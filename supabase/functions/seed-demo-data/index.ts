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
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if data already exists
    const { count } = await admin.from("issues").select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ message: "Demo data already exists", count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create demo users via auth
    const demoUsers = [
      { email: "citizen1@demo.sustaincity.in", password: "DemoPass123!", name: "Priya Sharma", role: "citizen" },
      { email: "citizen2@demo.sustaincity.in", password: "DemoPass123!", name: "Rahul Verma", role: "citizen" },
      { email: "citizen3@demo.sustaincity.in", password: "DemoPass123!", name: "Anita Desai", role: "citizen" },
      { email: "admin@demo.sustaincity.in", password: "DemoPass123!", name: "Suresh Kumar", role: "admin" },
      { email: "authority@demo.sustaincity.in", password: "DemoPass123!", name: "Municipal Water Dept", role: "authority" },
      { email: "authority2@demo.sustaincity.in", password: "DemoPass123!", name: "PWD Roads Division", role: "authority" },
    ];

    const userIds: Record<string, string> = {};

    for (const u of demoUsers) {
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name, role: u.role },
      });
      if (authErr) {
        console.error(`Failed to create user ${u.email}:`, authErr.message);
        continue;
      }
      const uid = authData.user.id;
      userIds[u.email] = uid;
    }

    const citizen1 = userIds["citizen1@demo.sustaincity.in"];
    const citizen2 = userIds["citizen2@demo.sustaincity.in"];
    const citizen3 = userIds["citizen3@demo.sustaincity.in"];
    const adminId = userIds["admin@demo.sustaincity.in"];
    const authority1 = userIds["authority@demo.sustaincity.in"];
    const authority2 = userIds["authority2@demo.sustaincity.in"];

    if (!citizen1 || !adminId || !authority1) {
      return new Response(JSON.stringify({ error: "Failed to create core demo users" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pincode zones
    const zones = [
      { pincode: "400001", city: "Mumbai", state: "Maharashtra", area: "Fort", ward: "A" },
      { pincode: "400028", city: "Mumbai", state: "Maharashtra", area: "Dadar", ward: "F/N" },
      { pincode: "400053", city: "Mumbai", state: "Maharashtra", area: "Andheri East", ward: "K/E" },
      { pincode: "400076", city: "Mumbai", state: "Maharashtra", area: "Powai", ward: "S" },
      { pincode: "400049", city: "Mumbai", state: "Maharashtra", area: "Bandra West", ward: "H/W" },
    ];
    await admin.from("pincode_zones").upsert(zones, { onConflict: "pincode" });

    const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

    const issues = [
      {
        title: "Major sewer overflow near Dadar station west entrance",
        description: "Raw sewage overflowing onto the footpath near Dadar station west side. The drain appears completely blocked and wastewater is spreading across the pedestrian walkway. Strong odour making the area nearly impassable during peak hours.",
        category: "sewer_overflow", pincode: "400028", status: "in_progress", priority: "high",
        priority_score: 92, upvotes_count: 47, downvotes_count: 2, reports_count: 12,
        authority_name: "Municipal Water Dept", assignee_id: authority1, created_by: citizen1,
        latitude: 19.0178, longitude: 72.8432, created_at: daysAgo(8),
      },
      {
        title: "Persistent water leakage from underground pipeline on SV Road",
        description: "Water has been leaking continuously from what appears to be a broken underground pipeline on SV Road near Andheri station. The leak has been ongoing for over two weeks, wasting significant amounts of water and creating a muddy, slippery surface.",
        category: "water_leakage", pincode: "400053", status: "assigned", priority: "high",
        priority_score: 78, upvotes_count: 31, downvotes_count: 1, reports_count: 8,
        authority_name: "Municipal Water Dept", assignee_id: authority1, created_by: citizen2,
        latitude: 19.1197, longitude: 72.8464, created_at: daysAgo(5),
      },
      {
        title: "Deep pothole on Link Road causing accidents",
        description: "A large pothole approximately 2 feet wide and 8 inches deep has formed on the main Link Road near the Oshiwara junction. Two-wheeler riders are especially at risk. One minor accident was reported yesterday evening.",
        category: "pothole", pincode: "400053", status: "verified", priority: "high",
        priority_score: 71, upvotes_count: 38, downvotes_count: 3, reports_count: 6,
        authority_name: "PWD Roads Division", created_by: citizen3,
        latitude: 19.1364, longitude: 72.8296, created_at: daysAgo(3),
      },
      {
        title: "Garbage pileup at Bandra Reclamation bus stop",
        description: "Garbage has not been collected for the past 4 days at the bus stop near Bandra Reclamation. The pile is attracting stray animals and insects. Commuters are forced to wait in unhygienic conditions.",
        category: "garbage", pincode: "400049", status: "reported", priority: "medium",
        priority_score: 45, upvotes_count: 19, downvotes_count: 0, reports_count: 5,
        created_by: citizen1, latitude: 19.0544, longitude: 72.8261, created_at: daysAgo(2),
      },
      {
        title: "Street light not working on Hiranandani main road",
        description: "Three consecutive street lights on the main road inside Hiranandani Gardens, Powai have been non-functional for over a week. The stretch becomes dangerously dark after 7 PM, creating safety concerns for pedestrians.",
        category: "street_light", pincode: "400076", status: "assigned", priority: "medium",
        priority_score: 48, upvotes_count: 14, downvotes_count: 1, reports_count: 3,
        authority_name: "PWD Roads Division", assignee_id: authority2, created_by: citizen2,
        latitude: 19.1176, longitude: 72.9060, created_at: daysAgo(6),
      },
      {
        title: "Road surface damaged after heavy rain near Flora Fountain",
        description: "Multiple sections of the road near Flora Fountain have developed cracks and uneven surfaces following recent heavy rainfall. The damaged patches are unmarked and pose a risk to both vehicles and pedestrians.",
        category: "road_damage", pincode: "400001", status: "in_progress", priority: "medium",
        priority_score: 55, upvotes_count: 22, downvotes_count: 2, reports_count: 4,
        authority_name: "PWD Roads Division", assignee_id: authority2, created_by: citizen3,
        latitude: 18.9339, longitude: 72.8333, created_at: daysAgo(10),
      },
      {
        title: "Blocked storm drain causing waterlogging in Dadar TT area",
        description: "The storm drain near Dadar TT circle is completely choked with debris and plastic waste. Even moderate rain causes water to accumulate knee-deep on the road, disrupting traffic and making the area inaccessible.",
        category: "sewer_overflow", pincode: "400028", status: "resolved", priority: "high",
        priority_score: 85, upvotes_count: 52, downvotes_count: 1, reports_count: 15,
        authority_name: "Municipal Water Dept", assignee_id: authority1, created_by: citizen1,
        latitude: 19.0186, longitude: 72.8479, created_at: daysAgo(20), resolved_at: daysAgo(4),
      },
      {
        title: "Pothole cluster on internal road in Powai",
        description: "Several potholes have appeared on the internal road behind IIT Bombay gate. The road is used by college students and local residents. The potholes are filled with muddy water making them hard to spot.",
        category: "pothole", pincode: "400076", status: "reported", priority: "low",
        priority_score: 28, upvotes_count: 7, downvotes_count: 0, reports_count: 2,
        created_by: citizen2, latitude: 19.1334, longitude: 72.9133, created_at: daysAgo(1),
      },
      {
        title: "Water leakage from overhead tank in Bandra housing colony",
        description: "The overhead water tank of a municipal housing colony in Bandra West has developed a visible crack and water is continuously dripping down the building wall. This has been going on for three days.",
        category: "water_leakage", pincode: "400049", status: "verified", priority: "medium",
        priority_score: 42, upvotes_count: 11, downvotes_count: 0, reports_count: 3,
        authority_name: "Municipal Water Dept", created_by: citizen3,
        latitude: 19.0596, longitude: 72.8295, created_at: daysAgo(4),
      },
      {
        title: "Garbage dumped in empty plot near Fort market",
        description: "An empty plot adjacent to the Fort market area is being used as an illegal garbage dump. Construction debris and household waste has accumulated over weeks. The situation is worsening daily.",
        category: "garbage", pincode: "400001", status: "assigned", priority: "low",
        priority_score: 30, upvotes_count: 8, downvotes_count: 1, reports_count: 2,
        authority_name: "Municipal Water Dept", assignee_id: authority1, created_by: citizen1,
        latitude: 18.9322, longitude: 72.8347, created_at: daysAgo(7),
      },
      {
        title: "Street light pole tilted dangerously after truck collision",
        description: "A street light pole on the service road near Andheri East metro station has been hit by a truck and is now tilted at approximately 30 degrees. Exposed wiring is visible. Immediate attention needed before it falls.",
        category: "street_light", pincode: "400053", status: "in_progress", priority: "high",
        priority_score: 82, upvotes_count: 29, downvotes_count: 0, reports_count: 7,
        authority_name: "PWD Roads Division", assignee_id: authority2, created_by: citizen2,
        latitude: 19.1190, longitude: 72.8507, created_at: daysAgo(4),
      },
      {
        title: "Road cave-in on approach to Powai lake",
        description: "A section of the road approaching Powai Lake has partially caved in, likely due to an underground pipeline issue. The affected area is about 3 feet wide. Barricades have been placed by locals but no official repair work has started.",
        category: "road_damage", pincode: "400076", status: "reported", priority: "high",
        priority_score: 68, upvotes_count: 24, downvotes_count: 0, reports_count: 4,
        created_by: citizen3, latitude: 19.1263, longitude: 72.9050, created_at: daysAgo(1),
      },
      {
        title: "Overflowing public dustbin at Dadar flower market",
        description: "The public dustbin outside Dadar flower market has been overflowing for two days. Flower waste and plastic bags are scattered across the pavement. The area smells terrible especially during afternoon hours.",
        category: "garbage", pincode: "400028", status: "resolved", priority: "low",
        priority_score: 25, upvotes_count: 9, downvotes_count: 0, reports_count: 3,
        authority_name: "Municipal Water Dept", assignee_id: authority1, created_by: citizen2,
        latitude: 19.0165, longitude: 72.8440, created_at: daysAgo(14), resolved_at: daysAgo(9),
      },
      {
        title: "Damaged footpath tiles near Bandra Bandstand",
        description: "Multiple tiles on the footpath near Bandra Bandstand promenade are broken or missing. Pedestrians, especially elderly visitors, are at risk of tripping. The footpath was last repaired over a year ago.",
        category: "road_damage", pincode: "400049", status: "resolved", priority: "medium",
        priority_score: 50, upvotes_count: 16, downvotes_count: 1, reports_count: 4,
        authority_name: "PWD Roads Division", assignee_id: authority2, created_by: citizen1,
        latitude: 19.0438, longitude: 72.8184, created_at: daysAgo(18), resolved_at: daysAgo(6),
      },
      {
        title: "Sewage leak contaminating drinking water supply in Fort",
        description: "Residents in the Fort area have reported that their tap water has an unusual odor and color. A nearby sewage line appears to have cracked and may be contaminating the municipal water supply. Urgent investigation required.",
        category: "sewer_overflow", pincode: "400001", status: "verified", priority: "high",
        priority_score: 88, upvotes_count: 41, downvotes_count: 0, reports_count: 9,
        authority_name: "Municipal Water Dept", created_by: citizen1,
        latitude: 18.9350, longitude: 72.8360, created_at: daysAgo(2),
      },
    ];

    const { data: insertedIssues, error: issuesErr } = await admin.from("issues").insert(issues).select("id, created_by, status, created_at, category, pincode");
    if (issuesErr) throw issuesErr;

    // Issue reports
    const reports: Record<string, unknown>[] = [];
    for (let i = 0; i < insertedIssues.length; i++) {
      const iss = insertedIssues[i];
      const issData = issues[i];
      reports.push({
        issue_id: iss.id,
        reporter_id: iss.created_by,
        description: issData.description,
        pincode: iss.pincode,
        latitude: issData.latitude,
        longitude: issData.longitude,
      });
    }
    // Extra reports for merged issues (reports_count > 5)
    const allCitizens = [citizen1, citizen2, citizen3].filter(Boolean);
    for (let i = 0; i < insertedIssues.length; i++) {
      if (issues[i].reports_count > 5) {
        const iss = insertedIssues[i];
        const extras = allCitizens.filter(id => id !== iss.created_by);
        for (const reporter of extras) {
          reports.push({
            issue_id: iss.id,
            reporter_id: reporter,
            description: "Same issue reported in this area. Needs urgent attention.",
            pincode: iss.pincode,
          });
        }
      }
    }
    await admin.from("issue_reports").insert(reports);

    // Status logs
    const statusLogs: Record<string, unknown>[] = [];
    for (let i = 0; i < insertedIssues.length; i++) {
      const iss = insertedIssues[i];
      const d = issues[i];

      statusLogs.push({
        issue_id: iss.id, changed_by_id: iss.created_by,
        old_status: null, new_status: "reported", comment: null,
        created_at: d.created_at,
      });

      if (["verified", "assigned", "in_progress", "resolved"].includes(d.status)) {
        statusLogs.push({
          issue_id: iss.id, changed_by_id: adminId,
          old_status: "reported", new_status: "verified",
          comment: "Issue verified after review. Forwarding to relevant department.",
          created_at: daysAgo(Math.max(0, Math.floor(Math.random() * 3) + 5)),
        });
      }

      if (["assigned", "in_progress", "resolved"].includes(d.status)) {
        statusLogs.push({
          issue_id: iss.id, changed_by_id: adminId,
          old_status: "verified", new_status: "assigned",
          comment: `Assigned to ${d.authority_name ?? "relevant department"}.`,
          created_at: daysAgo(Math.max(0, Math.floor(Math.random() * 2) + 3)),
        });
      }

      if (["in_progress", "resolved"].includes(d.status)) {
        statusLogs.push({
          issue_id: iss.id, changed_by_id: d.assignee_id ?? authority1,
          old_status: "assigned", new_status: "in_progress",
          comment: "Work crew dispatched. Repair work has commenced on site.",
          created_at: daysAgo(Math.max(0, Math.floor(Math.random() * 2) + 1)),
        });
      }

      if (d.status === "resolved") {
        statusLogs.push({
          issue_id: iss.id, changed_by_id: d.assignee_id ?? authority1,
          old_status: "in_progress", new_status: "resolved",
          comment: "Issue has been resolved. Area restored to normal condition.",
          created_at: d.resolved_at ?? daysAgo(1),
        });
      }
    }
    await admin.from("status_logs").insert(statusLogs);

    // Notifications
    const notifications = [
      { user_id: citizen1, issue_id: insertedIssues[0].id, message: "Your issue \"Major sewer overflow near Dadar station\" has been verified by the admin team.", type: "issue_verified", is_read: true, created_at: daysAgo(7) },
      { user_id: citizen1, issue_id: insertedIssues[0].id, message: "Municipal Water Dept has been assigned to your sewer overflow issue near Dadar station.", type: "authority_assigned", is_read: true, created_at: daysAgo(6) },
      { user_id: citizen1, issue_id: insertedIssues[0].id, message: "Status update: Sewer overflow issue is now in progress. Repair crew is on site.", type: "status_changed", is_read: false, created_at: daysAgo(3) },
      { user_id: citizen1, issue_id: insertedIssues[6].id, message: "Great news! The blocked storm drain issue at Dadar TT has been resolved.", type: "issue_resolved", is_read: false, created_at: daysAgo(4) },
      { user_id: citizen1, issue_id: insertedIssues[3].id, message: "Your report about garbage pileup at Bandra has been submitted successfully.", type: "issue_created", is_read: true, created_at: daysAgo(2) },
      { user_id: citizen1, issue_id: insertedIssues[14].id, message: "Your report about sewage contamination in Fort has been submitted and is under review.", type: "issue_created", is_read: false, created_at: daysAgo(2) },
      { user_id: citizen1, issue_id: insertedIssues[9].id, message: "Municipal Water Dept has been assigned to the garbage issue near Fort market.", type: "authority_assigned", is_read: false, created_at: daysAgo(5) },
      { user_id: citizen2!, issue_id: insertedIssues[1].id, message: "Your report about water leakage on SV Road has been verified.", type: "issue_verified", is_read: false, created_at: daysAgo(3) },
      { user_id: citizen2!, issue_id: insertedIssues[12].id, message: "The overflowing dustbin issue at Dadar flower market has been resolved.", type: "issue_resolved", is_read: true, created_at: daysAgo(9) },
      { user_id: authority1, issue_id: insertedIssues[0].id, message: "New issue assigned: Major sewer overflow near Dadar station west entrance.", type: "authority_assigned", is_read: true, created_at: daysAgo(6) },
      { user_id: authority1, issue_id: insertedIssues[1].id, message: "New issue assigned: Persistent water leakage on SV Road, Andheri.", type: "authority_assigned", is_read: false, created_at: daysAgo(3) },
      { user_id: authority1, issue_id: insertedIssues[9].id, message: "New issue assigned: Garbage dumped in empty plot near Fort market.", type: "authority_assigned", is_read: false, created_at: daysAgo(5) },
    ];
    await admin.from("notifications").insert(notifications);

    return new Response(
      JSON.stringify({
        success: true,
        created: {
          users: Object.keys(userIds).length,
          issues: insertedIssues.length,
          reports: reports.length,
          status_logs: statusLogs.length,
          notifications: notifications.length,
        },
        demo_credentials: {
          citizen: { email: "citizen1@demo.sustaincity.in", password: "DemoPass123!" },
          admin: { email: "admin@demo.sustaincity.in", password: "DemoPass123!" },
          authority: { email: "authority@demo.sustaincity.in", password: "DemoPass123!" },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
