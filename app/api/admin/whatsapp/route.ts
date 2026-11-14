import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { insideReplyWindow, updateConversation, waId, whatsappOutbox, type Stage } from '@/lib/whatsapp/inbox'

export const dynamic = 'force-dynamic'

const STAGES: Stage[] = ['new', 'browsing', 'cart', 'details', 'payment_sent', 'paid', 'needs_human', 'closed']

/**
 * Admin WhatsApp inbox.
 * GET                → chat list (?stage=, ?q=) + counts
 * GET ?phone=...     → one chat with its messages (marks it read)
 * POST {action, phone, text?} → reply | pause | resume | close
 */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')

  if (phone) {
    const id = waId(phone)
    const [{ data: conversation }, { data: messages }] = await Promise.all([
      supabaseAdmin.from('wa_conversations').select('*').eq('phone', id).maybeSingle(),
      supabaseAdmin.from('wa_messages').select('id, direction, sender, type, body, payload, status, created_at').eq('phone', id).order('created_at', { ascending: false }).limit(300),
    ])
    if (!conversation) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    if (conversation.unread_count) await supabaseAdmin.from('wa_conversations').update({ unread_count: 0 }).eq('phone', id)
    return NextResponse.json({
      conversation: { ...conversation, unread_count: 0, can_reply: insideReplyWindow(conversation) },
      messages: (messages || []).reverse(),
    })
  }

  const stage = searchParams.get('stage')
  const q = String(searchParams.get('q') || '').trim()
  let query = supabaseAdmin.from('wa_conversations').select('*').order('last_message_at', { ascending: false }).limit(200)
  if (stage && STAGES.includes(stage as Stage)) query = query.eq('stage', stage)
  if (q) query = query.or(`phone.ilike.%${q.replace(/[^0-9a-zA-Z ]/g, '')}%,name.ilike.%${q.replace(/[^0-9a-zA-Z ]/g, '')}%`)
  const { data: conversations, error } = await query
  if (error) {
    const missing = /does not exist|schema cache/i.test(error.message)
    return NextResponse.json({ error: missing ? 'Inbox tables are not set up yet. Run lib/whatsapp-inbox-schema.sql in Supabase.' : error.message }, { status: missing ? 503 : 500 })
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const [today, needs, payment, paid] = await Promise.all([
    supabaseAdmin.from('wa_conversations').select('phone', { count: 'exact', head: true }).gte('last_message_at', startOfDay.toISOString()),
    supabaseAdmin.from('wa_conversations').select('phone', { count: 'exact', head: true }).eq('stage', 'needs_human'),
    supabaseAdmin.from('wa_conversations').select('phone', { count: 'exact', head: true }).eq('stage', 'payment_sent'),
    supabaseAdmin.from('wa_conversations').select('phone', { count: 'exact', head: true }).eq('stage', 'paid'),
  ])

  return NextResponse.json({
    conversations: conversations || [],
    counts: { today: today.count || 0, needs_human: needs.count || 0, payment_sent: payment.count || 0, paid: paid.count || 0 },
  })
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const phone = waId(String(body.phone || ''))
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 })

  const { data: conversation } = await supabaseAdmin.from('wa_conversations').select('*').eq('phone', phone).maybeSingle()
  if (!conversation) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })

  if (action === 'reply') {
    const text = String(body.text || '').trim().slice(0, 4000)
    if (!text) return NextResponse.json({ error: 'Type a message first.' }, { status: 400 })
    if (!insideReplyWindow(conversation)) {
      return NextResponse.json({ error: 'It has been more than 24 hours since this customer last wrote, so WhatsApp only allows approved template messages. Ask them to message you, or call them.' }, { status: 409 })
    }
    try {
      await whatsappOutbox.text(phone, text, 'admin')
    } catch (error: any) {
      return NextResponse.json({ error: `WhatsApp did not accept the message: ${error?.message || 'unknown error'}` }, { status: 502 })
    }
    // Replying yourself takes the chat over, so the assistant doesn't talk over you.
    await updateConversation(phone, { bot_paused: true, unread_count: 0 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'pause') {
    await updateConversation(phone, { bot_paused: true })
    return NextResponse.json({ ok: true })
  }

  if (action === 'resume') {
    await updateConversation(phone, {
      bot_paused: false,
      needs_human_reason: null,
      stage: conversation.stage === 'needs_human' ? (conversation.cart?.length ? 'cart' : 'browsing') : conversation.stage,
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'close') {
    await updateConversation(phone, { stage: 'closed', bot_paused: false, needs_human_reason: null, unread_count: 0 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
