import { NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, receipt, notes } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const options = {
      amount, // amount in paise
      currency: 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    }

    const order = await razorpay.orders.create(options)

    if (!order) {
      return NextResponse.json({ error: 'Could not create Razorpay order' }, { status: 500 })
    }

    return NextResponse.json({ orderId: order.id, amount: order.amount })
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error)
    return NextResponse.json({ error: error.message || 'Error creating order' }, { status: 500 })
  }
}
