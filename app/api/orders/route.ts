import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  creditCashback,
  debitWallet,
  ensureUserProfile,
  getAppliedCouponDiscount,
  getCouponByCode,
  getWalletSnapshot,
  normalizePhone,
  validateCouponRules,
} from '@/lib/commerce'
import crypto from 'crypto'

function isMissingSchemaError(error: any) {
  const message = String(error?.message || '')
  return message.includes('schema cache') || message.includes('does not exist')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.payment_id && body.razorpay_order_id) {
      crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${body.razorpay_order_id}|${body.payment_id}`)
        .digest('hex')
    }

    const normalizedPhone = normalizePhone(body.customer_phone || '')
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Customer phone is required.' }, { status: 400 })
    }

    const profile = await ensureUserProfile(supabaseAdmin, {
      userId: body.user_id || null,
      phone: normalizedPhone,
      name: body.customer_name,
      email: body.customer_email,
    })

    let coupon = null
    let discountAmount = 0
    if (body.coupon_code) {
      coupon = await getCouponByCode(supabaseAdmin, body.coupon_code)
      if (!coupon) return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 400 })
      const ruleError = validateCouponRules(body.subtotal, coupon)
      if (ruleError) return NextResponse.json({ error: ruleError }, { status: 400 })
      discountAmount = getAppliedCouponDiscount(body.subtotal, coupon)
    }

    const walletSnapshot = await getWalletSnapshot(supabaseAdmin, {
      userId: profile.user_id || null,
      phone: normalizedPhone,
    })
    const walletRequested = Math.max(0, Number(body.wallet_amount || 0))
    const walletUsed = Math.min(walletRequested, walletSnapshot.wallet.balance || 0, Math.max(0, body.subtotal - discountAmount))

    const shipping = body.shipping || 0
    const finalAmount = Math.max(0, body.subtotal + shipping - discountAmount - walletUsed)
    const cashbackEarned = profile.is_cashback_eligible ? Math.round((finalAmount * 5) / 100) : 0

    const insertPayload = {
      user_id: profile.user_id || null,
      customer_name: body.customer_name,
      customer_phone: normalizedPhone,
      customer_email: body.customer_email || null,
      address: body.address,
      city: body.city,
      state: body.state || null,
      pincode: body.pincode,
      items: body.items,
      subtotal: body.subtotal,
      discount: discountAmount,
      discount_amount: discountAmount,
      shipping,
      total: finalAmount,
      final_amount: finalAmount,
      wallet_used: walletUsed,
      cashback_earned: cashbackEarned,
      coupon_code: coupon?.code || null,
      payment_id: body.payment_id || null,
      razorpay_order_id: body.razorpay_order_id || null,
      payment_status: body.payment_status || 'pending',
      status: body.status || 'pending',
      notes: body.notes || null,
    }

    let { data, error } = await supabaseAdmin
      .from('orders')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error && isMissingSchemaError(error)) {
      const legacyPayload = {
        user_id: profile.user_id || null,
        customer_name: body.customer_name,
        customer_phone: normalizedPhone,
        customer_email: body.customer_email || null,
        address: body.address,
        city: body.city,
        state: body.state || null,
        pincode: body.pincode,
        items: body.items,
        subtotal: body.subtotal,
        discount: discountAmount,
        shipping,
        total: finalAmount,
        coupon_code: coupon?.code || null,
        payment_id: body.payment_id || null,
        razorpay_order_id: body.razorpay_order_id || null,
        payment_status: body.payment_status || 'pending',
        status: body.status || 'pending',
        notes: body.notes || null,
      }

      const fallbackInsert = await supabaseAdmin
        .from('orders')
        .insert(legacyPayload)
        .select('*')
        .single()

      data = fallbackInsert.data
      error = fallbackInsert.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (walletUsed > 0) {
      await debitWallet(supabaseAdmin, {
        walletId: walletSnapshot.wallet.id,
        userId: profile.user_id || null,
        phone: normalizedPhone,
        amount: walletUsed,
        orderId: data.id,
        description: `Cashback used on order ${data.id.slice(0, 8).toUpperCase()}`,
      })
    }

    if (coupon) {
      const { error: couponUpdateError } = await supabaseAdmin
        .from('coupons')
        .update({
          usage_count: (coupon.usage_count || 0) + 1,
          total_orders: (coupon.total_orders || 0) + 1,
          total_revenue: (coupon.total_revenue || 0) + finalAmount,
          total_discount_given: (coupon.total_discount_given || 0) + discountAmount,
        })
        .eq('id', coupon.id)
      if (couponUpdateError && !isMissingSchemaError(couponUpdateError)) {
        throw couponUpdateError
      }
    }

    return NextResponse.json({
      id: data.id,
      success: true,
      final_amount: finalAmount,
      discount_amount: discountAmount,
      wallet_used: walletUsed,
      cashback_earned: cashbackEarned,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const { searchParams } = new URL(req.url)
  const phone = normalizePhone(searchParams.get('phone') || '')

  if (phone) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', body.id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: existingError?.message || 'Order not found.' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: body.status })
      .eq('id', body.id)
      .select('*')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    if (
      body.status === 'delivered' &&
      existing.status !== 'delivered' &&
      (updated.cashback_earned || 0) > 0 &&
      updated.customer_phone
    ) {
      const walletSnapshot = await getWalletSnapshot(supabaseAdmin, {
        userId: updated.user_id || null,
        phone: updated.customer_phone,
      })

      const { data: alreadyCredited } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('wallet_id', walletSnapshot.wallet.id)
        .eq('order_id', updated.id)
        .eq('reason', 'cashback')
        .limit(1)

      if (!alreadyCredited?.length) {
        await creditCashback(supabaseAdmin, {
          walletId: walletSnapshot.wallet.id,
          userId: updated.user_id || null,
          phone: updated.customer_phone,
          amount: updated.cashback_earned || 0,
          orderId: updated.id,
          description: `5% cashback for delivered order ${updated.id.slice(0, 8).toUpperCase()}`,
        })
      }
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
