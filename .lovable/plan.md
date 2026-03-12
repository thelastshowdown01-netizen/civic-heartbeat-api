

# How It Works Section — Enhancement Plan

## What Changes

Rebuild `HowItWorksSection.tsx` with a stronger heading, richer step copy, and a horizontal card-based layout on desktop (stacking vertically on mobile) with connecting arrows between steps.

## Heading
- **"From Citizen Report to Civic Resolution"**
- Subheading: "Five structured steps that turn everyday complaints into tracked, transparent government action."

## Steps (updated copy)

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | Camera | Report the Issue | Upload a photo, describe the problem, and tag your pincode — takes under a minute. |
| 2 | GitMerge | Duplicates Are Merged | Similar or nearby reports are automatically grouped into a single master issue. |
| 3 | TrendingUp | Priority Is Determined | Issues are ranked by severity, report volume, and community votes — urgent cases surface first. |
| 4 | Building2 | Authority Is Assigned | The responsible department takes ownership with clear accountability. |
| 5 | CheckCircle2 | Tracked to Resolution | Follow every status change from reported to resolved — fully transparent. |

## Layout
- **Desktop** (`lg:`): Horizontal 5-column grid of step cards with small connecting arrow icons (`ChevronRight`) between them — achieved via flex with gap and arrow dividers hidden on mobile
- **Mobile**: Vertical stack with a left-side timeline connector (similar to current but with enhanced cards)
- Each step card: numbered circle with icon, bold title below, 1-line description, all centered
- Cards: `bg-card/80 border rounded-xl p-6` with subtle hover lift

## Visual Polish
- Section bg: `bg-muted/30` (keeps alternating pattern)
- Step numbers: small `text-xs font-bold text-primary` label above icon circle
- Icon circles: `h-14 w-14 rounded-full bg-primary/10 border-2 border-primary`
- Connecting arrows between cards on desktop only

## Files Changed
- `src/components/landing/HowItWorksSection.tsx` — full rewrite

