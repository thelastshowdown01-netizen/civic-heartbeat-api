
-- Add type column to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'status_changed';

-- Create dashboard stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_issues', (SELECT count(*) FROM issues),
    'resolved_issues', (SELECT count(*) FROM issues WHERE status = 'resolved'),
    'active_issues', (SELECT count(*) FROM issues WHERE status NOT IN ('resolved', 'rejected')),
    'high_priority_unresolved', (SELECT count(*) FROM issues WHERE priority = 'high' AND status NOT IN ('resolved', 'rejected')),
    'most_reported_category', (SELECT category FROM issues GROUP BY category ORDER BY count(*) DESC LIMIT 1),
    'most_affected_pincode', (SELECT pincode FROM issues WHERE pincode IS NOT NULL GROUP BY pincode ORDER BY count(*) DESC LIMIT 1)
  )
$$;
