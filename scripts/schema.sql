-- OpenLaw Unified Account & Payment Schema
-- WARNING: This script will reset your database if run!

-- Drop existing tables
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS otp_codes;
DROP TABLE IF EXISTS free_users; -- We will move towards tracking everything in access_codes or similar
DROP TABLE IF EXISTS access_codes;

-- Main account table
-- A record is created as soon as a user verifies their email for free credits.
-- The 'code' is generated only when they make their first purchase.
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(16) UNIQUE, -- Generated on first purchase
  credits_remaining INT NOT NULL DEFAULT 0,
  total_credits_purchased INT NOT NULL DEFAULT 0,
  free_questions_used INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  session_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Atomic update functions (Fix #4)
CREATE OR REPLACE FUNCTION decrement_credits(account_id UUID) RETURNS void AS $$
  UPDATE accounts SET credits_remaining = credits_remaining - 1, last_used_at = now() WHERE id = account_id AND credits_remaining > 0;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION increment_free_questions(account_id UUID, max_free INT) RETURNS void AS $$
  UPDATE accounts SET free_questions_used = free_questions_used + 1, last_used_at = now() WHERE id = account_id AND free_questions_used < max_free;
$$ LANGUAGE sql;

-- Temporary OTP storage (for new email verification)
CREATE TABLE otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(6) NOT NULL,
  fingerprint VARCHAR(64) NOT NULL,
  attempts INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment history
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  amount INT NOT NULL,
  credits INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);

-- Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- No public policies = only service_role key access.
