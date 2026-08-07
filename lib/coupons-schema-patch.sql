-- Run this in your Supabase SQL Editor to add all missing columns to the coupons table

alter table public.coupons add column if not exists influencer_name text;
alter table public.coupons add column if not exists influencer_phone text;
alter table public.coupons add column if not exists creator_id uuid references public.creators(id);
alter table public.coupons add column if not exists commission_rate numeric(5,2);
alter table public.coupons add column if not exists min_order_amount integer default 0;
alter table public.coupons add column if not exists max_discount integer;
alter table public.coupons add column if not exists usage_limit integer;
alter table public.coupons add column if not exists usage_count integer default 0;
alter table public.coupons add column if not exists total_orders integer default 0;
alter table public.coupons add column if not exists total_revenue bigint default 0;
alter table public.coupons add column if not exists total_discount_given bigint default 0;
alter table public.coupons add column if not exists free_shipping boolean default false;
alter table public.coupons add column if not exists free_cod boolean default false;
alter table public.coupons add column if not exists free_handling boolean default false;
alter table public.coupons add column if not exists is_active boolean default true;
create index if not exists idx_coupons_creator_id on public.coupons(creator_id);
create index if not exists idx_coupons_influencer_phone on public.coupons(influencer_phone);
