import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        courier_name: courier_name || null,
        tracking_number: tracking_number || null,
        expected_delivery: expected_delivery || null,
        tracking_link: tracking_link || null,
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
