CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  moderation_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE moderation_logs IS 'Logs of content that failed OpenAI moderation checks';

ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserts to moderation_logs" ON moderation_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow reads from moderation_logs" ON moderation_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);
