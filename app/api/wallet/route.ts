import { NextResponse } from 'next/server'
import { getWalletSnapshot, normalizePhone } from '@/lib/commerce'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = normalizePhone(searchParams.get('phone') || '')
    const userId = searchParams.get('user_id')

    if (!phone && !userId) {
      return NextResponse.json({ error: 'phone or user_id is required.' }, { status: 400 })
    }

    const snapshot = await getWalletSnapshot(supabaseAdmin, { phone, userId })
    return NextResponse.json({
      balance: snapshot.wallet.balance || 0,
      wallet: snapshot.wallet,
      transactions: snapshot.transactions,
      is_cashback_eligible: snapshot.profile.is_cashback_eligible || false,
      profile: snapshot.profile,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
