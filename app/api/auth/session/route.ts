import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { countCompletedOrders } from '@/lib/checkout'
import { clearSessionCookie, getSessionPhone } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Who is signed in on this browser (via WhatsApp OTP), if anyone. */
export async function GET() {
  const phone = getSessionPhone()
  if (!phone) return NextResponse.json({ authenticated: false })

  let customerType: 'new' | 'returning' = 'new'
  try {
    customerType = (await countCompletedOrders(supabaseAdmin, phone)) > 0 ? 'returning' : 'new'
  } catch (error) {
    console.error('Session customer type lookup failed', error)
  }

  return NextResponse.json({ authenticated: true, phone, customer_type: customerType })
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
}
