import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { getSessionPhone, phoneVariants } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
import { revalidateCatalog } from '@/lib/revalidate'

export const dynamic = 'force-dynamic'

// Never includes customer_phone: reviews are public.
const PUBLIC_REVIEW_FIELDS = 'id, product_id, product_slug, customer_name, rating, title, body, verified_purchase, created_at'

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

  try {
    if (pending) {
      if (!isAdminRequest(req)) return unauthorized()
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
      .select(PUBLIC_REVIEW_FIELDS)
      .eq('product_slug', slug)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      if (isMissingSchemaError(error)) return NextResponse.json([])
      console.error('Reviews load failed', error)
      return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Reviews load failed', err)
    return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 })
  }
}

/** Signed-in customers who ordered the product may review it (moderated). */
export async function POST(req: Request) {
  try {
    const phone = getSessionPhone()
    if (!phone) {
      return NextResponse.json({ error: 'Please sign in with your WhatsApp number to write a review.' }, { status: 401 })
    }
    if (!rateLimit(`review:${phone}`, 5, 60 * 60 * 1000).ok) {
      return NextResponse.json({ error: 'You have submitted several reviews recently. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const productId = String(body.product_id || '')
    const productSlug = String(body.product_slug || '')
    const customerName = String(body.customer_name || '').trim().slice(0, 60)
    const title = String(body.title || '').trim().slice(0, 120)
    const text = String(body.body || '').trim()
    const rating = Number(body.rating)

    if (!productId || !productSlug) {
      return NextResponse.json({ error: 'Product is required.' }, { status: 400 })
    }
    if (!customerName) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
    }
    if (text.length < 20 || text.length > 2000) {
      return NextResponse.json({ error: 'Review must be between 20 and 2000 characters.' }, { status: 400 })
    }

    const { data: orders, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('items')
      .in('customer_phone', phoneVariants(phone))
      .neq('status', 'cancelled')
      .limit(100)

    if (orderError) {
      console.error('Review purchase check failed', orderError)
      return NextResponse.json({ error: 'Could not submit your review right now.' }, { status: 500 })
    }

    // Match on the product id only (both id and slug come from the browser),
    // and take the slug the review is shown under from the catalogue.
    const verifiedPurchase = (orders || []).some(order =>
      Array.isArray(order.items) && order.items.some((item: any) => item.product_id === productId)
    )

    if (!verifiedPurchase) {
      return NextResponse.json({ error: 'Sorry, you can only review products you have ordered.' }, { status: 403 })
    }

    const { data: product } = await supabaseAdmin.from('products').select('slug').eq('id', productId).maybeSingle()
    if (!product?.slug) {
      return NextResponse.json({ error: 'This product is no longer available.' }, { status: 404 })
    }

    const { data: existing } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .in('customer_phone', phoneVariants(phone))
      .limit(1)
    if (existing?.length) {
      return NextResponse.json({ error: 'You have already reviewed this product. Thank you!' }, { status: 409 })
    }

    const payload = {
      product_id: productId,
      product_slug: product.slug,
      customer_name: customerName,
      customer_phone: phone,
      rating,
      title: title || null,
      body: text,
      verified_purchase: true,
      approved: false,
    }

    const { error } = await supabaseAdmin.from('reviews').insert(payload)
    if (error) {
      if (isMissingSchemaError(error)) {
        return NextResponse.json({ error: 'Reviews are not enabled in the database yet.' }, { status: 503 })
      }
      console.error('Review insert failed', error)
      return NextResponse.json({ error: 'Could not submit your review right now.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Review submit failed', err)
    return NextResponse.json({ error: 'Could not submit your review right now.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

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
    // An approved review changes the product's star rating, which is cached in its page.
    revalidateCatalog([data?.product_slug])
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

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
