-- Allow anyone to check if unredeemed codes exist (for verification during signup)
CREATE POLICY "Anyone can check unredeemed codes"
ON public.access_codes
FOR SELECT
USING (is_redeemed = false);