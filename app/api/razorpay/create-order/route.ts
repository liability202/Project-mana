import { NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import {
  CheckoutConflictError,
  ORDER_NOTE,
  buildQuote,
  createOrder,
  publicQuote,
  readReferralCode,
  releaseAbandonedAttempts,
  runOrderSideEffects,
  validateCustomer,
} from '@/lib/checkout'
import { updateRows } from '@/lib/db-fallback'
import { getSessionPhone } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Starts an online payment. The order is priced and saved here first (as an
 * unpaid attempt), then a Razorpay order is opened for exactly that amount —
 * the browser never chooses what it pays.
 */
export async function POST(req: Request) {
  const phone = getSessionPhone()
  if (!phone) {
    return NextResponse.json({ error: 'Please verify your phone number to continue.' }, { status: 401 })
  }

  const limit = rateLimit(`checkout:${phone}`, 10, 10 * 60 * 1000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })

  try {
    const body = await req.json()
    const parsed = validateCustomer(body.customer)
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { customer } = parsed

    // This checkout supersedes earlier unpaid attempts: give back their wallet holds.
    await releaseAbandonedAttempts(supabaseAdmin, phone)

    const quote = await buildQuote(supabaseAdmin, {
      items: body.items,
      couponCode: typeof body.coupon_code === 'string' ? body.coupon_code : null,
      paymentMethod: 'online',
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

    const refCode = readReferralCode()

    // Wallet + discount covered everything: nothing to collect online.
    if (quote.totals.total === 0) {
      const order = await createOrder(supabaseAdmin, {
        quote, customer, phone, status: 'pending', paymentStatus: 'paid', notes: ORDER_NOTE.paidWithCredit,
      })
      await runOrderSideEffects(supabaseAdmin, order, { refCode, settings: quote.settings })
      return NextResponse.json({ paid: true, order_id: order.id, order_ref: order.order_ref })
    }

    const order = await createOrder(supabaseAdmin, {
      quote, customer, phone, status: 'cancelled', paymentStatus: 'pending', notes: ORDER_NOTE.awaitingPayment,
    })

    let razorpayOrder: any
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: quote.totals.total,
        currency: 'INR',
        receipt: order.order_ref,
        notes: { order_id: order.id, order_ref: order.order_ref, ref_code: refCode || '' },
      })
    } catch (error) {
      console.error('Razorpay order creation failed', order.id, error)
      return NextResponse.json({ error: 'Could not start the payment. Please try again in a moment.' }, { status: 502 })
    }

    await updateRows(supabaseAdmin, 'orders', { razorpay_order_id: razorpayOrder.id }, query => query.eq('id', order.id))

    return NextResponse.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      key_id: (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').replace(/"/g, ''),
      order_id: order.id,
      order_ref: order.order_ref,
    })
  } catch (error) {
    if (error instanceof CheckoutConflictError) {
      return NextResponse.json({ error: error.message, quote: true }, { status: 409 })
    }
    console.error('Create order failed', error)
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 })
  }
}
