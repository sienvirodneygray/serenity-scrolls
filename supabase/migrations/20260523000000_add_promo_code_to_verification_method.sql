-- Drop the existing check constraint on verification_method if it exists
ALTER TABLE public.access_requests 
  DROP CONSTRAINT IF EXISTS access_requests_verification_method_check;

-- Add a new check constraint that supports promo-code
ALTER TABLE public.access_requests
  ADD CONSTRAINT access_requests_verification_method_check 
  CHECK (verification_method IN ('format-only', 'sp-api', 'website-order', 'promo-code'));
