/**
 * The owner's Telegram control panel: commands and button taps arriving at
 * /api/telegram/webhook. Only the owner's chat ever reaches this (checked in
 * the route).
 *
 * Order, shipping, payment and review actions go through the same admin API
 * routes the admin panel uses (so every rule and customer notification stays
 * in one place). Stock, price and coupon on/off are single-field updates done
 * here, because the generic product/coupon PUT routes expect a full record.
 *
 * Multi-step actions (parcel weight, new price) are stateless: the bot asks
 * with a "reply to this message" prompt carrying a [tag], and the reply is
 * matched by that tag.
 */
import { supabaseAdmin } from '@/lib/supabase'
import { phoneVariants } from '@/lib/session'
import { revalidateCatalog } from '@/lib/revalidate'
import { getNimbusCourierRates, isCodOrder } from '@/lib/nimbuspost'
import {
  answerCallback, editTelegramMessage, esc, grams, isUnpaidOnlineAttempt, orderAlertText, orderCode, orderKeyboard,
  rupees, sendTelegramMessage, type Keyboard,
} from '@/lib/telegram'

const ORDER_FIELDS = '*'
const OPEN_STATUSES = ['pending', 'confirmed', 'packed']
const BOX = { length_cm: 20, breadth_cm: 15, height_cm: 12 } // same default box as the admin Ship form

// ── helpers ──

/** Calls one of the site's admin API routes as the admin. */
async function adminApi(origin: string, path: string, method: string, body?: unknown) {
  const res = await fetch(`${origin}${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.ADMIN_SECRET || ''}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(60000),
  })
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Request failed (HTTP ${res.status})`)
  return data
}

async function getOrder(id: string) {
  const { data } = await supabaseAdmin.from('orders').select(ORDER_FIELDS).eq('id', id).maybeSingle()
  return data
}

const orderCard = (order: any) => orderAlertText(order, { heading: '📋 <b>Order</b>', showStatus: true })

/** Midnight in India for today, the last 7 days, or this month, as an ISO string. */
function periodStart(period: 'today' | 'week' | 'month') {
  const ist = new Date(Date.now() + 5.5 * 3600e3) // shifted so the UTC fields read as Indian time
  let y = ist.getUTCFullYear(), m = ist.getUTCMonth(), d = ist.getUTCDate()
  if (period === 'week') d -= 6
  if (period === 'month') d = 1
  return new Date(Date.UTC(y, m, d) - 5.5 * 3600e3).toISOString()
}

const parseRupees = (s: string) => {
  const n = Number(String(s).replace(/[₹,\s]|rs\.?|inr/gi, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null
}

// ── commands ──

const HELP = [
  '🤖 <b>Mana shop controls</b>',
  '',
  '<b>Orders</b>',
  '/orders — today\'s orders and everything still to ship',
  '/order MANA123 — find by order number, phone or name',
  'Every new order arrives here with buttons: Confirm, Packed, Ship, Cancel, Delivered.',
  '',
  '<b>Store</b>',
  '/sales — today · /sales week · /sales month',
  '/stock almonds — mark in / out of stock (just /stock lists what is out)',
  '/price almonds — change a price',
  '/reviews — reviews waiting for approval',
  '/coupons — list and switch coupons on/off',
  '/newcoupon SAVE10 10% min 500 — new coupon (also ₹50 off: /newcoupon FLAT50 50rs)',
].join('\n')

async function cmdOrders() {
  const since = periodStart('today')
  const [{ data: today }, { data: open }] = await Promise.all([
    supabaseAdmin.from('orders').select(ORDER_FIELDS).gte('created_at', since).order('created_at', { ascending: false }).limit(40),
    supabaseAdmin.from('orders').select(ORDER_FIELDS).in('status', OPEN_STATUSES).order('created_at', { ascending: true }).limit(40),
  ])
  const real = (list: any[] | null) => (list || []).filter(o => !isUnpaidOnlineAttempt(o) && o.status !== 'cancelled')
  const todays = real(today)
  const toShip = real(open)
  const line = (o: any) => `• <code>${esc(orderCode(o))}</code> ${rupees(o.final_amount ?? o.total)} · ${o.payment_status === 'paid' ? 'paid' : 'COD'} · ${esc(o.customer_name || '')} · ${esc(o.status)}`
  const text = [
    `📅 <b>Today</b>: ${todays.length} order${todays.length === 1 ? '' : 's'}, ${rupees(todays.reduce((s, o) => s + Number(o.final_amount ?? o.total ?? 0), 0))}`,
    ...todays.slice(0, 10).map(line),
    '',
    `📦 <b>To ship</b>: ${toShip.length}`,
    ...toShip.slice(0, 15).map(line),
    toShip.length ? '\nTap an order to open it.' : '\nNothing waiting to ship. 🎉',
  ].join('\n')
  const ids = Array.from(new Map([...toShip, ...todays].map(o => [o.id, o])).values()).slice(0, 12)
  const keyboard: Keyboard = []
  for (let i = 0; i < ids.length; i += 3) keyboard.push(ids.slice(i, i + 3).map(o => ({ text: orderCode(o), callback_data: `on:${o.id}` })))
  await sendTelegramMessage(text, { keyboard })
}

async function cmdOrder(q: string) {
  q = q.trim()
  if (!q) return sendTelegramMessage('Send it like this: <code>/order MANA2TJ6KZ</code>, a phone number, or a customer name.')
  let rows: any[] = []
  const digits = q.replace(/\D/g, '')
  if (digits.length >= 10) {
    const { data } = await supabaseAdmin.from('orders').select(ORDER_FIELDS).in('customer_phone', phoneVariants(digits)).order('created_at', { ascending: false }).limit(8)
    rows = data || []
  } else {
    const safe = q.replace(/[%_\\]/g, '')
    const [byRef, byName] = await Promise.all([
      supabaseAdmin.from('orders').select(ORDER_FIELDS).ilike('order_ref', `%${safe}%`).order('created_at', { ascending: false }).limit(8),
      supabaseAdmin.from('orders').select(ORDER_FIELDS).ilike('customer_name', `%${safe}%`).order('created_at', { ascending: false }).limit(8),
    ])
    rows = Array.from(new Map([...(byRef.data || []), ...(byName.data || [])].map(o => [o.id, o])).values())
      .sort((x, y) => String(y.created_at).localeCompare(String(x.created_at))).slice(0, 8)
  }
  if (!rows.length) return sendTelegramMessage(`No order found for “${esc(q)}”.`)
  if (rows.length === 1) return sendTelegramMessage(orderCard(rows[0]), { keyboard: orderKeyboard(rows[0]) })
  await sendTelegramMessage(
    [`Found ${rows.length} orders:`, ...rows.map(o => `• <code>${esc(orderCode(o))}</code> ${rupees(o.final_amount ?? o.total)} · ${esc(o.customer_name || '')} · ${esc(o.status)}`)].join('\n'),
    { keyboard: rows.map(o => [{ text: `${orderCode(o)} · ${o.status}`, callback_data: `on:${o.id}` }]) }
  )
}

/** Sales numbers for a period; also used by the nightly summary. */
export async function salesReport(period: 'today' | 'week' | 'month') {
  const { data } = await supabaseAdmin.from('orders').select('status,payment_status,notes,final_amount,total,items,created_at').gte('created_at', periodStart(period)).limit(2000)
  const all = data || []
  const real = all.filter(o => o.status !== 'cancelled' && !isUnpaidOnlineAttempt(o))
  const amount = (o: any) => Number(o.final_amount ?? o.total ?? 0)
  const revenue = real.reduce((s, o) => s + amount(o), 0)
  const cod = real.filter(o => o.payment_status !== 'paid')
  const online = real.filter(o => o.payment_status === 'paid')
  const products = new Map<string, { qty: number; revenue: number }>()
  for (const o of real) for (const i of (o.items || []) as any[]) {
    const p = products.get(i.product_name) || { qty: 0, revenue: 0 }
    p.qty += Number(i.quantity) || 1
    p.revenue += Number(i.line_total) || 0
    products.set(i.product_name, p)
  }
  const top = Array.from(products.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
  const unpaid = all.filter(isUnpaidOnlineAttempt).length
  const cancelled = all.filter(o => o.status === 'cancelled' && !isUnpaidOnlineAttempt(o)).length
  const label = { today: 'Today', week: 'Last 7 days', month: 'This month' }[period]
  return [
    `📊 <b>${label}</b>`,
    `Orders: <b>${real.length}</b> · Revenue: <b>${rupees(revenue)}</b>`,
    real.length ? `Average order: ${rupees(revenue / real.length)}` : null,
    `💵 COD: ${cod.length} (${rupees(cod.reduce((s, o) => s + amount(o), 0))}) · ✅ Paid online: ${online.length} (${rupees(online.reduce((s, o) => s + amount(o), 0))})`,
    cancelled ? `❌ Cancelled: ${cancelled}` : null,
    unpaid ? `⚠️ Online payments not completed: ${unpaid}` : null,
    top.length ? '\n<b>Top products</b>' : null,
    ...top.map(([name, p], i) => `${i + 1}. ${esc(name)} — ${p.qty} sold · ${rupees(p.revenue)}`),
  ].filter(l => l !== null).join('\n')
}

async function cmdSales(arg: string) {
  const period = /month/i.test(arg) ? 'month' : /week/i.test(arg) ? 'week' : 'today'
  await sendTelegramMessage(await salesReport(period), {
    keyboard: [[{ text: 'Today', callback_data: 'sl:today' }, { text: '7 days', callback_data: 'sl:week' }, { text: 'Month', callback_data: 'sl:month' }]],
  })
}

// Stock

function stockView(products: any[]) {
  const text = ['📦 <b>Stock</b>', ...products.map(p => `• ${esc(p.name)} — ${p.in_stock === false ? '❌ Out of stock' : '✅ In stock'}`)].join('\n')
  const keyboard: Keyboard = products.map(p => [{
    text: p.in_stock === false ? `✅ Back in stock: ${p.name}` : `❌ Out of stock: ${p.name}`,
    callback_data: `st:${p.id}:${p.in_stock === false ? 1 : 0}`,
  }])
  return { text, keyboard }
}

async function findProducts(q: string, limit: number) {
  const safe = q.trim().replace(/[%_\\]/g, '')
  const cols = 'id,name,slug,in_stock,price,price_per_unit,variants,category'
  const [byName, bySlug] = await Promise.all([
    supabaseAdmin.from('products').select(cols).ilike('name', `%${safe}%`).order('name').limit(limit),
    supabaseAdmin.from('products').select(cols).ilike('slug', `%${safe.replace(/\s+/g, '-')}%`).order('name').limit(limit),
  ])
  return Array.from(new Map([...(byName.data || []), ...(bySlug.data || [])].map(p => [p.id, p])).values()).slice(0, limit)
}

async function cmdStock(q: string) {
  if (!q.trim()) {
    const { data } = await supabaseAdmin.from('products').select('id,name,slug,in_stock').eq('in_stock', false).order('name').limit(20)
    if (!data?.length) return sendTelegramMessage('Everything is in stock. To change one: <code>/stock almonds</code>')
    const v = stockView(data)
    return sendTelegramMessage(`${v.text}\n\nTo find another: <code>/stock name</code>`, { keyboard: v.keyboard })
  }
  const products = await findProducts(q, 8)
  if (!products.length) return sendTelegramMessage(`No product matches “${esc(q)}”.`)
  const v = stockView(products)
  await sendTelegramMessage(v.text, { keyboard: v.keyboard })
}

// Price

function priceUnit(p: any) { return String(p.price_per_unit || '').trim() || 'per unit' }

async function cmdPrice(q: string) {
  if (!q.trim()) return sendTelegramMessage('Send it like this: <code>/price almonds</code>')
  const products = (await findProducts(q, 3)).filter(p => p.category !== 'kits')
  if (!products.length) return sendTelegramMessage(`No product matches “${esc(q)}”. (Kit prices are set in admin.)`)
  for (const p of products) {
    const variants: any[] = Array.isArray(p.variants) ? p.variants : []
    const lines = [`💰 <b>${esc(p.name)}</b> (${esc(priceUnit(p))})`]
    const keyboard: Keyboard = []
    if (variants.length) {
      variants.forEach((v, i) => lines.push(`• ${esc(v.name)}: ${rupees(v.price)}${v.in_stock === false ? ' (out of stock)' : ''}`))
      for (let i = 0; i < variants.length; i += 2) keyboard.push(variants.slice(i, i + 2).map((v, j) => ({ text: `Change ${v.name}`, callback_data: `pp:${p.id}:${i + j}` })))
      lines.push(`Listing price: ${rupees(p.price)}`)
    } else {
      lines.push(`Price: ${rupees(p.price)}`)
      keyboard.push([{ text: 'Change price', callback_data: `pp:${p.id}:-1` }])
    }
    await sendTelegramMessage(lines.join('\n'), { keyboard })
  }
}

// Reviews

export function reviewText(r: any) {
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 0)))
  return [
    `📝 <b>New review</b> · ${stars}`,
    `${esc(r.customer_name || 'Customer')} on <b>${esc(r.product_slug || 'a product')}</b>`,
    r.title ? `<b>${esc(r.title)}</b>` : null,
    esc(r.body || ''),
  ].filter(Boolean).join('\n')
}
export const reviewKeyboard = (id: string): Keyboard => [[{ text: '✅ Approve', callback_data: `ra:${id}` }, { text: '🗑 Delete', callback_data: `rd:${id}` }]]

async function cmdReviews() {
  const { data, count } = await supabaseAdmin.from('reviews').select('*', { count: 'exact' }).eq('approved', false).order('created_at', { ascending: true }).limit(5)
  if (!data?.length) return sendTelegramMessage('No reviews waiting. ✨')
  for (const r of data) await sendTelegramMessage(reviewText(r), { keyboard: reviewKeyboard(r.id) })
  if ((count || 0) > data.length) await sendTelegramMessage(`…and ${(count || 0) - data.length} more. Send /reviews again after these.`)
}

// Coupons

const couponLine = (c: any) => {
  const off = c.discount_type === 'fixed' ? `${rupees(c.discount_value)} off` : `${Number(c.discount_value)}% off`
  return `• <code>${esc(c.code)}</code> — ${off}${Number(c.min_order_amount) > 0 ? `, min ${rupees(c.min_order_amount)}` : ''}${Number(c.max_discount) > 0 ? `, up to ${rupees(c.max_discount)}` : ''} · ${c.is_active === false ? '⏸ Off' : '✅ On'}`
}

async function couponsView() {
  const { data } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false }).limit(15)
  const list = data || []
  const text = list.length ? ['🎟 <b>Coupons</b>', ...list.map(couponLine), '', 'New: <code>/newcoupon SAVE10 10% min 500</code>'].join('\n') : 'No coupons yet. Create one: <code>/newcoupon SAVE10 10% min 500</code>'
  const keyboard: Keyboard = list.map(c => [{ text: `${c.is_active === false ? '▶️ Turn on' : '⏸ Turn off'} ${c.code}`, callback_data: `cp:${c.id}:${c.is_active === false ? 1 : 0}` }])
  return { text, keyboard }
}

async function cmdNewCoupon(origin: string, args: string) {
  const parts = args.trim().split(/\s+/).filter(Boolean)
  const code = (parts[0] || '').toUpperCase()
  const amountRaw = parts[1] || ''
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !amountRaw) {
    return sendTelegramMessage('Send it like this:\n<code>/newcoupon SAVE10 10%</code>\n<code>/newcoupon SAVE10 10% min 500 max 200</code>\n<code>/newcoupon FLAT50 50rs min 499</code>')
  }
  const pct = amountRaw.match(/^(\d+(?:\.\d+)?)%$/)
  const discount_type = pct ? 'percentage' : 'fixed'
  const discount_value = pct ? Number(pct[1]) : parseRupees(amountRaw)
  if (!discount_value || (pct && (discount_value <= 0 || discount_value > 90))) return sendTelegramMessage('The discount should be like 10% or 50rs.')
  const opt = (word: string) => { const i = parts.findIndex(p => p.toLowerCase() === word); return i > 0 ? parseRupees(parts[i + 1] || '') : null }
  const created = await adminApi(origin, '/api/coupons', 'POST', {
    code, discount_type, discount_value,
    min_order_amount: opt('min') || 0,
    max_discount: opt('max') || null,
    is_active: true,
  })
  await sendTelegramMessage(`✅ Coupon created and live:\n${couponLine(created)}`)
}

// ── replies to the bot's questions ([tag] in the question) ──

async function handleReply(origin: string, text: string, question: string) {
  const ship = question.match(/\[ship ([0-9a-f-]{36})\]/)
  if (ship) {
    const g = Math.round(Number(text.replace(/[^\d.]/g, '')))
    if (!g || g < 50 || g > 30000) return sendTelegramMessage('Please reply with the weight in grams, e.g. <code>1200</code>.')
    const order = await getOrder(ship[1])
    if (!order) return sendTelegramMessage('Order not found.')
    return shipPreview(order, g)
  }
  const price = question.match(/\[price ([0-9a-f-]{36}) (-?\d+)\]/)
  if (price) {
    const paise = parseRupees(text)
    if (!paise) return sendTelegramMessage('Please reply with just the amount in ₹, e.g. <code>360</code>.')
    const { data: p } = await supabaseAdmin.from('products').select('id,name,price,price_per_unit,variants').eq('id', price[1]).maybeSingle()
    if (!p) return sendTelegramMessage('Product not found.')
    const idx = Number(price[2])
    const v = idx >= 0 ? (p.variants || [])[idx] : null
    const label = v ? `${p.name} — ${v.name}` : p.name
    const old = v ? v.price : p.price
    return sendTelegramMessage(`Change <b>${esc(label)}</b> from ${rupees(old)} to <b>${rupees(paise)}</b> (${esc(priceUnit(p))})?`, {
      keyboard: [[{ text: `✅ Save ${rupees(paise)}`, callback_data: `ps:${p.id}:${idx}:${paise}` }, { text: '✖️ No', callback_data: 'x' }]],
    })
  }
  return sendTelegramMessage(HELP)
}

// ── orders: ship ──

/** NimbusPost prices are in rupees with paise, e.g. 103.08. */
const courierPrice = (rupeesValue: number) => `₹${rupeesValue.toFixed(2).replace(/\.00$/, '')}`

function parcelGrams(order: any) {
  const items: any[] = Array.isArray(order.items) ? order.items : []
  return items.reduce((s, i) => s + (Number(i.weight_grams) || 0) * (Number(i.quantity) || 1), 0) || 500
}

async function shipPreview(order: any, g = parcelGrams(order)) {
  if (isUnpaidOnlineAttempt(order)) return sendTelegramMessage('This online order was never paid — do not ship it.')
  if (!['pending', 'confirmed', 'packed'].includes(order.status)) return sendTelegramMessage(`This order is already ${esc(order.status)}.`)
  // The bot books the cheapest courier (a courier id won't fit in a Telegram button).
  // Choosing a different one is done from the admin panel's Ship Order window.
  let quote = 'Prices could not be loaded; the cheapest courier at booking time will be used.'
  try {
    const { rates, message } = await getNimbusCourierRates({
      deliveryPincode: order.pincode,
      cod: isCodOrder(order),
      orderAmountPaise: order.final_amount || order.total,
      weightGrams: g,
      lengthCm: BOX.length_cm,
      breadthCm: BOX.breadth_cm,
      heightCm: BOX.height_cm,
    })
    const r = rates[0]
    const others = rates.length - 1
    quote = r
      ? `Cheapest courier: <b>${esc(r.name)}</b> · ${courierPrice(r.total)}${r.deliveryDate ? ` · delivery by ${esc(r.deliveryDate.split('-').reverse().join('-'))}` : ''}` +
        (others > 0 ? `\n${others} other option${others === 1 ? '' : 's'}; choose one in the admin panel if you prefer.` : '')
      : `⚠️ ${esc(message || 'No courier delivers to this pincode.')}`
  } catch {}
  await sendTelegramMessage(
    `🚚 Book the courier for <code>${esc(orderCode(order))}</code>?\nParcel: <b>${grams(g)}</b>, box ${BOX.length_cm}×${BOX.breadth_cm}×${BOX.height_cm} cm.\n${quote}\nThe customer gets the tracking details automatically.`,
    { keyboard: [[{ text: '🚚 Book courier', callback_data: `osb:${order.id}:${g}` }], [{ text: '✏️ Different weight', callback_data: `osw:${order.id}` }, { text: '✖️ Not now', callback_data: 'x' }]] }
  )
}

// ── entry points ──

export async function handleMessage(origin: string, message: any) {
  const text = String(message.text || '').trim()
  if (message.reply_to_message?.text && !text.startsWith('/')) return handleReply(origin, text, message.reply_to_message.text)
  const m = text.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/)
  const cmd = (m?.[1] || '').toLowerCase()
  const arg = m?.[2] || ''
  switch (cmd) {
    case 'orders': return cmdOrders()
    case 'order': return cmdOrder(arg)
    case 'sales': return cmdSales(arg)
    case 'stock': return cmdStock(arg)
    case 'price': return cmdPrice(arg)
    case 'reviews': return cmdReviews()
    case 'coupons': { const v = await couponsView(); return sendTelegramMessage(v.text, { keyboard: v.keyboard }) }
    case 'newcoupon': return cmdNewCoupon(origin, arg)
    default: return sendTelegramMessage(HELP)
  }
}

export async function handleCallback(origin: string, cb: any) {
  const data = String(cb.data || '')
  const msgId: number = cb.message?.message_id
  const [kind, id, a, b] = data.split(':')

  // Re-render an order card in place after an action.
  const refreshCard = async (orderId: string) => {
    const order = await getOrder(orderId)
    if (order) await editTelegramMessage(msgId, orderCard(order), orderKeyboard(order))
    return order
  }
  const setStatus = async (status: string, done: string) => {
    await adminApi(origin, '/api/orders', 'PUT', { id, status })
    await answerCallback(cb.id, done)
    await refreshCard(id)
  }

  try {
    switch (kind) {
      case 'x': await answerCallback(cb.id, 'Okay'); return editTelegramMessage(msgId, `${esc(cb.message?.text || '')}\n\n✖️ Left unchanged.`)
      case 'ov': await answerCallback(cb.id); await refreshCard(id); return
      case 'on': { await answerCallback(cb.id); const o = await getOrder(id); if (o) await sendTelegramMessage(orderCard(o), { keyboard: orderKeyboard(o) }); return }
      case 'oc': return setStatus('confirmed', 'Order confirmed ✅')
      case 'opk': return setStatus('packed', 'Marked packed 📦')
      case 'odl': return setStatus('delivered', 'Marked delivered 🏁')
      case 'ox': {
        await answerCallback(cb.id)
        const o = await getOrder(id)
        if (!o) return
        return editTelegramMessage(msgId, `${orderCard(o)}\n\n❓ <b>Cancel this order?</b> Any wallet credit used goes back to the customer.`, [[{ text: '❌ Yes, cancel it', callback_data: `oxy:${id}` }, { text: '↩️ Keep it', callback_data: `ov:${id}` }]])
      }
      case 'oxy': return setStatus('cancelled', 'Order cancelled')
      case 'or': {
        const r = await adminApi(origin, '/api/admin/orders/reconcile', 'POST', { id })
        await answerCallback(cb.id, r?.paid ? 'Payment found — order confirmed ✅' : (r?.message || 'Still not paid'))
        await refreshCard(id)
        return
      }
      case 'os': { await answerCallback(cb.id); const o = await getOrder(id); if (o) await shipPreview(o); return }
      case 'osw': {
        await answerCallback(cb.id)
        const o = await getOrder(id)
        return sendTelegramMessage(`⚖️ Reply with the parcel weight in grams for <code>${esc(o ? orderCode(o) : '')}</code>.\n[ship ${id}]`, { forceReply: 'Weight in grams, e.g. 1200' })
      }
      case 'osb': {
        const g = Number(a) || 500
        await answerCallback(cb.id, 'Booking courier…')
        await editTelegramMessage(msgId, `⏳ Booking the courier (${grams(g)})…`) // buttons gone: no double booking
        try {
          const updated = await adminApi(origin, '/api/admin/orders/ship', 'POST', { id, weight_grams: g, ...BOX, generate_pickup: true })
          await editTelegramMessage(msgId, `✅ <b>Shipped</b> · <code>${esc(orderCode(updated))}</code>\n${esc(updated.courier_name || 'Courier')}${typeof updated.shipping_cost === 'number' ? ` · ${courierPrice(updated.shipping_cost)}` : ''} · AWB <code>${esc(updated.tracking_number || '—')}</code>${updated.label_url ? `\n<a href="${esc(updated.label_url)}">🏷️ Print shipping label</a>` : ''}${updated.tracking_link ? `\n<a href="${esc(updated.tracking_link)}">Tracking link</a>` : ''}\nThe customer has been sent the tracking details.`, orderKeyboard(updated))
        } catch (e: any) {
          await editTelegramMessage(msgId, `⚠️ Courier not booked: ${esc(e.message)}`, [[{ text: '🔁 Try again', callback_data: `os:${id}` }]])
        }
        return
      }
      case 'sl': { await answerCallback(cb.id); const period = (['today', 'week', 'month'].includes(id) ? id : 'today') as 'today' | 'week' | 'month'; return editTelegramMessage(msgId, await salesReport(period), cb.message?.reply_markup?.inline_keyboard) }
      case 'st': {
        const { data: p } = await supabaseAdmin.from('products').update({ in_stock: a === '1' }).eq('id', id).select('slug').maybeSingle()
        revalidateCatalog([p?.slug])
        await answerCallback(cb.id, a === '1' ? 'Back in stock ✅' : 'Marked out of stock')
        const ids = (cb.message?.reply_markup?.inline_keyboard || []).flat().map((k: any) => String(k.callback_data || '').split(':')[1]).filter(Boolean)
        const { data: list } = await supabaseAdmin.from('products').select('id,name,slug,in_stock').in('id', ids).order('name')
        const v = stockView(list || [])
        return editTelegramMessage(msgId, v.text, v.keyboard)
      }
      case 'pp': {
        await answerCallback(cb.id)
        const { data: p } = await supabaseAdmin.from('products').select('id,name,price,price_per_unit,variants').eq('id', id).maybeSingle()
        if (!p) return
        const idx = Number(a)
        const v = idx >= 0 ? (p.variants || [])[idx] : null
        return sendTelegramMessage(`💰 New price for <b>${esc(v ? `${p.name} — ${v.name}` : p.name)}</b> (now ${rupees(v ? v.price : p.price)} ${esc(priceUnit(p))})?\nReply with just the amount in ₹.\n[price ${p.id} ${idx}]`, { forceReply: 'Amount in ₹, e.g. 360' })
      }
      case 'ps': {
        const idx = Number(a), paise = Number(b)
        const { data: p } = await supabaseAdmin.from('products').select('id,slug,name,price,variants').eq('id', id).maybeSingle()
        if (!p || !paise) { await answerCallback(cb.id, 'Product not found'); return }
        const update: Record<string, unknown> = {}
        let label = p.name
        if (idx >= 0) {
          const variants = Array.isArray(p.variants) ? [...p.variants] : []
          if (!variants[idx]) { await answerCallback(cb.id, 'That option no longer exists'); return }
          const old = variants[idx].price
          variants[idx] = { ...variants[idx], price: paise }
          update.variants = variants
          label = `${p.name} — ${variants[idx].name}`
          // Keep the listing price in step when it mirrored the first option.
          if (idx === 0 && Number(p.price) === Number(old)) update.price = paise
        } else {
          update.price = paise
        }
        const { error } = await supabaseAdmin.from('products').update(update).eq('id', id)
        if (error) throw error
        revalidateCatalog([p.slug])
        await answerCallback(cb.id, 'Price saved ✅')
        return editTelegramMessage(msgId, `✅ <b>${esc(label)}</b> is now ${rupees(paise)}. The website shows it within a minute.`)
      }
      case 'ra': {
        await adminApi(origin, '/api/reviews', 'PATCH', { id })
        await answerCallback(cb.id, 'Review approved ✅')
        return editTelegramMessage(msgId, `${esc(cb.message?.text || '')}\n\n✅ Approved — now showing on the website.`)
      }
      case 'rd': {
        await adminApi(origin, `/api/reviews?id=${encodeURIComponent(id)}`, 'DELETE')
        await answerCallback(cb.id, 'Review deleted')
        return editTelegramMessage(msgId, `${esc(cb.message?.text || '')}\n\n🗑 Deleted.`)
      }
      case 'cp': {
        const { error } = await supabaseAdmin.from('coupons').update({ is_active: a === '1' }).eq('id', id)
        if (error) throw error
        await answerCallback(cb.id, a === '1' ? 'Coupon on ✅' : 'Coupon off ⏸')
        const v = await couponsView()
        return editTelegramMessage(msgId, v.text, v.keyboard)
      }
      default: return answerCallback(cb.id)
    }
  } catch (e: any) {
    await answerCallback(cb.id, `⚠️ ${e?.message || 'Something went wrong'}`)
    await sendTelegramMessage(`⚠️ ${esc(e?.message || 'Something went wrong')}`)
  }
}
