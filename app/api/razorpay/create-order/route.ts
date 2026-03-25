import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: Request) {
  try {
    const { amount, currency = 'INR' } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount), // in paise
      currency,
      receipt: `mana_${Date.now()}`,
    })

    return NextResponse.json({ orderId: order.id })
  } catch (err: any) {
    console.error('Razorpay create-order error:', err)
    return NextResponse.json({ error: err.message || 'Payment gateway error' }, { status: 500 })
  }
}
