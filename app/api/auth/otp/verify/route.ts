import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyOtpCode } from '@/lib/otp'
import { countCompletedOrders } from '@/lib/checkout'
import { setSessionCookie } from '@/lib/session'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const KNOWN_OTP_ERRORS = ['Invalid OTP', 'expired', 'No OTP request found', 'Too many invalid attempts', 'already been used']

export async function POST(req: Request) {
  try {
    const limit = rateLimit(`otp-verify:ip:${clientIp(req)}`, 30, 10 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })
    }

    const body = await req.json()
    const phone = String(body.phone || '').replace(/\D/g, '')
    const otp = String(body.otp || '').trim()

    if (phone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 })
    }
    if (otp.length < 4) {
      return NextResponse.json({ error: 'Please enter the OTP you received.' }, { status: 400 })
    }

    const result = await verifyOtpCode(supabaseAdmin, {
      phone,
      otp,
      name: body.name || null,
      email: body.email || null,
    })
    const completedOrders = await countCompletedOrders(supabaseAdmin, result.phone)

    const response = NextResponse.json({
      success: true,
      phone: result.phone,
      customer_type: completedOrders > 0 ? 'returning' : 'new',
      profile_id: result.profile.id,
      user_id: result.profile.user_id || null,
    })
    setSessionCookie(response, result.phone)
    return response
  } catch (err: any) {
    const message = err?.message || 'OTP verification failed.'
    if (KNOWN_OTP_ERRORS.some(fragment => message.includes(fragment))) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    console.error('OTP verify failed', err)
    return NextResponse.json({ error: 'Could not verify the OTP right now. Please try again.' }, { status: 500 })
  }
}
