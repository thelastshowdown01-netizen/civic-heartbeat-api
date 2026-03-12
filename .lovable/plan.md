

# Enhanced Submit-Report Edge Function

## Current State
The `submit-report` edge function already implements ~80% of the requirements. It has duplicate detection (category + pincode + proximity), priority scoring, and merge logic. The gaps are:

1. **Missing `title` in input** — accepts only description, not a separate title
2. **Missing `image_url` backfill** — doesn't update master issue image when it's missing
3. **Missing `issue_report_id` in response** — doesn't return the created report's ID
4. **Missing `duplicate_match_reason`** — doesn't explain why a match was found
5. **Missing keyword similarity check** — only uses category+pincode+proximity, no description keyword overlap
6. **CORS headers incomplete** — missing newer Supabase client headers

## Changes to `supabase/functions/submit-report/index.ts`

### 1. Accept `title` in input
Parse optional `title` from request body. Use it for the master issue title if creating new, fall back to truncated description.

### 2. Add keyword similarity helper
Simple function: split descriptions into words, count overlapping words. If overlap ratio > 30%, consider it a keyword match. Used as a secondary signal alongside category+pincode+proximity.

### 3. Update duplicate detection to track match reason
When a match is found, record why: `"proximity"`, `"same_pincode_category"`, or `"keyword_overlap"`. Return this in the response.

### 4. Backfill missing image on master issue
When merging into an existing issue, if the existing issue has no image but the new report does, update the master issue's description or store the image reference.

### 5. Return `issue_report_id`
Select the report ID after insert and include it in the response.

### 6. Enhanced response format
```json
{
  "success": true,
  "action_taken": "created_new_issue" | "attached_to_existing_issue",
  "issue_id": "uuid",
  "issue_report_id": "uuid",
  "duplicate_match_reason": "proximity" | "same_pincode_category" | null
}
```

### 7. Fix CORS headers
Add the newer Supabase client headers to the allow list.

## No database changes needed
All tables and columns already exist. This is purely an edge function update.

