
-- 1. Update assign_authority function to allow authority role (not just admin)
CREATE OR REPLACE FUNCTION public.assign_authority(p_issue_id uuid, p_assignee_id uuid, p_authority_name text, p_comment text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_issue RECORD;
  v_new_status issue_status;
  v_caller_id uuid := auth.uid();
BEGIN
  -- Must be authority (admin role removed)
  IF NOT has_role(v_caller_id, 'authority') THEN
    RAISE EXCEPTION 'Forbidden: authority role required';
  END IF;

  SELECT id, status INTO v_issue FROM issues WHERE id = p_issue_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found';
  END IF;

  v_new_status := CASE
    WHEN v_issue.status = 'verified' THEN 'assigned'::issue_status
    ELSE v_issue.status
  END;

  UPDATE issues SET
    assignee_id = p_assignee_id,
    authority_name = p_authority_name,
    status = v_new_status
  WHERE id = p_issue_id;

  IF v_new_status IS DISTINCT FROM v_issue.status THEN
    INSERT INTO status_logs (issue_id, changed_by_id, old_status, new_status, comment)
    VALUES (p_issue_id, v_caller_id, v_issue.status, v_new_status,
            coalesce(p_comment, 'Assigned to ' || p_authority_name));
  END IF;

  INSERT INTO notifications (user_id, issue_id, type, message)
  SELECT DISTINCT ir.reporter_id, p_issue_id, 'authority_assigned',
         p_authority_name || ' has been assigned to resolve your reported issue.'
  FROM issue_reports ir
  WHERE ir.issue_id = p_issue_id;

  RETURN json_build_object(
    'success', true,
    'issue_id', p_issue_id,
    'assignee_id', p_assignee_id,
    'authority_name', p_authority_name,
    'new_status', v_new_status
  );
END;
$function$;

-- 2. Update RLS policies on issues to allow authority to update all issues (not just assigned ones)
-- Drop old admin-only and authority-assigned-only policies
DROP POLICY IF EXISTS "Admins can update issues" ON public.issues;
DROP POLICY IF EXISTS "Authorities can update assigned issues" ON public.issues;

-- Authority can update any issue (they now handle verification, assignment, etc.)
CREATE POLICY "Authorities can update issues"
ON public.issues
FOR UPDATE
TO public
USING (has_role(auth.uid(), 'authority'::app_role));

-- 3. Update RLS on issues INSERT to allow authority to create issues too
DROP POLICY IF EXISTS "Citizens can create issues" ON public.issues;
CREATE POLICY "Authenticated users can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Update RLS on status_logs INSERT to allow authority
DROP POLICY IF EXISTS "Admins can create status logs" ON public.status_logs;
CREATE POLICY "Authorities can create status logs"
ON public.status_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'authority'::app_role));

-- 5. Update RLS on notifications INSERT to allow authority
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Authorities can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'authority'::app_role));

-- 6. Update RLS on user_roles - keep user can view own, authority can view all
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 7. Update RLS on pincode_zones
DROP POLICY IF EXISTS "Admins can manage pincode zones" ON public.pincode_zones;
CREATE POLICY "Authorities can manage pincode zones"
ON public.pincode_zones
FOR ALL
TO public
USING (has_role(auth.uid(), 'authority'::app_role));

-- 8. Convert existing admin users to authority role
UPDATE public.user_roles SET role = 'authority' WHERE role = 'admin';
