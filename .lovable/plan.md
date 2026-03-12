

# Voting & Priority Scoring — Enhancement Plan

## Current State
The `vote-issue` edge function already implements ~90% of the requirements: vote toggling, duplicate prevention, count updates, category-weighted priority scoring, and priority label mapping. Two gaps remain:

1. **Missing severity keyword bonus** in `vote-issue` — the `submit-report` function has it (+25 for keywords like "dangerous", "flood", "overflow") but `vote-issue` does not
2. **Outdated CORS headers** in `vote-issue` — missing newer Supabase client headers
3. **Response lacks `user_vote` and `priority` data** — frontend needs to know the user's current vote state and updated priority after voting

## Changes

### Update `supabase/functions/vote-issue/index.ts`

1. **Add severity keywords constant and check** — same list as submit-report: `dangerous, hazard, urgent, emergency, collapse, flood, accident, injury, blocked, overflow`. Add +25 to score if description contains any keyword.

2. **Update CORS headers** — add `x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version` to allowed headers.

3. **Also fetch `title` from issue** — include title in severity keyword check alongside description.

4. **Enhanced response** — return `priority_score`, `priority`, and `user_vote` (the user's current vote state after the action: `"up"`, `"down"`, or `null`) so the frontend can render vote buttons correctly.

5. **Extract shared `calculatePriority` function** — same formula as submit-report:
   - Category weight (sewer_overflow: 50, road_damage: 40, water_leakage: 35, street_light: 25, pothole: 20, garbage: 15, other: 10)
   - Severity keywords bonus: +25
   - reports_count × 5
   - upvotes × 2
   - downvotes × -1
   - Label: >75 = high, >40 = medium, else low

### No database changes needed
All tables, enums, constraints, and RLS policies are already in place. The votes table already has a composite unique constraint on `(user_id, issue_id)`.

