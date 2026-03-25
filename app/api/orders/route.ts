import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Verify Razorpay signature if payment_id present
    if (body.payment_id && body.razorpay_order_id) {
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${body.razorpay_order_id}|${body.payment_id}`)
        .digest('hex')
      // Note: in production also verify against razorpay_signature from client
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name:    body.customer_name,
        customer_phone:   body.customer_phone,
        customer_email:   body.customer_email || null,
        address:          body.address,
        city:             body.city,
        state:            body.state || null,
        pincode:          body.pincode,
        items:            body.items,
        subtotal:         body.subtotal,
        discount:         body.discount || 0,
        shipping:         body.shipping || 0,
        total:            body.total,
        coupon_code:      body.coupon_code || null,
        payment_id:       body.payment_id || null,
        razorpay_order_id:body.razorpay_order_id || null,
        payment_status:   body.payment_status || 'pending',
        status:           body.status || 'pending',
        notes:            body.notes || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Order save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Send WhatsApp confirmation via WhatsApp Business API
    // For now, customer does this manually via the confirm button

    return NextResponse.json({ id: data.id, success: true })
  } catch (err: any) {
    console.error('Order API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  // Admin: get all orders (protected)
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
