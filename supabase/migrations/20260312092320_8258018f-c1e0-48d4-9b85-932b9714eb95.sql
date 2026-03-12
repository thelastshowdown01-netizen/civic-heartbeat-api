
-- Enums
CREATE TYPE public.app_role AS ENUM ('citizen', 'admin', 'authority');
CREATE TYPE public.issue_status AS ENUM ('reported', 'verified', 'assigned', 'in_progress', 'resolved');
CREATE TYPE public.issue_category AS ENUM ('pothole', 'garbage', 'sewer_overflow', 'water_leakage', 'street_light', 'road_damage', 'other');
CREATE TYPE public.priority_label AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.vote_type AS ENUM ('up', 'down');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Pincode zones
CREATE TABLE public.pincode_zones (
  pincode TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  authority_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.pincode_zones ENABLE ROW LEVEL SECURITY;

-- Issues
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category issue_category NOT NULL,
  description TEXT NOT NULL,
  status issue_status NOT NULL DEFAULT 'reported',
  priority priority_label NOT NULL DEFAULT 'low',
  priority_score INTEGER NOT NULL DEFAULT 0,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  reports_count INTEGER NOT NULL DEFAULT 1,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  downvotes_count INTEGER NOT NULL DEFAULT 0,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Issue reports
CREATE TABLE public.issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  image_url TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Votes (composite PK)
CREATE TABLE public.votes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, issue_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Status logs
CREATE TABLE public.status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  changed_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status issue_status,
  new_status issue_status NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.status_logs ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Storage bucket for issue images
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true);

-- ============ RLS POLICIES ============

-- Profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles (read own, admins read all)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Pincode zones (public read, admin write)
CREATE POLICY "Anyone can view pincode zones" ON public.pincode_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage pincode zones" ON public.pincode_zones FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Issues (public read, admin/authority update)
CREATE POLICY "Anyone can view issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Authenticated can create issues" ON public.issues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update issues" ON public.issues FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authorities can update assigned issues" ON public.issues FOR UPDATE USING (
  public.has_role(auth.uid(), 'authority') AND assignee_id = auth.uid()
);

-- Issue reports (public read, citizens create own)
CREATE POLICY "Anyone can view reports" ON public.issue_reports FOR SELECT USING (true);
CREATE POLICY "Citizens can create reports" ON public.issue_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Votes
CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can manage own votes" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Status logs (public read, admin/authority create)
CREATE POLICY "Anyone can view status logs" ON public.status_logs FOR SELECT USING (true);
CREATE POLICY "Admins can create status logs" ON public.status_logs FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'authority')
);

-- Notifications (users read own, system creates)
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Storage policies for issue-images
CREATE POLICY "Anyone can view issue images" ON storage.objects FOR SELECT USING (bucket_id = 'issue-images');
CREATE POLICY "Authenticated can upload issue images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'issue-images');

-- ============ TRIGGERS ============

-- Auto-create profile + citizen role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
