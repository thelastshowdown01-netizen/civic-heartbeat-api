

# Issue Details / Track Progress Page — Implementation Plan

## Overview

Create `/issues/:id` page showing full issue details, status timeline, community signals, and voting. Fetches issue data, linked reports, status logs, and user's vote.

## Files to Create

### 1. `src/pages/IssueDetails.tsx`
Main page with responsive layout: single column on mobile, two-column on desktop (main content left, sidebar right).

**Data fetching** (3 parallel queries via react-query):
- Issue from `issues` table by id
- Status logs from `status_logs` table filtered by issue_id, ordered by created_at
- Issue reports from `issue_reports` table filtered by issue_id (to get images and report count)
- User's vote from `votes` table if authenticated

**Header section**:
- Back link to `/issues`
- Issue title (or formatted category as fallback)
- Row of badges: status, priority, category
- Meta row: pincode, created date, reports count

**Main content area**:
- **Issue image** from first report's `image_url` (or placeholder if none)
- **Full description**
- **Authority section**: assigned authority name or "Awaiting assignment" state
- **Community signals card**: upvotes/downvotes with vote buttons (reuse voting logic from IssueCard), reports count, merge note if reports > 1

**Status Timeline** (key visual feature):
- Vertical timeline showing issue lifecycle stages: reported → verified → assigned → in_progress → resolved
- Each stage shows: completed/current/pending state, timestamp from status_logs if available, comment from admin if present
- Current stage highlighted, completed stages checked, future stages grayed
- Rejected shown as a branch if status is rejected

**Sidebar (desktop)**:
- "Issue Progress" summary card
- "What happens next" based on current status
- "Report Similar Issue" link to `/report`

**Action buttons**:
- Upvote / Downvote (with same optimistic logic as IssueCard)
- "Back to Issues" link
- "Report Similar Issue" link

**Loading state**: Skeleton placeholders
**Not found state**: If issue doesn't exist, show 404-style message with link back

### 2. `src/components/issues/StatusTimeline.tsx`
Reusable vertical timeline component.

Props: `currentStatus`, `statusLogs` array, `resolvedAt`

Renders the 5 lifecycle stages as a vertical stepper with connecting lines. Maps status_logs entries to timestamps and comments for each stage.

## Files to Edit

### `src/App.tsx`
Add route: `<Route path="/issues/:id" element={<IssueDetails />} />`

### `src/components/issues/IssueCard.tsx`
Wrap the card title in a `<Link to={/issues/${issue.id}>` so cards are clickable from the Explore page.

## No Database Changes Needed
All data comes from existing `issues`, `status_logs`, `issue_reports`, and `votes` tables with public SELECT RLS policies.

