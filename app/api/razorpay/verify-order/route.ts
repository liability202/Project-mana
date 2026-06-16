import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET

    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed', isPaid: false }, { status: 400 })
    }

    return NextResponse.json({ success: true, isPaid: true, orderId: razorpay_order_id, paymentId: razorpay_payment_id })
  } catch (error: any) {
    console.error('Razorpay Verify Order Error:', error)
    return NextResponse.json({ error: error.message || 'Error verifying order' }, { status: 500 })
  }
}
