CREATE TABLE presale_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url text NOT NULL,
  clicked_at timestamptz DEFAULT now()
);
