import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isMissingSchemaError(error: any) {
  const message = String(error?.message || '')
  return (
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes("Could not find the table 'public.reviews'") ||
    message.includes("Could not find the 'approved' column") ||
    message.includes("Could not find the 'verified_purchase' column")
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const pending = searchParams.get('pending') === '1'
  const auth = req.headers.get('authorization')
  const isAdmin = auth === `Bearer ${process.env.ADMIN_SECRET}`

  try {
    if (pending && isAdmin) {
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false })
      if (error) {
        if (isMissingSchemaError(error)) return NextResponse.json([])
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data)
    }

    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('product_slug', slug)
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingSchemaError(error)) return NextResponse.json([])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const customerPhone = String(body.customer_phone || '').replace(/\D/g, '')

    if (!body.product_id || !body.product_slug) {
      return NextResponse.json({ error: 'Product is required.' }, { status: 400 })
    }
    if (!body.customer_name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!customerPhone || customerPhone.length < 10) {
      return NextResponse.json({ error: 'WhatsApp number is required.' }, { status: 400 })
    }
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
    }
    if (!body.body?.trim() || body.body.trim().length < 20) {
      return NextResponse.json({ error: 'Review body must be at least 20 characters.' }, { status: 400 })
    }

    const { data: orders, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('items')
      .eq('customer_phone', customerPhone)
      .limit(100)

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

    const verifiedPurchase = (orders || []).some(order =>
      Array.isArray(order.items) && order.items.some((item: any) =>
        item.product_id === body.product_id || item.product_slug === body.product_slug || item.product_name === body.product_name
      )
    )

    if (!verifiedPurchase) {
      return NextResponse.json({ error: 'Sorry, you can only review products you have purchased using this WhatsApp number.' }, { status: 403 })
    }

    const payload = {
      product_id: body.product_id,
      product_slug: body.product_slug,
      customer_name: body.customer_name.trim(),
      customer_phone: customerPhone,
      rating: Number(body.rating),
      title: body.title?.trim() || null,
      body: body.body.trim(),
      verified_purchase: verifiedPurchase,
      approved: false,
    }

    const { data, error } = await supabaseAdmin.from('reviews').insert(payload).select('*').single()
    if (error) {
      if (isMissingSchemaError(error)) {
        return NextResponse.json({ error: 'Reviews are not enabled in the database yet.' }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ approved: true })
      .eq('id', body.id)
      .select('*')
      .single()

    if (error) {
      if (isMissingSchemaError(error)) return NextResponse.json({ error: 'Reviews are not enabled in the database yet.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id)
    if (error) {
      if (isMissingSchemaError(error)) return NextResponse.json({ error: 'Reviews are not enabled in the database yet.' }, { status: 503 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
