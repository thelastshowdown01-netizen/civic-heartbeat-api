

# Notifications / Updates Center Page

## Overview

Create `/notifications` — a citizen-facing notifications page showing all issue-related updates with read/unread states, grouped by time, summary metrics, and linked issue navigation. Auth-guarded.

## New File: `src/pages/Notifications.tsx`

**Data**: Reuse existing hooks — `useNotifications`, `useUnreadCount`, `useMarkAsRead`, `useMarkAllAsRead`.

**Sections:**

1. **Header**: "Updates Center" / "Stay informed on the progress of your reported issues."

2. **Summary cards** (4): Total Notifications, Unread, Status Updates (type contains "status"), Resolved (type = "issue_resolved") — computed client-side from notifications data.

3. **Controls bar**: "Mark All as Read" button, filter toggle (All / Unread), notification count label.

4. **Notification feed**: Grouped by Today / Yesterday / Earlier. Each item shows:
   - Unread indicator (left border accent or dot)
   - Notification message
   - Type badge (verified, assigned, resolved, rejected, status_changed)
   - Timestamp (relative via `date-fns formatDistanceToNow`)
   - "View Issue" link to `/issues/:issue_id`
   - Click to mark as read

5. **Empty state**: "No updates yet" with supporting text and CTA to `/report`.

6. **Loading state**: Skeleton cards.

## File Edits

### `src/App.tsx`
Add route: `<Route path="/notifications" element={<Notifications />} />`

### `src/components/landing/Navbar.tsx`
Add bell icon link to `/notifications` with unread count badge (using `useUnreadCount` hook), visible for logged-in users.

## No Database Changes Needed
All data from existing `notifications` table with existing RLS policies and hooks.

