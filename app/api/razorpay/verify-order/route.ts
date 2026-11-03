import { NextResponse } from 'next/server'
import { isValidPaymentSignature, razorpay } from '@/lib/razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { markOrderPaid, runOrderSideEffects } from '@/lib/checkout'

export const dynamic = 'force-dynamic'

/**
 * Called by the checkout page after Razorpay reports success. The signature
 * proves the payment belongs to that Razorpay order, whose amount our server
 * set; the order id stored in its notes tells us which order to mark paid.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const razorpayOrderId = String(body.razorpay_order_id || '')
    const razorpayPaymentId = String(body.razorpay_payment_id || '')
    const signature = String(body.razorpay_signature || '')

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET is not configured')
      return NextResponse.json({ error: 'Payments are not configured.' }, { status: 500 })
    }

    if (!isValidPaymentSignature(razorpayOrderId, razorpayPaymentId, signature)) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    const razorpayOrder: any = await razorpay.orders.fetch(razorpayOrderId)
    const orderId = String(razorpayOrder?.notes?.order_id || '')
    if (!orderId) {
      console.error('Verified payment has no linked order', razorpayOrderId, razorpayPaymentId)
      return NextResponse.json({ error: 'We received your payment but could not find the order. Please contact us with your payment ID.' }, { status: 404 })
    }

    const { order, newlyPaid } = await markOrderPaid(supabaseAdmin, orderId, {
      razorpayOrderId,
      razorpayPaymentId,
      amountPaid: Number(razorpayOrder.amount) || null,
    })
    if (!order) {
      console.error('Verified payment for a missing order', orderId, razorpayPaymentId)
      return NextResponse.json({ error: 'We received your payment but could not find the order. Please contact us with your payment ID.' }, { status: 404 })
    }

    if (newlyPaid) {
      await runOrderSideEffects(supabaseAdmin, order, { refCode: razorpayOrder?.notes?.ref_code || null })
    }

    return NextResponse.json({
      success: true,
      id: order.id,
      order_ref: order.order_ref,
      payment_status: order.payment_status,
      final_amount: order.final_amount ?? order.total,
      cashback_earned: order.cashback_earned || 0,
    })
  } catch (error) {
    console.error('Razorpay verify failed', error)
    return NextResponse.json({ error: 'Could not confirm the payment. If you were charged, please contact us with your payment ID.' }, { status: 500 })
  }
}
