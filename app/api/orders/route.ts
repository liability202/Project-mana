import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCashbackCredited, sendOrderConfirmation, sendOrderShipped } from '@/lib/email'
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
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'
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

    const normalizedCouponCode = String(body.coupon_code || '').trim().toUpperCase()

    const profile = await ensureUserProfile(supabaseAdmin, {
      userId: body.user_id || null,
      phone: normalizedPhone,
      name: body.customer_name,
      email: body.customer_email,
    })

    let coupon = null
    let discountAmount = 0
    
    const { count: priorOrderCount, error: countError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_phone', normalizedPhone)

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

    if (normalizedCouponCode) {

      if (normalizedCouponCode === 'LOYAL12') {
        if ((priorOrderCount || 0) < 1) {
          return NextResponse.json({ error: 'LOYAL12 is available only for returning customers.' }, { status: 400 })
        }

        coupon = {
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
      } else {
        coupon = await getCouponByCode(supabaseAdmin, normalizedCouponCode)
        if (!coupon) return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 400 })
        if ((priorOrderCount || 0) > 0 && coupon.influencer_name) {
          return NextResponse.json({ error: 'Influencer codes are only valid on your first order.' }, { status: 400 })
        }
      }

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
    // Universal 5% cashback on every order
    const cashbackEarned = Math.round((finalAmount * 5) / 100)
    const orderRef = body.order_ref || `MANA${Date.now().toString().slice(-6)}`

    const insertPayload = {
      order_ref: orderRef,
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
        order_ref: orderRef,
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

    if ((priorOrderCount || 0) === 0 && !profile.is_cashback_eligible) {
      await supabaseAdmin.from('user_profiles').update({ is_cashback_eligible: true }).eq('phone', normalizedPhone)
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

    if (coupon && coupon.id !== 'loyal12') {
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

    if (data.customer_email && (data.payment_status === 'paid' || data.payment_status === 'pending')) {
      sendOrderConfirmation({
        customerEmail: data.customer_email,
        customerName: data.customer_name,
        orderId: data.id,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        shipping: data.shipping || 0,
        discount: data.discount_amount || data.discount || 0,
        total: data.final_amount || data.total || 0,
        address: data.address,
        city: data.city,
        state: data.state || undefined,
        pincode: data.pincode,
      }).catch(console.error)
    }

    return NextResponse.json({
      id: data.id,
      order_ref: data.order_ref || orderRef,
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

    const nextStatus = body.status || existing.status
    const nextPaymentStatus = nextStatus === 'delivered' ? 'paid' : existing.payment_status

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: nextStatus,
        payment_status: nextPaymentStatus 
      })
      .eq('id', body.id)
      .select('*')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    if (body.status === 'shipped' && existing.status !== 'shipped' && updated.customer_email) {
      sendOrderShipped({
        customerEmail: updated.customer_email,
        customerName: updated.customer_name,
        orderId: updated.id,
        trackingNumber: body.tracking_number || updated.tracking_number || undefined,
        courierName: body.courier_name || updated.courier_name || undefined,
        trackingLink: body.tracking_link || updated.tracking_link || undefined,
        expectedDelivery: body.expected_delivery || updated.expected_delivery || undefined,
        items: updated.items || [],
      }).catch(console.error)
    }

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

        if (updated.customer_email) {
          const refreshedWallet = await getWalletSnapshot(supabaseAdmin, {
            userId: updated.user_id || null,
            phone: updated.customer_phone,
          })

          sendCashbackCredited({
            customerEmail: updated.customer_email,
            customerName: updated.customer_name,
            cashbackAmount: updated.cashback_earned || 0,
            walletBalance: refreshedWallet.wallet.balance || 0,
          }).catch(console.error)
        }
      }
    }

    if (updated.customer_phone && existing.status !== body.status) {
      const orderCode = updated.order_ref || updated.id.slice(0, 8).toUpperCase()

      if (body.status === 'confirmed') {
        sendWhatsAppMessage(
          updated.customer_phone,
          `Order ${orderCode} confirmed ✅\n\nWe're preparing it now and will update you again when it ships.`
        ).catch(console.error)
      }

      if (body.status === 'shipped') {
        sendWhatsAppMessage(
          updated.customer_phone,
          `Your order ${orderCode} is on the way 🚚\n\nExpected delivery is today or tomorrow.`
        ).catch(console.error)
      }

      if (body.status === 'delivered') {
        let msg = `Order ${orderCode} delivered ✅\n\nThank you for shopping with MANA.`
        
        if ((updated.cashback_earned || 0) > 0) {
          msg += `\n\n🎁 ₹${updated.cashback_earned} cashback has been credited to your MANA account!\n\nTo avail this on your next purchase, simply checkout using your number +91 ${updated.customer_phone}. This cashback is valid for 2 months.`
        }
        
        sendWhatsAppMessage(
          updated.customer_phone,
          msg
        ).catch(console.error)
      }
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
