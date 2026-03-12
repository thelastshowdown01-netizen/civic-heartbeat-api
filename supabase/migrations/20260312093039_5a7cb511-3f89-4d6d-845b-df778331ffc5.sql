ALTER TABLE public.issues
  ADD COLUMN title text,
  ADD COLUMN authority_name text,
  ADD COLUMN created_by uuid;

ALTER TABLE public.pincode_zones
  ADD COLUMN ward text,
  ADD COLUMN area text;