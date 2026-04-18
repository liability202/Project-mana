import { NextResponse } from 'next/server'
import { getAppliedCouponDiscount, getCouponByCode, validateCouponRules } from '@/lib/commerce'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const subtotal = Number(body.subtotal || 0)
    const code = String(body.code || '')
    const phone = String(body.phone || '').replace(/\D/g, '')

    if (!code.trim()) return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 })
    if (subtotal <= 0) return NextResponse.json({ error: 'Subtotal must be greater than 0.' }, { status: 400 })

    let orderCount = 0
    if (phone) {
      const { count, error: countError } = await supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_phone', phone)

      if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
      orderCount = count || 0
    }

    const normalizedCode = code.trim().toUpperCase()

    if (normalizedCode === 'LOYAL12') {
      if (!phone) {
        return NextResponse.json({ error: 'Phone verification is required for loyalty discount.' }, { status: 400 })
      }
      if (orderCount < 1) {
        return NextResponse.json({ error: 'LOYAL12 is available only for returning customers.' }, { status: 400 })
      }

      const loyaltyCoupon = {
        id: 'loyal12',
        code: 'LOYAL12',
        discount_type: 'percentage' as const,
        discount_value: 12,
        influencer_name: null,
        min_order_amount: 0,
        max_discount: null,
        usage_limit: null,
        usage_count: 0,
        total_orders: 0,
        total_revenue: 0,
        total_discount_given: 0,
        is_active: true,
      }

      const discountAmount = getAppliedCouponDiscount(subtotal, loyaltyCoupon)
      return NextResponse.json({
        valid: true,
        coupon: loyaltyCoupon,
        discount_amount: discountAmount,
        final_subtotal: subtotal - discountAmount,
        customer_type: 'returning',
      })
    }

    const coupon = await getCouponByCode(supabaseAdmin, normalizedCode)
    if (!coupon) return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 404 })

    if (phone && orderCount > 0 && coupon.influencer_name) {
      return NextResponse.json({ error: 'Influencer codes are only valid on your first order.' }, { status: 400 })
    }

    const ruleError = validateCouponRules(subtotal, coupon)
    if (ruleError) return NextResponse.json({ error: ruleError }, { status: 400 })

    const discountAmount = getAppliedCouponDiscount(subtotal, coupon)
    return NextResponse.json({
      valid: true,
      coupon,
      discount_amount: discountAmount,
      final_subtotal: subtotal - discountAmount,
      customer_type: orderCount > 0 ? 'returning' : 'new',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
