import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = process.env.SUPABASE_INVOICE_BUCKET || 'order-invoices'
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

function isAuthorised(req: Request, formSecret?: string) {
  const adminSecret = (process.env.ADMIN_SECRET || '').trim()
  if (!adminSecret) return false

  const token = (
    req.headers.get('x-admin-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    formSecret ||
    ''
  ).trim()

  return token === adminSecret
}

/** Missing-column errors mean the SQL patch hasn't been applied yet. */
function isMissingColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return (
    error.code === 'PGRST204' ||
    /invoice_(url|number|uploaded_at)/.test(error.message || '') ||
    /schema cache/i.test(error.message || '')
  )
}

const SCHEMA_HINT =
  'Invoice columns are missing. Run lib/invoices-schema-patch.sql in the Supabase SQL editor, then retry.'

// Upload an invoice file and attach it to an order.
export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    if (!isAuthorised(req, String(formData.get('admin_secret') || ''))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = String(formData.get('order_id') || '').trim()
    const invoiceNumber = String(formData.get('invoice_number') || '').trim()
    const file = formData.get('file') as File | null

    if (!orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })
    if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invoice must be a PDF, PNG, JPG or WebP file.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Invoice must be 10MB or smaller.' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, order_ref')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'pdf'
    const safeExtension = /^[a-z0-9]{1,5}$/.test(extension) ? extension : 'pdf'
    const ref = String(order.order_ref || order.id).replace(/[^a-zA-Z0-9-]/g, '')
    // The random suffix keeps the public URL unguessable — invoices contain
    // customer names and addresses, so they must not be enumerable by order ref.
    const secret = randomUUID().replace(/-/g, '').slice(0, 16)
    const path = `${orderId}/${ref}-${secret}.${safeExtension}`

    const buffer = Buffer.from(await file.arrayBuffer())

    let { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    // First run on a fresh project: create the bucket, then retry once.
    if (uploadError && /not found|does not exist/i.test(uploadError.message)) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_BYTES,
        allowedMimeTypes: ALLOWED_TYPES,
      })
      const retry = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: true })
      uploadError = retry.error
    }

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        invoice_url: publicUrl.publicUrl,
        invoice_number: invoiceNumber || null,
        invoice_uploaded_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: isMissingColumn(updateError) ? SCHEMA_HINT : updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invoice upload failed.' }, { status: 500 })
  }
}

// Detach an invoice from an order (and delete the stored file).
export async function DELETE(req: Request) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('invoice_url')
    .eq('id', orderId)
    .maybeSingle()

  // Best-effort file cleanup — clearing the row is what actually matters.
  const marker = `/${BUCKET}/`
  const storedPath = order?.invoice_url?.includes(marker)
    ? decodeURIComponent(order.invoice_url.split(marker)[1])
    : null
  if (storedPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([storedPath])
  }

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({ invoice_url: null, invoice_number: null, invoice_uploaded_at: null })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json(
      { error: isMissingColumn(error) ? SCHEMA_HINT : error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(updated)
}
