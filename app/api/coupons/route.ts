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
  return NextResponse.json(data)
}

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

    let { data, error } = await supabaseAdmin.from('coupons').insert(payload).select('*').single()
    
    if (error && (error.message.includes('free_shipping') || error.message.includes('free_cod') || error.message.includes('free_handling') || error.message.includes('schema cache'))) {
      delete payload.free_shipping
      delete payload.free_cod
      delete payload.free_handling
      const retry = await supabaseAdmin.from('coupons').insert(payload).select('*').single()
      data = retry.data
      error = retry.error
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
