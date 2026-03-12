
-- Fix overly permissive INSERT policy on issues
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;
CREATE POLICY "Citizens and authorities can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'citizen'::app_role) OR has_role(auth.uid(), 'authority'::app_role));
