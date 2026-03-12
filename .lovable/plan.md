

# Explore Issues Page — Implementation Plan

## Overview

Create a new `/issues` page with full filtering, sorting, voting, and pagination. Reuses the existing `useIssueFeed` hook and `vote-issue` edge function.

## Files to Create/Edit

### 1. `src/pages/ExploreIssues.tsx` (new)
Main page with header, filter bar, issue grid, pagination, and empty state.

**Header**: "Explore City Issues" / "Discover what's happening in your area — filter, vote, and track civic problems across the city."

**Filter bar**: Collapsible on mobile (Sheet), inline on desktop. Fields: Pincode input, Category select, Status select, Priority select, Sort select. Apply + Clear buttons. Active filter chips with remove.

**Issue grid**: Responsive grid (`sm:grid-cols-1 lg:grid-cols-2`) of `IssueCard` components. Each card shows image (from first report's `image_url` via `issue_reports` join — or skip image for MVP and use category icon), title, description snippet (2-line clamp), category tag, pincode, status badge, priority badge, upvotes/downvotes, reports count, authority name, relative time.

**Voting**: Upvote/downvote buttons on each card calling `vote-issue` edge function. Optimistic UI updates. Requires auth — toast prompt if not logged in.

**Pagination**: "Load More" button pattern using `useIssueFeed` with page increment. Shows count of total issues.

**Empty state**: Icon + "No issues match your filters" + "Try broadening your search or report a new issue" + link to `/report`.

### 2. `src/components/issues/IssueCard.tsx` (new)
Reusable issue card component. Props: issue data object. Uses `statusColors`, `priorityColors`, `formatCategory`, `formatStatus` from `issueHelpers.ts`. Voting via `supabase.functions.invoke('vote-issue', ...)`.

### 3. `src/hooks/useIssueFeed.ts` (edit)
Add `image_url` to select if we want to show images. Actually, the issues table doesn't have image_url — images are on `issue_reports`. For MVP, skip issue images and use category-based visual markers instead.

### 4. `src/App.tsx` (edit)
Add route: `<Route path="/issues" element={<ExploreIssues />} />`

## Layout Details

- Full page, `min-h-screen bg-background`
- `max-w-6xl mx-auto px-4 py-12`
- Filter card at top, then count + chips row, then grid
- On mobile: filters in a collapsible section or always visible but stacked
- Cards: `border-border/50 hover:shadow-md hover:border-primary/20 transition-all`

## Voting UX
- ThumbsUp / ThumbsDown buttons with count
- Active state highlighting when user has voted (fetch user's votes on mount if authenticated)
- Calls `vote-issue` edge function
- If not logged in, show toast "Sign in to vote"

## No Database Changes Needed
All data comes from existing `issues` table and `vote-issue` edge function.

