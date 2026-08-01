import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPublicTrackingUrl } from '@/lib/nimbuspost'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, courier_name, tracking_number, expected_delivery, tracking_link } = body

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin.from('orders').select('*').eq('id', id).single()

    const computedTrackingLink = tracking_link || (tracking_number ? `https://ship.nimbuspost.com/shipping/tracking/${tracking_number.trim()}` : (existing ? getPublicTrackingUrl(existing.order_ref || id.slice(0, 8).toUpperCase(), existing.customer_phone) : null))

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        courier_name: courier_name || null,
        tracking_number: tracking_number || null,
        expected_delivery: expected_delivery || null,
        tracking_link: computedTrackingLink,
        tracking_synced_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not update tracking details.' }, { status: 500 })
  }
}
