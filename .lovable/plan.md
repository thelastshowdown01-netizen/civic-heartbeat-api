

# Dashboard Preview Section Enhancement

## What Changes

Rebuild `DashboardPreview.tsx` from a simple 4-card row into a richer two-tier civic analytics panel using the same `useDashboardStats` hook (no backend changes).

## Layout

**Top row** — 4 primary metric cards (2-col mobile, 4-col desktop):
- Total Issues (FileText icon)
- Resolved Issues (CheckCircle icon) — with resolution rate percentage derived from `resolved / total`
- High Priority Active (AlertTriangle icon) — destructive accent color
- Most Affected Area (MapPin icon)

**Bottom row** — 3 supporting insight cards (1-col mobile, 3-col desktop):
1. **Most Reported Category** — uses `most_reported_category` from stats, formatted via `issueHelpers.formatCategory`, shown as a highlighted badge
2. **Resolution Progress** — a `Progress` bar showing `resolved / total * 100`, with label
3. **Active Issues** — uses `active_issues` stat, with an "In Progress" status badge

## Visual Polish
- Section bg: `bg-muted/30` for contrast with adjacent sections
- Cards: `border-border/50`, subtle `shadow-sm`
- Metric values: `text-3xl font-bold` for primary row, `text-xl` for secondary
- High priority card gets `border-destructive/30` accent
- Resolution progress uses the existing `Progress` component
- Skeleton loaders for all values while loading

## Heading
- **"Live Civic Dashboard"** → **"City-Wide Civic Intelligence"**
- Subheading: "Real-time metrics on reported issues, resolution progress, and priority hotspots — powered by citizen data."

## Files Changed
- `src/components/landing/DashboardPreview.tsx` — full rewrite (imports `Progress` component and `formatCategory` from issueHelpers)

No new files, no backend changes.

