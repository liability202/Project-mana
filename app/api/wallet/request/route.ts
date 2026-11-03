import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionPhone } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const phone = getSessionPhone()
    if (!phone) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

    const body = await req.json()
    const instagramHandle = String(body.instagram_handle || '').trim().replace(/^@/, '').slice(0, 60)
    if (instagramHandle && !/^[A-Za-z0-9._]{1,30}$/.test(instagramHandle)) {
      return NextResponse.json({ error: 'Please enter a valid Instagram handle.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        phone,
        instagram_handle: instagramHandle || null,
        cashback_request_status: 'requested',
      }, { onConflict: 'phone' })
      .select('*')
      .single()

    if (error) {
      console.error('Cashback request failed', error)
      return NextResponse.json({ error: 'Could not submit your request.' }, { status: 500 })
    }
    return NextResponse.json({ success: true, profile: data })
  } catch (err) {
    console.error('Cashback request failed', err)
    return NextResponse.json({ error: 'Could not submit your request.' }, { status: 500 })
  }
}
