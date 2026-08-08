-- =============================================
-- ORDER INVOICES
-- Run this once in the Supabase SQL editor.
-- =============================================

-- Admin uploads a PDF/image invoice per order; customers download it from
-- their profile. Nullable — orders without an uploaded invoice simply don't
-- show a download button.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_uploaded_at timestamptz;

-- Storage bucket for the uploaded files.
-- NOTE: this is a PUBLIC bucket, so invoice URLs are unguessable-but-public.
-- File names include a random suffix (see app/api/admin/orders/invoice/route.ts)
-- so they cannot be enumerated. If you need stricter privacy, flip `public` to
-- false and switch the API route to `createSignedUrl` instead of
-- `getPublicUrl`.
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-invoices', 'order-invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Only the service role (used by our API routes) may write invoices.
DROP POLICY IF EXISTS "order_invoices_service_write" ON storage.objects;
CREATE POLICY "order_invoices_service_write" ON storage.objects
  FOR ALL
  USING (bucket_id = 'order-invoices' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'order-invoices' AND auth.role() = 'service_role');

-- Anyone holding the URL may read it.
DROP POLICY IF EXISTS "order_invoices_public_read" ON storage.objects;
CREATE POLICY "order_invoices_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'order-invoices');
