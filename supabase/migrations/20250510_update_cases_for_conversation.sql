ALTER TABLE cases 
  ADD COLUMN IF NOT EXISTS "when" TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS "who" TEXT,
  ADD COLUMN IF NOT EXISTS impact TEXT,
  ADD COLUMN IF NOT EXISTS cause TEXT,
  ADD COLUMN IF NOT EXISTS suggestions TEXT,
  ADD COLUMN IF NOT EXISTS conversation JSONB;

COMMENT ON COLUMN cases."when" IS 'When the DX failure occurred';
COMMENT ON COLUMN cases.location IS 'Where the DX failure occurred';
COMMENT ON COLUMN cases."who" IS 'Who was involved in the DX failure';
COMMENT ON COLUMN cases.impact IS 'Impact of the DX failure';
COMMENT ON COLUMN cases.cause IS 'Root cause of the DX failure';
COMMENT ON COLUMN cases.suggestions IS 'Suggestions for improvement';
COMMENT ON COLUMN cases.conversation IS 'Full conversation history in JSON format';
