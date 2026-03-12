import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No auth token" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { issue_id, assignee_id, authority_name, comment } = await req.json();

    if (!issue_id || !assignee_id || !authority_name) {
      return json({ error: "issue_id, assignee_id, and authority_name are required" }, 400);
    }

    // Call the DB function (runs as the authenticated user, function is SECURITY DEFINER)
    const { data, error } = await supabase.rpc("assign_authority", {
      p_issue_id: issue_id,
      p_assignee_id: assignee_id,
      p_authority_name: authority_name,
      p_comment: comment || null,
    });

    if (error) {
      const status = error.message.includes("Forbidden") ? 403
        : error.message.includes("not found") ? 404
        : 400;
      return json({ error: error.message }, status);
    }

    return json(data as Record<string, unknown>);
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});
