import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCashbackCredited, sendOrderConfirmation, sendOrderShipped } from '@/lib/email'
import { hasNimbusPostConfig, trackNimbusAwb } from '@/lib/nimbuspost'
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

function isMissingSchemaError(error: any) {
  const message = String(error?.message || '')
  return message.includes('schema cache') || message.includes('does not exist')
}

async function syncNimbusPostForOrder(order: any) {
  if (!hasNimbusPostConfig()) return null

  try {
    if (!order.tracking_number) return null

    const tracking = await trackNimbusAwb(order.tracking_number)
    const shipmentUpdate = {
      tracking_number: order.tracking_number,
      tracking_link: order.tracking_link || null,
      courier_name: tracking.courierName || order.courier_name || null,
      expected_delivery: tracking.expectedDelivery || order.expected_delivery || null,
      shiprocket_tracking_status: tracking.currentStatus || null,
      tracking_events: tracking.activities || [],
      tracking_synced_at: new Date().toISOString(),
    }

    if (!shipmentUpdate) return null

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(shipmentUpdate)
      .eq('id', order.id)
      .select('*')
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('NimbusPost sync failed', order.id, error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

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
    const codCharge = body.cod_charge || 0
    const smallOrderFee = body.small_order_fee || 0
    const finalAmount = Math.max(0, body.subtotal + shipping + codCharge + smallOrderFee - discountAmount - walletUsed)
    const cashbackEarned = Math.round((finalAmount * 5) / 100)
    const orderRef = body.order_ref || `MANA${Date.now().toString().slice(-6)}`

    const refCookie = cookies().get('mana_ref')?.value
    const potentialCreatorCode = normalizedCouponCode || refCookie
    let creatorMatch = null

    if (potentialCreatorCode) {
      const { data: creator } = await supabaseAdmin
        .from('creators')
        .select('id, code, commission_pct')
        .eq('code', potentialCreatorCode)
        .eq('active', true)
        .maybeSingle()
      creatorMatch = creator
    }

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
      cod_charge: body.cod_charge || 0,
      small_order_fee: body.small_order_fee || 0,
      total: finalAmount,
      final_amount: finalAmount,
      wallet_used: walletUsed,
      cashback_earned: cashbackEarned,
      coupon_code: coupon?.code || null,
      payment_id: body.payment_id || null,
      cashfree_order_id: body.cashfree_order_id || null,
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
        cashfree_order_id: body.cashfree_order_id || null,
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

    if (creatorMatch && data) {
      const commPct = creatorMatch.commission_pct || 10
      const commissionAmt = Math.round((body.subtotal * commPct) / 100)

      await supabaseAdmin.from('commissions').insert({
        creator_id: creatorMatch.id,
        order_id: data.id,
        order_total: body.subtotal,
        commission_pct: commPct,
        commission_amount: commissionAmt,
        status: 'pending',
      })
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
  const orderRef = String(searchParams.get('orderRef') || '').trim().toUpperCase()

  if (phone && orderRef) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
      .eq('order_ref', orderRef)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

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

    const updatePayload: Record<string, any> = {
      status: nextStatus,
      payment_status: nextPaymentStatus,
    }

    if ('tracking_number' in body) updatePayload.tracking_number = body.tracking_number || null
    if ('tracking_link' in body) updatePayload.tracking_link = body.tracking_link || null
    if ('courier_name' in body) updatePayload.courier_name = body.courier_name || null
    if ('expected_delivery' in body) updatePayload.expected_delivery = body.expected_delivery || null

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', body.id)
      .select('*')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    let latestOrder = updated

    if (nextStatus === 'shipped' && updated.tracking_number) {
      const synced = await syncNimbusPostForOrder(updated)
      if (synced) latestOrder = synced
    }

    if (nextStatus === 'shipped' && existing.status !== 'shipped' && latestOrder.customer_email) {
      sendOrderShipped({
        customerEmail: latestOrder.customer_email,
        customerName: latestOrder.customer_name,
        orderId: latestOrder.id,
        trackingNumber: body.tracking_number || latestOrder.tracking_number || undefined,
        courierName: body.courier_name || latestOrder.courier_name || undefined,
        trackingLink: body.tracking_link || latestOrder.tracking_link || undefined,
        expectedDelivery: body.expected_delivery || latestOrder.expected_delivery || undefined,
        items: latestOrder.items || [],
      }).catch(console.error)
    }

    if (
      nextStatus === 'delivered' &&
      existing.status !== 'delivered' &&
      (latestOrder.cashback_earned || 0) > 0 &&
      latestOrder.customer_phone
    ) {
      const walletSnapshot = await getWalletSnapshot(supabaseAdmin, {
        userId: latestOrder.user_id || null,
        phone: latestOrder.customer_phone,
      })

      const { data: alreadyCredited } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('wallet_id', walletSnapshot.wallet.id)
        .eq('order_id', latestOrder.id)
        .eq('reason', 'cashback')
        .limit(1)

      if (!alreadyCredited?.length) {
        await creditCashback(supabaseAdmin, {
          walletId: walletSnapshot.wallet.id,
          userId: latestOrder.user_id || null,
          phone: latestOrder.customer_phone,
          amount: latestOrder.cashback_earned || 0,
          orderId: latestOrder.id,
          description: `5% cashback for delivered order ${latestOrder.id.slice(0, 8).toUpperCase()}`,
        })

        if (latestOrder.customer_email) {
          const refreshedWallet = await getWalletSnapshot(supabaseAdmin, {
            userId: latestOrder.user_id || null,
            phone: latestOrder.customer_phone,
          })

          sendCashbackCredited({
            customerEmail: latestOrder.customer_email,
            customerName: latestOrder.customer_name,
            cashbackAmount: latestOrder.cashback_earned || 0,
            walletBalance: refreshedWallet.wallet.balance || 0,
          }).catch(console.error)
        }
      }
    }

    if (latestOrder.customer_phone && existing.status !== nextStatus) {
      const orderCode = latestOrder.order_ref || latestOrder.id.slice(0, 8).toUpperCase()

      if (nextStatus === 'confirmed') {
        sendWhatsAppMessage(
          latestOrder.customer_phone,
          `Order ${orderCode} confirmed.\n\nWe're preparing it now and will update you again when it ships.`
        ).catch(console.error)
      }

      if (nextStatus === 'shipped') {
        sendWhatsAppMessage(
          latestOrder.customer_phone,
          `Your order ${orderCode} is on the way.\n\nExpected delivery is ${latestOrder.expected_delivery || 'being updated soon'}.`
        ).catch(console.error)
      }

      if (nextStatus === 'delivered') {
        let message = `Order ${orderCode} delivered.\n\nThank you for shopping with MANA.`
        if ((latestOrder.cashback_earned || 0) > 0) {
          message += `\n\nRs. ${latestOrder.cashback_earned} cashback has been credited to your MANA account.\n\nTo avail this on your next purchase, simply checkout using your number +91 ${latestOrder.customer_phone}. This cashback is valid for 2 months.`
        }
        sendWhatsAppMessage(latestOrder.customer_phone, message).catch(console.error)
      }
    }

    if (nextStatus === 'delivered' && existing.status !== 'delivered') {
      const { data: comm } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('order_id', latestOrder.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (comm) {
        await supabaseAdmin
          .from('commissions')
          .update({ status: 'confirmed' })
          .eq('id', comm.id)

        const { data: creator } = await supabaseAdmin
          .from('creators')
          .select('total_earned, phone')
          .eq('id', comm.creator_id)
          .single()

        if (creator) {
          await supabaseAdmin
            .from('creators')
            .update({ total_earned: (creator.total_earned || 0) + comm.commission_amount })
            .eq('id', comm.creator_id)

          sendWhatsAppMessage(
            creator.phone,
            `Congratulations! You've earned Rs. ${comm.commission_amount / 100} commission for order ${latestOrder.order_ref || latestOrder.id.slice(0, 8).toUpperCase()}.\n\nCheck your balance: mana.in/creator`
          ).catch(console.error)
        }
      }
    }

    if (nextStatus === 'cancelled' && existing.status !== 'cancelled') {
      await supabaseAdmin
        .from('commissions')
        .update({ status: 'cancelled' })
        .eq('order_id', latestOrder.id)
        .eq('status', 'pending')
    }

    return NextResponse.json(latestOrder)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
