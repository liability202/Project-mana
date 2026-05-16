import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildNimbusShipmentUpdate, hasNimbusPostConfig } from '@/lib/nimbuspost'
import { sendOrderShipped } from '@/lib/email'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasNimbusPostConfig()) {
    return NextResponse.json({ error: 'NimbusPost is not configured yet.' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const orderId = String(body.id || '').trim()
    if (!orderId) {
      return NextResponse.json({ error: 'Order id is required.' }, { status: 400 })
    }

    const weightGrams = Math.max(100, Number(body.weight_grams || 0))
    const lengthCm = Math.max(1, Number(body.length_cm || 0))
    const breadthCm = Math.max(1, Number(body.breadth_cm || 0))
    const heightCm = Math.max(1, Number(body.height_cm || 0))

    if (!weightGrams || !lengthCm || !breadthCm || !heightCm) {
      return NextResponse.json({ error: 'Parcel weight and dimensions are required.' }, { status: 400 })
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: error?.message || 'Order not found.' }, { status: 404 })
    }

    const shipmentUpdate = await buildNimbusShipmentUpdate(order, {
      weightGrams,
      lengthCm,
      breadthCm,
      heightCm,
      courierId: body.courier_id ? Number(body.courier_id) : null,
      generatePickup: body.generate_pickup !== false,
    })

    if (!shipmentUpdate) {
      return NextResponse.json({ error: 'Could not create shipment in NimbusPost.' }, { status: 500 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        ...shipmentUpdate,
        status: 'shipped',
      })
      .eq('id', order.id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (updated.customer_email) {
      sendOrderShipped({
        customerEmail: updated.customer_email,
        customerName: updated.customer_name,
        orderId: updated.id,
        trackingNumber: updated.tracking_number || undefined,
        courierName: updated.courier_name || undefined,
        trackingLink: updated.tracking_link || undefined,
        expectedDelivery: updated.expected_delivery || undefined,
        items: updated.items || [],
      }).catch(console.error)
    }

    if (updated.customer_phone) {
      const orderCode = updated.order_ref || updated.id.slice(0, 8).toUpperCase()
      sendWhatsAppMessage(
        updated.customer_phone,
        `Your order ${orderCode} is on the way.\n\nExpected delivery is ${updated.expected_delivery || 'being updated soon'}.`
      ).catch(console.error)
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not ship order.' }, { status: 500 })
  }
}
