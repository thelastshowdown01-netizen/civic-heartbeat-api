

# Demo Mode for Sustain City

## Approach

Add a lightweight floating **Demo Bar** that appears when demo mode is activated. It enables instant role switching (citizen/admin/authority) with one click, shows the current role, and provides quick navigation to key screens. No heavy overlays or tutorials.

## Components

### 1. Demo Bar Component (`src/components/demo/DemoBar.tsx`)
A fixed bottom bar (like a presentation toolbar) that:
- Shows current demo role with colored indicator
- Has 3 role-switch buttons: Citizen, Admin, Authority
- Clicking a role signs out current user, signs in as that demo account, and navigates to the appropriate landing page
- Has quick-nav links: Report → Explore → Details → Admin → Authority
- Has an "Exit Demo" button
- Subtle, professional design — dark semi-transparent bar at bottom

### 2. Demo Context (`src/hooks/useDemo.tsx`)
A small context provider that tracks:
- `isDemoMode: boolean` — stored in sessionStorage
- `activateDemo()` — sets demo mode on
- `exitDemo()` — signs out and clears demo mode
- `switchRole(role)` — handles sign-in as the appropriate demo account

### 3. Demo Entry Point on Landing Page
Add a "Try Live Demo" button in the `HeroSection` that activates demo mode and signs in as citizen.

### 4. Demo Login Shortcut on Login Page
Add a "Demo Accounts" section below the login form with one-click buttons for each role.

## Demo Accounts (already seeded)
- Citizen: `citizen1@demo.sustaincity.in` / `DemoPass123!`
- Admin: `admin@demo.sustaincity.in` / `DemoPass123!`
- Authority: `authority@demo.sustaincity.in` / `DemoPass123!`

## Role Switch Flow
1. Click role button in Demo Bar
2. `supabase.auth.signOut()` then `supabase.auth.signInWithPassword()`
3. Navigate to role's home page (`/dashboard`, `/admin`, `/authority`)
4. Bar updates to show new active role

## Quick Nav in Demo Bar
Small pill buttons for fast screen jumping during demo:
- Home → Report → Explore → My Reports → Admin → Authority

## Files

| Action | File |
|--------|------|
| Create | `src/hooks/useDemo.tsx` |
| Create | `src/components/demo/DemoBar.tsx` |
| Edit | `src/App.tsx` — wrap with DemoProvider, render DemoBar |
| Edit | `src/components/landing/HeroSection.tsx` — add "Try Live Demo" button |
| Edit | `src/pages/Login.tsx` — add demo account quick-login section |

## No database or schema changes needed.

