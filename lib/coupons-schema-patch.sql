-- Add free_shipping, free_cod, and free_handling columns to coupons table
alter table public.coupons add column if not exists free_shipping boolean default false;
alter table public.coupons add column if not exists free_cod boolean default false;
alter table public.coupons add column if not exists free_handling boolean default false;
