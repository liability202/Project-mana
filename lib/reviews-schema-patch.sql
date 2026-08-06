-- Run this in your Supabase SQL Editor to enable customer reviews in the database

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  product_slug text not null,
  customer_name text not null,
  customer_phone text not null,
  rating integer check (rating between 1 and 5) not null,
  title text,
  body text not null,
  verified_purchase boolean default false,
  approved boolean default false,
  created_at timestamptz default now()
);

alter table reviews enable row level security;

drop policy if exists "reviews_public_read_approved" on reviews;
create policy "reviews_public_read_approved" on reviews for select using (approved = true);

drop policy if exists "reviews_public_insert" on reviews;
create policy "reviews_public_insert" on reviews for insert with check (true);
