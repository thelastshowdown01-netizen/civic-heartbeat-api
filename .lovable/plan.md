

# Public Issue Feed Preview — Enhancement Plan

## What Changes

Enhance `IssueFeedPreview.tsx` with a stronger heading, richer issue cards (adding description snippets and image placeholders), and improved visual polish. The hook and data source remain unchanged.

## Heading
- **"Live Civic Issues in Your City"**
- Subheading: "Discover, monitor, and engage with real civic problems reported by citizens — updated in real time."

## Card Enhancements
Each card gets:
- **Image area**: If `image_url` exists on the issue, show it; otherwise show a subtle category-themed placeholder with an icon (using the category to pick a relevant Lucide icon)
- **Description snippet**: Show `issue.description` truncated to 2 lines via `line-clamp-2` (already selected in hook query — need to add `description` to the select)
- **Category tag**: Kept as uppercase label
- **Title**: Slightly larger, `line-clamp-2`
- **Status + Priority badges**: Kept with existing color maps
- **Footer**: Upvotes, reports count, pincode, and relative time
- **Hover**: `hover:shadow-md hover:border-primary/20 transition-all`

## Hook Update
Add `description` and `image_url` to the select in `useTrendingIssues.ts` so cards can show snippets and images.

## Layout
- Keep 3-column grid (`sm:grid-cols-2 lg:grid-cols-3`) with `gap-5`
- Section background stays `bg-muted/30`

## Files Changed
1. `src/hooks/useTrendingIssues.ts` — add `description, image_url` to select
2. `src/components/landing/IssueFeedPreview.tsx` — enhanced cards with image area, description, and updated heading

