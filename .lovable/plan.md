

# End-to-End Integration — Gap Analysis & Fixes

## Assessment

After thorough review of every page, edge function, hook, and layout, **the app is already 95% connected end-to-end**. Auth, report submission, voting, status updates, notifications, role-based nav, and data queries are all wired to live backend functions and database tables.

There are only **3 real gaps** to close:

## Gap 1: `image_url` column missing on `issues` table

The `submit-report` edge function writes `image_url` to the `issues` table (for backfilling images from reports), but the column doesn't exist in the schema. This causes the image backfill to silently fail.

**Fix**: Add migration to create `image_url text` column on `issues` table.

## Gap 2: AdminIssueReview not wrapped in DashboardLayout

The admin review page (`/admin/issues/:id`) renders as a raw `div` without the sidebar, breaking navigation consistency. Admins lose access to the sidebar when reviewing issues.

**Fix**: Wrap the page content in `DashboardLayout` with back-link and proper header.

**Edit**: `src/pages/AdminIssueReview.tsx`

## Gap 3: Query invalidation after report submission

After submitting a report, the user sees a success screen but if they navigate to Explore Issues or My Reports, the cached data may be stale. The report form doesn't invalidate relevant queries.

**Fix**: Add `useQueryClient` to `ReportForm` and invalidate `issue-feed` and `my-reports` queries on success.

**Edit**: `src/components/report/ReportForm.tsx`

## Summary

| Change | File | Type |
|--------|------|------|
| Add `image_url` column to issues | Migration | DB |
| Wrap AdminIssueReview in DashboardLayout | `src/pages/AdminIssueReview.tsx` | Edit |
| Invalidate queries after report submit | `src/components/report/ReportForm.tsx` | Edit |

No other integration work is needed — all flows are already connected.

