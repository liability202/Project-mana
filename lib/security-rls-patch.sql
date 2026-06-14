-- Fix Supabase advisor: RLS disabled on public.referrals and public.kit_orders.
-- Run this once in Supabase SQL Editor.

alter table public.referrals enable row level security;
alter table public.kit_orders enable row level security;

drop policy if exists "referrals_service_role_all" on public.referrals;
create policy "referrals_service_role_all"
  on public.referrals
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "kit_orders_service_role_all" on public.kit_orders;
create policy "kit_orders_service_role_all"
  on public.kit_orders
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
