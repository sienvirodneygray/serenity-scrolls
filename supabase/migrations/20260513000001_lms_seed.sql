-- ============================================================
-- Courage Covenant™ Course Seed Data
-- ============================================================

DO $$
DECLARE
  course_id UUID := gen_random_uuid();
  m1 UUID := gen_random_uuid();
  m2 UUID := gen_random_uuid();
  m3 UUID := gen_random_uuid();
  m4 UUID := gen_random_uuid();
  m5 UUID := gen_random_uuid();
  m6 UUID := gen_random_uuid();
  m7 UUID := gen_random_uuid();
  m8 UUID := gen_random_uuid();
BEGIN

-- INSERT COURSE
INSERT INTO public.courses (id, slug, title, subtitle, description, price_cents, sale_price_cents, track, is_published, modules_count, lessons_count, duration_minutes, badge_color)
VALUES (
  course_id,
  'courage-covenant',
  'Courage Covenant™',
  'A Scripture-Based Bullying Guidance Course for Parents, Students & Faith Leaders',
  'When your child is being bullied, Courage Covenant™ gives you Scripture, words, reflection tools, and next steps so you can respond with calm, courage, and wisdom. This is not therapy. This is not legal advice. This is a Scripture-guided response framework for families and faith communities.',
  19700,
  9700,
  'parent',
  true,
  8,
  32,
  240,
  '#6B46C1'
);

-- MODULE 1
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m1, course_id, 'what-actually-happened', 'What Actually Happened?', 'Help parents and leaders distinguish between normal conflict, teasing, bullying, harassment, and danger.', 1, 'Foundation');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m1, course_id, 'conflict-vs-bullying', 'Conflict vs. Bullying: Know the Difference', 'Adults often minimize or overreact because they lack clear categories. A child says "They were mean to me." That could mean a one-time conflict, repeated mocking, social exclusion, threats, or online harassment. This lesson gives you the categories you need to respond wisely.', 10, 1, true, 'green'),
(m1, course_id, 'four-categories', 'The 4 Categories: Conflict, Teasing, Bullying, Danger', 'Breaking down each category with real examples, what it looks like, and how to respond appropriately at each level.', 8, 2, false, 'green'),
(m1, course_id, 'power-imbalance', 'Understanding Power Imbalance', 'True bullying involves a power imbalance. This lesson helps you spot it and explain it to your child without escalating fear.', 7, 3, false, 'yellow'),
(m1, course_id, 'online-offline', 'Online vs. Offline: Same Framework, Different Tools', 'Applying the 4-category framework to cyberbullying, social media exclusion, and group chats.', 8, 4, false, 'yellow');

-- MODULE 2
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m2, course_id, 'what-is-child-feeling', 'What Is the Child Feeling?', 'Help parents and leaders name and validate the emotional experience of a child who has been targeted.', 2, 'Emotion');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m2, course_id, 'naming-the-emotion', 'Naming the Emotion Without Minimizing', 'Children rarely say "I feel excluded and ashamed." They say "I hate school." This lesson teaches you to slow down and help them find the real word.', 10, 1, false, 'green'),
(m2, course_id, 'nine-emotions', 'The 9 Emotions of Bullying', 'Sad, anxious, frustrated, troubled, afraid, angry, ashamed, confused, lonely — and what each one tells you about what your child needs next.', 8, 2, false, 'green'),
(m2, course_id, 'parent-regulation', 'Your Regulation Before Theirs', 'You cannot regulate your child if you are not regulated. This lesson gives parents a 60-second reset so you can listen before you act.', 7, 3, false, 'green'),
(m2, course_id, 'body-signals', 'When the Body Speaks: Physical Signs of Distress', 'Stomach aches, refusing to go to school, sleep problems — these are not complaints. They are signals. Learn to read them.', 6, 4, false, 'yellow');

-- MODULE 3
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m3, course_id, 'what-does-scripture-say', 'What Does Scripture Say?', 'Help parents and leaders use Scripture to support truth, courage, and safety — not passivity.', 3, 'Scripture');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m3, course_id, 'scripture-does-not-deny-pain', 'Scripture Does Not Deny Pain', 'Psalms model honest emotion. Jesus acknowledged harm. Wisdom includes protection and truth. This lesson corrects the "just pray about it" trap.', 10, 1, false, 'green'),
(m3, course_id, 'comfort-courage-wisdom', 'Comfort, Courage & Wisdom Scriptures', 'Three categories of Scripture for three different moments: Comfort for sadness and fear. Courage for speaking and standing. Wisdom for knowing when to walk away or escalate.', 8, 2, false, 'green'),
(m3, course_id, 'what-not-to-say', 'What Not to Say Spiritually', 'Avoid: "A good Christian would forgive." Better: "God sees what happened." Practical language for parents and leaders.', 7, 3, false, 'green'),
(m3, course_id, 'serenity-scrolls-integration', 'Using Serenity Scrolls in This Moment', 'How to use the Scrolls and AI Servant to match Scripture to the child''s specific emotion right now.', 6, 4, false, 'green');

-- MODULE 4
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m4, course_id, 'what-child-can-say', 'What the Child Can Say', 'Give children practical, simple scripts for responding to bullying or mistreatment.', 4, 'Scripts');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m4, course_id, 'three-response-types', 'Boundary, Exit & Help-Seeking Responses', 'Children freeze because they do not have words ready. This lesson gives them three short, repeatable response types — not speeches, actual words.', 10, 1, false, 'green'),
(m4, course_id, 'boundary-scripts', 'Boundary Scripts: "Stop. I don''t like that."', 'Word-for-word scripts children can practice at home. Simple, clear, direct — and non-escalatory.', 7, 2, false, 'green'),
(m4, course_id, 'exit-scripts', 'Exit Scripts: "I''m walking away."', 'How to exit without shame, without a fight, and without giving the bully what they want.', 7, 3, false, 'green'),
(m4, course_id, 'practice-without-pressure', 'Practice Without Pressure', 'How parents can role-play these scripts at home in a way that builds confidence without adding fear.', 6, 4, false, 'green');

-- MODULE 5
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m5, course_id, 'what-parents-should-do', 'What Parents Should Say & Do', 'Help parents respond with calm, clarity, and emotional safety in the first 60 seconds and beyond.', 5, 'Parent Response');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m5, course_id, 'first-60-seconds', 'The First 60 Seconds', '"I''m glad you told me. You are not in trouble. That should not have happened. We will figure this out together." The first words matter most.', 10, 1, false, 'green'),
(m5, course_id, 'listen-clarify-comfort', 'Listen → Clarify → Comfort → Document → Decide', 'The 5-step parent response framework. Each step explained with scripts and what NOT to say at each stage.', 8, 2, false, 'yellow'),
(m5, course_id, 'when-to-contact-school', 'When to Contact the School or Church', 'The specific triggers that mean it''s time to involve adult authority — and how to do it without escalating unnecessarily.', 8, 3, false, 'yellow'),
(m5, course_id, 'documentation', 'Documenting Without Drama', 'Date, time, location, people involved, what happened, screenshots — a simple system that protects your child and builds your case.', 6, 4, false, 'yellow');

-- MODULE 6
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m6, course_id, 'green-yellow-red', 'The Green / Yellow / Red Escalation Framework', 'Give parents and leaders a simple decision framework. Remove fog. Know when to coach, document, or escalate immediately.', 6, '🟢🟡🔴 Escalation');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m6, course_id, 'green-monitor-and-coach', '🟢 Green: Monitor & Coach', 'One-time conflict, minor teasing, no threat, child feels safe, no pattern. Response: Listen, reflect, practice words, monitor.', 8, 1, false, 'green'),
(m6, course_id, 'yellow-document-and-involve', '🟡 Yellow: Document & Involve Adults', 'Repeated teasing, exclusion, online mockery, child distressed, avoidance, power imbalance. Response: Document, contact teacher/leader/coach, continue emotional support.', 8, 2, false, 'yellow'),
(m6, course_id, 'red-immediate-escalation', '🔴 Red: Immediate Escalation', 'Physical harm, threats, sexual harassment, abuse, self-harm statements. Response: Stop. Contact appropriate authorities. Do not rely on this course or AI alone.', 8, 3, false, 'red'),
(m6, course_id, 'decision-map-worksheet', 'Using the Decision Map', 'Walk through the full Green/Yellow/Red decision worksheet with real scenarios so you can use it in the moment without second-guessing yourself.', 7, 4, false, 'yellow');

-- MODULE 7
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m7, course_id, 'forgiveness-boundaries-wisdom', 'Forgiveness, Boundaries & Wisdom', 'Teach biblical forgiveness without enabling harm or silencing truth.', 7, 'Faith & Wisdom');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m7, course_id, 'what-forgiveness-is', 'What Forgiveness Actually Is', 'Forgiveness is releasing vengeance and entrusting justice to God. It is not silence, access, or pretending harm did not happen.', 8, 1, false, 'green'),
(m7, course_id, 'what-forgiveness-is-not', 'What Forgiveness Is NOT', 'Forgiveness is not denial, silence, immediate trust, reconciliation without safety, or avoiding consequences. These are the four ways forgiveness gets weaponized in faith communities.', 8, 2, false, 'green'),
(m7, course_id, 'boundaries-not-bitterness', 'Boundaries Are Not Bitterness', 'Boundaries can be wise, loving, and biblical. This lesson gives parents the language to set them without shame.', 7, 3, false, 'green'),
(m7, course_id, 'reconciliation-safety', 'Reconciliation Requires Safety First', 'Reconciliation is not always immediate and may not always be appropriate. A Scripture-based framework for when and how.', 6, 4, false, 'green');

-- MODULE 8
INSERT INTO public.course_modules (id, course_id, slug, title, description, order_index, badge_label)
VALUES (m8, course_id, 'seven-day-courage-ritual', 'The 7-Day Courage Ritual', 'Tie the course directly into Serenity Scrolls products and create a repeatable post-course practice.', 8, '7-Day Ritual');

INSERT INTO public.course_lessons (module_id, course_id, slug, title, content_body, duration_minutes, order_index, is_free_preview, escalation_level)
VALUES
(m8, course_id, 'the-daily-ritual', 'The Daily 5-Step Courage Ritual', 'Name the emotion → Select the Scroll → Read Scripture slowly → Journal honestly → Pray simply → Choose one wise step. This is the habit that makes everything else stick.', 10, 1, false, 'green'),
(m8, course_id, 'using-the-servant', 'Using the AI Servant in Your Ritual', 'How to use Serenity Scrolls Servant as your daily reflection companion — Courage Covenant mode, parent mode, and the leader dashboard.', 8, 2, false, 'green'),
(m8, course_id, 'seven-day-plan', 'Your 7-Day Courage Plan', 'A structured day-by-day plan through all 8 modules using the physical Scrolls, Journal, and AI Servant together.', 8, 3, false, 'green'),
(m8, course_id, 'continuing-the-ritual', 'Continuing the Ritual Beyond 7 Days', 'How to sustain the practice, share it with your child, and bring it to your faith community. Your next steps after the course.', 7, 4, false, 'green');

END $$;
