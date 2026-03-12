

# Hero Section Rebuild Plan

## What Changes

Replace the current centered text-only `HeroSection.tsx` with a two-column layout:
- **Left**: Badge, headline, subheading, CTAs, trust chips
- **Right**: A static mock product preview showing issue cards and mini dashboard stats

## Left Column

- Badge: "Civic Resolution Platform"
- Headline: "Report. Prioritize. Resolve." on line 1, "Civic Issues That Matter." on line 2 (with "That Matter" in primary color)
- Subheading: "Submit civic problems with photos and location. The platform merges duplicates, scores urgency, assigns authorities, and lets you track every step — transparently."
- CTAs: "Report an Issue" (primary, logged-in) / "Get Started" (primary, logged-out) + "Explore Issues" (outline)
- Trust row: 5 inline chips — Real-Time Tracking · Duplicate Merging · Smart Prioritization · Authority Visibility · Community Voting

## Right Column (static mock preview)

A styled card container with:
1. **Mini stat bar** at top — 3 small metric blocks (e.g., "142 Issues", "89 Resolved", "12 High Priority") using muted styling
2. **2-3 mock issue cards** stacked, each showing:
   - Category tag (e.g., "Pothole", "Water Leakage")
   - Title text
   - Status badge + priority badge
   - Upvote count + pincode
   - Uses real `statusColors`/`priorityColors` from issueHelpers

The right side is purely presentational (hardcoded data) — no API calls. It acts as a visual product demo.

## Layout

- `md:grid md:grid-cols-2 gap-12 items-center` with max-w-6xl
- Left column text-left on desktop, text-center on mobile
- Right column hidden on mobile (`hidden md:block`) to keep mobile clean
- Overall padding: `py-20 md:py-28`

## Files Changed

- `src/components/landing/HeroSection.tsx` — full rewrite

No new files, no backend changes.

