-- ============================================================
-- LMS Schema: Courage Covenant™ Course Platform
-- Serenity Scrolls — Migration 20260513000000
-- ============================================================

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  long_description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 19700,
  sale_price_cents INTEGER,
  stripe_price_id TEXT,
  track TEXT NOT NULL DEFAULT 'parent' CHECK (track IN ('parent', 'student', 'leader', 'bundle')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_free_preview BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  promo_video_url TEXT,
  modules_count INTEGER NOT NULL DEFAULT 0,
  lessons_count INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  badge_color TEXT DEFAULT '#6B46C1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MODULES
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  badge_label TEXT, -- e.g. "Green", "Yellow/Red", "Ritual"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

-- LESSONS
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_body TEXT, -- rich text / markdown body
  video_url TEXT,
  audio_url TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN NOT NULL DEFAULT false,
  escalation_level TEXT CHECK (escalation_level IN ('green', 'yellow', 'red', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module_id, slug)
);

-- LESSON RESOURCES (worksheets, scripts, templates)
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'worksheet' CHECK (resource_type IN ('worksheet', 'script', 'template', 'checklist', 'guide')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COURSE ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  track TEXT DEFAULT 'parent',
  amount_paid_cents INTEGER,
  UNIQUE(user_id, course_id)
);

-- USER LESSON PROGRESS
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- COURSE CERTIFICATES
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- Courses: everyone can read published courses; only service role can insert/update
CREATE POLICY "courses_public_read" ON public.courses
  FOR SELECT USING (is_published = true OR auth.role() = 'service_role');

CREATE POLICY "courses_service_write" ON public.courses
  FOR ALL USING (auth.role() = 'service_role');

-- Modules: publicly readable for published courses
CREATE POLICY "modules_public_read" ON public.course_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_modules.course_id AND is_published = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "modules_service_write" ON public.course_modules
  FOR ALL USING (auth.role() = 'service_role');

-- Lessons: free previews public; rest requires enrollment
CREATE POLICY "lessons_free_preview_read" ON public.course_lessons
  FOR SELECT USING (
    is_free_preview = true
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE user_id = auth.uid() AND course_id = course_lessons.course_id
    )
  );

CREATE POLICY "lessons_service_write" ON public.course_lessons
  FOR ALL USING (auth.role() = 'service_role');

-- Resources: requires enrollment
CREATE POLICY "resources_enrolled_read" ON public.lesson_resources
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.course_lessons l
      JOIN public.course_enrollments e ON e.course_id = l.course_id
      WHERE l.id = lesson_resources.lesson_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "resources_service_write" ON public.lesson_resources
  FOR ALL USING (auth.role() = 'service_role');

-- Enrollments: users see their own; service role sees all
CREATE POLICY "enrollments_own_read" ON public.course_enrollments
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "enrollments_service_write" ON public.course_enrollments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "enrollments_own_insert" ON public.course_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Progress: users own their progress
CREATE POLICY "progress_own_read" ON public.user_lesson_progress
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "progress_own_write" ON public.user_lesson_progress
  FOR ALL USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Certificates: users see their own
CREATE POLICY "certs_own_read" ON public.course_certificates
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "certs_service_write" ON public.course_certificates
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course_id ON public.user_lesson_progress(course_id);
