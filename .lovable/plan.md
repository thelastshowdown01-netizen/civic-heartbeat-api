

# Fix: Admin/Authority Login Always Opens Citizen Dashboard

## Root Cause

The `user_roles` table is **completely empty**. When you previously asked to "delete all dummy data," all role assignments were wiped. The `handle_new_user` trigger only fires on **new** user creation, so existing users (including the admin and authority demo accounts) never got their roles back.

When Login.tsx queries `user_roles` for the logged-in user and gets no result, it defaults to `"citizen"` and navigates to `/dashboard`.

Network evidence: `GET /user_roles?user_id=eq.b5d3739e...` returns `[]` for the admin account.

## Fix

### 1. Database Migration: Re-insert roles for all existing users

Insert the correct roles for demo accounts and default `citizen` for any other users without a role:

```sql
-- Re-insert demo account roles
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('b5d3739e-3593-4af6-8c37-4721fcf6f47c', 'admin'),      -- admin@demo
  ('36cb464f-09dc-4fbd-b1cb-8f4654f5209d', 'authority'),   -- authority@demo
  ('6a602f29-7555-4046-8624-150199834f04', 'authority'),   -- authority2@demo
  ('a1231a37-53f8-4ded-9ec6-4ceb6737d983', 'citizen'),     -- citizen1@demo
  ('ba4c2fb1-027e-4048-a88e-ce08ef458006', 'citizen'),     -- citizen2@demo
  ('e814eed9-9f1d-42b6-af88-ffff75377894', 'citizen'),     -- citizen3@demo
  ('6536d0b2-e709-4e8d-a130-eca34deee0fb', 'citizen'),     -- test02
  ('2c598056-234f-4320-827e-ef0fc867f5b9', 'citizen'),     -- test1
  ('a2106abf-802c-476c-b0bb-dc94688b81a1', 'citizen')      -- test2
ON CONFLICT (user_id, role) DO NOTHING;
```

### 2. Update seed function to always ensure roles exist

Modify `supabase/functions/seed-demo-data/index.ts` so even when it detects existing issues, it still upserts the demo user roles before returning early. This prevents the problem from recurring.

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Insert missing roles for all existing users |
| `supabase/functions/seed-demo-data/index.ts` | Always upsert demo roles even if data exists |

