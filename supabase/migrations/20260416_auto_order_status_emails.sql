-- Automate shipping and delivery notification emails
-- Uses pg_net (built into Supabase) to call the send-order-notification edge function
-- whenever the orders.status column changes to 'shipped' or 'delivered'.

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: fires on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Determine notification type based on new status
  IF NEW.status = 'shipped' THEN
    notification_type := 'shipping';
  ELSIF NEW.status = 'delivered' THEN
    notification_type := 'delivery';
  ELSE
    -- No email for other status transitions
    RETURN NEW;
  END IF;

  -- Build the edge function URL
  edge_function_url := current_setting('app.settings.supabase_url', true);
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    edge_function_url := 'https://ytaporbcmtlidafbssyc.supabase.co';
  END IF;

  service_role_key := current_setting('app.settings.service_role_key', true);
  IF service_role_key IS NULL OR service_role_key = '' THEN
    -- Use the anon key as fallback (function has verify_jwt = false)
    service_role_key := current_setting('supabase.anon_key', true);
  END IF;

  -- Call the edge function asynchronously via pg_net
  PERFORM extensions.http_post(
    url := edge_function_url || '/functions/v1/send-order-notification',
    body := json_build_object(
      'orderId', NEW.id::text,
      'type', notification_type
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    )::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS trigger_order_status_notification ON public.orders;
CREATE TRIGGER trigger_order_status_notification
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_change();

-- Add a comment for documentation
COMMENT ON TRIGGER trigger_order_status_notification ON public.orders IS
  'Automatically sends shipping/delivery notification emails when order status changes to shipped or delivered';
