

# Schema Update Plan for Sustain City

## Current State
The database already has all 7 tables created with enums, RLS policies, and edge functions. The requested schema is ~90% in place. The gaps between what exists and what's requested are:

### Missing columns
- **issues**: missing `title`, `authority_name`, `created_by`
- **pincode_zones**: missing `ward` and `area` fields for ward/area mapping

### Changes needed

**1. Migration: Add missing columns to `issues` table**
```sql
ALTER TABLE public.issues
  ADD COLUMN title text,
  ADD COLUMN authority_name text,
  ADD COLUMN created_by uuid;
```
- `title` — nullable text, optional short headline for the issue
- `authority_name` — nullable text, name of assigned authority (denormalized for display)
- `created_by` — nullable uuid, references the first reporter who created the issue

**2. Migration: Add ward/area columns to `pincode_zones`**
```sql
ALTER TABLE public.pincode_zones
  ADD COLUMN ward text,
  ADD COLUMN area text;
```
- Supports ward-level and area-level filtering for civic bodies

**3. Update `submit-report` edge function**
- Pass `created_by: user.id` when inserting a new issue
- Optionally set `title` from a truncated description if not provided

**4. Update frontend types usage**
- After migration, the auto-generated types will include the new columns
- Update any components that reference the issues table to use `title` where appropriate

### What's already correct (no changes needed)
- All 7 tables exist with proper PKs and relationships
- Enums: `app_role`, `issue_category`, `issue_status`, `priority_label`, `vote_type`
- Composite uniqueness on votes `(user_id, issue_id)`
- `issue_reports` linked to `issues` via `issue_id` FK
- `status_logs` tracks every change with actor and comment
- `notifications` supports per-user issue update messages
- RLS policies enforce role-based access
- `has_role()` security definer function
- Auto-create profile + citizen role on signup trigger
- Edge functions for submit-report, vote-issue, update-issue-status

### Summary
Two small migrations to add 5 columns across 2 tables, plus a minor edge function update. Everything else is already built and functional.

