import { NextResponse } from 'next/server'
import { isValidWebhookSignature, razorpay } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { markOrderPaid, runOrderSideEffects } from '@/lib/checkout'
import { updateRows } from '@/lib/db-fallback'

export const dynamic = 'force-dynamic'

/**
 * Razorpay → us. Covers the cases the checkout page can't:
 *  - the customer paid but closed the tab before our callback ran
 *  - WhatsApp-bot orders paid through a payment link
 *
 * Setup: Razorpay Dashboard → Settings → Webhooks → URL
 * https://<site>/api/razorpay/webhook, events order.paid, payment.captured and
 * payment_link.paid, then put the secret in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    const event = JSON.parse(rawBody)
    const payment = event?.payload?.payment?.entity

    if (event?.event === 'order.paid' || event?.event === 'payment.captured') {
      const razorpayOrder = event?.payload?.order?.entity
        || (payment?.order_id ? await razorpay.orders.fetch(payment.order_id) : null)
      const orderId = String(razorpayOrder?.notes?.order_id || '')
      if (orderId && payment?.id) {
        const { order, newlyPaid } = await markOrderPaid(supabaseAdmin, orderId, {
          razorpayOrderId: razorpayOrder.id,
          razorpayPaymentId: payment.id,
          amountPaid: Number(payment.amount) || null,
        })
        if (order && newlyPaid) {
          await runOrderSideEffects(supabaseAdmin, order, { refCode: razorpayOrder?.notes?.ref_code || null })
        }
      }
    }

    if (event?.event === 'payment_link.paid') {
      const link = event?.payload?.payment_link?.entity
      const orderId = String(link?.notes?.order_id || '')
      if (orderId && payment?.id) {
        // WhatsApp-bot orders are saved as unpaid attempts, like web orders.
        const { order, newlyPaid } = await markOrderPaid(supabaseAdmin, orderId, {
          razorpayOrderId: String(link?.order_id || payment.order_id || ''),
          razorpayPaymentId: payment.id,
          amountPaid: Number(payment.amount) || null,
        })
        if (order && newlyPaid) {
          await runOrderSideEffects(supabaseAdmin, order, {})
        } else if (order && order.payment_status === 'pending') {
          // Bot orders created before this change were saved as 'pending'.
          await updateRows(
            supabaseAdmin,
            'orders',
            { payment_status: 'paid', payment_id: payment.id, razorpay_payment_id: payment.id },
            query => query.eq('id', orderId).eq('payment_status', 'pending').neq('status', 'cancelled')
          )
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // A 500 makes Razorpay retry, which is what we want for transient failures.
    console.error('Razorpay webhook failed', error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
