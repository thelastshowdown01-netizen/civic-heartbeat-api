

# Filter / Discover Issues Section Enhancement

## What Changes

Enhance `FilterDiscoverSection.tsx` from a basic filter bar into a full discovery section with stateful filters, a live preview of filtered results, and polished civic-tech styling.

## Heading
- **"Explore Civic Issues in Your Area"**
- Subheading: "Filter by pincode, category, status, or priority — find exactly what's happening in your locality."

## Filter Panel
- Wrap filters in a `Card` with `bg-card/80` and subtle border
- Keep existing 4 controls (pincode input, category/status/priority selects) with same enum sources
- Add a sort-by select: Latest, Most Upvoted, Highest Priority
- Add "Explore Issues" button and a "Clear" text button to reset
- Use `useState` for all filter values; wire them into the `useIssueFeed` hook

## Live Results Preview
Below the filter card, show:
- A results summary line: "{count} issues found" with active filter badges (dismissible)
- Up to 3 compact issue cards in a responsive row (`sm:grid-cols-2 lg:grid-cols-3`), each showing: title (line-clamp-1), category badge, status badge, priority badge, upvotes, pincode, relative time
- Skeleton loaders while fetching
- Empty state if no results

## Visual Polish
- Section bg: default (no tinted background — alternates with adjacent `bg-muted/30` sections)
- Filter card: rounded-xl, shadow-sm, p-6
- Result cards: compact, border, hover:shadow-sm
- Filter badges below the bar showing active filters as dismissible chips

## Files Changed
- `src/components/landing/FilterDiscoverSection.tsx` — full rewrite with state, `useIssueFeed`, and results preview

No new files, no backend changes.

