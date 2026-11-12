import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendOtp } from '@/lib/otp'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = String(body.phone || '').replace(/\D/g, '')

    if (phone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 })
    }

    // Every OTP is a paid WhatsApp message; cap how many one visitor or one
    // number can trigger, on top of the 30s per-number cooldown in lib/otp.
    const byIp = rateLimit(`otp-send:ip:${clientIp(req)}`, 10, HOUR)
    const byPhone = rateLimit(`otp-send:phone:${phone}`, 5, HOUR)
    if (!byIp.ok || !byPhone.ok) {
      const wait = Math.max(byIp.retryAfterSeconds, byPhone.retryAfterSeconds)
      return NextResponse.json(
        { error: `Too many OTP requests. Please try again in ${Math.ceil(wait / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': String(wait) } }
      )
    }

    const otp = await createAndSendOtp(supabaseAdmin, phone)

    return NextResponse.json({
      success: true,
      channels: otp.channels,
      expires_in_minutes: otp.expiresInMinutes,
    })
  } catch (err: any) {
    const message = err?.message || 'Could not send OTP.'
    if (message.includes('Please wait')) return NextResponse.json({ error: message }, { status: 429 })
    console.error('OTP send failed', err)
    return NextResponse.json({ error: 'Could not send the OTP right now. Please try again shortly.' }, { status: 500 })
  }
}
