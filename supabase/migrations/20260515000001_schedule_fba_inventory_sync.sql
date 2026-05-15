-- Schedule FBA Inventory Sync via pg_cron
-- Runs every hour on the hour
-- Calls the sync-amazon-inventory edge function using the anon key for authorization (which the function now permits for cron execution)

SELECT cron.schedule(
  'hourly-fba-inventory-sync',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ytaporbcmtlidafbssyc.supabase.co/functions/v1/sync-amazon-inventory',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjA4ODksImV4cCI6MjA4ODI5Njg4OX0.OtsXhTimnK_VUcZns-ygq5tFBuQLKYjvhfDPBk9NLlw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
