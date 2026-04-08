-- Add country column to analytics_sessions for geo breakdown
ALTER TABLE public.analytics_sessions 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add country column to analytics_pageviews for fallback geo queries
ALTER TABLE public.analytics_pageviews 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Index for country-based queries
CREATE INDEX IF NOT EXISTS idx_sessions_country ON public.analytics_sessions(country);
