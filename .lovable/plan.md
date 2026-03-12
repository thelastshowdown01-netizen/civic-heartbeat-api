

# Admin Issue Review / Moderation Details Page

## Overview

Create `/admin/issues/:id` — a detailed admin review page for inspecting a single issue, viewing linked reports, status history, priority signals, and taking moderation actions. Reuses existing components (StatusTimeline) and the `update-issue-status` edge function.

## New File: `src/pages/AdminIssueReview.tsx`

Single-page component with admin auth guard. Two-column layout on desktop (main left, action sidebar right), stacked on mobile.

**Data fetching** (parallel react-query):
- Issue from `issues` table
- Status logs from `status_logs` table (with `changed_by_id` joined to `profiles` for admin names)
- Issue reports from `issue_reports` with `reporter_id` joined to `profiles` for reporter names/avatars
- User's admin role verification

**Sections:**

1. **Header**: Back to admin dashboard link, issue title, badges (status, priority, category), meta row (pincode, date, reports count)

2. **Issue Overview Panel**: Image from first report, full description, coordinates/location, category, authority assignment status

3. **Linked Reports Section**: Expandable list of all `issue_reports` for this issue. Each shows reporter name (or "Anonymous Citizen"), description, image thumbnail, pincode, submitted date, merged indicator badge

4. **Status Timeline**: Reuse `StatusTimeline` component with full status_logs, plus admin names on each log entry

5. **Priority & Community Signals Card**: Priority score + label, reports count, upvotes/downvotes counts, severity note (auto-generated based on priority + reports count)

6. **Duplicate Review Card**: Merged reports count, "Consolidated from X reports" note, duplicate indicator if reports > 2

7. **Internal Admin Notes Section**: Display status_log comments as admin notes timeline (admin name, timestamp, note text). Admin-only styling with a subtle background differentiation

8. **Admin Action Panel** (sidebar on desktop, sticky bottom on mobile):
   - Verify Issue (if status = reported)
   - Assign Authority (if status = verified) — inline input for authority/department name
   - Mark In Progress (if status = assigned)
   - Resolve (if status = in_progress)
   - Reject (any non-terminal status) — with comment textarea
   - Add Admin Note — textarea + submit (creates a status log with same status + comment)
   - View Public Issue Page — link to `/issues/:id`

## File Edits

### `src/App.tsx`
Add route: `<Route path="/admin/issues/:id" element={<AdminIssueReview />} />`

### `src/components/admin/AdminIssueTable.tsx`
Update "View Details" action to link to `/admin/issues/:id` instead of `/issues/:id`.

## No Database Changes Needed
All data from existing tables. Admin notes piggyback on `status_logs` table (comment field with same old/new status to represent a note without status change — or we simply display existing status_log comments as notes).

## Key Design Decisions
- Action buttons are contextual: only show valid actions based on current status (using same `VALID_TRANSITIONS` logic as the edge function)
- Authority assignment uses a simple text input (matching existing `AdminActionDialog` pattern)
- Internal notes section styled with a distinct admin-only visual treatment (amber/slate background)
- Mobile: action panel moves below content, remains fully functional

