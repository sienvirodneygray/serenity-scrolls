-- ============================================================
-- LMS Schema Admin RLS Bypass
-- Serenity Scrolls — Migration 20260513000002
-- ============================================================

-- Courses: allow admins to read all courses (including unpublished)
CREATE POLICY "courses_admin_read" ON public.courses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Modules: allow admins to read all modules
CREATE POLICY "modules_admin_read" ON public.course_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Lessons: allow admins to read all lessons
CREATE POLICY "lessons_admin_read" ON public.course_lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Resources: allow admins to read all resources
CREATE POLICY "resources_admin_read" ON public.lesson_resources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
