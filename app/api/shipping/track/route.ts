import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicTrackingUrl, hasNimbusPostConfig, trackNimbusAwb } from '@/lib/nimbuspost'
import { normalizePhone } from '@/lib/commerce'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const auth = req.headers.get('authorization')
    const orderId = String(searchParams.get('orderId') || '').trim()
    const orderRef = String(searchParams.get('orderRef') || '').trim().toUpperCase()
    const phone = normalizePhone(searchParams.get('phone') || '')

    let query = supabaseAdmin.from('orders').select('*')

    if (orderId) {
      if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      query = query.eq('id', orderId)
    } else if (orderRef && phone) {
      query = query.eq('order_ref', orderRef).eq('customer_phone', phone)
    } else {
      return NextResponse.json({ error: 'orderId or orderRef + phone is required.' }, { status: 400 })
    }

    const { data: order, error } = await query.single()
    if (error || !order) {
      return NextResponse.json({ error: error?.message || 'Order not found.' }, { status: 404 })
    }

    if (!hasNimbusPostConfig() || !order.tracking_number) {
      return NextResponse.json({ order, refreshed: false })
    }

    const tracking = await trackNimbusAwb(order.tracking_number).catch(() => null)
    if (!tracking) return NextResponse.json({ order, refreshed: false })

    const update = {
      tracking_number: order.tracking_number,
      tracking_link: order.tracking_link || getPublicTrackingUrl(order.order_ref || order.id.slice(0, 8).toUpperCase(), order.customer_phone),
      courier_name: tracking.courierName || order.courier_name || null,
      expected_delivery: tracking.expectedDelivery || order.expected_delivery || null,
      shiprocket_tracking_status: tracking.currentStatus || null,
      tracking_events: tracking.activities || [],
      tracking_synced_at: new Date().toISOString(),
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(update)
      .eq('id', order.id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ order: updatedOrder, refreshed: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not refresh tracking.' }, { status: 500 })
  }
}
