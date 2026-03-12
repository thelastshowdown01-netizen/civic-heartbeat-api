

# Design System & Visual Consistency Layer

## Current State Assessment

The app already has solid foundations: CSS variables for colors, shadcn/ui components, centralized status/priority colors in `issueHelpers.ts`, and Inter font. However, visual consistency is ad-hoc — each page defines its own heading sizes, spacing, card patterns, and stat layouts independently. There is no shared typography scale, no reusable page header pattern, and stat cards are duplicated across Admin, Authority, and User dashboards with slightly different styling.

## What This Plan Does

Introduce a **CSS utility layer** and a small set of **shared components** that standardize recurring patterns across all pages, making the product feel unified without rewriting page logic.

## Implementation

### 1. `src/index.css` — Add Design System Utilities

Add `@layer components` block with reusable utility classes:

**Typography scale:**
- `.page-title` — `text-2xl md:text-3xl font-bold tracking-tight`
- `.page-description` — `text-sm md:text-base text-muted-foreground`
- `.section-title` — `text-xl md:text-2xl font-semibold tracking-tight`
- `.section-description` — `text-sm text-muted-foreground`
- `.label-text` — `text-xs font-medium uppercase tracking-wide text-muted-foreground`

**Layout utilities:**
- `.page-container` — `max-w-6xl mx-auto px-4 py-6 md:py-8`
- `.page-header` — `mb-6 md:mb-8` (flex column with gap for title + description)
- `.section-gap` — `space-y-6`
- `.card-grid` — responsive grid for stat cards

**State patterns:**
- `.empty-state` — centered container with icon, title, description styling

### 2. `src/components/ui/stat-card.tsx` — Shared Stat Card (new)

Extract the repeated stat card pattern (used in AdminStatsCards, AuthorityDashboard, UserDashboard) into one reusable component:

```tsx
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: string;
  loading?: boolean;
}
```

Renders a `Card` with consistent padding (p-4), icon+label row, and bold value. Loading state uses `Skeleton`.

### 3. `src/components/ui/page-header.tsx` — Shared Page Header (new)

Reusable header block for all pages:

```tsx
interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode; // slot for buttons
}
```

Renders icon + title + description in a consistent layout with optional right-aligned action buttons.

### 4. `src/components/ui/empty-state.tsx` — Shared Empty State (new)

Reusable empty state component:

```tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}
```

### 5. `src/lib/issueHelpers.ts` — Expand with category icons

Move the `categoryIcons` map (currently duplicated in IssueCard and UserDashboard) into the shared helpers file.

### 6. Update Pages to Use Shared Components

**`src/components/admin/AdminStatsCards.tsx`** — Use `StatCard` component instead of inline card markup.

**`src/pages/AuthorityDashboard.tsx`** — Use `StatCard`, `PageHeader`, and `EmptyState` components. Remove inline stat card markup and empty state markup.

**`src/pages/UserDashboard.tsx`** — Use `PageHeader` and `StatCard` for the summary section.

**`src/pages/ExploreIssues.tsx`** — Use `PageHeader`.

**`src/pages/Notifications.tsx`** — Use `PageHeader` and `EmptyState`.

**`src/pages/ReportIssue.tsx`** — Use `PageHeader`.

**`src/pages/IssueDetails.tsx`** — Ensure consistent page container spacing.

**`src/components/landing/FeaturesSection.tsx`** — Use `.section-title` / `.section-description` classes.

## Files

- **Edit**: `src/index.css` (add utility layer)
- **Create**: `src/components/ui/stat-card.tsx`
- **Create**: `src/components/ui/page-header.tsx`
- **Create**: `src/components/ui/empty-state.tsx`
- **Edit**: `src/lib/issueHelpers.ts` (add categoryIcons)
- **Edit**: `src/components/admin/AdminStatsCards.tsx`
- **Edit**: `src/pages/AuthorityDashboard.tsx`
- **Edit**: `src/pages/UserDashboard.tsx`
- **Edit**: `src/pages/ExploreIssues.tsx`
- **Edit**: `src/pages/Notifications.tsx`
- **Edit**: `src/pages/ReportIssue.tsx`
- **Edit**: `src/pages/IssueDetails.tsx`
- **Edit**: `src/components/landing/FeaturesSection.tsx`

## No Database Changes

