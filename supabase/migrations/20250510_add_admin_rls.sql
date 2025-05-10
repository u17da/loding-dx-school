
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cases') THEN
    RAISE EXCEPTION 'Table cases does not exist';
  END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update cases" 
ON cases
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete cases" 
ON cases
FOR DELETE
TO authenticated
USING (true);

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read admin_settings" 
ON admin_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update admin_settings" 
ON admin_settings
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert admin_settings" 
ON admin_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete admin_settings" 
ON admin_settings
FOR DELETE
TO authenticated
USING (true);

COMMENT ON TABLE admin_settings IS 'Settings and configuration for admin functionality';
