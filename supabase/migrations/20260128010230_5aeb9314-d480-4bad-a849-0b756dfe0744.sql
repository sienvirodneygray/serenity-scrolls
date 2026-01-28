-- Add RLS policies for admin blog management
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all posts (including drafts)
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));