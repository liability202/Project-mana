import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { esc, isUnpaidOnlineAttempt, orderAlertText, orderKeyboard, sendTelegramMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

const alerted = new Set<string>()

/**
 * Called by the checkout page when a customer closes the Razorpay window
 * without paying. Tells the owner on Telegram so they can follow up.
 * Public on purpose, so it only ever alerts about a real, recent, unpaid
 * attempt, at most once per order.
 */
export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    if (!rateLimit(`abandoned:${ip}`, 10, 10 * 60 * 1000).ok) return NextResponse.json({ ok: true })

    const body = await req.json().catch(() => ({}))
    const razorpayOrderId = String(body?.razorpay_order_id || '')
    if (!/^order_[A-Za-z0-9]{6,40}$/.test(razorpayOrderId)) return NextResponse.json({ ok: true })

    const { data: order } = await supabaseAdmin.from('orders').select('*').eq('razorpay_order_id', razorpayOrderId).maybeSingle()
    if (!order || !isUnpaidOnlineAttempt(order) || alerted.has(order.id)) return NextResponse.json({ ok: true })
    if (Date.now() - new Date(order.created_at).getTime() > 6 * 3600e3) return NextResponse.json({ ok: true })
    alerted.add(order.id)

    const reason = String(body?.reason || '').slice(0, 140)
    const heading = `⚠️ <b>Payment not completed</b>${reason ? ` — <i>${esc(reason)}</i>` : ' — customer closed the payment window'}`
    await sendTelegramMessage(orderAlertText(order, { heading }), { keyboard: orderKeyboard(order) })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[abandoned] alert failed', error)
    return NextResponse.json({ ok: true })
  }
}
