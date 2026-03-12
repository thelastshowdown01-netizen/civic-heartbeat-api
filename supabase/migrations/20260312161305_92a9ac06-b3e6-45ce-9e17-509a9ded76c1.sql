
-- =============================================
-- 3. NOTIFICATION TYPE ENUM (corrected)
-- =============================================

CREATE TYPE public.notification_type AS ENUM (
  'issue_created',
  'issue_verified',
  'authority_assigned',
  'status_changed',
  'issue_resolved',
  'issue_rejected',
  'duplicate_linked'
);

-- Convert notifications.type from text to enum
ALTER TABLE public.notifications
  ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN type TYPE public.notification_type USING type::public.notification_type,
  ALTER COLUMN type SET DEFAULT 'status_changed'::public.notification_type;
