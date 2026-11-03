import { NextResponse } from 'next/server'
import { getWalletSnapshot, normalizePhone } from '@/lib/commerce'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { getSessionPhone } from '@/lib/session'
import { releaseAbandonedAttempts } from '@/lib/checkout'

export const dynamic = 'force-dynamic'

/**
 * Customer: their own wallet (phone comes from the session cookie).
 * Admin: any customer's wallet via ?phone= or ?user_id=.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let phone = ''
    let userId: string | null = null

    if (req.headers.get('authorization')) {
      if (!isAdminRequest(req)) return unauthorized()
      phone = normalizePhone(searchParams.get('phone') || '')
      userId = searchParams.get('user_id')
      if (!phone && !userId) {
        return NextResponse.json({ error: 'phone or user_id is required.' }, { status: 400 })
      }
    } else {
      phone = getSessionPhone() || ''
      if (!phone) return NextResponse.json({ error: 'Please sign in to see your wallet.' }, { status: 401 })
      // Online payments abandoned for 30+ minutes return their wallet hold.
      await releaseAbandonedAttempts(supabaseAdmin, phone, 30 * 60 * 1000)
    }

    const snapshot = await getWalletSnapshot(supabaseAdmin, { phone, userId })
    return NextResponse.json({
      balance: snapshot.wallet.balance || 0,
      wallet: snapshot.wallet,
      transactions: snapshot.transactions,
      is_cashback_eligible: snapshot.profile.is_cashback_eligible || false,
      profile: snapshot.profile,
    })
  } catch (err) {
    console.error('Wallet load failed', err)
    return NextResponse.json({ error: 'Could not load the wallet.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const body = await req.json()
    const phone = normalizePhone(body.phone || '')
    if (!phone && !body.user_id) {
      return NextResponse.json({ error: 'phone or user_id is required.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: body.user_id || null,
        phone: phone || null,
        full_name: body.full_name || null,
        email: body.email || null,
        is_cashback_eligible: Boolean(body.is_cashback_eligible),
        instagram_handle: body.instagram_handle || null,
        cashback_request_status: body.cashback_request_status || (body.is_cashback_eligible ? 'approved' : 'none'),
      }, { onConflict: body.user_id ? 'user_id' : 'phone' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
