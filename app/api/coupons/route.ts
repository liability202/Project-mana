import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  summariseCommissions,
  type CommissionRow,
  type CommissionableOrder,
} from '@/lib/commissions'

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
    .select('id,name,phone,code,commission_pct,active')

  const creatorsByCode = new Map((creators || []).map((creator: any) => [String(creator.code || '').toUpperCase(), creator]))
  const creatorsByPhone = new Map((creators || []).map((creator: any) => [String(creator.phone || '').replace(/\D/g, '').slice(-10), creator]))
  const creatorsById = new Map((creators || []).map((creator: any) => [String(creator.id || ''), creator]))

  const seenCodes = new Set<string>()

  const enriched = (data || []).map((coupon: any) => {
    const couponCode = String(coupon.code || '').toUpperCase()
    seenCodes.add(couponCode)

    const creator =
      (coupon.creator_id ? creatorsById.get(String(coupon.creator_id)) : null) ||
      (coupon.influencer_phone ? creatorsByPhone.get(String(coupon.influencer_phone).replace(/\D/g, '').slice(-10)) : null) ||
      creatorsByCode.get(couponCode)

    if (!creator) return coupon

    return {
      ...coupon,
      creator_id: coupon.creator_id || creator.id,
      influencer_name: coupon.influencer_name || creator.name,
      influencer_phone: coupon.influencer_phone || creator.phone,
      commission_rate: coupon.commission_rate ?? creator.commission_pct,
    }
  })

  // Append any creator codes that are not in the coupons table yet
  for (const creator of (creators || [])) {
    const creatorCode = String(creator.code || '').toUpperCase()
    if (creatorCode && !seenCodes.has(creatorCode)) {
      seenCodes.add(creatorCode)
      enriched.push({
        id: `creator-${creator.id}`,
        code: creator.code,
        discount_type: 'percentage',
        discount_value: 10,
        influencer_name: creator.name,
        influencer_phone: creator.phone,
        creator_id: creator.id,
        commission_rate: creator.commission_pct || 10,
        usage_count: 0,
        total_orders: 0,
        total_revenue: 0,
        total_discount_given: 0,
        is_active: creator.active ?? true,
        is_influencer_code: true,
      })
    }
  }

  // ── Enrich with real order + commission stats ─────────────────────────────
  // These numbers have to agree with what the creator sees in their portal, so
  // both sides run the same rules from lib/commissions.ts.
  const [{ data: orderRows }, { data: commissionRows }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, coupon_code, subtotal, total, final_amount, discount_amount, discount, status')
      .not('coupon_code', 'is', null),
    supabaseAdmin
      .from('commissions')
      .select('order_id, creator_id, commission_amount, order_total, status'),
  ])

  // UPPER(coupon_code) → the orders placed with it.
  const ordersByCode = new Map<string, CommissionableOrder[]>()
  // order id → UPPER(coupon_code), used to attribute commission rows below.
  const codeByOrderId = new Map<string, string>()

  for (const row of orderRows || []) {
    const code = String(row.coupon_code || '').toUpperCase()
    if (!code) continue
    if (row.id) codeByOrderId.set(String(row.id), code)
    const bucket = ordersByCode.get(code)
    if (bucket) bucket.push(row)
    else ordersByCode.set(code, [row])
  }

  // Commission rows are keyed by creator, but a creator can own more than one
  // code — so attribute each row through its order's coupon code. Grouping by
  // creator instead would double-count their totals across every code they own.
  const commissionsByCode = new Map<string, CommissionRow[]>()
  for (const row of commissionRows || []) {
    const code = row.order_id ? codeByOrderId.get(String(row.order_id)) : undefined
    if (!code) continue
    const bucket = commissionsByCode.get(code)
    if (bucket) bucket.push(row)
    else commissionsByCode.set(code, [row])
  }

  const final = enriched.map((c: any) => {
    const code = String(c.code || '').toUpperCase()
    const hasCreator = Boolean(c.creator_id || c.influencer_name || c.influencer_phone)
    // A plain discount coupon with no influencer attached earns nobody a cut.
    const commPct = hasCreator ? Number(c.commission_rate ?? 10) : 0

    const summary = summariseCommissions({
      commissions: commissionsByCode.get(code) || [],
      orders: ordersByCode.get(code) || [],
      commissionPct: commPct,
    })

    return {
      ...c,
      // Live data is the single source of truth; the denormalised counters on
      // the coupons row drift as soon as an order is cancelled or edited.
      total_orders: summary.totalOrders,
      usage_count: summary.totalOrders,
      total_revenue: summary.totalRevenue,
      total_discount_given: summary.totalDiscount,
      total_commission: summary.totalCommission,
      commission_pending: summary.commissionPending,
      commission_confirmed: summary.commissionConfirmed,
      commission_paid: summary.commissionPaid,
      commission_source: summary.source,
    }
  })

  return NextResponse.json(final)
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

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, code, discount_type, discount_value, influencer_name, influencer_phone, creator_id, commission_rate, min_order_amount, max_discount, usage_limit, free_shipping, free_cod, free_handling, is_active } = body

    if (!id) return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 })

    if (String(id).startsWith('creator-')) {
      const realCreatorId = String(id).replace('creator-', '')
      const creatorPayload: any = {}
      if (code) creatorPayload.code = String(code).trim().toUpperCase()
      if (influencer_name) creatorPayload.name = influencer_name
      if (influencer_phone) creatorPayload.phone = String(influencer_phone).replace(/\D/g, '').slice(-10)
      if (commission_rate != null) creatorPayload.commission_pct = Number(commission_rate)
      if (is_active != null) creatorPayload.active = Boolean(is_active)

      const { data: updatedCreator, error: creatorErr } = await supabaseAdmin
        .from('creators')
        .update(creatorPayload)
        .eq('id', realCreatorId)
        .select()
        .single()

      if (creatorErr) return NextResponse.json({ error: creatorErr.message }, { status: 500 })

      return NextResponse.json({
        id,
        code: updatedCreator.code,
        discount_type: 'percentage',
        discount_value: 10,
        influencer_name: updatedCreator.name,
        influencer_phone: updatedCreator.phone,
        creator_id: updatedCreator.id,
        commission_rate: updatedCreator.commission_pct || 10,
        is_active: updatedCreator.active ?? true,
        is_influencer_code: true,
      })
    }

    const payload: any = {
      code: String(code || '').trim().toUpperCase(),
      discount_type,
      discount_value: Number(discount_value || 0),
      influencer_name: influencer_name || null,
      influencer_phone: influencer_phone ? String(influencer_phone).replace(/\D/g, '').slice(-10) : null,
      creator_id: creator_id || null,
      commission_rate: commission_rate ? Number(commission_rate) : null,
      min_order_amount: min_order_amount != null ? Number(min_order_amount) : 0,
      max_discount: max_discount != null ? Number(max_discount) : null,
      usage_limit: usage_limit != null ? Number(usage_limit) : null,
      free_shipping: Boolean(free_shipping),
      free_cod: Boolean(free_cod),
      free_handling: Boolean(free_handling),
      is_active: is_active ?? true,
    }

    let currentPayload = { ...payload }
    let data: any = null
    let error: any = null
    let attempts = 0

    while (attempts < OPTIONAL_COLUMNS.length + 1) {
      const result = await supabaseAdmin.from('coupons').update(currentPayload).eq('id', id).select('*').single()
      data = result.data
      error = result.error

      if (!error) break
      const isSchemaError = error.message.includes('schema cache') || error.message.includes('column') || error.message.includes('does not exist') || error.code === 'PGRST204'
      if (!isSchemaError) break

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

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })

  if (id.startsWith('creator-')) {
    const realCreatorId = id.replace('creator-', '')
    const { error } = await supabaseAdmin.from('creators').delete().eq('id', realCreatorId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
