-- =============================================
-- MANA DATABASE SCHEMA
-- Paste this into Supabase → SQL Editor → Run
-- =============================================

-- PRODUCTS
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  category text check (category in ('dry-fruits','herbs','spices','pansari','kits')) not null,
  price integer not null,          -- in paise (₹1 = 100)
  compare_price integer,
  price_per_unit text default 'per 500g',
  images text[] default '{}',      -- Supabase storage URLs
  tags text[] default '{}',        -- bestseller, organic, premium, etc.
  vendor text,                     -- origin e.g. Kashmir India
  in_stock boolean default true,
  variants jsonb default '[]',     -- array of variant objects
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address text not null,
  city text not null,
  state text,
  pincode text not null,
  items jsonb not null default '[]',
  subtotal integer not null,       -- paise
  discount integer default 0,
  shipping integer default 0,
  total integer not null,          -- paise
  coupon_code text,
  status text default 'pending'
    check (status in ('pending','confirmed','packed','shipped','delivered','cancelled')),
  payment_status text default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  payment_id text,
  razorpay_order_id text,
  notes text,
  created_at timestamptz default now()
);

-- APPOINTMENTS (Video calls)
create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  email text,
  date date not null,
  time_slot text not null,
  interests text[],
  platform text default 'whatsapp',
  notes text,
  status text default 'requested'
    check (status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz default now()
);

-- REFERRALS
create table if not exists referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_user_id uuid references auth.users(id),
  referrer_name text,
  referral_code text unique not null,
  friend_order_id uuid references orders(id),
  credit_issued boolean default false,
  credit_amount integer default 10000, -- ₹100 in paise
  created_at timestamptz default now()
);

-- KIT ORDERS
create table if not exists kit_orders (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id),
  items jsonb not null,   -- [{name, grams, price}]
  total integer not null,
  notes text,
  created_at timestamptz default now()
);

-- ── SAMPLE PRODUCTS (run this to populate your store) ──
insert into products (name, slug, description, category, price, price_per_unit, tags, vendor, variants) values
(
  'Mamra Almonds',
  'mamra-almonds',
  'Handpicked premium Mamra almonds from Kashmir''s finest orchards — the most prized almond variety in India. Oil-rich, crunchy and packed with nutrients. Every batch is lab-tested for purity before dispatch.',
  'dry-fruits',
  120000,
  'per 500g',
  ARRAY['bestseller','organic'],
  'Kashmir, India',
  '[
    {"id":"v1","name":"Mamra","description":"Premium, oil-rich · Kashmir","price":120000,"quality_tag":"best"},
    {"id":"v2","name":"Australian","description":"Large, crunchy · Imported","price":76000,"quality_tag":"popular"},
    {"id":"v3","name":"Jumbo","description":"Extra large size","price":89000},
    {"id":"v4","name":"Sanora","description":"Sweet, budget-friendly","price":72000,"quality_tag":"basic"},
    {"id":"v5","name":"Organic","description":"No pesticides, certified","price":98000}
  ]'::jsonb
),
(
  'Ashwagandha Root Powder',
  'ashwagandha-root-powder',
  'Pure Ashwagandha powder ground fresh after your order — not pre-ground in bulk. Sourced from Madhya Pradesh, the heartland of quality Ashwagandha. Supports energy, stress relief and immunity.',
  'herbs',
  34000,
  'per 100g',
  ARRAY['organic','premium'],
  'Madhya Pradesh',
  '[
    {"id":"v1","name":"Powder","description":"Ground fresh after order","price":34000,"quality_tag":"best"},
    {"id":"v2","name":"Whole Root","description":"Dried whole root","price":28000}
  ]'::jsonb
),
(
  'Persian Pistachios',
  'persian-pistachios',
  'Vibrant green pistachios imported from Iran''s finest farms. Rich, buttery flavour — perfect for snacking, baking and gifting.',
  'dry-fruits',
  180000,
  'per 500g',
  ARRAY['bestseller','premium'],
  'Iran · Imported',
  '[
    {"id":"v1","name":"Roasted","description":"Lightly roasted, salted","price":180000,"quality_tag":"popular"},
    {"id":"v2","name":"Raw","description":"Natural, unsalted","price":175000,"quality_tag":"best"},
    {"id":"v3","name":"Salted","description":"Salted and ready to eat","price":182000}
  ]'::jsonb
),
(
  'Kashmiri Saffron',
  'kashmiri-saffron',
  'Pure A-grade Kashmiri Kesar saffron strands — the finest saffron in the world. Packed in small quantities to guarantee maximum potency and freshness.',
  'spices',
  58000,
  'per 2g',
  ARRAY['premium','bestseller'],
  'Kashmir, India',
  '[
    {"id":"v1","name":"Grade A Threads","description":"Full red threads","price":58000,"quality_tag":"best"},
    {"id":"v2","name":"Grade B Threads","description":"Mixed threads","price":42000,"quality_tag":"basic"}
  ]'::jsonb
),
(
  'Cardamom Pods',
  'cardamom-pods',
  'Aromatic green cardamom pods from the spice gardens of Kerala. Freshly sourced each season.',
  'spices',
  48000,
  'per 100g',
  ARRAY['organic'],
  'Kerala, India',
  '[
    {"id":"v1","name":"Green Pods","description":"Whole green pods","price":48000,"quality_tag":"best"},
    {"id":"v2","name":"Black Pods","description":"Smoked black cardamom","price":38000},
    {"id":"v3","name":"Powder","description":"Ground fresh to order","price":52000}
  ]'::jsonb
),
(
  'Medjool Dates',
  'medjool-dates',
  'Soft, caramel-sweet Medjool dates — the king of dates. Imported from Saudi Arabia. Nature''s perfect energy food.',
  'dry-fruits',
  75000,
  'per 500g',
  ARRAY['bestseller'],
  'Saudi Arabia',
  '[
    {"id":"v1","name":"Premium","description":"Jumbo size, extra soft","price":75000,"quality_tag":"best"},
    {"id":"v2","name":"Standard","description":"Regular size","price":62000,"quality_tag":"popular"}
  ]'::jsonb
);

-- ── ROW LEVEL SECURITY ──
alter table products enable row level security;
alter table orders enable row level security;
alter table appointments enable row level security;

-- Anyone can read products
create policy "products_public_read" on products for select using (true);

-- Anyone can insert orders (guest checkout)
create policy "orders_insert" on orders for insert with check (true);

-- Users can read their own orders
create policy "orders_own_read" on orders for select
  using (auth.uid() = user_id or user_id is null);

-- Public can insert appointments
create policy "appts_insert" on appointments for insert with check (true);
