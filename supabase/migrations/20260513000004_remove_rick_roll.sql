-- Update video_url to a placeholder string
UPDATE public.course_lessons
SET video_url = 'placeholder'
WHERE module_id IN (
  SELECT id FROM public.course_modules WHERE slug = 'what-actually-happened'
);
