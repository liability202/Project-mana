import { supabaseAdmin } from '@/lib/supabase'
import type { Product } from '@/lib/supabase'
import { getInStockCatalog } from '@/lib/catalog'
import { matchCatalogProducts } from '@/lib/product-search'
import { buildQuote, createOrder, isVisibleToCustomer, ORDER_NOTE, validateCustomer, type Quote } from '@/lib/checkout'
import { buildKitVariantId } from '@/lib/pricing'
import { getHerbContent } from '@/lib/herb-content'
import { getKitContent } from '@/lib/kit-content'
import { getNimbusPostServiceability } from '@/lib/nimbuspost'
import { phoneVariants } from '@/lib/session'
import { getDefaultWeight, getPresetWeights } from '@/app/products/[slug]/weights'
import { createRazorpayPaymentLink } from './razorpay'
import {
  alertOwner,
  getConversation,
  localPhone,
  updateConversation,
  waId,
  type CartLine,
  type Outbox,
} from './inbox'

/**
 * The shop actions the assistant can take. Every price, stock level and total
 * comes from the database through the same checkout code the website uses —
 * the model never invents a number. Orders are only created when the customer
 * taps "Confirm & pay" (confirmPendingOrder), never by the model directly.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.manadryfruits.com'
export const CONFIRM_ORDER_ID = 'mana_confirm_order'
export const CHANGE_ORDER_ID = 'mana_change_order'

const rupees = (paise: number) => `₹${(Math.round(paise) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
const clean = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

export type ToolContext = { phone: string; outbox: Outbox }

async function catalog(): Promise<Product[]> {
  return getInStockCatalog().catch(() => [])
}

function productSummary(p: Product) {
  return {
    slug: p.slug,
    name: clean(p.name),
    category: p.category,
    price: `${rupees(p.price)} ${p.price_per_unit || ''}`.trim(),
    varieties: (p.variants || []).map((v: any) => ({ name: clean(v.name), price: rupees(v.price || p.price), in_stock: v.in_stock !== false })),
    sizes_grams: p.category === 'kits' ? undefined : getPresetWeights(p.category),
  }
}

// ── Tool implementations ──

async function searchProducts(input: { query: string; category?: string | null }) {
  const all = await catalog()
  const pool = input.category ? all.filter(p => p.category === input.category) : all
  const results = clean(input.query)
    ? matchCatalogProducts(pool, input.query, 8).map(m => m.product)
    : pool.slice(0, 12)
  if (!results.length) return { results: [], note: 'No matching products in stock. Offer the closest alternatives or a person.' }
  return { results: results.map(productSummary) }
}

async function getProductDetails(input: { slug: string }) {
  const all = await catalog()
  const p = all.find(x => x.slug === input.slug)
  if (!p) return { error: 'Not found or out of stock. Search again.' }
  const herb = getHerbContent(p.slug)
  const kit = getKitContent(p.slug)
  return {
    ...productSummary(p),
    description: clean(p.description).slice(0, 700),
    link: `${SITE}/${p.category === 'kits' ? 'kits' : 'products'}/${p.slug}`,
    ...(herb ? {
      hindi: herb.hindi,
      botanical: herb.botanical,
      also_known_as: herb.aka,
      traditional_uses: herb.traditionalUses,
      how_to_use: herb.howToUse,
      typical_amount: herb.typicalAmount,
      precautions: herb.precautions,
    } : {}),
    ...(kit ? {
      kit_contents: kit.itemRoles,
      kit_routine: kit.routine,
      kit_precautions: kit.precautions,
      kit_sizes: (p.variants || []).map((v: any) => ({ name: clean(v.name), price: rupees(v.price || p.price), items: (v.items || []).map((i: any) => `${clean(i.name)} ${i.grams || v.grams_each || ''}g`) })),
      kit_forms: 'whole or powder (where offered)',
    } : {}),
  }
}

function resolveLine(all: Product[], item: { slug: string; variety?: string | null; grams?: number | null; quantity?: number | null; kit_form?: string | null }): CartLine | { error: string } {
  const p = all.find(x => x.slug === item.slug)
  if (!p) return { error: `${item.slug}: not found or out of stock` }
  const variants: any[] = p.variants || []
  const wanted = clean(item.variety).toLowerCase()
  const variant = (wanted && variants.find(v => clean(v.name).toLowerCase() === wanted))
    || (wanted && variants.find(v => clean(v.name).toLowerCase().includes(wanted)))
    || variants.find(v => v.in_stock !== false)
    || variants[0]
    || null
  const quantity = Math.max(1, Math.min(20, Math.round(Number(item.quantity) || 1)))

  if (p.category === 'kits') {
    if (!variant) return { error: `${p.name}: no kit sizes available` }
    const forms = variant.form_options || {}
    const form: 'powder' | 'whole' = item.kit_form === 'powder' && forms.powder !== false ? 'powder' : forms.whole !== false ? 'whole' : 'powder'
    const selection = (variant.items || []).map((i: any) => ({ id: i.id, grams: i.grams || variant.grams_each || 100 }))
    return {
      slug: p.slug, product_id: p.id, name: clean(p.name),
      variant_id: buildKitVariantId(variant.id, form, selection),
      variant_name: `${clean(variant.name)} (${form})`, grams: null, quantity,
    }
  }

  const grams = Math.max(50, Math.min(5000, Math.round(Number(item.grams) || getDefaultWeight(p.category))))
  return {
    slug: p.slug, product_id: p.id, name: clean(p.name),
    variant_id: variant?.id || null, variant_name: variant ? clean(variant.name) : null, grams, quantity,
  }
}

async function quoteFor(phone: string, cart: CartLine[], customer: { city?: string; state?: string | null; pincode?: string }): Promise<Quote> {
  return buildQuote(
    supabaseAdmin,
    {
      items: cart.map(l => ({ product_id: l.product_id, variant_id: l.variant_id, weight_grams: l.grams, quantity: l.quantity })),
      paymentMethod: 'online',
      city: customer.city,
      state: customer.state || undefined,
      pincode: customer.pincode,
    },
    localPhone(phone)
  )
}

function quoteSummary(quote: Quote) {
  const t = quote.totals
  return {
    lines: quote.lines.map(l => ({
      item: `${clean(l.product_name)}${l.variant_name ? ` – ${clean(l.variant_name)}` : ''}${l.weight_grams ? ` ${l.weight_grams} g` : ''}${l.quantity > 1 ? ` × ${l.quantity}` : ''}`,
      price: rupees(l.line_total),
    })),
    subtotal: rupees(t.subtotal),
    ...(t.discount ? { discount: `−${rupees(t.discount)}` } : {}),
    shipping: t.shipping ? rupees(t.shipping) : 'free',
    ...(t.smallOrderFee ? { small_order_fee: rupees(t.smallOrderFee) } : {}),
    total: rupees(t.total),
    problems: quote.errors,
  }
}

async function setCart(ctx: ToolContext, input: { items: Array<{ slug: string; variety?: string | null; grams?: number | null; quantity?: number | null; kit_form?: string | null }> }) {
  const all = await catalog()
  const resolved = (input.items || []).map(item => resolveLine(all, item))
  const errors = resolved.filter((r): r is { error: string } => 'error' in r).map(r => r.error)
  const cart = resolved.filter((r): r is CartLine => !('error' in r))
  const conversation = await getConversation(ctx.phone)
  await updateConversation(ctx.phone, { cart, stage: cart.length ? (conversation.customer?.pincode ? 'details' : 'cart') : 'browsing', pending_order: null })
  if (!cart.length) return { cart: [], errors: errors.length ? errors : ['Cart is now empty.'] }
  const quote = await quoteFor(ctx.phone, cart, conversation.customer || {})
  return { ...quoteSummary(quote), errors }
}

async function saveCustomerDetails(ctx: ToolContext, input: { name: string; address: string; city: string; state?: string | null; pincode: string; email?: string | null }) {
  const result = validateCustomer(input)
  if ('error' in result) return { error: result.error }
  const conversation = await getConversation(ctx.phone)
  await updateConversation(ctx.phone, {
    customer: result.customer,
    name: result.customer.name || conversation.name,
    stage: conversation.cart?.length ? 'details' : conversation.stage,
    pending_order: null,
  })
  return { saved: result.customer }
}

async function checkDelivery(ctx: ToolContext, input: { pincode: string }) {
  const pincode = clean(input.pincode).replace(/\D/g, '')
  if (!/^\d{6}$/.test(pincode)) return { error: 'A pincode has 6 digits.' }
  const conversation = await getConversation(ctx.phone)
  const grams = (conversation.cart || []).reduce((s, l) => s + (l.grams || 1000) * l.quantity, 0) || 500
  const result: any = await getNimbusPostServiceability({ deliveryPincode: pincode, weightGrams: grams, cod: false })
  if (!result.configured) return { note: 'Delivery check unavailable right now; Mana ships across India.' }
  return {
    deliverable: result.serviceable,
    estimated_delivery: result.estimatedDeliveryDate ? new Date(result.estimatedDeliveryDate).toDateString() : null,
  }
}

async function prepareOrder(ctx: ToolContext) {
  const conversation = await getConversation(ctx.phone)
  if (!conversation.cart?.length) return { error: 'The cart is empty. Add items with set_cart first.' }
  const check = validateCustomer(conversation.customer || {})
  if ('error' in check) return { error: `Need delivery details first: ${check.error}` }
  const quote = await quoteFor(ctx.phone, conversation.cart, check.customer)
  if (quote.errors.length) return { error: quote.errors.join(' ') }
  const s = quoteSummary(quote)
  const c = check.customer
  const summary = [
    '*Please confirm your order*',
    '',
    ...s.lines.map(l => `• ${l.item} — ${l.price}`),
    '',
    `Subtotal: ${s.subtotal}${'discount' in s ? `\nDiscount: ${(s as any).discount}` : ''}`,
    `Shipping: ${s.shipping}`,
    `*Total: ${s.total}*`,
    '',
    `Deliver to: ${c.name}, ${c.address}, ${c.city}${c.state ? `, ${c.state}` : ''} – ${c.pincode}`,
  ].join('\n')
  await ctx.outbox.buttons(ctx.phone, summary.slice(0, 1024), [
    { id: CONFIRM_ORDER_ID, title: 'Confirm & pay' },
    { id: CHANGE_ORDER_ID, title: 'Change something' },
  ])
  await updateConversation(ctx.phone, { pending_order: { total: quote.totals.total, created_at: new Date().toISOString() }, stage: 'details' })
  return { sent: 'Confirmation with Confirm & pay buttons was sent to the customer. Wait for them to tap it. Do not say the order is placed.' }
}

async function myOrders(ctx: ToolContext) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('order_ref, created_at, status, payment_status, final_amount, total, tracking_link, tracking_number, notes, items')
    .in('customer_phone', [...phoneVariants(localPhone(ctx.phone)), waId(ctx.phone)])
    .order('created_at', { ascending: false })
    .limit(8)
  const orders = (data || []).filter(isVisibleToCustomer).slice(0, 5)
  if (!orders.length) return { orders: [], note: 'No orders found for this WhatsApp number.' }
  return {
    orders: orders.map(o => ({
      ref: o.order_ref,
      date: new Date(o.created_at).toDateString(),
      status: o.status,
      payment: o.payment_status,
      total: rupees(o.final_amount ?? o.total),
      items: (o.items || []).map((i: any) => clean(i.product_name)).slice(0, 4).join(', '),
      tracking: o.tracking_link || null,
    })),
  }
}

async function handOff(ctx: ToolContext, input: { reason: string }) {
  const conversation = await getConversation(ctx.phone)
  const reason = clean(input.reason).slice(0, 300) || 'Customer asked for a person'
  await updateConversation(ctx.phone, { stage: 'needs_human', bot_paused: true, needs_human_reason: reason })
  if (!ctx.outbox.test) await alertOwner(conversation, reason)
  return { done: 'The Mana team has been alerted and the assistant is paused for this chat. Tell the customer a team member will reply here soon (usually within a few hours, 10am–7pm).' }
}

// ── Tool definitions for Claude ──

const str = (description: string) => ({ type: 'string', description })

export const TOOL_DEFINITIONS = [
  {
    name: 'search_products',
    description: 'Search Mana\'s in-stock catalogue by name, Hindi name or need (e.g. "badam", "hair", "summer"). Returns slugs, prices and varieties. Always search before quoting prices or suggesting products.',
    input_schema: {
      type: 'object',
      properties: {
        query: str('What to search for, in any language or spelling'),
        category: { type: ['string', 'null'], enum: ['dry-fruits', 'herbs', 'spices', 'kits', 'pansari', null], description: 'Optional category filter' },
      },
      required: ['query', 'category'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_product_details',
    description: 'Full details for one product or kit by slug: description, varieties and prices, sizes, and for herbs/kits the guide (traditional uses, how to use, typical amount, precautions, kit contents).',
    input_schema: { type: 'object', properties: { slug: str('Product slug from search_products') }, required: ['slug'], additionalProperties: false },
  },
  {
    name: 'set_cart',
    description: 'Replace the customer\'s cart with these items and get the exact price from the website\'s checkout (subtotal, shipping, total). Include every item the customer wants each time (it replaces the cart). Empty list clears the cart.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slug: str('Product slug'),
              variety: { type: ['string', 'null'], description: 'Variety or kit size name, e.g. "Mamra Afgani", "W240", "Signature". Null = default.' },
              grams: { type: ['number', 'null'], description: 'Weight in grams for loose products (e.g. 250, 500, 1000). Null for kits or default.' },
              quantity: { type: ['number', 'null'], description: 'Number of packs, default 1' },
              kit_form: { type: ['string', 'null'], enum: ['whole', 'powder', null], description: 'Kits only' },
            },
            required: ['slug', 'variety', 'grams', 'quantity', 'kit_form'],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
  {
    name: 'save_customer_details',
    description: 'Save the delivery name and address once the customer has given them. Ask for anything missing first.',
    input_schema: {
      type: 'object',
      properties: {
        name: str('Full name'),
        address: str('House/flat, street, area'),
        city: str('City'),
        state: { type: ['string', 'null'], description: 'State' },
        pincode: str('6-digit pincode'),
        email: { type: ['string', 'null'], description: 'Email if given, for the invoice' },
      },
      required: ['name', 'address', 'city', 'state', 'pincode', 'email'],
      additionalProperties: false,
    },
  },
  {
    name: 'check_delivery',
    description: 'Check whether Mana delivers to a pincode and the estimated delivery date.',
    input_schema: { type: 'object', properties: { pincode: str('6-digit pincode') }, required: ['pincode'], additionalProperties: false },
  },
  {
    name: 'prepare_order',
    description: 'When the cart and delivery details are complete and the customer wants to buy: sends them the order summary with Confirm & pay / Change buttons. The order is only created when they tap Confirm & pay.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'my_orders',
    description: 'The customer\'s recent orders (this WhatsApp number only): reference, status, payment, total, tracking link.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'hand_off_to_human',
    description: 'Pause the assistant and alert the Mana team. Use for complaints, damaged/wrong items, refunds, bulk or corporate orders, payment problems, anything you cannot do, or when the customer asks for a person.',
    input_schema: { type: 'object', properties: { reason: str('Short reason the team will see') }, required: ['reason'], additionalProperties: false },
  },
] as const

export async function runTool(ctx: ToolContext, name: string, input: any): Promise<unknown> {
  switch (name) {
    case 'search_products': return searchProducts(input)
    case 'get_product_details': return getProductDetails(input)
    case 'set_cart': return setCart(ctx, input)
    case 'save_customer_details': return saveCustomerDetails(ctx, input)
    case 'check_delivery': return checkDelivery(ctx, input)
    case 'prepare_order': return prepareOrder(ctx)
    case 'my_orders': return myOrders(ctx)
    case 'hand_off_to_human': return handOff(ctx, input)
    default: return { error: `Unknown tool ${name}` }
  }
}

/**
 * Customer tapped "Confirm & pay": create the order exactly as the website
 * does (unpaid until Razorpay confirms) and send a payment link. Runs in code,
 * not through the model, so an order can never be placed without that tap.
 */
export async function confirmPendingOrder(ctx: ToolContext) {
  const conversation = await getConversation(ctx.phone)
  const check = validateCustomer(conversation.customer || {})
  if (!conversation.pending_order || !conversation.cart?.length || 'error' in check) {
    await ctx.outbox.text(ctx.phone, 'That order confirmation has expired. Tell me what you\'d like and I\'ll prepare it again.')
    return
  }
  // Payment links last 24 h; don't honour a confirmation older than that.
  if (Date.now() - new Date(conversation.pending_order.created_at).getTime() > 24 * 60 * 60 * 1000) {
    await updateConversation(ctx.phone, { pending_order: null })
    await ctx.outbox.text(ctx.phone, 'That confirmation is more than a day old. Let me prepare a fresh one — just say "order again".')
    return
  }

  const quote = await quoteFor(ctx.phone, conversation.cart, check.customer)
  if (quote.errors.length || quote.totals.total <= 0) {
    await ctx.outbox.text(ctx.phone, `Sorry, I couldn't place this order: ${quote.errors.join(' ') || 'the total is zero'}. Let's fix the cart.`)
    return
  }

  if (ctx.outbox.test) {
    await updateConversation(ctx.phone, { stage: 'payment_sent', pending_order: null })
    await ctx.outbox.text(ctx.phone, `(Test mode — no real order or payment link was created.) A real customer would now get order and payment link for *${rupees(quote.totals.total)}*.`)
    return
  }

  const order = await createOrder(supabaseAdmin, {
    quote,
    customer: check.customer,
    phone: localPhone(ctx.phone),
    status: 'cancelled',
    paymentStatus: 'pending',
    notes: ORDER_NOTE.awaitingPayment,
  })

  let link: string
  try {
    link = await createRazorpayPaymentLink({
      amount: quote.totals.total,
      description: `MANA ${order.order_ref} – ${quote.lines.map(l => clean(l.product_name)).join(', ')}`,
      orderId: order.id,
      orderRef: order.order_ref,
      phone: waId(ctx.phone),
    })
  } catch (error) {
    console.error('[whatsapp] payment link failed', order.id, error)
    await updateConversation(ctx.phone, { stage: 'needs_human', bot_paused: true, needs_human_reason: `Payment link failed for ${order.order_ref}` })
    await alertOwner(conversation, `Payment link failed for order ${order.order_ref}`)
    await ctx.outbox.text(ctx.phone, 'Sorry — the payment link didn\'t generate. Our team has been alerted and will send it here shortly.')
    return
  }

  await supabaseAdmin.from('orders').update({ payment_link: link }).eq('id', order.id)
  await updateConversation(ctx.phone, {
    stage: 'payment_sent',
    pending_order: null,
    last_order_id: order.id,
    last_order_ref: order.order_ref,
  })
  await ctx.outbox.text(
    ctx.phone,
    `Order *${order.order_ref}* is ready. Total *${rupees(quote.totals.total)}*.\n\nPay securely here (UPI, cards, netbanking): ${link}\n\nThe link is valid for 24 hours. I'll confirm here as soon as the payment comes through.`
  )
}

/** Called from the Razorpay webhook once a WhatsApp order is paid. */
export async function notifyOrderPaid(order: { id: string; order_ref: string; customer_phone: string; final_amount?: number | null; total?: number }, outbox: Outbox) {
  const phone = waId(order.customer_phone)
  await updateConversation(phone, { stage: 'paid', cart: [], pending_order: null, last_order_id: order.id, last_order_ref: order.order_ref }).catch(() => {})
  await outbox.text(
    phone,
    `Payment received ✅ Thank you!\n\nOrder *${order.order_ref}* — ${rupees(order.final_amount ?? order.total ?? 0)}. We'll pack it fresh and share tracking here once it ships.`,
    'system'
  )
}
