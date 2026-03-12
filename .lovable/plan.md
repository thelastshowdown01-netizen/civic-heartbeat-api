

# Database Hardening: Indexes, Triggers, and Notification Enum

## Assessment

The full schema (enums, tables, RLS policies, functions) is already in place and working. Three gaps remain:

1. **No performance indexes** — only PK/unique indexes exist. Queries filtering by `status`, `pincode`, `category`, `user_id`, and `issue_id` on large tables will be slow.
2. **No triggers attached** — the `handle_new_user` and `update_updated_at_column` functions exist but no triggers are wired up, meaning new signups don't auto-create profiles/roles, and `updated_at` doesn't auto-update.
3. **No `notification_type` enum** — notifications.type is plain text; adding an enum improves data integrity.

## Single Migration

One migration to add all missing pieces:

### Indexes
- `issues`: status, priority, pincode, category, created_by
- `issue_reports`: issue_id, reporter_id
- `votes`: issue_id
- `notifications`: user_id + is_read, issue_id
- `status_logs`: issue_id

### Triggers
- `on_auth_user_created` → calls `handle_new_user()` on `auth.users` INSERT
- `update_issues_updated_at` → calls `update_updated_at_column()` on `issues` UPDATE

### Notification Type Enum
- Create `notification_type` enum with: `issue_verified`, `authority_assigned`, `status_changed`, `issue_resolved`, `issue_rejected`, `duplicate_linked`
- Alter `notifications.type` column to use this enum (with cast)

## Files

| Action | File |
|--------|------|
| Migration | Add indexes, triggers, notification_type enum |

No code changes needed — the frontend already works with the existing column names.

