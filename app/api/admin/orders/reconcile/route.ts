import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { razorpay } from '@/lib/razorpay'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { ORDER_NOTE, markOrderPaid, runOrderSideEffects } from '@/lib/checkout'

export const dynamic = 'force-dynamic'

/**
 * "Re-check payment" for an online attempt shown as payment-not-completed.
 * Asks Razorpay directly, so a customer who paid but whose browser (and the
 * webhook) never reported back still gets their order.
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const { id } = await req.json()
    const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', id).maybeSingle()
    if (error || !order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    if (order.notes !== ORDER_NOTE.awaitingPayment || order.payment_status !== 'pending') {
      return NextResponse.json({ paid: order.payment_status === 'paid', order, message: 'This order is not waiting for an online payment.' })
    }

    let razorpayOrderId: string = order.razorpay_order_id || ''
    if (!razorpayOrderId && order.order_ref) {
      // Without the razorpay_order_id column, find it by the receipt we set.
      const found: any = await razorpay.orders.all({ receipt: order.order_ref } as any)
      razorpayOrderId = found?.items?.[0]?.id || ''
    }
    if (!razorpayOrderId) {
      return NextResponse.json({ paid: false, message: 'Razorpay has no payment session for this order, so it was never paid.' })
    }

    const razorpayOrder: any = await razorpay.orders.fetch(razorpayOrderId)
    const payments: any = await razorpay.orders.fetchPayments(razorpayOrderId)
    const items: any[] = payments?.items || []
    const payment = items.find(p => p.status === 'captured') || items.find(p => p.status === 'authorized')
    if (!payment) {
      return NextResponse.json({ paid: false, message: 'No successful payment found in Razorpay for this order.' })
    }

    const { order: updated, newlyPaid } = await markOrderPaid(supabaseAdmin, order.id, {
      razorpayOrderId,
      razorpayPaymentId: payment.id,
      amountPaid: Number(payment.amount) || null,
    })
    if (updated && newlyPaid) {
      await runOrderSideEffects(supabaseAdmin, updated, { refCode: razorpayOrder?.notes?.ref_code || null })
    }

    return NextResponse.json({
      paid: true,
      order: updated,
      message: payment.status === 'authorized'
        ? 'Payment found (authorized, not yet captured). The order is now marked paid; capture it in Razorpay if auto-capture is off.'
        : 'Payment found. The order is now marked paid.',
    })
  } catch (err: any) {
    console.error('Payment re-check failed', err)
    return NextResponse.json({ error: 'Could not reach Razorpay. Please try again.' }, { status: 502 })
  }
}
