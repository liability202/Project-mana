import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getNimbusCourierRates, hasNimbusPostConfig, isCodOrder, missingPickupSettings } from '@/lib/nimbuspost'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { ORDER_NOTE } from '@/lib/checkout'

/**
 * The couriers NimbusPost offers for one order's parcel, cheapest first, so
 * the admin can choose before booking. Read-only: nothing is booked here.
 */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()
  if (!hasNimbusPostConfig()) {
    return NextResponse.json({ error: 'NimbusPost is not configured yet.' }, { status: 400 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const orderId = String(body.id || '').trim()
    if (!orderId) return NextResponse.json({ error: 'Order id is required.' }, { status: 400 })

    const weightGrams = Math.round(Number(body.weight_grams || 0))
    if (!(weightGrams >= 100)) {
      return NextResponse.json({ error: 'Enter the parcel weight in grams (at least 100).' }, { status: 400 })
    }

    const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
    if (error || !order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    if (order.notes === ORDER_NOTE.awaitingPayment && order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'This online order was never paid. Do not ship it.' }, { status: 409 })
    }
    if (!['pending', 'confirmed', 'packed'].includes(order.status)) {
      return NextResponse.json({ error: `This order is already ${order.status}.` }, { status: 409 })
    }

    const cod = isCodOrder(order)
    const { rates, message } = await getNimbusCourierRates({
      deliveryPincode: order.pincode,
      cod,
      orderAmountPaise: order.final_amount || order.total,
      weightGrams,
      lengthCm: Number(body.length_cm) || undefined,
      breadthCm: Number(body.breadth_cm) || undefined,
      heightCm: Number(body.height_cm) || undefined,
    })

    return NextResponse.json({
      rates,
      message,
      cod,
      pincode: order.pincode,
      city: order.city,
      // Booking will fail until these are set, so say so before anyone picks a courier.
      missingSettings: missingPickupSettings(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not get courier prices.' }, { status: 500 })
  }
}
