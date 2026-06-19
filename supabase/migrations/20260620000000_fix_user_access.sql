-- SQL migration to clean up expired users and reset test account
-- Path: supabase/migrations/20260620000000_fix_user_access.sql

-- 1. Automatically revoke has_access for any user whose trial expired in the past
UPDATE public.profiles
SET has_access = false,
    subscription_status = 'expired'
WHERE has_access = true
  AND access_expires_at < NOW()
  AND (subscription_status IS NULL OR subscription_status IN ('trial', 'none', 'cancelled'));

-- 2. Completely reset ivllnv.000@gmail.com to an expired/un-enrolled state for testing
-- Delete the COVENANT2026 promo redemption request
DELETE FROM public.access_requests 
WHERE email = 'ivllnv.000@gmail.com' 
  AND order_id = 'PROMO-COVENANT2026';

-- Delete the course enrollment for courage-covenant
DELETE FROM public.course_enrollments 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'ivllnv.000@gmail.com');

-- Reset profile back to expired status and set access_expires_at to a past date
UPDATE public.profiles
SET has_access = false,
    access_expires_at = '2026-04-04T00:00:00+00:00',
    subscription_status = 'expired'
WHERE email = 'ivllnv.000@gmail.com';
