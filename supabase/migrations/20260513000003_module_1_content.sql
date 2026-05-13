-- ============================================================
-- Courage Covenant™ Update Module 1 Content
-- Migration 20260513000003
-- ============================================================

-- Lesson 1.1: Conflict vs Bullying
UPDATE public.course_lessons
SET 
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
  content_body = '# Conflict vs. Bullying: Know the Difference

Adults often minimize or overreact because they lack clear categories. A child says "They were mean to me." That could mean a one-time conflict, repeated mocking, social exclusion, threats, or online harassment.

## The Core Difference

**Conflict** is a disagreement or argument between people with equal power. Both parties are upset.
**Bullying** is intentional, repeated harm involving a power imbalance. One party is targeted.

### What You Need to Look For:
1. **Intentionality:** Was the harm done on purpose?
2. **Repetition:** Has this happened before, or is there a fear it will happen again?
3. **Power Imbalance:** Does the target have a hard time defending themselves (due to age, size, social status, or numbers)?

> **Reflection:** Take a moment to write down exactly what your child told you without adding your own interpretation.'
WHERE slug = 'conflict-vs-bullying';

-- Lesson 1.2: The 4 Categories
UPDATE public.course_lessons
SET 
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
  content_body = '# The 4 Categories: Conflict, Teasing, Bullying, Danger

Understanding exactly what you are dealing with dictates your response.

## 1. Conflict (Normal)
A disagreement between equals. 
**Response:** Coach your child through conflict resolution. Do not intervene unless physical.

## 2. Teasing (Boundary Testing)
Mocking or poking fun. It can cross the line.
**Response:** Teach your child to set a firm verbal boundary. "Stop, I don''t like that."

## 3. Bullying (Targeted)
Repeated, intentional harm with a power imbalance.
**Response:** Document the incidents and involve adult authority (school/church).

## 4. Danger (Immediate Risk)
Physical violence, severe threats, or sexual harassment.
**Response:** Escalate immediately to law enforcement or emergency services. Do not wait.'
WHERE slug = 'four-categories';

-- Lesson 1.3: Power Imbalance
UPDATE public.course_lessons
SET 
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
  content_body = '# Understanding Power Imbalance

True bullying involves a power imbalance. This lesson helps you spot it and explain it to your child without escalating fear.

### Types of Power Imbalance:
- **Physical:** Size, age, or physical strength.
- **Social:** Popularity, group exclusion, or social standing.
- **Digital:** Anonymity online, group chat piling on.

When a power imbalance exists, the target cannot easily defend themselves. This is why adult intervention becomes necessary in true bullying situations.'
WHERE slug = 'power-imbalance';

-- Lesson 1.4: Online vs Offline
UPDATE public.course_lessons
SET 
  video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
  content_body = '# Online vs. Offline: Same Framework, Different Tools

Applying the 4-category framework to cyberbullying, social media exclusion, and group chats.

## The Digital Amplifier
Online bullying often feels worse because:
1. It is public and permanent.
2. It follows the child home.
3. The perpetrators are often anonymous.

### Your Next Steps:
- **Screenshot everything.** Do not delete the messages.
- **Block and Report.** Use platform tools immediately.
- **Do not respond.** Responding gives the bully the reaction they want.'
WHERE slug = 'online-offline';
