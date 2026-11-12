import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendOtp, verifyOtpCode } from '@/lib/otp'
import { normalizePhone } from '@/lib/commerce'
import { clearCreatorSessionCookie, getCreatorSessionId, setCreatorSessionCookie } from '@/lib/session'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Test-login number: skips OTP entirely and drops straight into the portal.
 *
 * Exists so the creator portal can be worked on without a live OTP channel
 * (WhatsApp is often unconfigured in local dev). It is a genuine login bypass,
 * so it only ever works outside production — CREATOR_TEST_PHONE set in a
 * production environment is ignored.
 */
const DEV_TEST_PHONE = '6969699696'

function testLoginPhone(): string | null {
  if (process.env.NODE_ENV === 'production') return null
  return normalizePhone(process.env.CREATOR_TEST_PHONE || '').slice(-10) || DEV_TEST_PHONE
}

function publicCreator(creator: any) {
  return { id: creator.id, name: creator.name, code: creator.code, phone: creator.phone }
}

async function findActiveCreator(phone: string) {
  // Creator phones were saved as typed by the admin, so match common spellings.
  const { data, error } = await supabaseAdmin
    .from('creators')
    .select('id, name, code, phone')
    .in('phone', [phone, `91${phone}`, `+91${phone}`, `+91 ${phone}`])
    .eq('active', true)
    .limit(1)
  if (error) throw error
  return data?.[0] || null
}

/** Who is signed in to the creator portal on this browser. */
export async function GET() {
  const creatorId = getCreatorSessionId()
  if (!creatorId) return NextResponse.json({ authenticated: false }, { status: 401 })

  const { data: creator } = await supabaseAdmin
    .from('creators')
    .select('id, name, code, phone, active')
    .eq('id', creatorId)
    .maybeSingle()
  if (!creator || creator.active === false) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 })
    clearCreatorSessionCookie(response)
    return response
  }
  return NextResponse.json({ authenticated: true, creator: publicCreator(creator) })
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearCreatorSessionCookie(response)
  return response
}

export async function POST(req: Request) {
  try {
    const { phone, otp, type } = await req.json()
    const normalized = normalizePhone(phone || '').slice(-10)

    if (normalized.length !== 10) {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 })
    }

    const ip = clientIp(req)
    const limit = type === 'verify'
      ? rateLimit(`creator-verify:${ip}`, 30, 10 * 60 * 1000)
      : rateLimit(`creator-send:${ip}`, 10, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const isTestLogin = normalized === testLoginPhone()
    const creator = await findActiveCreator(normalized)

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

    // Test login: hand back the session on the "send" step so the client never
    // shows the OTP screen at all.
    if (isTestLogin) {
      console.warn(`[creator-auth] OTP bypassed via test login for ${normalized}`)
      const response = NextResponse.json({ success: true, bypass: true, creator: publicCreator(creator) })
      setCreatorSessionCookie(response, creator.id)
      return response
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

      // Clears the OTP record and ensures a user_profile exists as well.
      await verifyOtpCode(supabaseAdmin, { phone: normalized, otp: String(otp).trim() })

      const response = NextResponse.json({ success: true, creator: publicCreator(creator) })
      setCreatorSessionCookie(response, creator.id)
      return response
    }

    return NextResponse.json({ error: 'Invalid request type.' }, { status: 400 })
  } catch (err: any) {
    const message = String(err?.message || '')
    if (['Invalid OTP', 'expired', 'No OTP request found', 'Too many invalid attempts', 'already been used', 'Please wait'].some(part => message.includes(part))) {
      return NextResponse.json({ error: message }, { status: message.includes('Please wait') ? 429 : 400 })
    }
    console.error('Creator Auth Error:', err)
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 })
  }
}
