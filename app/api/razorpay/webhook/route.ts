import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  if (!secret) {
    return new NextResponse('Webhook secret not configured', { status: 500 })
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (signature !== expectedSignature) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(body)
  if (event.event === 'payment_link.paid') {
    const entity = event.payload?.payment_link?.entity
    const orderId = entity?.reference_id
    const phone = String(entity?.customer?.contact || '').replace(/\D/g, '')

    if (orderId) {
      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', orderId)
        .select('order_ref, customer_phone')
        .single()

      const targetPhone = updatedOrder?.customer_phone || phone
      if (targetPhone) {
        await sendWhatsAppMessage(
          targetPhone,
          `Payment received ✅\n\nYour order ${updatedOrder?.order_ref || ''} is confirmed and will be packed soon.`
        )
      }
    }
  }

  return NextResponse.json({ received: true })
}
