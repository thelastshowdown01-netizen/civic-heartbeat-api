

# Redesign Authority Dashboard — 3 Tabs with Reports as Landing Page

## Summary

Rebuild the authority dashboard with 3 main tabs (not 4 — Tab 1 "Live Feed" and Tab 2 "Merged/NLP" are conceptually distinct but the merge logic already exists in the submit-report edge function). The structure:

1. **Reports (Landing Tab)** — Overview stats: total problems, resolved, active. This is the default tab when authority logs in.
2. **Live Feed** — All issues with actions (Assign Priority, Mark WIP, Verify/Reject), filters (sort by upvotes, category filters like pothole/garbage/electricity), and each issue card shows report count. Clicking a merged issue shows all individual citizen reports with their original descriptions.
3. **Merged Issues** — Shows only issues with `reports_count > 1` (already merged by the existing NLP/proximity logic in `submit-report`). Each card shows the single consolidated issue; clicking it expands to show all linked citizen reports in their original language.

## What Already Exists

- The `submit-report` edge function already performs NLP-based merging (keyword overlap, proximity, same pincode+category). No new backend NLP work needed.
- `issue_reports` table stores every individual citizen report linked to a master `issues` record.
- The `IssueDetails` page already shows "Linked Reports" with individual descriptions.
- Dashboard stats RPC `get_dashboard_stats` returns total/resolved/active counts.

## Changes

### 1. `src/pages/AuthorityDashboard.tsx` — Full rewrite

**Tab structure:**
- Default tab = `"reports"` (landing page)
- Tabs: Reports | Live Feed | Merged Issues

**Reports tab (landing):**
- 3 large stat cards: Total Problems, Resolved, Active (clickable to filter Live Feed tab)
- Small summary of recent activity (last 5 status changes)

**Live Feed tab:**
- Filters bar: category dropdown (pothole, garbage, electricity, etc.), sort by (upvotes, newest, priority, most reported)
- Issue cards showing: title, category icon, pincode, priority badge, status badge, upvotes count, reports count
- 3 action buttons per issue: Assign Priority (verify), Mark WIP (in_progress), Resolve
- Clicking an issue opens an expandable panel or navigates to `/issues/:id` showing all individual citizen reports

**Merged Issues tab:**
- Query: `issues` where `reports_count > 1`, ordered by reports_count desc
- Each card shows the consolidated issue with a badge like "12 people reported this"
- Expandable section fetching `issue_reports` for that issue, showing each citizen's original description
- Same location grouping is already handled by the backend merge logic

### 2. New component: `src/components/authority/MergedReportsPanel.tsx`

- Takes an `issue_id`, fetches all `issue_reports` for it
- Renders each report with the citizen's original description, timestamp
- Shows "X people addressed this problem" header

### 3. New component: `src/components/authority/IssueActionCard.tsx`

- Reusable card for Live Feed displaying issue info + action buttons
- Actions: Verify, Reject, Mark In Progress, Resolve (context-dependent on current status)
- Shows reports_count as "N reports" badge

### 4. Navigation update in `DashboardLayout.tsx`

- Add "Merged Issues" as a concept within the dashboard tabs (no new route needed, it's a tab)

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AuthorityDashboard.tsx` | Full rewrite with 3-tab layout, Reports as default |
| `src/components/authority/MergedReportsPanel.tsx` | New — expandable panel showing linked citizen reports |
| `src/components/authority/IssueActionCard.tsx` | New — card with actions for Live Feed |

No database or edge function changes needed — the existing merge logic and data model already support this.

