import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendOtp } from '@/lib/otp'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = String(body.phone || '').replace(/\D/g, '')

    if (phone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 })
    }

    const otp = await createAndSendOtp(supabaseAdmin, phone)

    return NextResponse.json({
      success: true,
      channels: otp.channels,
      expires_in_minutes: otp.expiresInMinutes,
      dev_otp: otp.devOtp,
    })
  } catch (err: any) {
    const message = err?.message || 'Could not send OTP.'
    const status = message.includes('Please wait') ? 429 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
