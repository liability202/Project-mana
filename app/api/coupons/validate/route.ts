import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { countCompletedOrders, priceCart, resolveCoupon } from '@/lib/checkout'
import { couponDiscount, couponIneligibility } from '@/lib/pricing'
import { getSessionPhone } from '@/lib/session'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Checks a coupon against the current cart. Checkout uses /api/checkout/quote;
 * this stays for callers that only need a yes/no and the coupon's rules.
 * Returns the rules (not a frozen amount) so the discount can follow the cart.
 */
export async function POST(req: Request) {
  // Slow down anyone trying to guess codes.
  const limit = rateLimit(`coupon:${clientIp(req)}`, 20, 60 * 1000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 })

  try {
    const body = await req.json()
    const code = String(body.code || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 })

    const phone = getSessionPhone()
    const subtotal = Array.isArray(body.items)
      ? (await priceCart(supabaseAdmin, body.items)).subtotal
      : Math.max(0, Math.round(Number(body.subtotal) || 0))
    if (subtotal <= 0) return NextResponse.json({ error: 'Add something to your cart first.' }, { status: 400 })

    const result = await resolveCoupon(supabaseAdmin, code, phone)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })

    const { rules } = result.coupon
    const ineligible = couponIneligibility(subtotal, rules)
    if (ineligible) return NextResponse.json({ error: ineligible, rules }, { status: 400 })

    const discountAmount = couponDiscount(subtotal, rules)
    const customerType = phone ? ((await countCompletedOrders(supabaseAdmin, phone)) > 0 ? 'returning' : 'new') : null

    return NextResponse.json({
      valid: true,
      rules,
      coupon: { code: rules.code, discount_type: rules.discount_type, discount_value: rules.discount_value },
      discount_amount: discountAmount,
      final_subtotal: subtotal - discountAmount,
      free_shipping: Boolean(rules.free_shipping),
      free_cod: Boolean(rules.free_cod),
      free_handling: Boolean(rules.free_handling),
      customer_type: customerType,
    })
  } catch (err) {
    console.error('Coupon validation failed', err)
    return NextResponse.json({ error: 'Could not check this coupon right now.' }, { status: 500 })
  }
}
