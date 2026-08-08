import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { LOYALTY_CODE, LOYALTY_DISCOUNT_PCT } from '@/lib/commerce'
import { rangeStartISO } from '@/lib/date-ranges'

/**
 * Analytics for the built-in loyalty code.
 *
 * LOYAL12 has no row in `coupons` — it is granted in code to anyone with a
 * prior order — so it never appears in the coupon performance table. Its
 * numbers are derived from the orders that carry the code instead.
 *
 * Cancelled orders are excluded from every money figure but reported
 * separately, matching how the coupon table treats them.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const since = rangeStartISO(new URL(req.url).searchParams.get('range'))

    let query = supabaseAdmin
      .from('orders')
      .select('id, order_ref, customer_name, customer_phone, subtotal, total, final_amount, discount_amount, discount, status, created_at')
      .ilike('coupon_code', LOYALTY_CODE)
      .order('created_at', { ascending: false })

    if (since) {
      query = query.gte('created_at', since)
    }

    const { data, error } = await query
    if (error) throw error

    const orders = data || []
    const live = orders.filter(o => o.status !== 'cancelled')

    // `discount_amount` is the current column; `discount` is the older one that
    // some rows still carry. Prefer the former, fall back to the latter.
    const discountOf = (o: any) => o.discount_amount || o.discount || 0
    const revenueOf = (o: any) => o.subtotal || o.total || o.final_amount || 0

    const revenue = live.reduce((sum, o) => sum + revenueOf(o), 0)
    const discountGiven = live.reduce((sum, o) => sum + discountOf(o), 0)

    // Who is actually using it, and who keeps coming back to it.
    const ordersPerCustomer = new Map<string, number>()
    for (const o of live) {
      const phone = String(o.customer_phone || '').replace(/\D/g, '')
      if (!phone) continue
      ordersPerCustomer.set(phone, (ordersPerCustomer.get(phone) || 0) + 1)
    }
    let repeatCustomers = 0
    ordersPerCustomer.forEach(count => {
      if (count > 1) repeatCustomers++
    })

    return NextResponse.json({
      code: LOYALTY_CODE,
      discount_pct: LOYALTY_DISCOUNT_PCT,
      totalOrders: live.length,
      cancelledOrders: orders.length - live.length,
      revenue,
      discountGiven,
      netRevenue: revenue - discountGiven,
      averageOrderValue: live.length ? Math.round(revenue / live.length) : 0,
      uniqueCustomers: ordersPerCustomer.size,
      repeatCustomers,
      orders: orders.map(o => ({
        id: o.id,
        order_ref: o.order_ref,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        subtotal: revenueOf(o),
        discount: discountOf(o),
        status: o.status,
        created_at: o.created_at,
      })),
    })
  } catch (err: any) {
    console.error('Loyalty Analytics Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
