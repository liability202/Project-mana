-- =============================================
-- SUPPORT TICKETS & ORDER TRACKING SCHEMA PATCH
-- Run this in Supabase SQL Editor
-- =============================================

-- SUPPORT TICKETS
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_ref text unique not null,
  phone text not null,
  order_ref text,
  issue_type text not null
    check (issue_type in ('order_issue','payment','delivery','damaged','refund','return','other')),
  issue_detail text,
  image_url text,
  status text default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz default now()
);

-- New columns on orders for shipping / tracking
alter table orders add column if not exists courier_name text;
alter table orders add column if not exists awb_number text;
alter table orders add column if not exists tracking_url text;
alter table orders add column if not exists packed_at timestamptz;
alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;

-- Indexes
create index if not exists idx_support_tickets_phone on support_tickets(phone);
create index if not exists idx_support_tickets_order_ref on support_tickets(order_ref);
create index if not exists idx_support_tickets_status on support_tickets(status);
create index if not exists idx_orders_awb_number on orders(awb_number);

-- RLS
alter table support_tickets enable row level security;

drop policy if exists "support_tickets_service_role_all" on support_tickets;
create policy "support_tickets_service_role_all"
on support_tickets
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
