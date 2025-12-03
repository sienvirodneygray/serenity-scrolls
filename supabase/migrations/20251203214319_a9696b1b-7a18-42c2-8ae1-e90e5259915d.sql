-- Create analytics_clicks table for heatmap data
CREATE TABLE public.analytics_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  click_x INTEGER NOT NULL,
  click_y INTEGER NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  element_tag TEXT,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_user_flows table for navigation patterns
CREATE TABLE public.analytics_user_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_page TEXT NOT NULL,
  to_page TEXT NOT NULL,
  transition_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.analytics_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_flows ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_clicks
CREATE POLICY "Admins can view all clicks" ON public.analytics_clicks
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can track clicks" ON public.analytics_clicks
FOR INSERT WITH CHECK (true);

-- RLS policies for analytics_user_flows
CREATE POLICY "Admins can view all user flows" ON public.analytics_user_flows
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can track user flows" ON public.analytics_user_flows
FOR INSERT WITH CHECK (true);

-- Add indexes for better query performance
CREATE INDEX idx_analytics_clicks_session ON public.analytics_clicks(session_id);
CREATE INDEX idx_analytics_clicks_page ON public.analytics_clicks(page_path);
CREATE INDEX idx_analytics_clicks_timestamp ON public.analytics_clicks(timestamp);
CREATE INDEX idx_analytics_user_flows_session ON public.analytics_user_flows(session_id);
CREATE INDEX idx_analytics_user_flows_timestamp ON public.analytics_user_flows(timestamp);