-- WhatsApp bot schema patch for MANA
-- Run this separately in Supabase SQL Editor.
-- Do not replace your existing lib/supabase-schema.sql if your base tables already exist.

create table if not exists wa_sessions (
  phone text primary key,
  state text default 'GREETING',
  lang text default 'English',
  cart jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table orders add column if not exists order_ref text unique;
alter table orders add column if not exists cashfree_order_id text;
alter table orders add column if not exists payment_link text;

create index if not exists idx_orders_order_ref on orders(order_ref);
create index if not exists idx_orders_customer_phone on orders(customer_phone);
create index if not exists idx_wa_sessions_updated_at on wa_sessions(updated_at);

alter table wa_sessions enable row level security;

drop policy if exists "wa_sessions_service_role_all" on wa_sessions;
create policy "wa_sessions_service_role_all"
on wa_sessions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
