-- Enable pg_net extension to allow HTTP POST calls from the database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: fires on email_campaigns changes
CREATE OR REPLACE FUNCTION notify_email_campaign_changes()
RETURNS TRIGGER AS $$
DECLARE
  sender_url TEXT;
  webhook_secret TEXT;
  payload_campaign_id UUID;
BEGIN
  -- Determine campaign ID based on operation
  IF TG_OP = 'DELETE' THEN
    payload_campaign_id := OLD.id;
  ELSE
    payload_campaign_id := NEW.id;
  END IF;

  -- Load custom settings if configured, fallback to production defaults
  sender_url := current_setting('app.settings.sender_url', true);
  IF sender_url IS NULL OR sender_url = '' THEN
    sender_url := 'https://sienvi-sender-test--sienvi-sender.us-east4.hosted.app';
  END IF;

  webhook_secret := current_setting('app.settings.sender_webhook_secret', true);
  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    webhook_secret := 'serenity_sender_sync_secret_123';
  END IF;

  -- POST notification payload to Sienvi Sender Test
  PERFORM extensions.http_post(
    url := sender_url || '/api/webhooks/campaign-sync',
    body := json_build_object(
      'event', TG_OP,
      'campaignId', payload_campaign_id
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    )::jsonb
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: fires on email_templates changes
CREATE OR REPLACE FUNCTION notify_email_template_changes()
RETURNS TRIGGER AS $$
DECLARE
  sender_url TEXT;
  webhook_secret TEXT;
  payload_campaign_id UUID;
BEGIN
  -- Determine campaign ID from the template record
  IF TG_OP = 'DELETE' THEN
    payload_campaign_id := OLD.campaign_id;
  ELSE
    payload_campaign_id := NEW.campaign_id;
  END IF;

  -- Load settings or fall back
  sender_url := current_setting('app.settings.sender_url', true);
  IF sender_url IS NULL OR sender_url = '' THEN
    sender_url := 'https://sienvi-sender-test--sienvi-sender.us-east4.hosted.app';
  END IF;

  webhook_secret := current_setting('app.settings.sender_webhook_secret', true);
  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    webhook_secret := 'serenity_sender_sync_secret_123';
  END IF;

  -- Send template update event as an 'UPDATE' event on the parent campaign
  PERFORM extensions.http_post(
    url := sender_url || '/api/webhooks/campaign-sync',
    body := json_build_object(
      'event', 'UPDATE',
      'campaignId', payload_campaign_id
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    )::jsonb
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on email_campaigns
DROP TRIGGER IF EXISTS trigger_sync_email_campaigns ON public.email_campaigns;
CREATE TRIGGER trigger_sync_email_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_campaign_changes();

-- Create triggers on email_templates
DROP TRIGGER IF EXISTS trigger_sync_email_templates ON public.email_templates;
CREATE TRIGGER trigger_sync_email_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_template_changes();

-- Add comments for documentation
COMMENT ON TRIGGER trigger_sync_email_campaigns ON public.email_campaigns IS 'Sends real-time updates to Sienvi Sender Test when campaigns change';
COMMENT ON TRIGGER trigger_sync_email_templates ON public.email_templates IS 'Sends real-time updates to Sienvi Sender Test when templates change';
