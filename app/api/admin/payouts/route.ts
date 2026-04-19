import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.split(' ')[1]
  if (secret !== process.env.NEXT_PUBLIC_ADMIN_HINT && secret?.length! <= 6) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: payouts, error } = await supabaseAdmin
      .from('payout_requests')
      .select('*, creators(name, code, upi_id, bank_account, bank_ifsc)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(payouts || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const secret = req.headers.get('authorization')?.split(' ')[1]
  if (secret !== process.env.NEXT_PUBLIC_ADMIN_HINT && secret?.length! <= 6) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status } = await req.json()
    
    // If marking as processed, we should update the total_paid on creator and mark commissions as paid
    if (status === 'processed') {
      const { data: payout, error: pError } = await supabaseAdmin
        .from('payout_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (pError) throw pError

      // Update commissions to 'paid' for this creator that were 'confirmed'
      const { error: cError } = await supabaseAdmin
        .from('commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('creator_id', payout.creator_id)
        .eq('status', 'confirmed')

      if (cError) throw cError

      // Update creator's total_paid
      const { data: creator, error: crError } = await supabaseAdmin
        .from('creators')
        .select('total_paid, total_earned')
        .eq('id', payout.creator_id)
        .single()

      if (crError) throw crError

      await supabaseAdmin
        .from('creators')
        .update({ total_paid: (creator.total_paid || 0) + payout.amount })
        .eq('id', payout.creator_id)
    }

    const { data, error } = await supabaseAdmin
      .from('payout_requests')
      .update({ status, processed_at: status === 'processed' ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Payout Admin Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
