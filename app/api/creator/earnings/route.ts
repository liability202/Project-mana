import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    }

    const { data: payouts, error } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Also get the confirmed but not yet paid commissions to calculate available balance
    const { data: confirmedComms, error: commsError } = await supabaseAdmin
      .from('commissions')
      .select('commission_amount')
      .eq('creator_id', creatorId)
      .eq('status', 'confirmed')

    if (commsError) throw commsError

    const availableBalance = (confirmedComms || []).reduce((sum, c) => sum + c.commission_amount, 0)

    return NextResponse.json({
      payouts: payouts || [],
      availableBalance
    })
  } catch (err: any) {
    console.error('Creator Earnings API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { creatorId, amount } = await req.json()

    if (!creatorId || !amount) {
      return NextResponse.json({ error: 'Creator ID and amount are required.' }, { status: 400 })
    }

    // 1. Validate creator and payment details
    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('creators')
      .select('upi_id, bank_account, bank_ifsc')
      .eq('id', creatorId)
      .maybeSingle()

    if (creatorError) throw creatorError
    if (!creator) return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })

    // 2. Validate available balance
    const { data: confirmedComms, error: commsError } = await supabaseAdmin
      .from('commissions')
      .select('commission_amount')
      .eq('creator_id', creatorId)
      .eq('status', 'confirmed')

    if (commsError) throw commsError

    const availableBalance = (confirmedComms || []).reduce((sum, c) => sum + c.commission_amount, 0)

    if (amount > availableBalance) {
      return NextResponse.json({ error: 'Insufficient balance available for payout.' }, { status: 400 })
    }

    // 3. Create payout request
    const { data, error } = await supabaseAdmin
      .from('payout_requests')
      .insert({
        creator_id: creatorId,
        amount,
        upi_id: creator.upi_id,
        bank_account: creator.bank_account,
        bank_ifsc: creator.bank_ifsc,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, request: data })
  } catch (err: any) {
    console.error('Creator Payout Request Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
