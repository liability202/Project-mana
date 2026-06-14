-- Fix checkout/admin order visibility issues caused by missing columns in public.orders.
-- Run this once in Supabase SQL Editor, then reload the PostgREST schema cache if needed.

alter table public.orders add column if not exists discount_amount integer default 0;
alter table public.orders add column if not exists final_amount integer default 0;
alter table public.orders add column if not exists cashback_earned integer default 0;
alter table public.orders add column if not exists wallet_used integer default 0;
alter table public.orders add column if not exists cod_charge integer default 0;
alter table public.orders add column if not exists small_order_fee integer default 0;
alter table public.orders add column if not exists order_ref text;
alter table public.orders add column if not exists cashfree_order_id text;
alter table public.orders add column if not exists payment_link text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_link text;
alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists expected_delivery date;
alter table public.orders add column if not exists shiprocket_order_id text;
alter table public.orders add column if not exists shiprocket_shipment_id text;
alter table public.orders add column if not exists shiprocket_tracking_status text;
alter table public.orders add column if not exists tracking_events jsonb default '[]'::jsonb;
alter table public.orders add column if not exists tracking_synced_at timestamptz;

create unique index if not exists idx_orders_order_ref_unique on public.orders(order_ref) where order_ref is not null;
create index if not exists idx_orders_cashfree_order_id on public.orders(cashfree_order_id);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);

notify pgrst, 'reload schema';
