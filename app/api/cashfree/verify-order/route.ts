import { NextResponse } from 'next/server'
import { fetchCashfreeOrder, fetchCashfreePayments } from '@/lib/cashfree'

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await fetchCashfreeOrder(orderId)
    const payments = order.order_status === 'PAID' ? await fetchCashfreePayments(orderId) : []
    const successfulPayment = payments.find((payment: any) => payment.payment_status === 'SUCCESS' || payment.payment_status === 'CAPTURED')

    return NextResponse.json({
      orderId: order.order_id,
      cfOrderId: order.cf_order_id,
      orderStatus: order.order_status,
      isPaid: order.order_status === 'PAID',
      paymentId: successfulPayment?.cf_payment_id || null,
      payments,
    })
  } catch (err: any) {
    console.error('Cashfree verify-order error:', err)
    return NextResponse.json({ error: err.message || 'Could not verify payment' }, { status: 500 })
  }
}
