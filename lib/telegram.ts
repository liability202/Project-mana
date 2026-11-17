/**
 * New-order alerts to the owner's phone through a Telegram bot.
 *
 * Setup (once): create a bot with @BotFather, put its key in the Vercel
 * variable TELEGRAM_BOT_TOKEN, send the bot any message, then copy the chat ID
 * shown in Admin → Settings → Order alerts into TELEGRAM_CHAT_ID and redeploy.
 *
 * Alerts must never hold up or fail an order, so every call has a short
 * timeout and callers treat errors as log-only.
 */
import { SITE_URL } from '@/lib/seo'

const API = 'https://api.telegram.org'
const token = () => (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const chatId = () => (process.env.TELEGRAM_CHAT_ID || '').trim()

export function telegramStatus() {
  return { tokenSet: Boolean(token()), chatIdSet: Boolean(chatId()) }
}

async function call(method: string, body?: Record<string, unknown>) {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000),
    cache: 'no-store',
  })
  const json: any = await res.json().catch(() => ({}))
  if (!json.ok) throw new Error(json.description || `Telegram ${method} failed (HTTP ${res.status})`)
  return json.result
}

/** Sends to the owner's chat. Returns false (without throwing) when not set up. */
export async function sendTelegramMessage(text: string) {
  if (!token() || !chatId()) return false
  await call('sendMessage', { chat_id: chatId(), text, parse_mode: 'HTML', disable_web_page_preview: true })
  return true
}

/** People who have recently messaged the bot — used once to find the owner's chat ID. */
export async function recentTelegramChats(): Promise<Array<{ id: string; name: string; username: string | null }>> {
  if (!token()) return []
  const updates: any[] = await call('getUpdates')
  const chats = new Map<string, { id: string; name: string; username: string | null }>()
  for (const u of updates || []) {
    const c = u?.message?.chat
    if (c?.type !== 'private') continue
    chats.set(String(c.id), { id: String(c.id), name: [c.first_name, c.last_name].filter(Boolean).join(' '), username: c.username || null })
  }
  return Array.from(chats.values())
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const rupees = (paise: number) => {
  const p = Math.round(Number(paise) || 0)
  return `₹${(p / 100).toLocaleString('en-IN', p % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })}`
}
const grams = (g: number) => (!g ? '' : g >= 1000 ? `${Number((g / 1000).toFixed(2))} kg` : `${g} g`)
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`

/** Indian mobile numbers as +91 XXXXX XXXXX, plus the digits for a wa.me link. */
function phoneParts(raw: unknown) {
  const digits = String(raw || '').replace(/\D/g, '')
  const local = digits.length > 10 && digits.startsWith('91') ? digits.slice(-10) : digits
  if (local.length !== 10) return { shown: String(raw || ''), wa: digits }
  return { shown: `+91 ${local.slice(0, 5)} ${local.slice(5)}`, wa: `91${local}` }
}

type AlertExtras = { heading?: string; previousOrders?: number | null; refCode?: string | null }

/** The alert text for a confirmed order (HTML for Telegram). */
export function orderAlertText(order: any, extras: AlertExtras = {}) {
  const paid = order.payment_status === 'paid'
  const how = paid ? `✅ ${esc(order.notes || 'Paid online')}` : '💵 Cash on delivery'
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

  // null = an optional line this order doesn't have; '' = a deliberate blank line.
  const out = [
    `${extras.heading || '🛒 <b>New order</b>'} · <code>${esc(order.order_ref || String(order.id || '').slice(0, 8))}</code>`,
    when ? `🕒 ${esc(when)}` : null,
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
    extras.refCode ? `\n🔗 Came via creator link: <code>${esc(extras.refCode)}</code>` : null,
    '',
    `<a href="${SITE_URL}/admin?tab=orders">Open orders in admin</a>`,
  ].filter((l): l is string => l !== null)
  return out.filter((l, i) => !(l === '' && out[i - 1] === '')).join('\n').trim()
}

/** Tells the owner about a confirmed order. Never throws. */
export async function sendOrderAlert(order: any, extras: AlertExtras = {}) {
  try {
    await sendTelegramMessage(orderAlertText(order, extras))
  } catch (error) {
    console.error('[telegram] order alert failed for', order?.order_ref || order?.id, error)
  }
}
