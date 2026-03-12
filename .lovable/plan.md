

# App Shell, Navigation System & Role-Based Layouts

## Current State
Every page individually imports and renders `<Navbar />`. No shared layout. No sidebar. No mobile menu. Navigation items are crammed into a single horizontal bar that hides most links on mobile.

## Architecture

### Two Layout Components

**1. `src/components/layouts/PublicLayout.tsx`** — For public/citizen pages
- Enhanced top navbar with mobile hamburger menu (Sheet-based drawer)
- Role-aware nav items
- Consistent page container (`max-w-6xl mx-auto px-4 py-8`)
- Simple footer on landing page only
- Props: `children`, optional `fullWidth` for landing page

**2. `src/components/layouts/DashboardLayout.tsx`** — For admin/authority pages
- Sidebar using Shadcn Sidebar component (`collapsible="icon"`)
- Sidebar shows role-specific nav items with active states (using NavLink)
- Header bar with SidebarTrigger, page title, notification bell, user avatar/initials, role badge, sign out
- Props: `children`, `title`, `icon`

### Navigation Items by Role

**Public (logged out):**
- Home, Explore Issues, Report an Issue, Sign In, Sign Up

**Citizen (logged in):**
- Home, Explore Issues, Report an Issue, My Reports, Notifications, Sign Out

**Admin (logged in):**
- Admin Dashboard, Moderation Queue (`/admin`), Issue Review, Explore Issues, Notifications, Sign Out

**Authority (logged in):**
- Work Queue (`/authority`), Explore Issues, Notifications, Sign Out

### Mobile Navigation
- **PublicLayout**: Hamburger icon opens a Sheet (slide-from-left) with all nav items stacked vertically
- **DashboardLayout**: Sidebar collapses to icon-only strip; SidebarTrigger always visible in header

### Page Assignments

**PublicLayout**: `/` (fullWidth), `/issues`, `/issues/:id`, `/report`, `/dashboard` (My Reports), `/notifications`, `/login`, `/signup`, `/forgot-password`, `/reset-password`

**DashboardLayout**: `/admin`, `/admin/issues/:id`, `/authority`

### Implementation Steps

1. Create `src/components/layouts/PublicLayout.tsx` — responsive top nav with mobile Sheet menu, role-aware items, notification bell, user info
2. Create `src/components/layouts/DashboardLayout.tsx` — Shadcn Sidebar + header bar with trigger, title, user controls
3. Update all page files to remove `<Navbar />` import and wrap content in the appropriate layout
4. Remove standalone `Navbar` usage from all pages (it gets absorbed into PublicLayout)

### Files

- **Create**: `src/components/layouts/PublicLayout.tsx`
- **Create**: `src/components/layouts/DashboardLayout.tsx`
- **Edit**: `src/pages/Index.tsx`, `src/pages/ExploreIssues.tsx`, `src/pages/IssueDetails.tsx`, `src/pages/ReportIssue.tsx`, `src/pages/UserDashboard.tsx`, `src/pages/Notifications.tsx` — wrap in `PublicLayout`
- **Edit**: `src/pages/AdminDashboard.tsx`, `src/pages/AdminIssueReview.tsx` — wrap in `DashboardLayout` (admin)
- **Edit**: `src/pages/AuthorityDashboard.tsx` — wrap in `DashboardLayout` (authority)
- **Edit**: `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx` — these use `AuthLayout` already, no change needed
- **Edit**: `src/App.tsx` — no route changes needed, just imports stay the same

### No Database Changes

