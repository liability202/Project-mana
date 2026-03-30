import { NextResponse } from 'next/server'
import { getAppliedCouponDiscount, getCouponByCode, validateCouponRules } from '@/lib/commerce'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const subtotal = Number(body.subtotal || 0)
    const code = String(body.code || '')

    if (!code.trim()) return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 })
    if (subtotal <= 0) return NextResponse.json({ error: 'Subtotal must be greater than 0.' }, { status: 400 })

    const coupon = await getCouponByCode(supabaseAdmin, code)
    if (!coupon) return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 404 })

    const ruleError = validateCouponRules(subtotal, coupon)
    if (ruleError) return NextResponse.json({ error: ruleError }, { status: 400 })

    const discountAmount = getAppliedCouponDiscount(subtotal, coupon)
    return NextResponse.json({
      valid: true,
      coupon,
      discount_amount: discountAmount,
      final_subtotal: subtotal - discountAmount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
