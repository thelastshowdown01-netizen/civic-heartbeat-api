
-- =============================================
-- 1. HELPER: Create notification (reusable)
-- =============================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_issue_id uuid,
  p_type notification_type,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Avoid duplicate notifications (same user, issue, type within 1 hour)
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = p_user_id
      AND issue_id = p_issue_id
      AND type = p_type
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, issue_id, type, message)
  VALUES (p_user_id, p_issue_id, p_type, p_message)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =============================================
-- 2. PRIORITY RECALCULATION
-- =============================================
CREATE OR REPLACE FUNCTION public.recalculate_issue_priority(p_issue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue RECORD;
  v_score integer;
  v_label priority_label;
  v_cat_weight integer;
  v_text text;
BEGIN
  SELECT category, description, title, reports_count, upvotes_count, downvotes_count
  INTO v_issue
  FROM issues WHERE id = p_issue_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- Category weights
  v_cat_weight := CASE v_issue.category
    WHEN 'sewer_overflow' THEN 50
    WHEN 'road_damage' THEN 40
    WHEN 'water_leakage' THEN 35
    WHEN 'street_light' THEN 25
    WHEN 'pothole' THEN 20
    WHEN 'garbage' THEN 15
    ELSE 10
  END;

  v_score := v_cat_weight;

  -- Severity keywords
  v_text := lower(coalesce(v_issue.title, '') || ' ' || v_issue.description);
  IF v_text ~ '(dangerous|hazard|urgent|emergency|collapse|flood|accident|injury|blocked|overflow)' THEN
    v_score := v_score + 25;
  END IF;

  -- Report volume
  v_score := v_score + v_issue.reports_count * 5;

  -- Vote impact
  v_score := v_score + v_issue.upvotes_count * 2;
  v_score := v_score - v_issue.downvotes_count;

  -- Label
  v_label := CASE
    WHEN v_score > 75 THEN 'high'
    WHEN v_score > 40 THEN 'medium'
    ELSE 'low'
  END;

  UPDATE issues
  SET priority_score = v_score, priority = v_label
  WHERE id = p_issue_id;
END;
$$;

-- =============================================
-- 3. REFRESH VOTE COUNTS FROM SOURCE
-- =============================================
CREATE OR REPLACE FUNCTION public.refresh_issue_vote_counts(p_issue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_up integer;
  v_down integer;
BEGIN
  SELECT
    coalesce(sum(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0),
    coalesce(sum(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)
  INTO v_up, v_down
  FROM votes WHERE issue_id = p_issue_id;

  UPDATE issues
  SET upvotes_count = v_up, downvotes_count = v_down
  WHERE id = p_issue_id;
END;
$$;

-- =============================================
-- 4. REFRESH REPORTS COUNT FROM SOURCE
-- =============================================
CREATE OR REPLACE FUNCTION public.refresh_issue_reports_count(p_issue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM issue_reports WHERE issue_id = p_issue_id;

  UPDATE issues
  SET reports_count = v_count
  WHERE id = p_issue_id;
END;
$$;

-- =============================================
-- 5. TRIGGER: After vote changes → refresh counts + priority
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_vote_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue_id uuid;
BEGIN
  v_issue_id := coalesce(NEW.issue_id, OLD.issue_id);
  PERFORM refresh_issue_vote_counts(v_issue_id);
  PERFORM recalculate_issue_priority(v_issue_id);
  RETURN coalesce(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_vote_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_vote_changed();

-- =============================================
-- 6. TRIGGER: After report inserted → refresh count + priority
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_report_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_issue_reports_count(NEW.issue_id);
  PERFORM recalculate_issue_priority(NEW.issue_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_report_added
  AFTER INSERT ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_report_added();

-- =============================================
-- 7. TRIGGER: After issue category/description changes → recalc priority
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_issue_content_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.category IS DISTINCT FROM NEW.category
     OR OLD.description IS DISTINCT FROM NEW.description
     OR OLD.title IS DISTINCT FROM NEW.title THEN
    PERFORM recalculate_issue_priority(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_content_changed
  AFTER UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_issue_content_changed();

-- =============================================
-- 8. ASSIGN AUTHORITY (RPC function)
-- =============================================
CREATE OR REPLACE FUNCTION public.assign_authority(
  p_issue_id uuid,
  p_assignee_id uuid,
  p_authority_name text,
  p_comment text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_issue RECORD;
  v_new_status issue_status;
  v_caller_id uuid := auth.uid();
BEGIN
  -- Must be admin
  IF NOT has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT id, status INTO v_issue FROM issues WHERE id = p_issue_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Issue not found';
  END IF;

  -- Auto-advance to assigned if currently verified
  v_new_status := CASE
    WHEN v_issue.status = 'verified' THEN 'assigned'::issue_status
    ELSE v_issue.status
  END;

  UPDATE issues SET
    assignee_id = p_assignee_id,
    authority_name = p_authority_name,
    status = v_new_status
  WHERE id = p_issue_id;

  -- Status log
  IF v_new_status IS DISTINCT FROM v_issue.status THEN
    INSERT INTO status_logs (issue_id, changed_by_id, old_status, new_status, comment)
    VALUES (p_issue_id, v_caller_id, v_issue.status, v_new_status,
            coalesce(p_comment, 'Assigned to ' || p_authority_name));
  END IF;

  -- Notify all reporters
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
$$;
