import { handleSchedule } from '@vercel/schedules'
import { supabaseAdmin } from '@/lib/supabase'
import { isUnpaidOnlineAttempt, sendTelegramMessage, telegramStatus } from '@/lib/telegram'
import { salesReport } from '@/lib/telegram-bot'

export const dynamic = 'force-dynamic'

// A run can be delivered more than once; never send the same night twice.
const done = new Set<string>()

/**
 * Nightly sales summary to the owner's Telegram (schedule "telegram-daily-summary"
 * in vercel.json, 21:00 India time). Private: only Vercel's scheduler can call it.
 */
export const POST = handleSchedule(async metadata => {
  if (done.has(metadata.executionId)) return
  done.add(metadata.executionId)
  // After an outage old runs are replayed; a summary only makes sense the same evening.
  if (Date.now() - new Date(metadata.scheduledAt).getTime() > 3 * 3600e3) return
  const status = telegramStatus()
  if (!status.tokenSet || !status.chatIdSet) return

  const [report, open, reviews] = await Promise.all([
    salesReport('today'),
    supabaseAdmin.from('orders').select('status,notes,payment_status').in('status', ['pending', 'confirmed', 'packed']).limit(500),
    supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true }).eq('approved', false),
  ])
  const toShip = (open.data || []).filter(o => !isUnpaidOnlineAttempt(o)).length
  const waitingReviews = reviews.count || 0

  await sendTelegramMessage(
    [
      '🌙 <b>Daily summary</b>',
      '',
      report,
      '',
      `📦 Still to ship: <b>${toShip}</b>${toShip ? ' — send /orders' : ''}`,
      waitingReviews ? `📝 Reviews waiting: <b>${waitingReviews}</b> — send /reviews` : null,
    ].filter(l => l !== null).join('\n'),
    { keyboard: [[{ text: '7 days', callback_data: 'sl:week' }, { text: 'Month', callback_data: 'sl:month' }]] }
  )
})
