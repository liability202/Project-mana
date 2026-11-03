import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { creatorAvailableBalance, getActiveCreatorId } from '@/lib/creator-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const creatorId = await getActiveCreatorId()

    if (!creatorId) {
      return NextResponse.json({ error: 'Please sign in to the creator portal.' }, { status: 401 })
    }

    const { data: payouts, error } = await supabaseAdmin
      .from('payout_requests')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      payouts: payouts || [],
      availableBalance: Math.max(0, await creatorAvailableBalance(creatorId)),
    })
  } catch (err: any) {
    console.error('Creator Earnings API Error:', err)
    return NextResponse.json({ error: 'Could not load earnings.' }, { status: 500 })
  }
}

const MIN_PAYOUT = 50000 // ₹500, same floor the earnings page shows

export async function POST(req: Request) {
  try {
    const creatorId = await getActiveCreatorId()
    if (!creatorId) {
      return NextResponse.json({ error: 'Please sign in to the creator portal.' }, { status: 401 })
    }

    const { amount: rawAmount } = await req.json()
    const amount = Number(rawAmount)
    if (!Number.isInteger(amount) || amount < MIN_PAYOUT) {
      return NextResponse.json({ error: 'The minimum payout is ₹500.' }, { status: 400 })
    }

    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('creators')
      .select('upi_id, bank_account, bank_ifsc')
      .eq('id', creatorId)
      .maybeSingle()

    if (creatorError) throw creatorError
    if (!creator) return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
    if (!creator.upi_id && !(creator.bank_account && creator.bank_ifsc)) {
      return NextResponse.json({ error: 'Add a UPI ID or bank details in your profile first.' }, { status: 400 })
    }

    if (amount > (await creatorAvailableBalance(creatorId))) {
      return NextResponse.json({ error: 'Insufficient balance available for payout.' }, { status: 400 })
    }

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

    // Two simultaneous requests can both pass the check above; undo ours if
    // together they now exceed what was earned.
    if ((await creatorAvailableBalance(creatorId)) < 0) {
      await supabaseAdmin.from('payout_requests').delete().eq('id', data.id)
      return NextResponse.json({ error: 'A payout request is already in progress.' }, { status: 409 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (err: any) {
    console.error('Creator Payout Request Error:', err)
    return NextResponse.json({ error: 'Could not create the payout request.' }, { status: 500 })
  }
}
