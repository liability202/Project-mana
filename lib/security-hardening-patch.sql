-- URGENT: close public read/write access to customer data.
-- Run this once in Supabase → SQL Editor. Safe to re-run.
--
-- Why: the site's anon key ships to every browser. With the policies below,
-- anyone holding it could read every order (names, phones, addresses, emails)
-- straight from the Supabase REST API, insert fake "paid" orders, read coupon
-- rows (influencer phones, commission rates) and post pre-approved reviews.
--
-- The app never needs these: every API route uses the service-role key, which
-- bypasses RLS. Dropping the policies leaves RLS enabled with no anon access.

-- Orders: `user_id is null` matched every phone-OTP order, so all were public.
drop policy if exists "orders_own_read" on public.orders;
drop policy if exists "orders_insert" on public.orders;

-- Same `or user_id is null` hole; production already hides these rows, but the
-- policies in lib/supabase-schema.sql would re-expose them on a fresh setup.
drop policy if exists "wallet_own_read" on public.wallet;
drop policy if exists "wallet_txn_own_read" on public.wallet_transactions;
drop policy if exists "profiles_own_read" on public.user_profiles;

-- Coupons hold influencer phone numbers and commission data.
drop policy if exists "coupons_public_read_active" on public.coupons;

-- Reviews: both policies go. Reads were exposing every reviewer's WhatsApp
-- number (customer_phone); /api/reviews now serves approved reviews without it.
-- Inserts must go through /api/reviews so `approved` and `verified_purchase`
-- can't be forged.
drop policy if exists "reviews_public_read_approved" on public.reviews;
drop policy if exists "reviews_public_insert" on public.reviews;

-- app/api/settings/route.ts calls an `exec_sql` RPC. If such a function exists
-- and anon/authenticated can execute it, anyone with the public key can run
-- arbitrary SQL. Restrict it to the service role (no-op if it doesn't exist).
do $$
begin
  revoke all on function public.exec_sql(text) from public, anon, authenticated;
exception when undefined_function then
  null;
end $$;

-- Make sure RLS stays on for every table that holds customer data.
alter table public.orders enable row level security;
alter table public.coupons enable row level security;
alter table public.wallet enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.reviews enable row level security;
