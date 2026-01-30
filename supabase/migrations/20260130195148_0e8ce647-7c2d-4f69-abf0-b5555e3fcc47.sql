-- Add new columns to blog_posts for SEO/AEO optimization
ALTER TABLE blog_posts 
  ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS long_tail_queries text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Migrate existing data: convert published boolean to status text
UPDATE blog_posts SET status = 'published', published_at = created_at WHERE published = true;
UPDATE blog_posts SET status = 'draft' WHERE published = false;

-- Create faqs table for storing FAQs from keyword research
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on faqs table
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs
CREATE POLICY "Anyone can view active FAQs" 
ON faqs 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage all FAQs" 
ON faqs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all FAQs including inactive
CREATE POLICY "Admins can view all FAQs" 
ON faqs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();