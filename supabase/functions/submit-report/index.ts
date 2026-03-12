import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  "dangerous",
  "hazard",
  "urgent",
  "emergency",
  "collapse",
  "flood",
  "accident",
  "injury",
  "blocked",
  "overflow",
];

function calculatePriority(
  category: string,
  description: string,
  reportsCount: number,
  upvotes: number,
  downvotes: number
): { score: number; label: string } {
  let score = CATEGORY_WEIGHTS[category] || 10;

  const lowerDesc = description.toLowerCase();
  if (SEVERITY_KEYWORDS.some((kw) => lowerDesc.includes(kw))) {
    score += 25;
  }

  score += reportsCount * 5;
  score += upvotes * 2;
  score -= downvotes;

  const label = score > 75 ? "high" : score > 40 ? "medium" : "low";
  return { score, label };
}

// Haversine distance in meters
function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { description, category, pincode, image_url, latitude, longitude } =
      await req.json();

    if (!description || !category || !pincode) {
      return new Response(
        JSON.stringify({ error: "description, category, and pincode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for DB operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find similar existing issue: same category + pincode + unresolved
    const { data: candidates } = await adminClient
      .from("issues")
      .select("id, latitude, longitude, reports_count, upvotes_count, downvotes_count, description")
      .eq("category", category)
      .eq("pincode", pincode)
      .neq("status", "resolved");

    let matchedIssueId: string | null = null;

    if (candidates && candidates.length > 0) {
      for (const c of candidates) {
        // If both have coords, check proximity (~500m for MVP)
        if (latitude && longitude && c.latitude && c.longitude) {
          const dist = distanceMeters(latitude, longitude, c.latitude, c.longitude);
          if (dist <= 500) {
            matchedIssueId = c.id;
            break;
          }
        } else {
          // Same category + pincode without coords = likely duplicate
          matchedIssueId = c.id;
          break;
        }
      }
    }

    let issueId: string;

    if (matchedIssueId) {
      // Attach to existing issue
      issueId = matchedIssueId;
      const existing = candidates!.find((c) => c.id === matchedIssueId)!;
      const newReportsCount = existing.reports_count + 1;
      const { score, label } = calculatePriority(
        category,
        existing.description + " " + description,
        newReportsCount,
        existing.upvotes_count,
        existing.downvotes_count
      );

      await adminClient
        .from("issues")
        .update({
          reports_count: newReportsCount,
          priority_score: score,
          priority: label,
        })
        .eq("id", issueId);
    } else {
      // Create new issue
      const { score, label } = calculatePriority(category, description, 1, 0, 0);

      const { data: newIssue, error: issueErr } = await adminClient
        .from("issues")
        .insert({
          category,
          description,
          pincode,
          latitude,
          longitude,
          priority_score: score,
          priority: label,
        })
        .select("id")
        .single();

      if (issueErr) throw issueErr;
      issueId = newIssue.id;

      // Initial status log
      await adminClient.from("status_logs").insert({
        issue_id: issueId,
        changed_by_id: user.id,
        new_status: "reported",
      });
    }

    // Create the report
    const { error: reportErr } = await adminClient.from("issue_reports").insert({
      issue_id: issueId,
      reporter_id: user.id,
      description,
      image_url,
      pincode,
      latitude,
      longitude,
    });

    if (reportErr) throw reportErr;

    return new Response(
      JSON.stringify({
        success: true,
        issue_id: issueId,
        merged: !!matchedIssueId,
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
