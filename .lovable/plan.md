

# Admin Dashboard — Implementation Plan

## Overview

Create `/admin` page with role-based access (admin only), dashboard stats, moderation queue, issue management table with filtering/sorting, and quick admin actions via the existing `update-issue-status` edge function.

## New Files

### 1. `src/pages/AdminDashboard.tsx`
Main admin page with auth guard (redirects non-admins to `/`).

**Sections:**
- **Header**: "Admin Dashboard" / "Monitor, manage, and resolve civic issues across the city."
- **Stats cards row**: Total Issues, Pending Verification (status=reported), Assigned, In Progress, Resolved, High Priority Unresolved. Uses `get_dashboard_stats` RPC + additional queries for pending/assigned/in_progress counts.
- **Tabs**: "Moderation Queue" | "All Issues" | "Urgent"
  - **Moderation Queue**: Issues with `status = 'reported'`, sorted by priority_score desc. Quick action buttons per row.
  - **All Issues**: Full table with filters (status, category, pincode, priority, authority) and sorting. Paginated.
  - **Urgent**: High priority unresolved issues.

**Issue table columns**: Title, Category, Pincode, Status (badge), Priority (badge), Authority, Reports, Upvotes, Created, Actions (dropdown).

**Quick actions** (call `update-issue-status` edge function):
- Verify → transitions reported → verified
- Assign Authority → dialog with authority name input, transitions verified → assigned
- Mark In Progress → transitions assigned → in_progress
- Resolve → transitions in_progress → resolved
- Reject → with comment dialog
- View Details → link to `/issues/:id`

### 2. `src/components/admin/AdminStatsCards.tsx`
Stats cards component fetching counts via separate queries.

### 3. `src/components/admin/AdminIssueTable.tsx`
Reusable table component with columns, sorting, pagination, and action dropdown per row.

### 4. `src/components/admin/AdminActionDialog.tsx`
Dialog for actions requiring input (assign authority name, reject with comment).

## Files to Edit

### `src/App.tsx`
Add route: `<Route path="/admin" element={<AdminDashboard />} />`

### `src/components/landing/Navbar.tsx`
Add "Admin" link visible when `userRole === 'admin'`.

## Data Strategy
- Stats: Combine `get_dashboard_stats` RPC with targeted count queries (`status eq 'reported'`, etc.)
- Issue list: Direct Supabase queries on `issues` table with filters, sorting, pagination
- Actions: `supabase.functions.invoke('update-issue-status', { body: { issue_id, new_status, comment?, assignee_id?, authority_name? } })`
- Authority list for assignment: Query `profiles` joined with `user_roles` where role = 'authority'

## No Database Changes Needed
All data accessible via existing tables and edge functions with admin RLS policies.

