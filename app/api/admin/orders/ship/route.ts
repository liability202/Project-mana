import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildNimbusShipmentUpdate, hasNimbusPostConfig } from '@/lib/nimbuspost'
import { sendOrderShipped } from '@/lib/email'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { ORDER_NOTE } from '@/lib/checkout'

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

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

    if (order.notes === ORDER_NOTE.awaitingPayment && order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'This online order was never paid. Do not ship it.' }, { status: 409 })
    }
    if (!['pending', 'confirmed', 'packed'].includes(order.status)) {
      return NextResponse.json({ error: `This order is already ${order.status}.` }, { status: 409 })
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

    // No AWB means nothing was booked: keep what NimbusPost told us, but don't
    // mark the order shipped or tell the customer it is on the way.
    if (!shipmentUpdate.tracking_number) {
      await supabaseAdmin.from('orders').update(shipmentUpdate).eq('id', order.id)
      const unserviceable = shipmentUpdate.shiprocket_tracking_status === 'UNSERVICEABLE'
      return NextResponse.json({
        error: unserviceable
          ? 'NimbusPost cannot deliver to this pincode. The order was not marked shipped.'
          : 'NimbusPost did not assign an AWB, so nothing was booked. Check the NimbusPost dashboard; the order was not marked shipped.',
      }, { status: 502 })
    }

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        ...shipmentUpdate,
        status: 'shipped',
      })
      .eq('id', order.id)
      .eq('status', order.status)
      .select('*')

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    const updated = updatedRows?.[0]
    if (!updated) {
      return NextResponse.json({ error: 'This order was just updated by someone else. Please refresh.' }, { status: 409 })
    }

    if (updated.customer_email) {
      sendOrderShipped({
        customerEmail: updated.customer_email,
        customerName: updated.customer_name,
        orderId: updated.id,
        orderRef: updated.order_ref,
        trackingNumber: updated.tracking_number || undefined,
        courierName: updated.courier_name || undefined,
        trackingLink: updated.tracking_link || undefined,
        expectedDelivery: updated.expected_delivery || undefined,
        items: updated.items || [],
      }).catch(console.error)
    }

    if (updated.customer_phone) {
      const orderCode = updated.order_ref || updated.id.slice(0, 8).toUpperCase()
      let msg = `Your order ${orderCode} is on the way.\n\nExpected delivery is ${updated.expected_delivery || 'being updated soon'}.`
      if (updated.tracking_link || updated.tracking_number) {
        msg += `\n\nCourier: ${updated.courier_name || 'Partner'}\nTracking No: ${updated.tracking_number || ''}\nTrack here: ${updated.tracking_link || ''}`
      }
      sendWhatsAppMessage(updated.customer_phone, msg).catch(console.error)
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not ship order.' }, { status: 500 })
  }
}
