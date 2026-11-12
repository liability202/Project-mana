-- Checkout hardening: run once in Supabase → SQL Editor after deploying the
-- server-side checkout. Safe to re-run. The app already works without it (it
-- skips missing columns); this just stores everything and speeds up lookups.

-- Payment references for online orders (also in razorpay-schema-patch.sql).
alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
create index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_coupon_code on public.orders(coupon_code);

-- One commission row per order, so a retried webhook can never pay a creator
-- twice. Skipped (with a notice) if duplicates already exist — clean those up
-- in Table Editor → commissions, then re-run this file.
do $$
begin
  create unique index if not exists idx_commissions_order_unique on public.commissions(order_id);
exception
  when unique_violation then raise notice 'commissions has duplicate order_id rows; unique index not created.';
  when undefined_table then raise notice 'commissions table not found; skipped.';
end $$;

-- Dedicated OTP table. Without it, OTPs are kept inside wa_sessions.cart.
create table if not exists public.checkout_otps (
  phone text primary key,
  otp_hash text not null,
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  attempts integer not null default 0,
  delivery_channels text[],
  verified_at timestamptz,
  created_at timestamptz default now()
);
alter table public.checkout_otps enable row level security;
drop policy if exists "checkout_otps_service_role_all" on public.checkout_otps;
create policy "checkout_otps_service_role_all" on public.checkout_otps
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

notify pgrst, 'reload schema';
