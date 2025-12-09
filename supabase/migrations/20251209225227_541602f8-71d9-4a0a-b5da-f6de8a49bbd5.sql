-- First, update any null visitor_id values to a placeholder
UPDATE analytics_sessions SET visitor_id = 'legacy_' || id::text WHERE visitor_id IS NULL;

-- Add missing columns to analytics_events for the tracking system
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'page_view';
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS page_path TEXT;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- Now make visitor_id NOT NULL
ALTER TABLE analytics_sessions ALTER COLUMN visitor_id SET NOT NULL;

-- Add public select policy for analytics_events (for external dashboard)
DROP POLICY IF EXISTS "Allow public select for analytics" ON analytics_events;
CREATE POLICY "Allow public select for analytics" ON analytics_events FOR SELECT USING (true);

-- Add public select policy for analytics_sessions
DROP POLICY IF EXISTS "Allow public select for sessions" ON analytics_sessions;
CREATE POLICY "Allow public select for sessions" ON analytics_sessions FOR SELECT USING (true);