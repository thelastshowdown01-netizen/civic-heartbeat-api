
-- Fix overly permissive INSERT on issues: only allow via service role (edge functions)
-- Drop the permissive policy and replace with role-checked one
DROP POLICY "Authenticated can create issues" ON public.issues;
CREATE POLICY "Citizens can create issues" ON public.issues FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'citizen') OR public.has_role(auth.uid(), 'admin'));

-- Fix overly permissive INSERT on notifications
DROP POLICY "Service can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'authority'));
