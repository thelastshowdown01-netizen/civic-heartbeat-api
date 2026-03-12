

# Features Section Enhancement Plan

The current section is functional but could be more visually impactful. Here's what I'll improve:

## Changes to `src/components/landing/FeaturesSection.tsx`

### Heading
- Change to: **"Not Just Reporting — Smarter Civic Resolution"**
- Subheading: "From photo-based complaints to authority-tracked resolution, every step is designed to fix real problems faster."

### Card Enhancements
- Add a subtle hover effect (`hover:shadow-md hover:border-primary/20 transition-all`)
- Improve descriptions to be more specific and action-oriented:
  - **Photo & Location Reporting** → "Attach photos, drop a pin, and add your pincode. Every report carries the evidence needed for faster action."
  - **Smart Duplicate Merging** → "When 50 people report the same pothole, they see one unified issue — not 50 separate threads."
  - **Priority-Based Resolution** → "Sewer overflows rank higher than cosmetic cracks. Auto-scoring ensures the most urgent problems surface first."
  - **Authority Assignment** → "Every issue is routed to the right department. You see who's responsible and what stage it's in."
  - **Community Voting** → "Upvote issues that affect your daily commute. The more votes, the higher the urgency signal."
  - **Pincode-Based Discovery** → "Enter your pincode. See exactly what's broken, pending, or resolved in your neighborhood."

### Visual Polish
- Slightly larger icon containers (`h-11 w-11`) with rounded-xl
- Add `group` class on cards for hover icon animation
- Keep the 3×2 responsive grid, increase gap to `gap-6`

Single file change: `src/components/landing/FeaturesSection.tsx`

