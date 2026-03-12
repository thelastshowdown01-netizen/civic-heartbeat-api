

# Notifications, Feed, Filtering & Dashboard — Implementation Plan

## Analysis

Most of the requirements are achievable with **client-side Supabase queries** — no new edge functions needed. The `issues` table already has public SELECT RLS, and notifications have user-specific RLS. Two backend changes are needed:

1. **Add `type` column to `notifications` table** — currently missing, needed for notification categorization
2. **Create a `dashboard_stats` database function** — efficient server-side aggregation instead of multiple client queries
3. **Update edge functions** to include notification `type` when creating notifications

## Changes

### 1. Database Migration

```sql
-- Add type column to notifications
ALTER TABLE public.notifications 
ADD COLUMN type text DEFAULT 'status_changed';

-- Create dashboard stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_issues', (SELECT count(*) FROM issues),
    'resolved_issues', (SELECT count(*) FROM issues WHERE status = 'resolved'),
    'active_issues', (SELECT count(*) FROM issues WHERE status NOT IN ('resolved', 'rejected')),
    'high_priority_unresolved', (SELECT count(*) FROM issues WHERE priority = 'high' AND status NOT IN ('resolved', 'rejected')),
    'most_reported_category', (SELECT category FROM issues GROUP BY category ORDER BY count(*) DESC LIMIT 1),
    'most_affected_pincode', (SELECT pincode FROM issues WHERE pincode IS NOT NULL GROUP BY pincode ORDER BY count(*) DESC LIMIT 1)
  )
$$;
```

### 2. Update Edge Functions

**`submit-report/index.ts`** — when creating status log notification, add `type: 'issue_created'`.

**`update-issue-status/index.ts`** — map status to notification type:
- `verified` → `type: 'issue_verified'`
- `assigned` → `type: 'authority_assigned'`
- `in_progress` → `type: 'status_changed'`
- `resolved` → `type: 'issue_resolved'`
- `rejected` → `type: 'issue_rejected'`

### 3. Frontend Hooks (new files)

**`src/hooks/useIssueFeed.ts`** — React Query hook for paginated issue feed with filters:
- Accepts `{ pincode, category, status, priority, sortBy, page, pageSize }`
- Maps `sortBy` to Supabase `.order()`: `recent` → `created_at desc`, `priority` → `priority_score desc`, `upvoted` → `upvotes_count desc`, `reported` → `reports_count desc`
- Uses `.range(from, to)` for pagination
- Excludes `rejected` issues from public feed by default

**`src/hooks/useDashboardStats.ts`** — React Query hook calling `supabase.rpc('get_dashboard_stats')`.

**`src/hooks/useNotifications.ts`** — React Query hook for user notifications:
- `useNotifications()` — fetch all notifications for current user, ordered by `created_at desc`
- `useUnreadCount()` — count of unread notifications
- `markAsRead(id)` — update `is_read = true` via Supabase client
- `markAllAsRead()` — update all unread for current user

**`src/hooks/useTrendingIssues.ts`** — fetch top 5 issues by `priority_score desc` where status is not resolved/rejected.

### 4. No New Edge Functions Needed

All feed/filter/sort/notification queries work directly via the Supabase JS client thanks to existing RLS policies:
- `issues` → public SELECT ✓
- `notifications` → user can SELECT own, UPDATE own ✓
- `status_logs` → public SELECT ✓

## Summary

One migration (add `type` column + dashboard function), two edge function tweaks (add notification type), and four frontend hooks for feed, dashboard, notifications, and trending. Clean MVP approach using existing RLS.

