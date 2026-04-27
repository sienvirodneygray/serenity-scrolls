-- Schedule the daily subscription offer email flow via pg_cron
-- Runs every day at 2:00 AM UTC
-- Calls the send-subscription-offers edge function which handles:
--   Email 1: 7-day exclusive offer (10% off monthly OR annual 4-months-free)
--   Email 2: 3-day reminder (monthly only, no discount)
--   Email 3: Expiry notice (access ended)

SELECT cron.schedule(
  'daily-subscription-offers',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ytaporbcmtlidafbssyc.supabase.co/functions/v1/send-subscription-offers',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjA4ODksImV4cCI6MjA4ODI5Njg4OX0.OtsXhTimnK_VUcZns-ygq5tFBuQLKYjvhfDPBk9NLlw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
