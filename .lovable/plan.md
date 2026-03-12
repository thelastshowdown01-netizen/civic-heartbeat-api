

# Sustain City — Backend Architecture & MVP Plan

## Overview
A crowdsourced civic issue reporting platform built on Lovable Cloud (Supabase). Citizens report issues, admins verify and assign, authorities resolve. The system auto-merges duplicate reports and calculates priority scores.

## Phase 1: Database Schema & Auth

### Tables to create:
1. **profiles** — `id (FK→auth.users)`, `full_name`, `email`, `avatar_url`, `created_at`
2. **user_roles** — `id`, `user_id (FK→auth.users)`, `role (enum: citizen/admin/authority)` — separate table per security requirements
3. **pincode_zones** — `pincode (PK)`, `city`, `state`, `authority_id (FK→auth.users)`
4. **issues** — `id`, `category`, `description`, `status (enum)`, `priority (enum)`, `priority_score`, `pincode`, `latitude`, `longitude`, `reports_count`, `upvotes_count`, `downvotes_count`, `assignee_id`, `created_at`, `updated_at`, `resolved_at`
5. **issue_reports** — `id`, `issue_id (FK→issues)`, `reporter_id (FK→auth.users)`, `description`, `image_url`, `pincode`, `latitude`, `longitude`, `created_at`
6. **votes** — `user_id`, `issue_id`, `vote_type (1/-1)`, composite PK on (user_id, issue_id)
7. **status_logs** — `id`, `issue_id`, `changed_by_id`, `old_status`, `new_status`, `comment`, `created_at`
8. **notifications** — `id`, `user_id`, `issue_id`, `message`, `is_read`, `created_at`

### Storage
- **issue-images** bucket for citizen-uploaded photos

### RLS Policies
- Citizens: read all issues, CRUD own reports/votes, read own notifications
- Admins: full access to issues, status_logs, assignments
- Authorities: read/update assigned issues
- Role checks via `has_role()` security definer function

### Auth
- Supabase Auth with email/password signup
- Auto-create profile + citizen role on signup via database trigger
- Login, signup, and password reset pages

## Phase 2: Core Backend Logic (Edge Functions)

### `submit-report` function
- Accepts: description, category, pincode, image_url, lat/lon
- Finds similar unresolved issues (same category + pincode + within ~50m using lat/lon distance calc)
- If match: attach report to existing issue, increment reports_count
- If no match: create new issue + first report + initial status_log
- Recalculate priority score after every submission

### `vote-issue` function
- Toggle upvote/downvote (insert, change, or remove)
- Update counts on the issue record
- Recalculate priority

### `update-issue-status` function (admin/authority only)
- Validate role permissions
- Update issue status, create status_log entry
- Generate notifications for all reporters linked to the issue

### Priority scoring (reusable logic)
- Category weight (sewer_overflow: 50, road_damage: 40, pothole: 20, etc.)
- Severity keywords bonus (+25)
- Reports count × 5
- Upvotes × 2, downvotes × -1
- Labels: >75 = high, >40 = medium, else low

## Phase 3: Frontend Pages

### Public / Citizen Views
- **Landing page** — app intro, CTA to report or browse
- **Auth pages** — login, signup, forgot/reset password
- **Issue feed** — filterable list (pincode, category, status, priority) with sort options (recent, priority, upvotes, reports)
- **Issue detail** — description, image, status timeline, vote buttons, report count
- **Report form** — category select, description, pincode input, image upload, optional lat/lon
- **My reports** — citizen's own submitted reports and linked issues
- **Notifications** — list of updates on reported issues

### Admin Dashboard
- Unverified issues queue
- Assign authority to issues
- Status management (verify, mark in-progress, resolve)
- Basic stats (total issues, resolved, by category)

### Authority View
- Assigned issues list
- Update status/progress on assigned issues

## Phase 4: Polish & Integration
- Toast notifications for actions (report submitted, vote recorded, status changed)
- Mobile-responsive layout (primary use case is phone on a street corner)
- High-contrast, scannable UI per the design brief
- Loading states and error handling throughout

## Implementation Order
1. Database migrations (all tables, enums, RLS, triggers)
2. Storage bucket for images
3. Auth pages (signup/login/reset)
4. Edge functions (submit-report, vote, status-update)
5. Issue feed + detail pages
6. Report submission form with image upload
7. Admin dashboard
8. Authority view
9. Notifications
10. Filtering, sorting, and polish

