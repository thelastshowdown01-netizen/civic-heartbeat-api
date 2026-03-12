import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  sewer_overflow: 50,
  road_damage: 40,
  water_leakage: 35,
  street_light: 25,
  pothole: 20,
  garbage: 15,
  other: 10,
};

const SEVERITY_KEYWORDS = [
  "dangerous", "hazard", "urgent", "emergency", "collapse",
  "flood", "accident", "injury", "blocked", "overflow",
];

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to",
  "for", "of", "and", "or", "but", "not", "it", "this", "that", "with",
  "has", "have", "had", "be", "been", "being", "do", "does", "did",
  "my", "our", "your", "his", "her", "its", "there", "here", "very",
]);

function calculatePriority(
  category: string,
  description: string,
  reportsCount: number,
  upvotes: number,
  downvotes: number
): { score: number; label: string } {
  let score = CATEGORY_WEIGHTS[category] || 10;
  const lowerDesc = description.toLowerCase();
  if (SEVERITY_KEYWORDS.some((kw) => lowerDesc.includes(kw))) score += 25;
  score += reportsCount * 5;
  score += upvotes * 2;
  score -= downvotes;
  const label = score > 75 ? "high" : score > 40 ? "medium" : "low";
  return { score, label };
}

function extractKeywords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function keywordOverlap(a: string, b: string): number {
  const setA = extractKeywords(a);
  const setB = extractKeywords(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const w of setA) if (setB.has(w)) overlap++;
  return overlap / Math.min(setA.size, setB.size);
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, description, category, pincode, image_url, latitude, longitude } =
      await req.json();

    if (!description || !category || !pincode) {
      return new Response(
        JSON.stringify({ error: "description, category, and pincode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Duplicate detection ---
    const { data: candidates } = await adminClient
      .from("issues")
      .select("id, latitude, longitude, reports_count, upvotes_count, downvotes_count, description, image_url")
      .eq("category", category)
      .eq("pincode", pincode)
      .neq("status", "resolved");

    let matchedIssueId: string | null = null;
    let matchReason: string | null = null;

    if (candidates && candidates.length > 0) {
      for (const c of candidates) {
        // 1. Proximity check
        if (latitude && longitude && c.latitude && c.longitude) {
          const dist = distanceMeters(latitude, longitude, c.latitude, c.longitude);
          if (dist <= 500) {
            matchedIssueId = c.id;
            matchReason = "proximity";
            break;
          }
        }

        // 2. Keyword similarity
        if (keywordOverlap(description, c.description) > 0.3) {
          matchedIssueId = c.id;
          matchReason = "keyword_overlap";
          break;
        }
      }

      // 3. Fallback: same category + pincode
      if (!matchedIssueId && candidates.length > 0) {
        // Only fallback if no coords provided (can't be more specific)
        if (!latitude || !longitude) {
          matchedIssueId = candidates[0].id;
          matchReason = "same_pincode_category";
        }
      }
    }

    let issueId: string;
    let actionTaken: string;

    if (matchedIssueId) {
      // --- Merge into existing issue ---
      issueId = matchedIssueId;
      actionTaken = "attached_to_existing_issue";
      const existing = candidates!.find((c) => c.id === matchedIssueId)!;
      const newReportsCount = existing.reports_count + 1;
      const { score, label } = calculatePriority(
        category,
        existing.description + " " + description,
        newReportsCount,
        existing.upvotes_count,
        existing.downvotes_count
      );

      const updatePayload: Record<string, unknown> = {
        reports_count: newReportsCount,
        priority_score: score,
        priority: label,
      };

      // Backfill image if master issue has none
      if (!existing.image_url && image_url) {
        updatePayload.image_url = image_url;
      }

      await adminClient.from("issues").update(updatePayload).eq("id", issueId);
    } else {
      // --- Create new master issue ---
      actionTaken = "created_new_issue";
      const { score, label } = calculatePriority(category, description, 1, 0, 0);
      const issueTitle = title || (description.length > 80 ? description.slice(0, 77) + "..." : description);

      const { data: newIssue, error: issueErr } = await adminClient
        .from("issues")
        .insert({
          title: issueTitle,
          category,
          description,
          pincode,
          image_url,
          latitude,
          longitude,
          priority_score: score,
          priority: label,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (issueErr) throw issueErr;
      issueId = newIssue.id;

      await adminClient.from("status_logs").insert({
        issue_id: issueId,
        changed_by_id: user.id,
        new_status: "reported",
      });
    }

    // --- Always store raw report ---
    const { data: report, error: reportErr } = await adminClient
      .from("issue_reports")
      .insert({
        issue_id: issueId,
        reporter_id: user.id,
        description,
        image_url,
        pincode,
        latitude,
        longitude,
      })
      .select("id")
      .single();

    if (reportErr) throw reportErr;

    return new Response(
      JSON.stringify({
        success: true,
        action_taken: actionTaken,
        issue_id: issueId,
        issue_report_id: report.id,
        duplicate_match_reason: matchReason,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
