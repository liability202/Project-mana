-- Optional database schema patch for products badge overlay columns
-- Run this in your Supabase SQL Editor if you wish to add dedicated database columns for badge positions:

ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_x integer DEFAULT 50;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_y integer DEFAULT 82;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_scale numeric DEFAULT 1.0;
