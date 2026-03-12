

# Trust / Transparency Section — Enhancement Plan

## What Changes

Rebuild `TrustSection.tsx` from 3 basic cards into a richer 5-pillar trust section with a visual status timeline preview and stronger copy.

## Heading
- **"Transparency That Builds Public Trust"**
- Subheading: "Every issue is tracked, every authority is visible, and every resolution is public — accountability by design."

## 5 Trust Pillars

| Icon | Title | Description |
|------|-------|-------------|
| Eye | Transparent Status Tracking | Follow every issue from reported to resolved — every status change is logged and visible to all. |
| Building2 | Authority Visibility | See exactly which department or authority is handling the issue and at what stage. |
| ThumbsUp | Community Validation | Public votes and multiple citizen reports surface the issues that matter most. |
| GitMerge | Smart Issue Consolidation | Duplicate complaints are grouped into one master issue for cleaner action and better prioritization. |
| BarChart3 | Data-Driven Prioritization | Severity, report volume, and community signals determine which issues get attention first. |

## Layout
- **Top**: 3-column grid for first 3 pillars
- **Bottom**: 2-column grid (centered) for remaining 2 pillars
- Each card: icon circle (`bg-primary/10`), bold title, 1-line description, centered text
- Cards: `border-border/50 bg-card` with `hover:shadow-md hover:border-primary/20 transition-all`

## Visual Support
Add a small inline status progression strip below the heading showing 5 status chips: Reported → Verified → Assigned → In Progress → Resolved — connected by subtle lines. Uses `Badge` components with status colors from `issueHelpers.ts`.

## Section styling
- `py-20`, no tinted background (alternates with adjacent sections)
- Max width `max-w-6xl`

## Files Changed
- `src/components/landing/TrustSection.tsx` — full rewrite

