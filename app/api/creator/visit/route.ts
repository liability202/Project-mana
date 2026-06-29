import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { creatorCode, phone } = await req.json()

    if (!creatorCode || !phone) {
      return NextResponse.json({ error: 'creatorCode and phone are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('referral_visits')
      .insert({
        creator_code: creatorCode,
        visitor_phone: phone
      })

    if (error) {
      console.error('Failed to log referral visit:', error)
      // We don't want to fail the user's flow just because analytics failed
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
