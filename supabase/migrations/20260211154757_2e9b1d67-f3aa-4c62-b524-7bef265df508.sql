
-- SEO Authority Engine Schema

-- Site configuration table
CREATE TABLE public.seo_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Serenity Scrolls',
  timezone text NOT NULL DEFAULT 'America/New_York',
  publish_enabled boolean NOT NULL DEFAULT true,
  schedule_days text[] NOT NULL DEFAULT ARRAY['monday','wednesday','friday'],
  publish_time time NOT NULL DEFAULT '09:00:00',
  brand_voice jsonb DEFAULT '{}',
  niche_summary text,
  audience_personas text,
  cta_preference text,
  seo_targets jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_config"
ON public.seo_config FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view seo_config"
ON public.seo_config FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Topic clusters
CREATE TABLE public.topic_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pillar_post_id uuid,
  goals text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clusters"
ON public.topic_clusters FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view clusters"
ON public.topic_clusters FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Topic backlog
CREATE TABLE public.topic_backlog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  cluster_id uuid REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'used', 'skipped')),
  format_type text CHECK (format_type IN ('how-to', 'list', 'problem-solution')),
  primary_keyword text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.topic_backlog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backlog"
ON public.topic_backlog FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view backlog"
ON public.topic_backlog FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add new columns to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS cluster_id uuid REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'spoke' CHECK (post_type IN ('pillar', 'spoke')),
  ADD COLUMN IF NOT EXISTS format_type text CHECK (format_type IN ('how-to', 'list', 'problem-solution')),
  ADD COLUMN IF NOT EXISTS primary_keyword text,
  ADD COLUMN IF NOT EXISTS secondary_keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS search_intent text CHECK (search_intent IN ('informational', 'commercial', 'transactional')),
  ADD COLUMN IF NOT EXISTS target_persona text,
  ADD COLUMN IF NOT EXISTS internal_links text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS external_links text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_prompt text,
  ADD COLUMN IF NOT EXISTS faq_schema jsonb,
  ADD COLUMN IF NOT EXISTS publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_time_on_page integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranking_notes text;

-- Add foreign key reference for pillar_post_id
ALTER TABLE public.topic_clusters
  ADD CONSTRAINT fk_pillar_post FOREIGN KEY (pillar_post_id) REFERENCES public.blog_posts(id) ON DELETE SET NULL;

-- Publish log
CREATE TABLE public.publish_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  attempted_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  action_type text NOT NULL DEFAULT 'publish' CHECK (action_type IN ('publish', 'refresh', 'retry')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publish_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage publish_log"
ON public.publish_log FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view publish_log"
ON public.publish_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Insert default seo_config row
INSERT INTO public.seo_config (site_name) VALUES ('Serenity Scrolls');

-- Triggers for updated_at
CREATE TRIGGER update_seo_config_updated_at
BEFORE UPDATE ON public.seo_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topic_clusters_updated_at
BEFORE UPDATE ON public.topic_clusters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topic_backlog_updated_at
BEFORE UPDATE ON public.topic_backlog
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
