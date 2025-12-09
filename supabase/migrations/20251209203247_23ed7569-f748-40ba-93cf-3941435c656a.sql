-- Add missing columns to analytics_sessions
ALTER TABLE public.analytics_sessions 
ADD COLUMN IF NOT EXISTS visitor_id text,
ADD COLUMN IF NOT EXISTS is_bounce boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- Add missing columns to analytics_pageviews
ALTER TABLE public.analytics_pageviews 
ADD COLUMN IF NOT EXISTS load_time_ms integer,
ADD COLUMN IF NOT EXISTS time_on_page_ms integer,
ADD COLUMN IF NOT EXISTS path text;

-- Update path from page_path for consistency
UPDATE public.analytics_pageviews SET path = page_path WHERE path IS NULL;

-- Update RLS policies for analytics_sessions to allow UPDATE
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.analytics_sessions;
CREATE POLICY "Anyone can update sessions" 
ON public.analytics_sessions 
FOR UPDATE 
USING (true);

-- Update RLS policies for analytics_pageviews to allow UPDATE
CREATE POLICY "Anyone can update pageviews" 
ON public.analytics_pageviews 
FOR UPDATE 
USING (true);