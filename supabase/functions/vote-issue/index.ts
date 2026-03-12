import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const { issue_id, vote_type } = await req.json();
    // vote_type: "up", "down", or "remove"

    if (!issue_id) {
      return new Response(JSON.stringify({ error: "issue_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get existing vote
    const { data: existingVote } = await adminClient
      .from("votes")
      .select("vote_type")
      .eq("user_id", user.id)
      .eq("issue_id", issue_id)
      .maybeSingle();

    // Get current issue counts
    const { data: issue } = await adminClient
      .from("issues")
      .select("upvotes_count, downvotes_count, category, description, reports_count")
      .eq("id", issue_id)
      .single();

    if (!issue) {
      return new Response(JSON.stringify({ error: "Issue not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let upvotes = issue.upvotes_count;
    let downvotes = issue.downvotes_count;

    if (existingVote) {
      // Remove old vote effect
      if (existingVote.vote_type === "up") upvotes--;
      else downvotes--;

      if (vote_type === "remove" || vote_type === existingVote.vote_type) {
        // Remove vote entirely
        await adminClient
          .from("votes")
          .delete()
          .eq("user_id", user.id)
          .eq("issue_id", issue_id);
      } else {
        // Change vote
        if (vote_type === "up") upvotes++;
        else downvotes++;
        await adminClient
          .from("votes")
          .update({ vote_type })
          .eq("user_id", user.id)
          .eq("issue_id", issue_id);
      }
    } else if (vote_type !== "remove") {
      // New vote
      if (vote_type === "up") upvotes++;
      else downvotes++;
      await adminClient.from("votes").insert({
        user_id: user.id,
        issue_id,
        vote_type,
      });
    }

    // Recalculate priority
    const CATEGORY_WEIGHTS: Record<string, number> = {
      sewer_overflow: 50, road_damage: 40, water_leakage: 35,
      street_light: 25, pothole: 20, garbage: 15, other: 10,
    };
    let score = CATEGORY_WEIGHTS[issue.category] || 10;
    score += issue.reports_count * 5;
    score += upvotes * 2;
    score -= downvotes;
    const label = score > 75 ? "high" : score > 40 ? "medium" : "low";

    await adminClient
      .from("issues")
      .update({
        upvotes_count: upvotes,
        downvotes_count: downvotes,
        priority_score: score,
        priority: label,
      })
      .eq("id", issue_id);

    return new Response(
      JSON.stringify({ success: true, upvotes_count: upvotes, downvotes_count: downvotes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
