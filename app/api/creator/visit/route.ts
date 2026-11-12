import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const DAY = 24 * 60 * 60 * 1000

/** Logs a visit to a creator's referral link (shown in their stats). */
export async function POST(req: Request) {
  try {
    const { creatorCode } = await req.json()

    // Always store UPPERCASE so it matches the stats API's codesArray (which uppercases)
    const normalizedCode = String(creatorCode || '').trim().toUpperCase()
    if (!/^[A-Z0-9_-]{2,40}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'creatorCode is required' }, { status: 400 })
    }

    // Count each visitor once a day per code, and cap total writes per visitor,
    // so stats can't be inflated by replaying the request.
    const ip = clientIp(req)
    if (!rateLimit(`visit:${ip}:${normalizedCode}`, 1, DAY).ok || !rateLimit(`visit:${ip}`, 20, DAY).ok) {
      return NextResponse.json({ success: true, counted: false })
    }

    const { data: creator } = await supabaseAdmin
      .from('creators')
      .select('id')
      .eq('code', normalizedCode)
      .eq('active', true)
      .maybeSingle()
    if (!creator) return NextResponse.json({ success: true, counted: false })

    const { error } = await supabaseAdmin
      .from('referral_visits')
      .insert({
        creator_code: normalizedCode,
        visitor_phone: 'anonymous_visit',
      })

    if (error) {
      console.error('Failed to log referral visit:', error)
      return NextResponse.json({ success: false }, { status: 500 })
    }

    return NextResponse.json({ success: true, counted: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
