import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  reported: ["verified", "rejected"],
  verified: ["assigned", "in_progress", "rejected"],
  assigned: ["in_progress", "rejected"],
  in_progress: ["resolved"],
  resolved: [],
  rejected: [],
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check roles - only authority can update status
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const userRoles = roles?.map((r) => r.role) || [];
    const isAuthority = userRoles.includes("authority");

    if (!isAuthority) {
      return json({ error: "Forbidden: authority role required" }, 403);
    }

    const { issue_id, new_status, comment, assignee_id, authority_name } = await req.json();

    if (!issue_id) return json({ error: "issue_id is required" }, 400);

    // Get current issue
    const { data: issue } = await adminClient
      .from("issues")
      .select("status, authority_name")
      .eq("id", issue_id)
      .single();

    if (!issue) return json({ error: "Issue not found" }, 404);

    // Determine effective new status
    let effectiveStatus = new_status;

    // Auto-set status to "assigned" when assigning authority to a verified issue
    if (assignee_id && !new_status) {
      if (issue.status === "verified") {
        effectiveStatus = "assigned";
      } else {
        effectiveStatus = null;
      }
    }

    // Same-status guard
    if (effectiveStatus && effectiveStatus === issue.status) {
      return json({ success: true, no_change: true, issue_id, status: issue.status });
    }

    // Validate transition
    if (effectiveStatus) {
      const allowed = VALID_TRANSITIONS[issue.status] || [];
      if (!allowed.includes(effectiveStatus)) {
        return json({
          error: `Invalid transition: ${issue.status} → ${effectiveStatus}. Allowed: ${allowed.join(", ") || "none"}`,
        }, 400);
      }
    }

    // Build update payload
    const updateData: Record<string, unknown> = {};
    if (effectiveStatus) updateData.status = effectiveStatus;
    if (assignee_id) updateData.assignee_id = assignee_id;
    if (authority_name !== undefined) updateData.authority_name = authority_name;
    if (effectiveStatus === "resolved") updateData.resolved_at = new Date().toISOString();

    if (Object.keys(updateData).length > 0) {
      await adminClient.from("issues").update(updateData).eq("id", issue_id);
    }

    // Create status log if status changed
    if (effectiveStatus) {
      await adminClient.from("status_logs").insert({
        issue_id,
        changed_by_id: userId,
        old_status: issue.status,
        new_status: effectiveStatus,
        comment: comment || null,
      });
    }

    // Notify reporters if status changed
    if (effectiveStatus) {
      const { data: reporters } = await adminClient
        .from("issue_reports")
        .select("reporter_id")
        .eq("issue_id", issue_id);

      if (reporters && reporters.length > 0) {
        const uniqueReporterIds = [...new Set(reporters.map((r) => r.reporter_id))];
        const statusMessages: Record<string, string> = {
          verified: "Your reported issue has been verified by the responsible authority.",
          assigned: "A department has been assigned to your reported issue.",
          in_progress: "Work has begun on your reported issue.",
          resolved: "Your reported issue has been resolved!",
          rejected: "Your reported issue was reviewed and could not be verified.",
        };

        const statusToType: Record<string, string> = {
          verified: "issue_verified",
          assigned: "authority_assigned",
          in_progress: "status_changed",
          resolved: "issue_resolved",
          rejected: "issue_rejected",
        };

        const message = statusMessages[effectiveStatus] || `Issue status updated to ${effectiveStatus}.`;
        const notifType = statusToType[effectiveStatus] || "status_changed";

        const notifications = uniqueReporterIds.map((uid) => ({
          user_id: uid,
          issue_id,
          message,
          type: notifType,
        }));

        await adminClient.from("notifications").insert(notifications);
      }
    }

    return json({
      success: true,
      issue_id,
      old_status: issue.status,
      new_status: effectiveStatus || issue.status,
      authority_name: authority_name ?? issue.authority_name,
    });
  } catch (err) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});
