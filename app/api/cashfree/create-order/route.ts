import { NextResponse } from 'next/server'
import { createCashfreeOrder } from '@/lib/cashfree'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const amountPaise = Math.round(Number(body.amount || 0))

    if (!amountPaise || amountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const orderId = body.orderId || `mana_${Date.now()}`
    const orderAmount = Number((amountPaise / 100).toFixed(2))

    const order = await createCashfreeOrder({
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: body.customerId || body.phone || orderId,
        customer_name: body.name || 'Mana Customer',
        customer_email: body.email || 'support@manafood.in',
        customer_phone: body.phone,
      },
      order_meta: {
        return_url: body.returnUrl || undefined,
      },
      order_note: body.orderNote || 'Mana checkout',
    })

    return NextResponse.json({
      orderId: order.order_id,
      cfOrderId: order.cf_order_id,
      paymentSessionId: order.payment_session_id,
      orderStatus: order.order_status,
    })
  } catch (err: any) {
    console.error('Cashfree create-order error:', err)
    return NextResponse.json({ error: err.message || 'Payment gateway error' }, { status: 500 })
  }
}
