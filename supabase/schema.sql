CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags JSONB NOT NULL, -- Changed from TEXT[] to JSONB to match application expectations
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
