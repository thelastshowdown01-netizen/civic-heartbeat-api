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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user is admin or authority
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((r) => r.role) || [];
    const isAdmin = userRoles.includes("admin");
    const isAuthority = userRoles.includes("authority");

    if (!isAdmin && !isAuthority) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or authority role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { issue_id, new_status, comment, assignee_id } = await req.json();

    if (!issue_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "issue_id and new_status required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current issue
    const { data: issue } = await adminClient
      .from("issues")
      .select("status")
      .eq("id", issue_id)
      .single();

    if (!issue) {
      return new Response(JSON.stringify({ error: "Issue not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authority can only update their assigned issues
    if (isAuthority && !isAdmin) {
      const { data: assignedIssue } = await adminClient
        .from("issues")
        .select("id")
        .eq("id", issue_id)
        .eq("assignee_id", user.id)
        .maybeSingle();

      if (!assignedIssue) {
        return new Response(JSON.stringify({ error: "Not assigned to this issue" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Update issue
    const updateData: Record<string, unknown> = { status: new_status };
    if (assignee_id && isAdmin) updateData.assignee_id = assignee_id;
    if (new_status === "resolved") updateData.resolved_at = new Date().toISOString();

    await adminClient.from("issues").update(updateData).eq("id", issue_id);

    // Create status log
    await adminClient.from("status_logs").insert({
      issue_id,
      changed_by_id: user.id,
      old_status: issue.status,
      new_status,
      comment,
    });

    // Notify all reporters linked to this issue
    const { data: reporters } = await adminClient
      .from("issue_reports")
      .select("reporter_id")
      .eq("issue_id", issue_id);

    if (reporters && reporters.length > 0) {
      const uniqueReporterIds = [...new Set(reporters.map((r) => r.reporter_id))];
      const statusMessages: Record<string, string> = {
        verified: "Your reported issue has been verified by an admin.",
        assigned: "An authority has been assigned to your reported issue.",
        in_progress: "Work has begun on your reported issue.",
        resolved: "Your reported issue has been resolved!",
      };

      const message = statusMessages[new_status] || `Issue status updated to ${new_status}.`;

      const notifications = uniqueReporterIds.map((uid) => ({
        user_id: uid,
        issue_id,
        message,
      }));

      await adminClient.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true }),
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
