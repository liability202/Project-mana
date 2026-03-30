import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/commerce'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = normalizePhone(body.phone || '')
    const instagramHandle = String(body.instagram_handle || '').trim()

    if (!phone) return NextResponse.json({ error: 'Phone is required.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        phone,
        instagram_handle: instagramHandle || null,
        cashback_request_status: 'requested',
      }, { onConflict: 'phone' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, profile: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
