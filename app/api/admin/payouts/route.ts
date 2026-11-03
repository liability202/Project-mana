import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    // ?creatorId= narrows to one creator's requests for their insights page.
    const creatorId = new URL(req.url).searchParams.get('creatorId')

    let query = supabaseAdmin
      .from('payout_requests')
      .select('*, creators(name, code, phone, upi_id, bank_account, bank_ifsc)')
      .order('created_at', { ascending: false })

    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    }

    const { data: payouts, error } = await query

    if (error) throw error
    return NextResponse.json(payouts || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Settle a payout request. A request moves pending → processed|rejected once;
 * processing marks commissions paid only up to the requested amount (oldest
 * first), so commissions confirmed after the request stay payable.
 */
export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const { id, status } = await req.json()
    if (!id || (status !== 'processed' && status !== 'rejected')) {
      return NextResponse.json({ error: 'Status must be processed or rejected.' }, { status: 400 })
    }

    // Claim the request first so a double click can't settle it twice.
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('payout_requests')
      .update({ status, processed_at: status === 'processed' ? new Date().toISOString() : null })
      .eq('id', id)
      .eq('status', 'pending')
      .select()

    if (claimError) throw claimError
    const payout = claimed?.[0]
    if (!payout) {
      return NextResponse.json({ error: 'This payout request was already handled.' }, { status: 409 })
    }

    if (status === 'processed') {
      const { data: confirmed, error: commsError } = await supabaseAdmin
        .from('commissions')
        .select('id, commission_amount')
        .eq('creator_id', payout.creator_id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true })
      if (commsError) throw commsError

      const settledIds: string[] = []
      let settled = 0
      for (const commission of confirmed || []) {
        const amount = commission.commission_amount || 0
        if (settled + amount > payout.amount) break
        settled += amount
        settledIds.push(commission.id)
      }

      if (settledIds.length) {
        const { error: payError } = await supabaseAdmin
          .from('commissions')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .in('id', settledIds)
          .eq('status', 'confirmed')
        if (payError) throw payError
      }
      if (settled !== payout.amount) {
        console.warn('[payouts] request amount does not match whole commissions', payout.id, payout.amount, settled)
      }

      // Compare-and-set so concurrent updates don't lose a payment.
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: creator, error: crError } = await supabaseAdmin
          .from('creators')
          .select('total_paid')
          .eq('id', payout.creator_id)
          .single()
        if (crError) throw crError

        let update = supabaseAdmin
          .from('creators')
          .update({ total_paid: (creator.total_paid || 0) + payout.amount })
          .eq('id', payout.creator_id)
        update = creator.total_paid == null ? update.is('total_paid', null) : update.eq('total_paid', creator.total_paid)
        const { data: updated } = await update.select('id')
        if (updated?.length) break
      }
    }

    return NextResponse.json(payout)
  } catch (err: any) {
    console.error('Payout Admin Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
