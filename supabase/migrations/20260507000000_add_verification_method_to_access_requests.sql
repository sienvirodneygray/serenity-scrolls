-- Add verification_method column to access_requests
-- Tracks how each order was verified: sp-api, website-order, or format-only (legacy)
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'format-only'
  CHECK (verification_method IN ('format-only', 'sp-api', 'website-order'));
