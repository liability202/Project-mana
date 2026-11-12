import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicTrackingUrl, hasNimbusPostConfig, trackNimbusAwb } from '@/lib/nimbuspost'
import { normalizePhone } from '@/lib/commerce'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { getSessionPhone, phoneVariants } from '@/lib/session'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const REFRESH_INTERVAL_MS = 10 * 60 * 1000

/** What the public tracking page needs — no address, email or phone. */
function trackingView(order: any) {
  return {
    id: order.id,
    order_ref: order.order_ref,
    status: order.status,
    payment_status: order.payment_status,
    created_at: order.created_at,
    total: order.total,
    final_amount: order.final_amount,
    city: order.city,
    items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
      product_name: item.product_name,
      variant_name: item.variant_name,
      weight_grams: item.weight_grams,
      quantity: item.quantity,
      price: item.price,
    })),
    courier_name: order.courier_name,
    tracking_number: order.tracking_number,
    tracking_link: order.tracking_link,
    expected_delivery: order.expected_delivery,
    shiprocket_tracking_status: order.shiprocket_tracking_status,
    tracking_events: order.tracking_events,
    tracking_synced_at: order.tracking_synced_at,
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = String(searchParams.get('orderId') || '').trim()
    const orderRef = String(searchParams.get('orderRef') || '').trim().toUpperCase()
    const isAdmin = Boolean(orderId)

    let query = supabaseAdmin.from('orders').select('*')

    if (isAdmin) {
      if (!isAdminRequest(req)) return unauthorized()
      query = query.eq('id', orderId)
    } else {
      // Order ref + phone (from the session, or typed on the tracking page).
      const phone = getSessionPhone() || normalizePhone(searchParams.get('phone') || '').slice(-10)
      if (!orderRef || phone.length !== 10) {
        return NextResponse.json({ error: 'Order ID and phone number are required.' }, { status: 400 })
      }
      if (!rateLimit(`track:${clientIp(req)}`, 30, 10 * 60 * 1000).ok) {
        return NextResponse.json({ error: 'Too many lookups. Please try again in a few minutes.' }, { status: 429 })
      }
      query = query.eq('order_ref', orderRef).in('customer_phone', phoneVariants(phone))
    }

    const { data: order, error } = await query.maybeSingle()
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found. Check the order ID and phone number.' }, { status: 404 })
    }

    const respond = (current: any, refreshed: boolean) =>
      NextResponse.json({ order: isAdmin ? current : trackingView(current), refreshed })

    // Only the admin may point an order at a different AWB.
    const customAwb = isAdmin ? String(searchParams.get('awb') || '').trim() : ''
    const awbToTrack = customAwb || order.tracking_number

    if (!hasNimbusPostConfig() || !awbToTrack) return respond(order, false)

    // Public lookups reuse a recent sync instead of calling the courier API.
    const lastSync = order.tracking_synced_at ? new Date(order.tracking_synced_at).getTime() : 0
    if (!isAdmin && Date.now() - lastSync < REFRESH_INTERVAL_MS) return respond(order, false)

    const tracking = await trackNimbusAwb(awbToTrack).catch(() => null)
    if (!tracking) return respond(order, false)

    const update = {
      tracking_number: awbToTrack,
      tracking_link: getPublicTrackingUrl(order.order_ref || order.id.slice(0, 8).toUpperCase(), order.customer_phone, awbToTrack),
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
      console.error('Tracking update failed', order.id, updateError)
      return respond(order, false)
    }

    return respond(updatedOrder, true)
  } catch (err: any) {
    console.error('Tracking lookup failed', err)
    return NextResponse.json({ error: 'Could not refresh tracking right now.' }, { status: 500 })
  }
}
