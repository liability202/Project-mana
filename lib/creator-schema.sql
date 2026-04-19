-- =============================================
-- CREATOR / INFLUENCER PANEL SCHEMA
-- =============================================

-- Creator accounts
CREATE TABLE IF NOT EXISTS creators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  instagram_handle text,
  youtube_handle text,
  niche text,               -- hair, fitness, ayurveda, food etc.
  code text UNIQUE NOT NULL, -- MANA-PRIYA
  commission_pct integer DEFAULT 10,
  tier text DEFAULT 'standard' 
    CHECK (tier IN ('nano','standard','premium','custom')),
  upi_id text,              -- for payouts
  bank_account text,
  bank_ifsc text,
  total_earned integer DEFAULT 0,   -- paise
  total_paid integer DEFAULT 0,     -- paise
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Commission transactions
CREATE TABLE IF NOT EXISTS commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES creators(id),
  order_id uuid REFERENCES orders(id),
  order_total integer NOT NULL,      -- paise
  commission_pct integer NOT NULL,
  commission_amount integer NOT NULL, -- paise
  status text DEFAULT 'pending'
    CHECK (status IN (
      'pending',    -- order placed, not delivered
      'confirmed',  -- order delivered, ready to pay
      'paid',       -- creator paid out
      'cancelled'   -- order cancelled/returned
    )),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Payout requests
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES creators(id),
  amount integer NOT NULL,          -- paise
  upi_id text,
  bank_account text,
  bank_ifsc text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'rejected')),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_creators_phone ON creators(phone);
CREATE INDEX IF NOT EXISTS idx_creators_code ON creators(code);
CREATE INDEX IF NOT EXISTS idx_commissions_creator_id ON commissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);

-- RLS
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Creators can read their own account
CREATE POLICY "creators_own_read" ON creators FOR SELECT 
  USING (phone = (auth.jwt() ->> 'phone'));

-- Creators can read their own commissions
CREATE POLICY "commissions_own_read" ON commissions FOR SELECT 
  USING (creator_id IN (SELECT id FROM creators WHERE phone = (auth.jwt() ->> 'phone')));

-- Creators can read their own payout requests
CREATE POLICY "payout_requests_own_read" ON payout_requests FOR SELECT 
  USING (creator_id IN (SELECT id FROM creators WHERE phone = (auth.jwt() ->> 'phone')));

-- Service role can do everything (for API routes)
CREATE POLICY "creators_service_role" ON creators FOR ALL 
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "commissions_service_role" ON commissions FOR ALL 
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "payout_requests_service_role" ON payout_requests FOR ALL 
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
