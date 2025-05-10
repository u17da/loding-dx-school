
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS cases;

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags JSONB NOT NULL, -- Using JSONB for tags instead of TEXT[]
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cases_title_idx ON cases (title);
CREATE INDEX IF NOT EXISTS cases_created_at_idx ON cases (created_at);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to cases" ON cases
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public reads from cases" ON cases
  FOR SELECT
  TO anon
  USING (true);
