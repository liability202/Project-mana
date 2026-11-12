import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendCashbackCredited, sendOrderShipped } from '@/lib/email'
import { hasNimbusPostConfig, trackNimbusAwb } from '@/lib/nimbuspost'
import { getWalletSnapshot } from '@/lib/commerce'
import {
  CheckoutConflictError,
  ORDER_NOTE,
  adjustWallet,
  buildQuote,
  createOrder,
  isVisibleToCustomer,
  publicQuote,
  readReferralCode,
  releaseAbandonedAttempts,
  releaseWalletForOrder,
  runOrderSideEffects,
  toCustomerOrder,
  validateCustomer,
} from '@/lib/checkout'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { getSessionPhone, phoneVariants } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

export const dynamic = 'force-dynamic'

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

/**
 * Places a Cash-on-Delivery order for the signed-in customer. Online orders go
 * through /api/razorpay/create-order + verify-order instead, so nothing sent
 * here can mark an order as paid.
 */
export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Checkout pages from before this change sent `payment_status: 'paid'` after
  // a client-side payment. Never trust it; ask them to refresh instead.
  if (body?.payment_id || body?.razorpay_order_id || body?.payment_status === 'paid') {
    console.error('Rejected legacy paid-order request', { payment_id: body?.payment_id, phone: body?.customer_phone })
    return NextResponse.json(
      { error: 'This page is out of date. Please refresh and try again. If you were charged, contact us with your payment ID.' },
      { status: 409 }
    )
  }

  const phone = getSessionPhone()
  if (!phone) {
    return NextResponse.json({ error: 'Please verify your phone number to continue.' }, { status: 401 })
  }

  const limit = rateLimit(`checkout:${phone}`, 10, 10 * 60 * 1000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })

  try {
    const parsed = validateCustomer(body.customer)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { customer } = parsed

    await releaseAbandonedAttempts(supabaseAdmin, phone)

    const quote = await buildQuote(supabaseAdmin, {
      items: body.items,
      couponCode: typeof body.coupon_code === 'string' ? body.coupon_code : null,
      paymentMethod: 'cod',
      useWallet: Boolean(body.use_wallet),
      city: customer.city,
      state: customer.state || '',
      pincode: customer.pincode,
    }, phone)

    if (quote.errors.length || !quote.lines.length) {
      return NextResponse.json({ error: quote.errors[0] || 'Your cart is empty.', quote: publicQuote(quote) }, { status: 400 })
    }
    if (quote.coupon?.error) {
      return NextResponse.json({ error: quote.coupon.error, quote: publicQuote(quote) }, { status: 400 })
    }
    const expectedTotal = Number(body.expected_total)
    if (Number.isFinite(expectedTotal) && expectedTotal !== quote.totals.total) {
      return NextResponse.json(
        { error: 'Your order total has changed. Please review it and try again.', quote: publicQuote(quote) },
        { status: 409 }
      )
    }

    const order = await createOrder(supabaseAdmin, {
      quote, customer, phone, status: 'pending', paymentStatus: 'pending', notes: ORDER_NOTE.cod,
    })
    await runOrderSideEffects(supabaseAdmin, order, { refCode: readReferralCode(), settings: quote.settings })

    return NextResponse.json({
      id: order.id,
      order_ref: order.order_ref,
      success: true,
      final_amount: order.final_amount ?? order.total,
      discount_amount: order.discount_amount ?? order.discount ?? 0,
      wallet_used: order.wallet_used || 0,
      cashback_earned: order.cashback_earned || 0,
    })
  } catch (err) {
    if (err instanceof CheckoutConflictError) {
      return NextResponse.json({ error: err.message, quote: true }, { status: 409 })
    }
    console.error('COD order failed', err)
    return NextResponse.json({ error: 'Could not place your order. Please try again.' }, { status: 500 })
  }
}

/**
 * Admin (Bearer ADMIN_SECRET): latest orders across all customers.
 * Customer (session cookie): their own orders only.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  if (req.headers.get('authorization')) {
    // Someone presenting a token is asking for admin data; a customer session
    // in the same browser must not make a wrong password "work".
    if (!isAdminRequest(req)) return unauthorized()

    const requested = Number(searchParams.get('limit'))
    const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 500) : 100
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Admin orders load failed', error)
      return NextResponse.json({ error: 'Could not load orders.' }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const phone = getSessionPhone()
  if (!phone) return NextResponse.json({ error: 'Please sign in to see your orders.' }, { status: 401 })

  const orderRef = String(searchParams.get('orderRef') || '').trim().toUpperCase()
  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .in('customer_phone', phoneVariants(phone))
    .order('created_at', { ascending: false })
    .limit(50)
  if (orderRef) query = query.eq('order_ref', orderRef)

  const { data, error } = await query
  if (error) {
    console.error('Customer orders load failed', error)
    return NextResponse.json({ error: 'Could not load your orders.' }, { status: 500 })
  }
  return NextResponse.json((data || []).filter(isVisibleToCustomer).map(toCustomerOrder))
}

const PROGRESS_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']

/**
 * Delivered and cancelled are final: delivery pays cashback and confirms the
 * creator's commission, cancellation refunds the wallet. Allowing either to be
 * undone (or reached by a stray click from the other) is how money went wrong.
 */
function statusChangeError(from: string, to: string) {
  if (from === to) return null
  if (from === 'delivered' || from === 'cancelled') return `This order is already ${from}; its status can no longer be changed.`
  if (to !== 'cancelled' && !PROGRESS_STATUSES.includes(to)) return `Unknown status "${to}".`
  return null
}

function rupees(paise: number) {
  return '₹' + (Math.round(paise) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export async function PUT(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

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

    if (existing.notes === ORDER_NOTE.awaitingPayment && existing.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'This online order was never paid. It cannot be confirmed or shipped.' },
        { status: 409 }
      )
    }

    const nextStatus = String(body.status || existing.status)
    const transitionError = statusChangeError(existing.status, nextStatus)
    if (transitionError) return NextResponse.json({ error: transitionError }, { status: 409 })

    const nextPaymentStatus = nextStatus === 'delivered' ? 'paid' : existing.payment_status

    const updatePayload: Record<string, any> = {
      status: nextStatus,
      payment_status: nextPaymentStatus,
    }

    if ('tracking_number' in body) updatePayload.tracking_number = body.tracking_number || null
    if ('tracking_link' in body) updatePayload.tracking_link = body.tracking_link || null
    if ('courier_name' in body) updatePayload.courier_name = body.courier_name || null
    if ('expected_delivery' in body) updatePayload.expected_delivery = body.expected_delivery || null

    // Only apply if nobody changed the status since we read it, so the
    // one-time effects below can't run twice for a double click.
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', body.id)
      .eq('status', existing.status)
      .select('*')

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    const updated = updatedRows?.[0]
    if (!updated) {
      return NextResponse.json({ error: 'This order was just updated by someone else. Please refresh.' }, { status: 409 })
    }

    const statusChanged = existing.status !== nextStatus
    let latestOrder = updated

    if (nextStatus === 'shipped' && updated.tracking_number) {
      const synced = await syncNimbusPostForOrder(updated)
      if (synced) latestOrder = synced
    }

    if (nextStatus === 'shipped' && statusChanged && latestOrder.customer_email) {
      sendOrderShipped({
        customerEmail: latestOrder.customer_email,
        customerName: latestOrder.customer_name,
        orderId: latestOrder.id,
        orderRef: latestOrder.order_ref,
        trackingNumber: body.tracking_number || latestOrder.tracking_number || undefined,
        courierName: body.courier_name || latestOrder.courier_name || undefined,
        trackingLink: body.tracking_link || latestOrder.tracking_link || undefined,
        expectedDelivery: body.expected_delivery || latestOrder.expected_delivery || undefined,
        items: latestOrder.items || [],
      }).catch(console.error)
    }

    const orderCode = latestOrder.order_ref || latestOrder.id.slice(0, 8).toUpperCase()
    const paidOnline = existing.payment_status === 'paid' && existing.notes !== ORDER_NOTE.cod
    let cashbackCredited = 0

    if (nextStatus === 'delivered' && statusChanged && (latestOrder.cashback_earned || 0) > 0 && latestOrder.customer_phone) {
      const { data: alreadyCredited } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('order_id', latestOrder.id)
        .eq('reason', 'cashback')
        .limit(1)

      if (!alreadyCredited?.length) {
        const credited = await adjustWallet(supabaseAdmin, {
          phone: latestOrder.customer_phone,
          amount: latestOrder.cashback_earned,
          type: 'credit',
          reason: 'cashback',
          orderId: latestOrder.id,
          description: `5% cashback for delivered order ${orderCode}`,
        })
        if (credited) cashbackCredited = latestOrder.cashback_earned

        if (credited && latestOrder.customer_email) {
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

    // Return exactly what the wallet ledger says this order took — never
    // credit that was never debited.
    let walletRefunded = 0
    if (nextStatus === 'cancelled' && statusChanged && latestOrder.customer_phone) {
      walletRefunded = await releaseWalletForOrder(supabaseAdmin, latestOrder, `Wallet credit returned for cancelled order ${orderCode}`)
    }

    if (latestOrder.customer_phone && statusChanged) {
      if (nextStatus === 'confirmed') {
        sendWhatsAppMessage(
          latestOrder.customer_phone,
          `Order ${orderCode} confirmed.\n\nWe're preparing it now and will update you again when it ships.`
        ).catch(console.error)
      }

      if (nextStatus === 'shipped') {
        let msg = `Your order ${orderCode} is on the way.\n\nExpected delivery is ${latestOrder.expected_delivery || 'being updated soon'}.`
        if (latestOrder.tracking_link || latestOrder.tracking_number) {
          msg += `\n\nCourier: ${latestOrder.courier_name || 'Partner'}\nTracking No: ${latestOrder.tracking_number || ''}\nTrack here: ${latestOrder.tracking_link || ''}`
        }
        sendWhatsAppMessage(latestOrder.customer_phone, msg).catch(console.error)
      }

      if (nextStatus === 'delivered') {
        let message = `Order ${orderCode} delivered.\n\nThank you for shopping with MANA.`
        if (cashbackCredited > 0) {
          // cashback_earned is stored in paise.
          message += `\n\n${rupees(cashbackCredited)} cashback has been credited to your MANA account.\n\nTo use it on your next purchase, simply check out with your number +91 ${String(latestOrder.customer_phone).slice(-10)}.`
        }
        sendWhatsAppMessage(latestOrder.customer_phone, message).catch(console.error)
      }

      if (nextStatus === 'cancelled') {
        let message = `Order ${orderCode} has been cancelled.`
        if (walletRefunded > 0) message += `\n\n${rupees(walletRefunded)} has been returned to your MANA wallet.`
        if (paidOnline) message += `\n\nYour online payment will be refunded to the original payment method.`
        sendWhatsAppMessage(latestOrder.customer_phone, message).catch(console.error)
      }
    }

    if (nextStatus === 'delivered' && statusChanged) {
      const { data: comm } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('order_id', latestOrder.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (comm) {
        const { data: confirmedRows } = await supabaseAdmin
          .from('commissions')
          .update({ status: 'confirmed' })
          .eq('id', comm.id)
          .eq('status', 'pending')
          .select('id')

        if (confirmedRows?.length) {
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
              `Congratulations! You've earned ${rupees(comm.commission_amount)} commission for order ${orderCode}.\n\nCheck your balance: manadryfruits.com/creator`
            ).catch(console.error)
          }
        }
      }
    }

    if (nextStatus === 'cancelled' && statusChanged) {
      // Void both pending and confirmed rows. Only voiding `pending` left a
      // delivered-then-cancelled order with a live commission attached to a
      // dead sale, which then counted towards the creator's earnings and the
      // coupon report. `paid` rows are deliberately left alone — that money has
      // already gone out, so clawing it back is a manual decision.
      const { data: voided } = await supabaseAdmin
        .from('commissions')
        .select('id, creator_id, commission_amount, status')
        .eq('order_id', latestOrder.id)
        .in('status', ['pending', 'confirmed'])

      if (voided && voided.length > 0) {
        await supabaseAdmin
          .from('commissions')
          .update({ status: 'cancelled' })
          .in('id', voided.map(row => row.id))

        // `total_earned` was incremented when the commission was confirmed on
        // delivery, so confirmed rows have to be subtracted back out.
        for (const row of voided.filter(r => r.status === 'confirmed')) {
          const { data: creator } = await supabaseAdmin
            .from('creators')
            .select('total_earned')
            .eq('id', row.creator_id)
            .single()

          if (creator) {
            await supabaseAdmin
              .from('creators')
              .update({
                total_earned: Math.max(0, (creator.total_earned || 0) - (row.commission_amount || 0)),
              })
              .eq('id', row.creator_id)
          }
        }
      }
    }

    return NextResponse.json({
      ...latestOrder,
      wallet_refunded: walletRefunded,
      // The card/UPI payment still has to be refunded by hand in Razorpay.
      online_refund_needed: nextStatus === 'cancelled' && statusChanged && paidOnline
        ? (latestOrder.final_amount ?? latestOrder.total)
        : 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
