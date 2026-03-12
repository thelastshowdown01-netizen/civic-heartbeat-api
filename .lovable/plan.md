

# Polish & Demo-Ready Refinements for Sustain City

## Assessment

The app is already well-structured with good loading/empty states on most pages. The main gaps are: missing footer on public pages, NotFound page is unstyled, AdminIssueReview lacks the DashboardLayout wrapper, SubmissionSuccess uses `window.location.href` instead of React Router, some hover/transition polish is missing, and a few empty states could use the shared `EmptyState` component.

## Changes

### 1. Add Footer to PublicLayout
Add a minimal civic-tech footer with branding, links, and copyright below the main content area. Only visible on public pages (not dashboard).

**Edit**: `src/components/layouts/PublicLayout.tsx` — add footer section after `</main>`.

### 2. Polish NotFound Page
Wrap in `PublicLayout`, use `EmptyState` component, add proper 404 illustration and navigation links.

**Edit**: `src/pages/NotFound.tsx`

### 3. Fix AdminIssueReview — wrap in DashboardLayout
Currently renders raw `div` without layout. Wrap in `DashboardLayout` for sidebar consistency with the rest of admin pages.

**Edit**: `src/pages/AdminIssueReview.tsx` — replace raw `div.min-h-screen` wrapper with `DashboardLayout`.

### 4. Fix SubmissionSuccess navigation
Replace `window.location.href = '/#issues'` with React Router `Link to="/issues"`. Also link to the actual created issue via `/issues/${issueId}`.

**Edit**: `src/components/report/SubmissionSuccess.tsx`

### 5. Polish AdminIssueTable empty state
Replace plain text empty state with `EmptyState` component.

**Edit**: `src/components/admin/AdminIssueTable.tsx` — lines 23-28

### 6. Add subtle card hover transition to IssueCard
Already has `hover:shadow-md hover:border-primary/20 transition-all duration-200` — good. Ensure consistency across all card types.

### 7. Add global transition utilities to index.css
Add `.card-hover` utility class for consistent card hover behavior across the app.

**Edit**: `src/index.css`

### 8. Polish HeroSection CTA buttons
The "Report an Issue" button for logged-in users doesn't link anywhere. Wrap in `Link to="/report"`.

**Edit**: `src/components/landing/HeroSection.tsx` — line 74

### 9. Polish ExploreIssues empty state
Replace inline empty state with `EmptyState` component for consistency.

**Edit**: `src/pages/ExploreIssues.tsx` — lines 280-296

### 10. Add query error handling with toast
Add `onError` to the QueryClient defaults so failed queries show a toast instead of silently failing.

**Edit**: `src/App.tsx` — configure queryClient with default error handler.

## Files Summary

- **Edit**: `src/components/layouts/PublicLayout.tsx` (add footer)
- **Edit**: `src/pages/NotFound.tsx` (polish with layout + EmptyState)
- **Edit**: `src/pages/AdminIssueReview.tsx` (wrap in DashboardLayout)
- **Edit**: `src/components/report/SubmissionSuccess.tsx` (fix navigation)
- **Edit**: `src/components/admin/AdminIssueTable.tsx` (use EmptyState)
- **Edit**: `src/components/landing/HeroSection.tsx` (fix CTA link)
- **Edit**: `src/pages/ExploreIssues.tsx` (use EmptyState component)
- **Edit**: `src/index.css` (add card-hover utility)
- **Edit**: `src/App.tsx` (add global query error handler)

## No Database Changes

