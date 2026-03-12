

# Authority Dashboard / Department Work Queue

## Overview

Create `/authority` — an operational dashboard for authority/department users to manage their assigned issues, update progress, and resolve problems. Auth-guarded for users with the `authority` role.

## New File: `src/pages/AuthorityDashboard.tsx`

Follows the same structural pattern as `AdminDashboard.tsx` and `UserDashboard.tsx`.

**Data fetching** (react-query):
- Issues assigned to the current user: `supabase.from("issues").select("*").eq("assignee_id", user.id)` — filtered by assignee_id
- Status counts computed client-side from the fetched data

**Sections:**

1. **Header**: Building2 icon + "Department Work Queue" / "Manage assigned civic issues, update progress, and move toward resolution."

2. **Summary cards** (5): Total Assigned, New Assignments (status = "assigned"), In Progress, Resolved, High Priority — all computed client-side from fetched issues.

3. **Filter/sort bar**: Reuse the same Select-based pattern from AdminDashboard. Filters: status, priority, category, pincode input. Sort: newest assigned, oldest, highest priority, most reported.

4. **Issues work queue**: Table layout reusing `AdminIssueTable` component pattern but with authority-specific actions. Each row: title, category, pincode, status badge, priority badge, reports_count, upvotes, created_at, action dropdown. Actions per status:
   - `assigned` → "Mark In Progress"
   - `in_progress` → "Add Update" (opens dialog), "Mark Resolved"
   - All → "View Details" link to `/issues/:id`

5. **Progress Update Dialog**: A dialog component for adding a progress note — textarea for update note + confirm button. Calls the `update-issue-status` edge function with a comment.

6. **Empty state**: "No issues assigned yet" / "Assigned civic issues will appear here as they are routed to your department." — no CTA button needed.

7. **Loading state**: Skeleton cards matching existing pattern.

## File Edits

### `src/App.tsx`
Add route: `<Route path="/authority" element={<AuthorityDashboard />} />`

### `src/components/landing/Navbar.tsx`
Add "Work Queue" link visible when `userRole === "authority"`, similar to the existing Admin link.

## No Database Changes Needed
Issues already have `assignee_id` column. Authority users already have RLS permission to update assigned issues. The `update-issue-status` edge function handles status changes.

