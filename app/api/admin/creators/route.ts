import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { LOYALTY_CODE, normalizePhone } from '@/lib/commerce'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    // ?id= returns the single creator object, for the insights page.
    const id = new URL(req.url).searchParams.get('id')

    if (id) {
      const { data: creator, error: oneError } = await supabaseAdmin
        .from('creators')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (oneError) throw oneError
      if (!creator) return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
      return NextResponse.json(creator)
    }

    const { data: creators, error } = await supabaseAdmin
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(creators || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const body = await req.json()

    // Build the row from known fields only: totals, active flags and payment
    // details are never taken from the request.
    const name = String(body.name || '').trim().slice(0, 80)
    const phone = normalizePhone(String(body.phone || '')).slice(-10)
    const code = String(body.code || '').trim().toUpperCase()
    const commissionPct = Number(body.commission_pct ?? 10)
    const tier = String(body.tier || 'standard').trim().slice(0, 20) || 'standard'

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (phone.length !== 10) return NextResponse.json({ error: 'Enter a valid 10-digit phone number.' }, { status: 400 })
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return NextResponse.json({ error: 'Code must be 3-30 letters, numbers, - or _.' }, { status: 400 })
    }
    if (code === LOYALTY_CODE) return NextResponse.json({ error: `${LOYALTY_CODE} is reserved.` }, { status: 400 })
    if (!Number.isInteger(commissionPct) || commissionPct < 0 || commissionPct > 50) {
      return NextResponse.json({ error: 'Commission must be a whole number between 0 and 50.' }, { status: 400 })
    }

    // Commission is attributed by code, so a creator code must not shadow a
    // store coupon (or every order using that coupon would pay the creator).
    const { data: clash } = await supabaseAdmin.from('coupons').select('id').eq('code', code).limit(1)
    if (clash?.length) {
      return NextResponse.json({ error: `${code} is already a store coupon code.` }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('creators')
      .insert({ name, phone, code, commission_pct: commissionPct, tier })
      .select()
      .single()

    if (error) {
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'A creator with this phone or code already exists.' }, { status: 409 })
      }
      throw error
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
