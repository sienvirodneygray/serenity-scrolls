-- Drop all existing policies on cart_items
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cart_items'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON cart_items', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users see their own items, anon users see items by session_id
CREATE POLICY "Users can view own cart items" ON cart_items
FOR SELECT USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  OR
  (auth.role() = 'service_role')
);

-- INSERT: authenticated users can insert with their user_id, anon users can insert with session_id
CREATE POLICY "Users can insert own cart items" ON cart_items
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (user_id IS NULL AND session_id IS NOT NULL)
  OR
  (auth.role() = 'service_role')
);

-- UPDATE: authenticated users update their own items, anon users update by session_id
CREATE POLICY "Users can update own cart items" ON cart_items
FOR UPDATE USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  OR
  (auth.role() = 'service_role')
);

-- DELETE: authenticated users delete their own items, anon users delete by session_id
CREATE POLICY "Users can delete own cart items" ON cart_items
FOR DELETE USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  OR
  (auth.role() = 'service_role')
);
