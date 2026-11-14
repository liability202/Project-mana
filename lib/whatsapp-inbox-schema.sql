-- WhatsApp AI assistant + admin inbox.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- One row per customer chat: who it is, where they are in the buying journey,
-- and what the assistant is holding for them (cart, address, pending order).
create table if not exists wa_conversations (
  phone              text primary key,                 -- WhatsApp id, e.g. 919876543210
  name               text,
  stage              text not null default 'new',      -- new | browsing | cart | details | payment_sent | paid | needs_human | closed
  bot_paused         boolean not null default false,   -- true while you are replying yourself
  needs_human_reason text,
  cart               jsonb not null default '[]'::jsonb,
  customer           jsonb not null default '{}'::jsonb,
  pending_order      jsonb,
  last_order_id      uuid,
  last_order_ref     text,
  last_message_at    timestamptz not null default now(),
  last_message_preview text,
  last_inbound_at    timestamptz,                      -- WhatsApp's 24-hour reply window starts here
  unread_count       int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Every message in and out, for the inbox transcript.
create table if not exists wa_messages (
  id            bigserial primary key,
  phone         text not null,
  direction     text not null check (direction in ('in', 'out')),
  sender        text not null,                         -- customer | bot | admin | system
  wa_message_id text unique,                           -- Meta's id; unique = duplicate deliveries are ignored
  type          text not null default 'text',
  body          text,
  payload       jsonb,
  status        text,                                  -- sent | delivered | read | failed
  created_at    timestamptz not null default now()
);

create index if not exists wa_messages_phone_created on wa_messages (phone, created_at desc);
create index if not exists wa_conversations_stage_recent on wa_conversations (stage, last_message_at desc);
create index if not exists wa_conversations_recent on wa_conversations (last_message_at desc);

-- Only the server (service role) may read or write these. No public policies.
alter table wa_conversations enable row level security;
alter table wa_messages enable row level security;
