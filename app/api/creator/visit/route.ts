import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { creatorCode, phone } = await req.json()

    if (!creatorCode) {
      return NextResponse.json({ error: 'creatorCode is required' }, { status: 400 })
    }

    // Always store UPPERCASE so it matches the stats API's codesArray (which uppercases)
    const normalizedCode = String(creatorCode).trim().toUpperCase()

    const { error } = await supabaseAdmin
      .from('referral_visits')
      .insert({
        creator_code: normalizedCode,
        visitor_phone: phone || 'anonymous_visit',
      })

    if (error) {
      console.error('Failed to log referral visit:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

