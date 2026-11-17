/**
 * Telegram bot for the shop owner: new-order alerts plus a private control
 * panel (see lib/telegram-bot.ts for the commands and buttons).
 *
 * Setup (once): create a bot with @BotFather, put its key in the Vercel
 * variable TELEGRAM_BOT_TOKEN and your chat ID in TELEGRAM_CHAT_ID, redeploy,
 * then press "Connect bot controls" in Admin → Settings.
 *
 * The bot only ever obeys TELEGRAM_CHAT_ID. Webhook calls are verified with a
 * secret derived from the bot key, so no extra variable is needed. Alerts never
 * hold up or fail an order: every call has a short timeout and callers treat
 * errors as log-only.
 */
import crypto from 'crypto'
import { SITE_URL } from '@/lib/seo'

const API = 'https://api.telegram.org'
const token = () => (process.env.TELEGRAM_BOT_TOKEN || '').trim()
export const ownerChatId = () => (process.env.TELEGRAM_CHAT_ID || '').trim()

export function telegramStatus() {
  return { tokenSet: Boolean(token()), chatIdSet: Boolean(ownerChatId()) }
}

export type InlineButton = { text: string; callback_data?: string; url?: string }
export type Keyboard = InlineButton[][]

/** Calls a Bot API method. Throws on a Telegram error. */
export async function tg(method: string, body?: Record<string, unknown>) {
  if (!token()) throw new Error('TELEGRAM_BOT_TOKEN is not set.')
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })
  const json: any = await res.json().catch(() => ({}))
  if (!json.ok) throw new Error(json.description || `Telegram ${method} failed (HTTP ${res.status})`)
  return json.result
}

/** Sends to the owner's chat. Returns the sent message, or null when not set up. */
export async function sendTelegramMessage(text: string, opts: { keyboard?: Keyboard; forceReply?: string; replyTo?: number } = {}) {
  if (!token() || !ownerChatId()) return null
  const reply_markup = opts.forceReply
    ? { force_reply: true, input_field_placeholder: opts.forceReply }
    : opts.keyboard?.length ? { inline_keyboard: opts.keyboard } : undefined
  return tg('sendMessage', {
    chat_id: ownerChatId(),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(reply_markup ? { reply_markup } : {}),
    ...(opts.replyTo ? { reply_parameters: { message_id: opts.replyTo, allow_sending_without_reply: true } } : {}),
  })
}

/** Replaces a message's text and buttons (used after an action on an order card). */
export async function editTelegramMessage(messageId: number, text: string, keyboard?: Keyboard) {
  try {
    await tg('editMessageText', {
      chat_id: ownerChatId(),
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: keyboard || [] },
    })
  } catch (error: any) {
    // "message is not modified" just means nothing changed.
    if (!/not modified/i.test(error?.message || '')) throw error
  }
}

/** The small toast shown after tapping a button. */
export async function answerCallback(callbackId: string, text?: string) {
  try { await tg('answerCallbackQuery', { callback_query_id: callbackId, ...(text ? { text: text.slice(0, 190) } : {}) }) } catch {}
}

/** People who have recently messaged the bot — used once to find the owner's chat ID. */
export async function recentTelegramChats(): Promise<Array<{ id: string; name: string; username: string | null }>> {
  if (!token()) return []
  const updates: any[] = await tg('getUpdates')
  const chats = new Map<string, { id: string; name: string; username: string | null }>()
  for (const u of updates || []) {
    const c = u?.message?.chat
    if (c?.type !== 'private') continue
    chats.set(String(c.id), { id: String(c.id), name: [c.first_name, c.last_name].filter(Boolean).join(' '), username: c.username || null })
  }
  return Array.from(chats.values())
}

// ── Webhook (bot controls) ──

/** Secret Telegram sends back on every webhook call; derived from the bot key. */
export function webhookSecret() {
  return crypto.createHmac('sha256', token() || 'unset').update('mana-telegram-webhook').digest('hex').slice(0, 48)
}

export const BOT_COMMANDS = [
  { command: 'orders', description: "Today's and open orders" },
  { command: 'order', description: 'Find an order: /order MANA123 or a phone number' },
  { command: 'sales', description: 'Sales: /sales today | week | month' },
  { command: 'stock', description: 'In / out of stock: /stock almonds' },
  { command: 'price', description: 'Change a price: /price almonds' },
  { command: 'reviews', description: 'Reviews waiting for approval' },
  { command: 'coupons', description: 'List and switch coupons on/off' },
  { command: 'newcoupon', description: 'Create: /newcoupon SAVE10 10% min 500' },
  { command: 'help', description: 'Everything the bot can do' },
]

/** Points Telegram at this site's webhook and sets the command menu. */
export async function connectBotControls(origin = SITE_URL) {
  await tg('setWebhook', {
    url: `${origin}/api/telegram/webhook`,
    secret_token: webhookSecret(),
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  })
  await tg('setMyCommands', { commands: BOT_COMMANDS, scope: { type: 'chat', chat_id: Number(ownerChatId()) } })
}

export async function botControlsStatus() {
  if (!token()) return { connected: false, url: '' }
  const info = await tg('getWebhookInfo')
  return { connected: Boolean(info?.url), url: String(info?.url || ''), lastError: info?.last_error_message || null }
}

// ── Formatting ──

export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const rupees = (paise: number) => {
  const p = Math.round(Number(paise) || 0)
  return `₹${(p / 100).toLocaleString('en-IN', p % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })}`
}
export const grams = (g: number) => (!g ? '' : g >= 1000 ? `${Number((g / 1000).toFixed(2))} kg` : `${g} g`)
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`

/** Indian mobile numbers as +91 XXXXX XXXXX, plus the digits for a wa.me link. */
export function phoneParts(raw: unknown) {
  const digits = String(raw || '').replace(/\D/g, '')
  const local = digits.length > 10 && digits.startsWith('91') ? digits.slice(-10) : digits
  if (local.length !== 10) return { shown: String(raw || ''), wa: digits }
  return { shown: `+91 ${local.slice(0, 5)} ${local.slice(5)}`, wa: `91${local}` }
}

export const orderCode = (order: any) => order.order_ref || String(order.id || '').slice(0, 8).toUpperCase()
export const isUnpaidOnlineAttempt = (order: any) => order.notes === 'Awaiting online payment' && order.payment_status !== 'paid'

const STATUS_LABEL: Record<string, string> = {
  pending: '🕓 Pending', confirmed: '✅ Confirmed', packed: '📦 Packed', shipped: '🚚 Shipped', delivered: '🏁 Delivered', cancelled: '❌ Cancelled',
}

type AlertExtras = { heading?: string; previousOrders?: number | null; refCode?: string | null; showStatus?: boolean }

/** The full message for an order (HTML for Telegram). */
export function orderAlertText(order: any, extras: AlertExtras = {}) {
  const paid = order.payment_status === 'paid'
  const how = paid ? `✅ ${esc(order.notes || 'Paid online')}` : isUnpaidOnlineAttempt(order) ? '⚠️ Online payment not completed' : '💵 Cash on delivery'
  const when = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : ''

  // Price breakdown — only the parts that apply to this order.
  const discount = Number(order.discount_amount || order.discount) || 0
  const parts = [
    `Items ${rupees(order.subtotal || 0)}`,
    Number(order.shipping) > 0 ? `Shipping ${rupees(order.shipping)}` : 'Free shipping',
    Number(order.cod_charge) > 0 ? `COD charge ${rupees(order.cod_charge)}` : '',
    Number(order.small_order_fee) > 0 ? `Small-order fee ${rupees(order.small_order_fee)}` : '',
    discount > 0 ? `Discount −${rupees(discount)}${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}` : '',
    Number(order.wallet_used) > 0 ? `Wallet −${rupees(order.wallet_used)}` : '',
  ].filter(Boolean)

  const prev = extras.previousOrders
  const who = prev == null ? '' : prev === 0 ? ' — ⭐ New customer' : ` — 🔁 Repeat customer (${ordinal(prev + 1)} order)`
  const phone = phoneParts(order.customer_phone)
  const address = [order.address, [order.city, order.state].filter(Boolean).join(', ')].filter(Boolean).join(', ')

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const units = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0)
  const lines = items.slice(0, 15).map(i => {
    const detail = [i.variant_name, grams(i.weight_grams)].filter(Boolean).join(', ')
    const total = i.line_total != null ? ` = ${rupees(i.line_total)}` : ''
    return `• ${esc(i.product_name || 'Item')}${detail ? ` — ${esc(detail)}` : ''} × ${Number(i.quantity) || 1}${total}`
  })
  if (items.length > 15) lines.push(`• …and ${items.length - 15} more`)

  const tracking = order.tracking_number
    ? `🚚 ${esc(order.courier_name || 'Courier')} · AWB <code>${esc(order.tracking_number)}</code>${order.tracking_link ? ` · <a href="${esc(order.tracking_link)}">Track</a>` : ''}`
    : null

  // null = an optional line this order doesn't have; '' = a deliberate blank line.
  const out = [
    `${extras.heading || '🛒 <b>New order</b>'} · <code>${esc(orderCode(order))}</code>`,
    when ? `🕒 ${esc(when)}` : null,
    extras.showStatus ? `Status: <b>${STATUS_LABEL[order.status] || esc(order.status)}</b>` : null,
    '',
    `💰 <b>${rupees(order.final_amount ?? order.total ?? 0)}</b> · ${how}`,
    `<i>${parts.join(' · ')}</i>`,
    '',
    `👤 <b>${esc(order.customer_name || 'Customer')}</b>${who}`,
    order.customer_phone ? `📞 ${esc(phone.shown)}${phone.wa ? ` · <a href="https://wa.me/${phone.wa}">WhatsApp</a>` : ''}` : null,
    order.customer_email ? `✉️ ${esc(order.customer_email)}` : null,
    `📍 ${esc(address)}${order.pincode ? ` – ${esc(order.pincode)}` : ''}`,
    '',
    `🧺 <b>${units} item${units === 1 ? '' : 's'}</b>`,
    ...lines,
    tracking ? `\n${tracking}` : null,
    order.invoice_url ? `🧾 <a href="${esc(order.invoice_url)}">Invoice</a>` : null,
    extras.refCode ? `\n🔗 Came via creator link: <code>${esc(extras.refCode)}</code>` : null,
    '',
    `<a href="${SITE_URL}/admin?tab=orders">Open orders in admin</a>`,
  ].filter((l): l is string => l !== null)
  return out.filter((l, i) => !(l === '' && out[i - 1] === '')).join('\n').trim()
}

/** Buttons for an order, depending on where it is in its life. */
export function orderKeyboard(order: any): Keyboard {
  const id = order.id
  const rows: Keyboard = []
  const wa = phoneParts(order.customer_phone).wa
  if (isUnpaidOnlineAttempt(order)) {
    rows.push([{ text: '🔁 Re-check payment', callback_data: `or:${id}` }])
  } else if (['pending', 'confirmed', 'packed'].includes(order.status)) {
    rows.push([
      ...(order.status === 'pending' ? [{ text: '✅ Confirm', callback_data: `oc:${id}` }] : []),
      ...(order.status === 'confirmed' ? [{ text: '📦 Packed', callback_data: `opk:${id}` }] : []),
      { text: '🚚 Ship', callback_data: `os:${id}` },
    ])
    rows.push([{ text: '❌ Cancel order', callback_data: `ox:${id}` }])
  } else if (order.status === 'shipped') {
    rows.push([{ text: '🏁 Mark delivered', callback_data: `odl:${id}` }])
  }
  rows.push([
    ...(wa ? [{ text: '💬 WhatsApp customer', url: `https://wa.me/${wa}` }] : []),
    { text: '🔄 Refresh', callback_data: `ov:${id}` },
  ])
  return rows
}

/** Tells the owner about a confirmed order, with action buttons. Never throws. */
export async function sendOrderAlert(order: any, extras: AlertExtras = {}) {
  try {
    await sendTelegramMessage(orderAlertText(order, extras), { keyboard: orderKeyboard(order) })
  } catch (error) {
    console.error('[telegram] order alert failed for', order?.order_ref || order?.id, error)
  }
}
