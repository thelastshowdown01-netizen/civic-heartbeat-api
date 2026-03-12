

# Seed Realistic Demo Data for Sustain City

## Approach

Create a one-time seed edge function (`seed-demo-data`) that populates all tables with realistic Mumbai civic issue data. After deployment, invoke it once to fill the database.

## What Gets Created

### Demo Users (6)
- **citizen1@demo.sustaincity.in** — Priya Sharma (citizen)
- **citizen2@demo.sustaincity.in** — Rahul Verma (citizen)
- **citizen3@demo.sustaincity.in** — Anita Desai (citizen)
- **admin@demo.sustaincity.in** — Suresh Kumar (admin)
- **authority@demo.sustaincity.in** — Municipal Water Dept (authority)
- **authority2@demo.sustaincity.in** — PWD Roads Division (authority)
- All passwords: `DemoPass123!`

### Pincode Zones (5 Mumbai areas)
Fort (400001), Dadar (400028), Andheri East (400053), Powai (400076), Bandra West (400049)

### Issues (15 realistic civic issues)
Varied across all categories, statuses, priorities, and areas:

| # | Title | Category | Area | Status | Priority | Reports |
|---|-------|----------|------|--------|----------|---------|
| 1 | Major sewer overflow near Dadar station | sewer_overflow | 400028 | in_progress | high | 12 |
| 2 | Persistent water leakage on SV Road | water_leakage | 400053 | assigned | high | 8 |
| 3 | Deep pothole on Link Road causing accidents | pothole | 400053 | verified | high | 6 |
| 4 | Garbage pileup at Bandra bus stop | garbage | 400049 | reported | medium | 5 |
| 5 | Street lights not working in Hiranandani | street_light | 400076 | assigned | medium | 3 |
| 6 | Road surface damaged near Flora Fountain | road_damage | 400001 | in_progress | medium | 4 |
| 7 | Blocked storm drain at Dadar TT | sewer_overflow | 400028 | resolved | high | 15 |
| 8 | Pothole cluster in Powai | pothole | 400076 | reported | low | 2 |
| 9 | Water leakage from overhead tank in Bandra | water_leakage | 400049 | verified | medium | 3 |
| 10 | Garbage dumped near Fort market | garbage | 400001 | assigned | low | 2 |
| 11 | Street light pole tilted in Andheri | street_light | 400053 | in_progress | high | 7 |
| 12 | Road cave-in near Powai lake | road_damage | 400076 | reported | high | 4 |
| 13 | Overflowing dustbin at Dadar flower market | garbage | 400028 | resolved | low | 3 |
| 14 | Damaged footpath near Bandra Bandstand | road_damage | 400049 | resolved | medium | 4 |
| 15 | Sewage contaminating water supply in Fort | sewer_overflow | 400001 | verified | high | 9 |

### Issue Reports (15 primary + extras for merged issues)
Extra duplicate reports for issues with reports_count > 5, simulating the merge logic.

### Status Logs
Full audit trail for each issue showing transitions through the lifecycle (reported → verified → assigned → in_progress → resolved), with realistic admin/authority comments.

### Notifications (~12)
For citizen1, citizen2, and authority1 — covering issue_created, issue_verified, authority_assigned, status_changed, and issue_resolved types. Mix of read/unread.

## Files

- **Create**: `supabase/functions/seed-demo-data/index.ts` — edge function using service role key
- No page or component changes needed — all screens already render from database queries

## Execution

After deployment, invoke the function once. It checks if data already exists to prevent duplicate seeding.

## No Schema Changes

All data fits existing tables and enums.

