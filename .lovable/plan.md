

# Move Authority Tabs into Sidebar Navigation

## What Changes

Replace the current sidebar nav items ("Dashboard" and "Explore Issues") with the 3 tabs that are currently inside the AuthorityDashboard page: **Reports**, **Live Feed**, and **Merged Issues**. Each becomes its own route and sidebar link instead of in-page tabs.

## Changes

### 1. `src/App.tsx` — Add 3 authority routes

Add routes:
- `/authority` → Reports page (landing)
- `/authority/feed` → Live Feed page
- `/authority/merged` → Merged Issues page

### 2. `src/components/layouts/DashboardLayout.tsx` — Update sidebar nav

Replace `authorityNavItems` with:
- `/authority` → "Reports" (FileText icon)
- `/authority/feed` → "Live Feed" (Activity icon)
- `/authority/merged` → "Merged Issues" (ClipboardList icon)

### 3. Split `src/pages/AuthorityDashboard.tsx` into 3 pages

Extract the content of each tab into its own page component, all wrapped in `DashboardLayout`:

- **`src/pages/authority/AuthorityReports.tsx`** — Stats cards + recent activity (current "reports" tab content). This is the landing page at `/authority`.
- **`src/pages/authority/AuthorityFeed.tsx`** — Filters, issue cards with actions, pagination (current "feed" tab content). Includes the action dialogs.
- **`src/pages/authority/AuthorityMerged.tsx`** — Merged issues list with expandable citizen reports (current "merged" tab content).

The shared state (action dialogs for verify/reject/progress/resolve) will be duplicated in Feed and Merged pages since both use `IssueActionCard`.

### 4. Remove the in-page `Tabs` component

The old `AuthorityDashboard.tsx` with its `TabsList` will be replaced by the 3 separate page files.

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/authority/feed` and `/authority/merged` routes |
| `src/components/layouts/DashboardLayout.tsx` | Update sidebar nav items to 3 tabs |
| `src/pages/authority/AuthorityReports.tsx` | New — stats + activity (landing) |
| `src/pages/authority/AuthorityFeed.tsx` | New — live feed with filters + actions |
| `src/pages/authority/AuthorityMerged.tsx` | New — merged issues with expandable reports |
| `src/pages/AuthorityDashboard.tsx` | Delete (replaced by 3 pages) |

