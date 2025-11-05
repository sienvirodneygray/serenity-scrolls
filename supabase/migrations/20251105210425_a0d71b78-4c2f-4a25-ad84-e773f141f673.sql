-- Add is_reusable column to access_codes table
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS is_reusable BOOLEAN DEFAULT false;

-- Mark code 7777777 as reusable and unredeemed
UPDATE access_codes 
SET is_reusable = true, is_redeemed = false 
WHERE code = '7777777';

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Anyone can check unredeemed codes" ON access_codes;
DROP POLICY IF EXISTS "Users can redeem codes" ON access_codes;

-- Create new RLS policy to allow checking codes that are either unredeemed OR reusable
CREATE POLICY "Anyone can check valid codes" 
ON access_codes 
FOR SELECT 
USING (is_redeemed = false OR is_reusable = true);

-- Allow updates for reusable codes
CREATE POLICY "Users can redeem codes" 
ON access_codes 
FOR UPDATE 
USING (is_redeemed = false OR is_reusable = true)
WITH CHECK (redeemed_by = auth.uid());