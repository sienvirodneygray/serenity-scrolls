-- Servant 30-Day Access System Migration

-- Add expiry + subscription fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
  CHECK (subscription_status IN ('none','trial','active','expired','cancelled'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add redemption tracking to access_requests
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS redemption_count INT DEFAULT 0;
ALTER TABLE public.access_requests ADD COLUMN IF NOT EXISTS max_redemptions INT DEFAULT 1;
