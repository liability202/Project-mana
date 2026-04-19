import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendOtp, verifyOtpCode } from '@/lib/otp'
import { normalizePhone } from '@/lib/commerce'

export async function POST(req: Request) {
  try {
    const { phone, otp, type } = await req.json()
    const normalized = normalizePhone(phone || '')

    if (!normalized) {
      return NextResponse.json({ error: 'Valid phone number is required.' }, { status: 400 })
    }

    // Check if the user is a registered creator
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('creators')
      .select('*')
      .eq('phone', normalized)
      .eq('active', true)
      .maybeSingle()

    if (creatorError) throw creatorError
    
    if (!creator) {
      return NextResponse.json({ 
        error: 'This number is not registered as a creator. WhatsApp us to apply.' 
      }, { status: 403 })
    }

    if (type === 'send') {
      const result = await createAndSendOtp(supabaseAdmin, normalized)
      return NextResponse.json({ 
        success: true, 
        channels: result.channels,
        devOtp: result.devOtp 
      })
    }

    if (type === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP is required.' }, { status: 400 })
      }
      
      // We use the existing verify logic. 
      // It will clear the OTP record and ensure a user_profile exists as well.
      await verifyOtpCode(supabaseAdmin, { phone: normalized, otp })
      
      return NextResponse.json({
        success: true,
        creator: {
          id: creator.id,
          name: creator.name,
          code: creator.code,
          phone: creator.phone
        }
      })
    }

    return NextResponse.json({ error: 'Invalid request type.' }, { status: 400 })
  } catch (err: any) {
    console.error('Creator Auth Error:', err)
    return NextResponse.json({ 
      error: err.message || 'Authentication failed. Please try again.' 
    }, { status: 500 })
  }
}
