-- =============================================
-- REFERRAL VISITS TABLE
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS referral_visits (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_code text NOT NULL,       -- stored UPPERCASE to match stats query
  visitor_phone text,               -- 'anonymous_visit' for non-phone visits
  created_at   timestamptz DEFAULT now()
);

-- Fast count queries per creator code
CREATE INDEX IF NOT EXISTS idx_referral_visits_creator_code
  ON referral_visits (creator_code);

-- Fast time-range queries
CREATE INDEX IF NOT EXISTS idx_referral_visits_created_at
  ON referral_visits (created_at);

-- RLS
ALTER TABLE referral_visits ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (insert from API routes, read for stats)
CREATE POLICY "referral_visits_service_role" ON referral_visits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
