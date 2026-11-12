import { supabaseAdmin } from '@/lib/supabase'
import { getCreatorSessionId } from '@/lib/session'

/**
 * The signed-in creator's id, but only while their account is still active —
 * deactivating a creator in the admin locks them out immediately rather than
 * when their 30-day cookie expires.
 */
export async function getActiveCreatorId() {
  const creatorId = getCreatorSessionId()
  if (!creatorId) return null
  const { data, error } = await supabaseAdmin.from('creators').select('id, active').eq('id', creatorId).maybeSingle()
  if (error || !data || data.active === false) return null
  return creatorId
}

/**
 * What a creator can still withdraw. A ledger, not a label: everything they
 * have earned and had confirmed, minus everything already requested or paid
 * out. Marking individual commission rows "paid" never makes money available
 * again, so a payout can't be drawn twice.
 */
export async function creatorAvailableBalance(creatorId: string) {
  const [{ data: earned, error: earnedError }, { data: withdrawn, error: withdrawnError }] = await Promise.all([
    supabaseAdmin.from('commissions').select('commission_amount').eq('creator_id', creatorId).in('status', ['confirmed', 'paid']),
    supabaseAdmin.from('payout_requests').select('amount').eq('creator_id', creatorId).in('status', ['pending', 'processed']),
  ])
  if (earnedError) throw earnedError
  if (withdrawnError) throw withdrawnError
  const earnedTotal = (earned || []).reduce((sum, row) => sum + (row.commission_amount || 0), 0)
  const withdrawnTotal = (withdrawn || []).reduce((sum, row) => sum + (row.amount || 0), 0)
  return earnedTotal - withdrawnTotal
}
