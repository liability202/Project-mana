import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyOtpCode } from '@/lib/otp'

export async function POST(req: Request) {
  try {
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

    return NextResponse.json({
      success: true,
      phone: result.phone,
      customer_type: result.customerType,
      profile_id: result.profile.id,
      user_id: result.profile.user_id || null,
      latest_order: result.latestOrder,
    })
  } catch (err: any) {
    const message = err?.message || 'OTP verification failed.'
    const status =
      message.includes('Invalid OTP') ||
      message.includes('expired') ||
      message.includes('No OTP request found') ||
      message.includes('Too many invalid attempts')
        ? 400
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}
