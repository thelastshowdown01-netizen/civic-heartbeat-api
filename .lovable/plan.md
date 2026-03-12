

# Final CTA Section — Enhancement Plan

## What Changes

Rebuild `FooterCTA.tsx` into a polished, high-impact final conversion block with dual CTAs, trust chips, and stronger civic-minded copy.

## Heading & Copy
- **Heading**: "Your City Needs Your Voice."
- **Subheading**: "Every report makes a local problem visible. Every vote helps prioritize what's urgent. Start reporting — and track real progress from complaint to resolution."

## CTAs
- **Primary** (logged in: "Report an Issue", logged out: "Start Reporting Now") — `variant="secondary"`, large
- **Secondary**: "Explore Issues" — `variant="outline"` styled for contrast on primary bg, links to `#issues`
- **Microcopy** below buttons: "Start in seconds — no complexity, just civic action."

## Trust Chips
Row of small inline badges below CTAs:
- "Real-Time Tracking"
- "Community Voting"  
- "Authority Visibility"
- "Smart Prioritization"

## Layout
- Full-width `bg-primary text-primary-foreground` banner, `py-24`
- Centered content, `max-w-3xl`
- Buttons side-by-side on desktop, stacked on mobile
- Trust chips as subtle `border border-primary-foreground/20` rounded pills

## Files Changed
- `src/components/landing/FooterCTA.tsx` — full rewrite

