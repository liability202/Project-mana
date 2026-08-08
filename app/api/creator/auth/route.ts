import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendOtp, verifyOtpCode } from '@/lib/otp'
import { normalizePhone } from '@/lib/commerce'

/**
 * Test-login number: skips OTP entirely and drops straight into the portal.
 *
 * Exists so the creator portal can be worked on without a live OTP channel
 * (WhatsApp/MSG91 are often unconfigured in local dev). It is a genuine login
 * bypass, so it is OFF in production unless someone deliberately sets
 * CREATOR_TEST_PHONE there — a hardcoded number that opens a creator's earnings
 * and payout details must not ship by accident.
 *
 * Set CREATOR_TEST_PHONE to point it at any existing creator instead.
 */
const DEV_TEST_PHONE = '6969699696'

function testLoginPhone(): string | null {
  const configured = normalizePhone(process.env.CREATOR_TEST_PHONE || '')
  if (configured) return configured
  return process.env.NODE_ENV === 'production' ? null : DEV_TEST_PHONE
}

export async function POST(req: Request) {
  try {
    const { phone, otp, type } = await req.json()
    const normalized = normalizePhone(phone || '')

    if (!normalized) {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 })
    }

    const isTestLogin = normalized === testLoginPhone()

    // Check if the user is a registered creator
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('creators')
      .select('*')
      .eq('phone', normalized)
      .eq('active', true)
      .maybeSingle()

    if (creatorError) throw creatorError

    if (!creator) {
      // The bypass still needs a creator to log in as — say so plainly rather
      // than leaving the number looking broken.
      if (isTestLogin) {
        return NextResponse.json({
          error: `Test login is on for ${normalized}, but no active creator has that phone. Add one in the admin panel, or set CREATOR_TEST_PHONE to an existing creator's number.`,
        }, { status: 403 })
      }

      return NextResponse.json({
        error: 'This number is not registered as a creator. WhatsApp us to apply.'
      }, { status: 403 })
    }

    const creatorSession = {
      id: creator.id,
      name: creator.name,
      code: creator.code,
      phone: creator.phone,
    }

    // Test login: hand back the session on the "send" step so the client never
    // shows the OTP screen at all.
    if (isTestLogin) {
      console.warn(`[creator-auth] OTP bypassed via test login for ${normalized}`)
      return NextResponse.json({ success: true, bypass: true, creator: creatorSession })
    }

    if (type === 'send') {
      const result = await createAndSendOtp(supabaseAdmin, normalized)
      return NextResponse.json({
        success: true,
        channels: result.channels,
      })
    }

    if (type === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required.' }, { status: 400 })
      }
      
      // We use the existing verify logic. 
      // It will clear the OTP record and ensure a user_profile exists as well.
      await verifyOtpCode(supabaseAdmin, { phone: normalized, otp })

      return NextResponse.json({ success: true, creator: creatorSession })
    }

    return NextResponse.json({ error: 'Invalid request type.' }, { status: 400 })
  } catch (err: any) {
    console.error('Creator Auth Error:', err)
    return NextResponse.json({ 
      error: err.message || 'Authentication failed. Please try again.' 
    }, { status: 500 })
  }
}
