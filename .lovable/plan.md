

# Enhanced Authentication Experience for Sustain City

## What Exists
All four auth pages (Login, Signup, ForgotPassword, ResetPassword) already exist and are fully functional. They use a simple centered card layout with basic forms. The auth backend (auto-confirm, profiles trigger, role assignment) is already configured.

## What Changes
Upgrade all four pages from basic centered cards to a polished **split layout** with civic-tech branding, add confirm password + optional pincode to signup, add client-side validation, and improve visual polish.

## Implementation

### All Auth Pages — Split Layout Pattern
- **Desktop**: Two-column layout. Left side = branded panel with Sustain City logo, 3-4 trust/benefit bullet points (icons + text), subtle gradient background using primary green. Right side = form card.
- **Mobile**: Single column, form only. Trust points hidden or collapsed above form.
- Shared layout extracted into a reusable `AuthLayout` component in `src/components/auth/AuthLayout.tsx`.

### `src/components/auth/AuthLayout.tsx` (new)
Reusable wrapper. Props: `children` (form content). Renders the split layout with left branding panel containing:
- Sustain City name + tagline
- Benefit items: "Report local issues easily", "Track progress transparently", "Stay updated on action taken", "Help improve your area"
- Each with a Lucide icon (MapPin, Eye, Bell, Heart)

### `src/pages/Login.tsx` (rewrite)
- Wrap in `AuthLayout`
- Add eye toggle for password visibility
- Keep existing auth logic unchanged

### `src/pages/Signup.tsx` (rewrite)
- Wrap in `AuthLayout`
- Add **Confirm Password** field with mismatch validation
- Add **Optional Pincode** field (passed as user metadata)
- Add eye toggle for password visibility
- Client-side validation: password match check before submit, toast error if mismatch

### `src/pages/ForgotPassword.tsx` (rewrite)
- Wrap in `AuthLayout`
- No logic changes, just visual upgrade

### `src/pages/ResetPassword.tsx` (rewrite)
- Wrap in `AuthLayout`
- Add confirm password field
- No other logic changes

## Files
- **Create**: `src/components/auth/AuthLayout.tsx`
- **Edit**: `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`

## No Database Changes Needed

