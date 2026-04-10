-- Enum setups
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'sending', 'completed');
CREATE TYPE public.campaign_type AS ENUM ('manual', 'ai_funnel');
CREATE TYPE public.schedule_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.send_status AS ENUM ('queued', 'sent', 'delivered', 'bounced', 'complaint', 'failed');
CREATE TYPE public.customer_event_type AS ENUM ('open', 'click', 'unsubscribe');
CREATE TYPE public.suppression_reason AS ENUM ('bounce', 'complaint', 'unsubscribe', 'manual');

-- 1. Customers Table (Independent CRM)
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customer Groups
CREATE TABLE public.customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'slate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customer Group Memberships
CREATE TABLE public.customer_group_memberships (
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, group_id)
);

-- 4. Email Campaigns
CREATE TABLE public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status public.campaign_status NOT NULL DEFAULT 'draft',
    campaign_type public.campaign_type NOT NULL DEFAULT 'manual',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Email Templates
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    subject TEXT NOT NULL,
    content_html TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Campaign Target Groups (Mapping)
CREATE TABLE public.campaign_target_groups (
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, group_id)
);

-- 7. Campaign Target Customers (Mapping)
CREATE TABLE public.campaign_target_customers (
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, customer_id)
);

-- 8. Campaign Schedules
CREATE TABLE public.campaign_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    email_template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status public.schedule_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Email Sends (Tracking dispatch per user)
CREATE TABLE public.email_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    schedule_id UUID REFERENCES public.campaign_schedules(id) ON DELETE SET NULL,
    status public.send_status NOT NULL DEFAULT 'queued',
    provider_id TEXT, -- E.g. Resend message ID
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Customer Events (Tracking interaction metrics)
CREATE TABLE public.customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    send_id UUID NOT NULL REFERENCES public.email_sends(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    event_type public.customer_event_type NOT NULL,
    event_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Sender Identities
CREATE TABLE public.sender_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    dkim_verified BOOLEAN NOT NULL DEFAULT FALSE,
    spf_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Suppressions
CREATE TABLE public.suppressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    reason public.suppression_reason NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customer_groups_updated_at BEFORE UPDATE ON public.customer_groups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_campaign_schedules_updated_at BEFORE UPDATE ON public.campaign_schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sender_identities_updated_at BEFORE UPDATE ON public.sender_identities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS Enforcement (Require 'admin' role globally)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_target_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_target_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sender_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressions ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    t_name TEXT;
    table_names TEXT[] := ARRAY['customers', 'customer_groups', 'customer_group_memberships', 'email_campaigns', 'email_templates', 'campaign_target_groups', 'campaign_target_customers', 'campaign_schedules', 'email_sends', 'customer_events', 'sender_identities', 'suppressions'];
BEGIN
    FOREACH t_name IN ARRAY table_names LOOP
        EXECUTE format('CREATE POLICY "Admins can do everything on %I" ON public.%I FOR ALL USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''));', t_name, t_name);
    END LOOP;
END $$;
