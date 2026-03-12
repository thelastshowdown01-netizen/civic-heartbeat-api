

# User Dashboard / My Reports Page

## Overview

Create `/dashboard` — a citizen-facing personal dashboard showing the user's submitted reports, summary metrics, status tracking, notifications, and filter/sort controls. Auth-guarded for logged-in users.

## New File: `src/pages/UserDashboard.tsx`

**Data fetching** (parallel react-query):
- User's reports from `issue_reports` joined with `issues` (to get status, priority, title, category, authority, etc.)
- User's notifications (reuse `useNotifications` hook)

**Sections:**

1. **Header**: "My Reports" / "Track the civic issues you've reported and stay informed on progress."

2. **Summary cards** (4 cards): Total Reports, Active (not resolved/rejected), Resolved, High Priority — computed from fetched data client-side.

3. **Filter/sort bar**: Filter by status, category, priority. Sort by latest, oldest, highest priority. Follow existing admin dashboard pattern with Select components.

4. **Reports list**: Card-based list using `IssueCard`-like layout per item. Each shows: issue title, description snippet, category, pincode, status badge, priority badge, reports_count (merge indicator), authority_name, created_at, "View Details" link to `/issues/:id`. If `reports_count > 1`, show merge note: "Your report was merged with X other reports."

5. **Recent updates sidebar/section**: Latest 5 notifications with status change info, using existing `useNotifications` hook. Each shows message, timestamp, link to issue.

6. **Empty state**: Illustration-free, clean empty state with heading "No reports yet", supporting text, and CTA button linking to `/report`.

7. **Loading/skeleton state**: Skeleton cards matching the admin dashboard pattern.

## File Edits

### `src/App.tsx`
Add route: `<Route path="/dashboard" element={<UserDashboard />} />`

### `src/components/landing/Navbar.tsx`
Add "My Reports" link visible when user is logged in (any role).

## No Database Changes Needed
Reports fetched via `issue_reports` (filtered by `reporter_id = auth.uid()`) joined with issue data. Notifications already have user-scoped RLS.

