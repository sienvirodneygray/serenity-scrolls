-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Analytics sessions table
CREATE TABLE public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  is_return_visitor BOOLEAN DEFAULT false,
  entry_page TEXT,
  exit_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  total_pageviews INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0
);

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Analytics pageviews table
CREATE TABLE public.analytics_pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES public.analytics_sessions(session_id) ON DELETE CASCADE NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  time_on_page_seconds INTEGER,
  scroll_depth_percent INTEGER,
  referrer TEXT
);

ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;

-- Amazon outbound clicks table
CREATE TABLE public.amazon_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES public.analytics_sessions(session_id) ON DELETE CASCADE NOT NULL,
  product_name TEXT,
  button_location TEXT,
  page_path TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  utm_source TEXT,
  utm_campaign TEXT
);

ALTER TABLE public.amazon_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only admins can read analytics data
CREATE POLICY "Admins can view all sessions"
  ON public.analytics_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create sessions"
  ON public.analytics_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON public.analytics_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view all pageviews"
  ON public.analytics_pageviews FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create pageviews"
  ON public.analytics_pageviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all Amazon clicks"
  ON public.amazon_clicks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can track Amazon clicks"
  ON public.amazon_clicks FOR INSERT
  WITH CHECK (true);

-- Update existing analytics_events table with admin-only policy
CREATE POLICY "Admins can view all analytics events"
  ON public.analytics_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX idx_sessions_timestamp ON public.analytics_sessions(first_visit DESC);
CREATE INDEX idx_pageviews_session ON public.analytics_pageviews(session_id);
CREATE INDEX idx_pageviews_timestamp ON public.analytics_pageviews(timestamp DESC);
CREATE INDEX idx_pageviews_page_path ON public.analytics_pageviews(page_path);
CREATE INDEX idx_amazon_timestamp ON public.amazon_clicks(timestamp DESC);