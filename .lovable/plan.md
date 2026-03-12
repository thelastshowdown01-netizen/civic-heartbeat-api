

# Admin Issue Management — Enhancement Plan

## Current State
The `update-issue-status` edge function already covers ~85% of the requirements: role checks (admin/authority), status updates, assignee handling, status logging, and reporter notifications. The gaps:

1. **No status transition validation** — can jump from `reported` to `resolved` directly
2. **No `authority_name` update** — accepts `assignee_id` but doesn't set `authority_name`
3. **No `rejected` status support** — enum and notification message missing
4. **No same-status guard** — allows redundant updates to the same status
5. **No auto-status on assignment** — assigning authority doesn't auto-set status to `assigned`
6. **CORS headers outdated** — missing newer Supabase client headers
7. **Response lacks updated issue data** — frontend can't update UI without re-fetching

## Changes

### 1. Database migration: Add `rejected` to `issue_status` enum
```sql
ALTER TYPE public.issue_status ADD VALUE IF NOT EXISTS 'rejected';
```

### 2. Update `supabase/functions/update-issue-status/index.ts`

**Status transition rules** — define valid transitions:
- `reported` → `verified`, `rejected`
- `verified` → `assigned`, `rejected`
- `assigned` → `in_progress`, `rejected`
- `in_progress` → `resolved`
- `resolved` → (terminal, no transitions unless reopened)

Reject invalid transitions with a 400 error. Skip update if `old_status === new_status`.

**Authority assignment enhancements:**
- Accept `authority_name` in request body alongside `assignee_id`
- When `assignee_id` is provided and status isn't explicitly set beyond `verified`, auto-set status to `assigned`
- Store both `assignee_id` and `authority_name` on the issue

**Notification messages** — add `rejected` message:
- `rejected`: "Your reported issue was reviewed and could not be verified."

**Same-status guard** — if `old_status === new_status`, return early with `{ success: true, no_change: true }`.

**CORS headers** — update to include `x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version`.

**Enhanced response** — return `{ success, issue_id, old_status, new_status, authority_name }` so frontend can update state directly.

### Summary
One small migration (add `rejected` enum value) and an edge function update with transition validation, authority name support, same-status guard, and enriched response. No new tables needed.

