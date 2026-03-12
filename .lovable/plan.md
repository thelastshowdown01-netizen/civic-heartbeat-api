

# Sustain City — Landing Page UI Plan

## Approach
Replace the current minimal `Index.tsx` with a full landing page composed of modular section components. Use existing hooks (`useDashboardStats`, `useIssueFeed`, `useTrendingIssues`) to pull live data. No backend changes needed.

## File Structure

### New Components
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/FeaturesSection.tsx`
- `src/components/landing/DashboardPreview.tsx` — uses `useDashboardStats` hook
- `src/components/landing/IssueFeedPreview.tsx` — uses `useTrendingIssues` hook
- `src/components/landing/FilterDiscoverSection.tsx` — filter bar with pincode input, category/status/priority selects (UI only on landing, links to future feed page)
- `src/components/landing/HowItWorksSection.tsx` — 5-step vertical timeline
- `src/components/landing/TrustSection.tsx`
- `src/components/landing/FooterCTA.tsx`
- `src/components/landing/Navbar.tsx` — extracted from current Index nav

### Updated Files
- `src/pages/Index.tsx` — compose all sections

## Section Details

### 1. Navbar
Extract existing nav into `Navbar.tsx`. Add "Explore Issues" link (points to `#issues` anchor for now). Keep auth buttons.

### 2. Hero Section
- Headline: "Empowering Citizens to Build Better Cities"
- Subheading: "Report civic issues, track resolution progress, and hold authorities accountable — all in one transparent platform."
- Primary CTA: "Report an Issue" (logged in) / "Get Started" (logged out)
- Secondary CTA: "Explore Issues" (scrolls to feed preview)
- Subtle badge above headline: "Crowdsourced Civic Infrastructure"

### 3. Features Section (6 cards, 3x2 grid)
Cards with icons from lucide-react:
1. Camera + MapPin — Photo & Location Reporting
2. GitMerge — Smart Duplicate Merging
3. BarChart3 — Priority-Based Resolution
4. Building2 — Authority Assignment & Tracking
5. ThumbsUp — Community Voting
6. Filter — Pincode-Based Discovery

### 4. Dashboard Preview
Uses `useDashboardStats()` hook. Show 4 stat cards in a row:
- Total Issues | Resolved | Active High Priority | Most Affected Area
Fallback to skeleton loaders while loading, show "No data yet" if empty.

### 5. Issue Feed Preview
Uses `useTrendingIssues(6)`. Renders issue cards in a 3-column grid. Each card:
- Category badge (color-coded)
- Title
- Pincode + status badge + priority badge
- Upvotes count + reports count
- Relative time
Show skeleton cards while loading. "No issues yet" empty state.

### 6. Filter/Discover Section
A horizontal filter bar with:
- Pincode text input
- Category select (from enum values)
- Status select
- Priority select
- "Search" button
This is presentational on the landing page — clicking search could scroll to/filter the feed preview or link to a future dedicated feed page.

### 7. How It Works (5 steps)
Numbered vertical timeline with icons:
1. Report — Submit with photo, location, category
2. Detect — System checks for duplicates
3. Prioritize — Auto-scored by category, votes, reports
4. Assign — Authority department gets notified
5. Resolve — Track progress until resolved

### 8. Trust Section
3 columns with icons:
- "Full Transparency" — every status change is logged
- "Data-Driven Priority" — scoring based on real engagement
- "Public Accountability" — authorities are visible and trackable

### 9. Footer CTA
Dark/primary background block. Headline: "Your city needs your voice." CTA button: "Start Reporting Now" → signup or report flow.

## Design Tokens
Use existing CSS variables: `--primary` (green), `--accent` (orange for badges), `--muted` for backgrounds. Alternating section backgrounds (`bg-background` / `bg-muted/30`) for visual rhythm.

## Category & Priority Badge Colors
- Priority: high = destructive red, medium = accent orange, low = secondary gray
- Status: resolved = green, in_progress = blue, assigned = purple, verified = teal, reported = gray, rejected = red
- Category: mapped to readable labels (e.g., `sewer_overflow` → "Sewer Overflow")

## No Database Changes
All data comes from existing hooks and public RLS queries.

