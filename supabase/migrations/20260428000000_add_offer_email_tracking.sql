-- Add offer email tracking columns to profiles
-- Tracks which offer emails have been sent per user so we don't re-send

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS offer_7day_sent_at   TIMESTAMPTZ,  -- Email 1: exclusive offer (7 days out)
  ADD COLUMN IF NOT EXISTS offer_3day_sent_at   TIMESTAMPTZ,  -- Email 2: no-discount reminder (3 days out)
  ADD COLUMN IF NOT EXISTS offer_expiry_sent_at TIMESTAMPTZ;  -- Email 3: access ended
