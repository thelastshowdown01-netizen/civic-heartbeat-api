

# Add Role Selection to Signup Page

## What changes

### 1. Update `handle_new_user()` trigger (Migration)
Currently hardcodes `'citizen'` role. Change it to read `raw_user_meta_data->>'role'` and default to `'citizen'` if not provided. Only allow `citizen`, `admin`, `authority` values.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
...
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    'citizen'
  )::app_role);
```

### 2. Update `src/pages/Signup.tsx`
- Add `selectedRole` state (`citizen` | `admin` | `authority`)
- Show 3 role selection buttons above/below the form (styled toggle group)
- Pass `role` in `signUp` options `data: { full_name, pincode, role: selectedRole }`
- After signup, navigate to login
- Replace single "Create Account" button with role-aware label (e.g. "Sign Up as Admin")

### Files

| File | Change |
|------|--------|
| Migration SQL | Update `handle_new_user()` to use metadata role |
| `src/pages/Signup.tsx` | Add role selector UI + pass role in metadata |

