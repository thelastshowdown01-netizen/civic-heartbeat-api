

# Report an Issue Page — Implementation Plan

## Overview

Create a new `/report` page with a polished issue submission form that calls the existing `submit-report` edge function. Requires auth — redirects unauthenticated users to login.

## New Files

### 1. `src/pages/ReportIssue.tsx`
Main page component with two-column layout on desktop (form left, info panel right), single column on mobile.

**Header**: "Report a Civic Issue" / "Help improve your city — it takes under a minute."

**Form fields** (using react-hook-form + zod validation):
- Title (optional text input)
- Description (required textarea, max 500 chars)
- Category (required select dropdown using existing `issue_category` enum values with labels from `issueHelpers.ts`)
- Pincode (required, 6-digit input)
- Image upload (drag-drop zone → uploads to `issue-images` storage bucket)
- Landmark / Area (optional text input)
- "Use My Location" button (browser geolocation API → stores lat/lng in hidden state)

**Right-side info panel** (desktop only, sticky):
- "What happens next?" card with 4 mini steps: Similar issues merged → Priority calculated → Authority assigned → Track progress
- Trust microcopy chips: "Similar reports are merged automatically", "Urgent issues are prioritized faster"

**Form states**:
- Validation errors shown inline per field
- Image uploading spinner
- Submit button with loading state ("Submitting..." with spinner)
- Auth guard: if no user, redirect to `/login?redirect=/report`

**Success state**: Replace form with a success card showing:
- Check icon + "Issue Submitted Successfully"
- Whether it was merged or created new (from edge function response)
- "View Issue" and "Report Another" buttons

**Submission flow**:
1. Upload image to `issue-images` bucket if present → get public URL
2. Call `submit-report` edge function with auth header
3. Handle response (created vs merged) and show success state

### 2. `src/components/report/ReportForm.tsx`
The form component extracted for cleanliness — contains all form logic, validation, image upload, and geolocation.

### 3. `src/components/report/SubmissionSuccess.tsx`
Success state component showing result details and next actions.

## Route Addition

Add to `App.tsx`:
```
<Route path="/report" element={<ReportIssue />} />
```

## No Database Changes Needed
The existing `submit-report` edge function and `issue-images` storage bucket handle everything.

## Key Technical Decisions
- Use `react-hook-form` + `zod` for validation (already installed)
- Upload images via Supabase storage client (`supabase.storage.from('issue-images').upload(...)`)
- Call edge function via `supabase.functions.invoke('submit-report', { body: {...} })`
- Browser Geolocation API for "Use My Location" — no external map library needed
- Auth guard using `useAuth` hook — redirect if not logged in

