import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppButtons, sendWhatsAppMessage, sendWhatsAppTemplate } from './sender'

/**
 * Conversation + message storage for the WhatsApp assistant and the admin
 * inbox (tables in lib/whatsapp-inbox-schema.sql). Everything the customer
 * sends and everything we send is recorded here, so the inbox shows the whole
 * chat and the assistant can read recent history.
 */

export type Stage = 'new' | 'browsing' | 'cart' | 'details' | 'payment_sent' | 'paid' | 'needs_human' | 'closed'

export type CartLine = {
  slug: string
  product_id: string
  name: string
  variant_id: string | null
  variant_name: string | null
  grams: number | null
  quantity: number
}

export type CustomerInfo = {
  name?: string
  address?: string
  city?: string
  state?: string | null
  pincode?: string
  email?: string | null
}

export type Conversation = {
  phone: string
  name: string | null
  stage: Stage
  bot_paused: boolean
  needs_human_reason: string | null
  cart: CartLine[]
  customer: CustomerInfo
  pending_order: any | null
  last_order_id: string | null
  last_order_ref: string | null
  last_message_at: string
  last_message_preview: string | null
  last_inbound_at: string | null
  unread_count: number
}

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  browsing: 'Browsing',
  cart: 'Cart',
  details: 'Details',
  payment_sent: 'Payment link sent',
  paid: 'Paid',
  needs_human: 'Needs you',
  closed: 'Closed',
}

/** WhatsApp ids are digits with country code: 917011693791. */
export function waId(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length === 10 ? `91${digits}` : digits
}

/** The 10-digit form the website uses for accounts and orders. */
export function localPhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

function preview(text: string | null | undefined) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

export async function getConversation(phone: string): Promise<Conversation> {
  const id = waId(phone)
  const { data } = await supabaseAdmin.from('wa_conversations').select('*').eq('phone', id).maybeSingle()
  if (data) return { ...data, cart: data.cart || [], customer: data.customer || {} } as Conversation
  const fresh = { phone: id, stage: 'new' as Stage }
  const { data: created, error } = await supabaseAdmin.from('wa_conversations').upsert(fresh, { onConflict: 'phone' }).select('*').single()
  if (error) throw error
  return { ...created, cart: created.cart || [], customer: created.customer || {} } as Conversation
}

export async function updateConversation(phone: string, patch: Partial<Omit<Conversation, 'phone'>>) {
  const { error } = await supabaseAdmin
    .from('wa_conversations')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('phone', waId(phone))
  if (error) throw error
}

/**
 * Saves an incoming message. Returns false if Meta already delivered it
 * (Meta retries webhooks), so the caller doesn't reply twice.
 */
export async function recordInbound(params: {
  phone: string
  waMessageId: string
  type: string
  body: string
  payload?: unknown
  name?: string | null
}): Promise<boolean> {
  const id = waId(params.phone)
  const { error } = await supabaseAdmin.from('wa_messages').insert({
    phone: id,
    direction: 'in',
    sender: 'customer',
    wa_message_id: params.waMessageId || null,
    type: params.type,
    body: params.body,
    payload: params.payload ?? null,
  })
  if (error) {
    if (error.code === '23505') return false // unique violation: duplicate delivery
    throw error
  }

  const current = await getConversation(id)
  const now = new Date().toISOString()
  await supabaseAdmin
    .from('wa_conversations')
    .update({
      name: params.name || current.name,
      last_message_at: now,
      last_inbound_at: now,
      last_message_preview: preview(params.body),
      unread_count: (current.unread_count || 0) + 1,
      // A closed chat reopens when the customer writes again.
      stage: current.stage === 'closed' || current.stage === 'paid' ? 'browsing' : current.stage === 'new' ? 'browsing' : current.stage,
      updated_at: now,
    })
    .eq('phone', id)
  return true
}

async function recordOutbound(phone: string, sender: 'bot' | 'admin' | 'system', type: string, body: string, payload?: unknown, waMessageId?: string | null) {
  const id = waId(phone)
  const now = new Date().toISOString()
  await supabaseAdmin.from('wa_messages').insert({
    phone: id,
    direction: 'out',
    sender,
    wa_message_id: waMessageId || null,
    type,
    body,
    payload: payload ?? null,
    status: 'sent',
  })
  await supabaseAdmin.from('wa_conversations').update({ last_message_at: now, last_message_preview: preview(body), updated_at: now }).eq('phone', id)
}

export async function updateMessageStatus(waMessageId: string, status: string) {
  if (!waMessageId) return
  await supabaseAdmin.from('wa_messages').update({ status }).eq('wa_message_id', waMessageId)
}

/**
 * Where replies go. In production that's WhatsApp; the admin test page swaps
 * in a capture transport so you can try the assistant without sending
 * anything to a real phone.
 */
export type Outbox = {
  /** Test mode: no real orders, payment links or owner alerts. */
  test?: boolean
  text(phone: string, body: string, sender?: 'bot' | 'admin' | 'system'): Promise<void>
  buttons(phone: string, body: string, buttons: { id: string; title: string }[]): Promise<void>
}

function messageIdOf(result: any): string | null {
  return result?.messages?.[0]?.id || null
}

export const whatsappOutbox: Outbox = {
  async text(phone, body, sender = 'bot') {
    const result = await sendWhatsAppMessage(waId(phone), body)
    await recordOutbound(phone, sender, 'text', body, null, messageIdOf(result))
  },
  async buttons(phone, body, buttons) {
    const result = await sendWhatsAppButtons(waId(phone), body, buttons)
    await recordOutbound(phone, 'bot', 'buttons', body, { buttons }, messageIdOf(result))
  },
}

/** Captures replies instead of sending them (admin test page). Still records them. */
export function captureOutbox(transcript: string[]): Outbox {
  return {
    test: true,
    async text(phone, body, sender = 'bot') {
      transcript.push(body)
      await recordOutbound(phone, sender, 'text', body)
    },
    async buttons(phone, body, buttons) {
      transcript.push(`${body}\n${buttons.map(b => `[ ${b.title} ]`).join('  ')}`)
      await recordOutbound(phone, 'bot', 'buttons', body, { buttons })
    },
  }
}

/** Text of the last N messages, oldest first, for the assistant's context. */
export async function recentHistory(phone: string, limit = 24) {
  const { data } = await supabaseAdmin
    .from('wa_messages')
    .select('direction, sender, body, type, created_at')
    .eq('phone', waId(phone))
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []).reverse()
}

/** WhatsApp only allows free-form replies within 24 hours of the customer's last message. */
export function insideReplyWindow(conversation: Pick<Conversation, 'last_inbound_at'>) {
  if (!conversation.last_inbound_at) return false
  return Date.now() - new Date(conversation.last_inbound_at).getTime() < 24 * 60 * 60 * 1000
}

/**
 * Tells you (the shop owner) that a chat needs a person. Free-form WhatsApp
 * messages only reach your phone if you've messaged the business number in
 * the last 24 hours, so an approved template is used when one is configured.
 */
export async function alertOwner(conversation: Pick<Conversation, 'phone' | 'name'>, reason: string) {
  const to = String(process.env.WHATSAPP_ALERT_NUMBER || '').replace(/\D/g, '')
  if (!to) return
  const who = conversation.name ? `${conversation.name} (+${conversation.phone})` : `+${conversation.phone}`
  try {
    const template = process.env.WHATSAPP_ALERT_TEMPLATE_NAME
    if (template) {
      await sendWhatsAppTemplate(waId(to), template, process.env.WHATSAPP_ALERT_TEMPLATE_LANG || 'en', [who, reason.slice(0, 200)])
    } else {
      await sendWhatsAppMessage(waId(to), `Mana inbox: ${who} needs you.\nReason: ${reason}\nOpen: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.manadryfruits.com'}/admin/whatsapp`)
    }
  } catch (error) {
    console.error('[whatsapp] owner alert failed', error)
  }
}
