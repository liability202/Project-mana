import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: creators } = await supabaseAdmin
    .from('creators')
    .select('id,name,phone,code,commission_pct')

  const creatorsByCode = new Map((creators || []).map((creator: any) => [String(creator.code || '').toUpperCase(), creator]))
  const enriched = (data || []).map((coupon: any) => {
    const creator = creatorsByCode.get(String(coupon.code || '').toUpperCase())
    if (!creator) return coupon
    return {
      ...coupon,
      creator_id: coupon.creator_id || creator.id,
      influencer_name: coupon.influencer_name || creator.name,
      influencer_phone: coupon.influencer_phone || creator.phone,
      commission_rate: coupon.commission_rate ?? creator.commission_pct,
    }
  })

  return NextResponse.json(enriched)
}

// Optional columns that may not exist yet in older DB schemas.
// If an insert fails citing a missing column, we strip it and retry.
const OPTIONAL_COLUMNS = [
  'influencer_name',
  'influencer_phone',
  'creator_id',
  'commission_rate',
  'min_order_amount',
  'max_discount',
  'usage_limit',
  'free_shipping',
  'free_cod',
  'free_handling',
]

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const payload: any = {
      code: String(body.code || '').trim().toUpperCase(),
      discount_type: body.discount_type,
      discount_value: Number(body.discount_value || 0),
      influencer_name: body.influencer_name || null,
      influencer_phone: body.influencer_phone ? String(body.influencer_phone).replace(/\D/g, '').slice(-10) : null,
      creator_id: body.creator_id || null,
      commission_rate: body.commission_rate ? Number(body.commission_rate) : null,
      min_order_amount: body.min_order_amount ? Number(body.min_order_amount) : 0,
      max_discount: body.max_discount ? Number(body.max_discount) : null,
      usage_limit: body.usage_limit ? Number(body.usage_limit) : null,
      free_shipping: Boolean(body.free_shipping),
      free_cod: Boolean(body.free_cod),
      free_handling: Boolean(body.free_handling),
      is_active: body.is_active ?? true,
    }

    if (!payload.code) return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 })
    if (!['percentage', 'fixed'].includes(payload.discount_type)) {
      return NextResponse.json({ error: 'Invalid discount type.' }, { status: 400 })
    }
    if (payload.discount_value <= 0) {
      return NextResponse.json({ error: 'Discount value must be greater than 0.' }, { status: 400 })
    }

    // Try inserting. If a column is missing from the schema cache, strip it and retry.
    let currentPayload = { ...payload }
    let data: any = null
    let error: any = null
    let attempts = 0

    while (attempts < OPTIONAL_COLUMNS.length + 1) {
      const result = await supabaseAdmin.from('coupons').insert(currentPayload).select('*').single()
      data = result.data
      error = result.error

      if (!error) break

      const isSchemaError =
        error.message.includes('schema cache') ||
        error.message.includes('column') ||
        error.message.includes('does not exist') ||
        error.code === 'PGRST204'

      if (!isSchemaError) break

      // Find which optional column is mentioned in the error and remove it
      const culprit = OPTIONAL_COLUMNS.find(col => error.message.includes(col))
      if (!culprit) break

      delete currentPayload[culprit]
      attempts++
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
