-- Amazon Sales Metrics
-- Stores daily aggregated order data pulled from the Amazon SP-API Orders endpoint.
-- Credentials are NOT stored here — they live in Supabase Secrets (AMAZON_SPAPI_*).

CREATE TABLE IF NOT EXISTS public.amazon_sales_metrics (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date         DATE NOT NULL UNIQUE,                  -- one row per calendar day
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_units  INTEGER NOT NULL DEFAULT 0,
    total_revenue_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast date-range queries used by the dashboard component
CREATE INDEX IF NOT EXISTS idx_amazon_sales_metrics_date
    ON public.amazon_sales_metrics (date DESC);

-- RLS
ALTER TABLE public.amazon_sales_metrics ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can read (service role bypasses RLS for inserts)
CREATE POLICY "Admin can read amazon_sales_metrics"
    ON public.amazon_sales_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
