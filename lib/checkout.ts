import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { LOYALTY_CODE, LOYALTY_DISCOUNT_PCT, ensureUserProfile, ensureWallet, getCouponByCode, normalizePhone, type CouponRecord } from '@/lib/commerce'
import { estimateCommission } from '@/lib/commissions'
import { insertRow, updateRows } from '@/lib/db-fallback'
import { sendOrderConfirmation } from '@/lib/email'
import {
  MAX_LINE_QUANTITY,
  cartLineKey,
  computeTotals,
  priceCartLine,
  type CartLineInput,
  type CouponRules,
  type PaymentMethod,
  type PricedLine,
  type PricingProduct,
  type Totals,
} from '@/lib/pricing'
import { phoneVariants } from '@/lib/session'

/**
 * Server-side checkout. Prices, discounts, fees and totals are always
 * recomputed here from the catalogue and coupon tables; the browser only says
 * *what* it wants (product, variant, weight, quantity, coupon code).
 *
 * Online orders are written before payment as `status: 'cancelled'` with the
 * awaiting-payment note, so every report that already ignores cancelled orders
 * ignores unpaid attempts too. Verified payment flips them to pending/paid
 * exactly once (markOrderPaid), and only then do side effects run.
 */

export const ORDER_NOTE = {
  cod: 'Cash on Delivery',
  awaitingPayment: 'Awaiting online payment',
  paidOnline: 'Paid online',
  paidWithCredit: 'Paid with wallet/discount',
} as const

const MAX_CART_LINES = 50
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ORDER_REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I

export type CheckoutSettings = {
  enable_cashback_earning: boolean
  enable_cashback_spending: boolean
}

export async function loadCheckoutSettings(client: SupabaseClient): Promise<CheckoutSettings> {
  const settings: CheckoutSettings = { enable_cashback_earning: true, enable_cashback_spending: true }
  const { data, error } = await client.from('site_settings').select('key, value')
  if (error) return settings
  for (const row of data || []) {
    if (row.key === 'enable_cashback_earning') settings.enable_cashback_earning = row.value !== false
    if (row.key === 'enable_cashback_spending') settings.enable_cashback_spending = row.value !== false
  }
  return settings
}

/** Orders that really happened: not cancelled (which also excludes unpaid online attempts). */
export async function countCompletedOrders(client: SupabaseClient, phone: string, excludeOrderId?: string) {
  let query = client
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('customer_phone', phoneVariants(phone))
    .neq('status', 'cancelled')
  if (excludeOrderId) query = query.neq('id', excludeOrderId)
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

/** Creator code from the referral-link cookie (set by middleware), if valid. */
export function readReferralCode() {
  let raw = cookies().get('mana_ref')?.value || ''
  try {
    raw = decodeURIComponent(raw)
  } catch {
    return null
  }
  const code = raw.trim().toUpperCase()
  return /^[A-Z0-9_-]{2,40}$/.test(code) ? code : null
}

export function generateOrderRef() {
  let ref = 'MANA'
  for (let i = 0; i < 6; i++) ref += ORDER_REF_ALPHABET[crypto.randomInt(ORDER_REF_ALPHABET.length)]
  return ref
}

// ── CART ──

/** A priced line plus the cart key the browser sent, so it can match them up. */
export type QuotedLine = PricedLine & { input_key: string }

export type PricedCart = { lines: QuotedLine[]; subtotal: number; errors: string[] }

export async function priceCart(client: SupabaseClient, rawItems: unknown): Promise<PricedCart> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { lines: [], subtotal: 0, errors: ['Your cart is empty.'] }
  if (rawItems.length > MAX_CART_LINES) return { lines: [], subtotal: 0, errors: ['Your cart has too many lines.'] }

  const errors: string[] = []
  const merged = new Map<string, CartLineInput>()
  for (const raw of rawItems as any[]) {
    const productId = String(raw?.product_id || '')
    if (!UUID_RE.test(productId)) {
      errors.push('An item in your cart is no longer available.')
      continue
    }
    // Kit selections are encoded in variant_id, so never cut it short: a
    // truncated id can silently drop items or change grams.
    const variantId = raw?.variant_id ? String(raw.variant_id) : null
    if (variantId && variantId.length > 8000) {
      errors.push('An item in your cart could not be read. Please add it again.')
      continue
    }
    const input: CartLineInput = {
      product_id: productId,
      variant_id: variantId,
      weight_grams: raw?.weight_grams == null ? null : Number(raw.weight_grams),
      quantity: Number(raw?.quantity ?? 1),
    }
    const key = cartLineKey(input)
    const existing = merged.get(key)
    if (existing) {
      existing.quantity = Math.min(MAX_LINE_QUANTITY, Number(existing.quantity || 0) + Number(input.quantity || 0))
    } else {
      merged.set(key, input)
    }
  }

  const ids = Array.from(new Set(Array.from(merged.values()).map(line => line.product_id)))
  const products = new Map<string, PricingProduct>()
  if (ids.length) {
    const { data, error } = await client
      .from('products')
      .select('id, name, slug, category, price, price_per_unit, in_stock, images, variants')
      .in('id', ids)
    if (error) throw error
    for (const product of data || []) products.set(product.id, product as PricingProduct)
  }

  const lines: QuotedLine[] = []
  for (const [key, input] of Array.from(merged.entries())) {
    const product = products.get(input.product_id)
    if (!product) {
      errors.push('An item in your cart is no longer available.')
      continue
    }
    const result = priceCartLine(product, input)
    if (result.ok) lines.push({ ...result.line, input_key: key })
    else errors.push(result.error)
  }

  return {
    lines,
    subtotal: lines.reduce((sum, line) => sum + line.line_total, 0),
    errors: Array.from(new Set(errors)),
  }
}

// ── COUPONS ──

export type ResolvedCoupon = {
  rules: CouponRules
  record: CouponRecord | null // null for the built-in loyalty code
}

export async function resolveCoupon(
  client: SupabaseClient,
  rawCode: string,
  phone: string | null
): Promise<{ coupon: ResolvedCoupon } | { error: string }> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { error: 'Enter a coupon code.' }

  if (code === LOYALTY_CODE) {
    if (!phone) return { error: `Verify your phone number to use ${LOYALTY_CODE}.` }
    if ((await countCompletedOrders(client, phone)) < 1) {
      return { error: `${LOYALTY_CODE} is available only for returning customers.` }
    }
    return {
      coupon: {
        rules: { code, discount_type: 'percentage', discount_value: LOYALTY_DISCOUNT_PCT },
        record: null,
      },
    }
  }

  const record = await getCouponByCode(client, code)
  if (!record || !record.is_active) return { error: 'Invalid or inactive coupon code.' }
  if ((record.usage_limit || 0) > 0 && (record.usage_count || 0) >= (record.usage_limit || 0)) {
    return { error: 'This coupon has reached its usage limit.' }
  }
  if (phone && record.influencer_phone && phoneVariants(phone).includes(normalizePhone(record.influencer_phone).slice(-10))) {
    return { error: 'Creators cannot use their own code.' }
  }

  return {
    coupon: {
      rules: {
        code: record.code,
        discount_type: record.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discount_value: Number(record.discount_value) || 0,
        min_order_amount: record.min_order_amount || 0,
        max_discount: record.max_discount || null,
        free_shipping: Boolean(record.free_shipping),
        free_cod: Boolean(record.free_cod),
        free_handling: Boolean(record.free_handling),
      },
      record,
    },
  }
}

// ── QUOTES ──

/** Thrown when the order can't be placed as quoted (e.g. wallet already spent). */
export class CheckoutConflictError extends Error {}

/**
 * Wallet credit the customer can use now: their balance plus whatever is held
 * by online attempts they never paid for (a new checkout releases those).
 */
async function readWalletBalance(client: SupabaseClient, phone: string) {
  const { data, error } = await client.from('wallet').select('balance').eq('phone', phone).maybeSingle()
  if (error) return 0
  const balance = Math.max(0, Number(data?.balance) || 0)

  const attempts = await unpaidAttemptsHoldingWallet(client, phone)
  if (!attempts.length) return balance
  const nets = await walletNetByOrder(client, attempts.map(order => order.id))
  const held = attempts.reduce((sum, order) => sum + Math.max(0, -(nets.get(order.id) || 0)), 0)
  return balance + held
}

export type QuoteInput = {
  items: unknown
  couponCode?: string | null
  paymentMethod: PaymentMethod
  useWallet?: boolean
  city?: string
  state?: string
  pincode?: string
}

export type Quote = {
  lines: QuotedLine[]
  errors: string[]
  totals: Totals
  coupon: null | {
    code: string
    rules: CouponRules | null
    applied: boolean
    error: string | null
    message: string | null
  }
  wallet: { balance: number }
  settings: CheckoutSettings
  resolvedCoupon: ResolvedCoupon | null // server-only; holds influencer details
}

export async function buildQuote(client: SupabaseClient, input: QuoteInput, phone: string | null): Promise<Quote> {
  const [cart, settings] = await Promise.all([priceCart(client, input.items), loadCheckoutSettings(client)])

  const code = String(input.couponCode || '').trim().toUpperCase().slice(0, 40)
  let resolvedCoupon: ResolvedCoupon | null = null
  let couponError: string | null = null
  if (code) {
    const result = await resolveCoupon(client, code, phone)
    if ('error' in result) couponError = result.error
    else resolvedCoupon = result.coupon
  }

  const walletBalance = phone && settings.enable_cashback_spending ? await readWalletBalance(client, phone) : 0

  const totals = computeTotals({
    subtotal: cart.subtotal,
    coupon: resolvedCoupon?.rules || null,
    paymentMethod: input.paymentMethod,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    walletBalance,
    useWallet: Boolean(input.useWallet && phone),
    walletSpendingEnabled: settings.enable_cashback_spending,
    cashbackEarningEnabled: settings.enable_cashback_earning,
  })

  return {
    lines: cart.lines,
    errors: cart.errors,
    totals,
    coupon: code
      ? {
          code,
          rules: resolvedCoupon?.rules || null,
          applied: totals.couponApplied,
          error: couponError,
          message: couponError || totals.couponMessage,
        }
      : null,
    wallet: { balance: walletBalance },
    settings,
    resolvedCoupon,
  }
}

/** What the browser may see: no influencer phone numbers or coupon stats. */
export function publicQuote(quote: Quote) {
  const { resolvedCoupon: _private, ...rest } = quote
  return rest
}

// ── CUSTOMER DETAILS ──

export type CustomerDetails = {
  name: string
  email: string | null
  address: string
  city: string
  state: string | null
  pincode: string
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function validateCustomer(raw: any): { customer: CustomerDetails } | { error: string } {
  const name = cleanText(raw?.name, 80)
  const email = cleanText(raw?.email, 120).toLowerCase()
  const address = cleanText(raw?.address, 300)
  const city = cleanText(raw?.city, 60)
  const state = cleanText(raw?.state, 60)
  const pincode = cleanText(raw?.pincode, 6)

  if (name.length < 2) return { error: 'Please enter your full name.' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email address.' }
  if (address.length < 5) return { error: 'Please enter your full address.' }
  if (city.length < 2) return { error: 'Please enter your city.' }
  if (!/^\d{6}$/.test(pincode)) return { error: 'Please enter a valid 6-digit pincode.' }

  return { customer: { name, email: email || null, address, city, state: state || null, pincode } }
}

// ── ORDERS ──

export async function createOrder(
  client: SupabaseClient,
  params: {
    quote: Quote
    customer: CustomerDetails
    phone: string
    status: 'pending' | 'cancelled'
    paymentStatus: 'pending' | 'paid'
    notes: string
  }
) {
  const { quote, customer, phone } = params
  const profile = await ensureUserProfile(client, { phone, name: customer.name, email: customer.email })
  const totals = quote.totals

  const basePayload = {
    user_id: profile.user_id || null,
    customer_name: customer.name,
    customer_phone: phone,
    customer_email: customer.email,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    items: quote.lines.map(({ input_key: _key, ...line }) => line),
    subtotal: totals.subtotal,
    discount: totals.discount,
    discount_amount: totals.discount,
    shipping: totals.shipping,
    cod_charge: totals.codCharge,
    small_order_fee: totals.smallOrderFee,
    total: totals.total,
    final_amount: totals.total,
    wallet_used: totals.walletUsed,
    cashback_earned: totals.cashback,
    coupon_code: totals.couponApplied ? quote.coupon?.code || null : null,
    payment_status: params.paymentStatus,
    status: params.status,
    notes: params.notes,
  }

  // order_ref is unique; retry on the (very unlikely) collision.
  let order: any = null
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const { data, error } = await insertRow(client, 'orders', { ...basePayload, order_ref: generateOrderRef() })
    if (!error && data) {
      order = data
      break
    }
    if ((error as any)?.code === '23505' && String((error as any)?.message || '').includes('order_ref')) continue
    throw error || new Error('Could not save the order.')
  }
  if (!order) throw new Error('Could not save the order. Please try again.')

  // Take the wallet credit now, before any payment, so two checkouts can't
  // spend the same rupees. Unpaid online attempts are released later.
  if (totals.walletUsed > 0 && !(await holdWalletForOrder(client, order, totals.walletUsed))) {
    await client.from('orders').delete().eq('id', order.id)
    throw new CheckoutConflictError('Your wallet balance has changed. Please review your order and try again.')
  }
  return order
}

/**
 * Flip an awaiting-payment order to paid. Returns newlyPaid=false when another
 * request (the browser callback or the webhook) already did it, so callers run
 * side effects only once.
 */
export async function markOrderPaid(
  client: SupabaseClient,
  orderId: string,
  payment: { razorpayOrderId: string; razorpayPaymentId: string; amountPaid: number | null }
) {
  const { data: current, error: loadError } = await client.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (loadError) throw loadError
  if (!current) return { order: null, newlyPaid: false }

  let notes: string = ORDER_NOTE.paidOnline
  if (payment.amountPaid !== null && payment.amountPaid !== (current.final_amount ?? current.total)) {
    notes = `${ORDER_NOTE.paidOnline} — amount mismatch: received ₹${(payment.amountPaid / 100).toFixed(2)}, please review`
    console.error('[checkout] paid amount does not match order total', orderId, payment.amountPaid, current.final_amount ?? current.total)
  }

  const { data: rows, error } = await updateRows(
    client,
    'orders',
    {
      status: 'pending',
      payment_status: 'paid',
      notes,
      payment_id: payment.razorpayPaymentId,
      razorpay_order_id: payment.razorpayOrderId,
      razorpay_payment_id: payment.razorpayPaymentId,
    },
    query => query.eq('id', orderId).eq('payment_status', 'pending').eq('notes', ORDER_NOTE.awaitingPayment)
  )
  if (error) throw error
  if (rows.length) return { order: rows[0], newlyPaid: true }

  const { data: latest } = await client.from('orders').select('*').eq('id', orderId).maybeSingle()
  return { order: latest, newlyPaid: false }
}

/**
 * Move money in or out of a customer's wallet and record it in the ledger.
 * Compare-and-set on the balance, so concurrent orders, cashback and refunds
 * can't overwrite each other or spend the same rupees twice. Returns false if
 * a debit would overdraw the wallet.
 */
export async function adjustWallet(
  client: SupabaseClient,
  params: {
    phone: string
    amount: number // positive; direction comes from `type`
    type: 'credit' | 'debit'
    reason: 'cashback' | 'usage' | 'adjustment'
    orderId: string
    description: string
  }
) {
  const amount = Math.round(params.amount)
  if (amount <= 0) return true
  const phone = normalizePhone(params.phone).slice(-10)

  for (let attempt = 0; attempt < 3; attempt++) {
    const lookup = await client.from('wallet').select('id, user_id, balance').eq('phone', phone).maybeSingle()
    if (lookup.error) return false
    let wallet: { id: string; user_id?: string | null; balance: number } | null = lookup.data
    if (!wallet) {
      if (params.type === 'debit') return false
      wallet = await ensureWallet(client, { phone })
    }
    const balance = Number(wallet!.balance) || 0
    if (params.type === 'debit' && balance < amount) return false

    const { data: updated, error: updateError } = await client
      .from('wallet')
      .update({ balance: params.type === 'credit' ? balance + amount : balance - amount })
      .eq('id', wallet!.id)
      .eq('balance', wallet!.balance)
      .select('id')
    if (updateError) throw updateError
    if (!updated?.length) continue

    const { error: ledgerError } = await client.from('wallet_transactions').insert({
      wallet_id: wallet!.id,
      user_id: wallet!.user_id || null,
      phone,
      order_id: params.orderId,
      amount: params.type === 'credit' ? amount : -amount,
      type: params.type,
      reason: params.reason,
      description: params.description,
    })
    // The balance already moved; a missing ledger row is worth a log, not a failed order.
    if (ledgerError) console.error('[wallet] ledger insert failed', params.orderId, ledgerError)
    return true
  }
  return false
}

// The wallet ledger is the record of what an order has actually taken from or
// returned to the wallet: "usage" debits are negative, refunds positive.
async function walletNetByOrder(client: SupabaseClient, orderIds: string[]) {
  const nets = new Map<string, number>()
  if (!orderIds.length) return nets
  const { data, error } = await client
    .from('wallet_transactions')
    .select('order_id, amount')
    .in('order_id', orderIds)
    .in('reason', ['usage', 'adjustment'])
  if (error) return nets
  for (const row of data || []) nets.set(row.order_id, (nets.get(row.order_id) || 0) + (Number(row.amount) || 0))
  return nets
}

async function unpaidAttemptsHoldingWallet(client: SupabaseClient, phone: string) {
  const { data, error } = await client
    .from('orders')
    .select('id, order_ref, customer_phone, wallet_used, created_at')
    .in('customer_phone', phoneVariants(phone))
    .eq('notes', ORDER_NOTE.awaitingPayment)
    .eq('payment_status', 'pending')
    .gt('wallet_used', 0)
    .limit(20)
  return error ? [] : data || []
}

/** Debit whatever part of `amount` this order hasn't already taken. Idempotent. */
async function holdWalletForOrder(client: SupabaseClient, order: any, amount: number) {
  if (amount <= 0) return true
  const outstanding = amount + ((await walletNetByOrder(client, [order.id])).get(order.id) || 0)
  if (outstanding <= 0) return true
  return adjustWallet(client, {
    phone: order.customer_phone,
    amount: outstanding,
    type: 'debit',
    reason: 'usage',
    orderId: order.id,
    description: `Cashback used on order ${order.order_ref || order.id.slice(0, 8).toUpperCase()}`,
  })
}

/** Return whatever wallet credit this order still holds; never more than it took. */
export async function releaseWalletForOrder(client: SupabaseClient, order: any, description: string) {
  const net = (await walletNetByOrder(client, [order.id])).get(order.id) || 0
  if (net >= 0) return 0
  const returned = await adjustWallet(client, {
    phone: order.customer_phone,
    amount: -net,
    type: 'credit',
    reason: 'adjustment',
    orderId: order.id,
    description,
  })
  return returned ? -net : 0
}

/**
 * Online attempts the customer never paid for give their wallet credit back.
 * A new checkout supersedes them all; elsewhere pass `olderThanMs` so a
 * payment that is still in progress keeps its hold. If one is paid after all,
 * runOrderSideEffects takes the credit again.
 */
export async function releaseAbandonedAttempts(client: SupabaseClient, phone: string, olderThanMs = 0) {
  for (const order of await unpaidAttemptsHoldingWallet(client, phone)) {
    if (olderThanMs && Date.now() - new Date(order.created_at).getTime() < olderThanMs) continue
    await releaseWalletForOrder(client, order, `Released: online payment not completed for order ${order.order_ref || order.id.slice(0, 8).toUpperCase()}`)
  }
}

async function recordCouponUse(client: SupabaseClient, order: any) {
  if (!order.coupon_code) return
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: coupon, error } = await client
      .from('coupons')
      .select('id, usage_count, usage_limit, total_orders, total_revenue, total_discount_given')
      .eq('code', order.coupon_code)
      .maybeSingle()
    if (error || !coupon) return // built-in or creator code: no coupons row

    // The limit is checked when the order is priced; two checkouts racing for
    // the last use can both get through. The order is paid, so count it, but
    // flag it for the admin.
    if ((coupon.usage_limit || 0) > 0 && (coupon.usage_count || 0) >= coupon.usage_limit && attempt === 0) {
      await client
        .from('orders')
        .update({ notes: `${order.notes || ''} — coupon ${order.coupon_code} was over its usage limit, please review`.trim() })
        .eq('id', order.id)
    }

    let update = client
      .from('coupons')
      .update({
        usage_count: (coupon.usage_count || 0) + 1,
        total_orders: (coupon.total_orders || 0) + 1,
        total_revenue: (coupon.total_revenue || 0) + (order.final_amount ?? order.total ?? 0),
        total_discount_given: (coupon.total_discount_given || 0) + (order.discount_amount ?? order.discount ?? 0),
      })
      .eq('id', coupon.id)
    // Compare-and-set on usage_count (NULL needs IS, not =).
    update = coupon.usage_count == null ? update.is('usage_count', null) : update.eq('usage_count', coupon.usage_count)
    const { data: updated, error: updateError } = await update.select('id')
    if (updateError) throw updateError
    if (updated?.length) return
  }
}

async function recordCreatorCommission(client: SupabaseClient, order: any, refCode: string | null) {
  const { data: existing } = await client.from('commissions').select('id').eq('order_id', order.id).limit(1)
  if (existing?.length) return

  const isOwnOrder = (creatorPhone?: string | null) =>
    Boolean(creatorPhone) && phoneVariants(order.customer_phone).includes(normalizePhone(String(creatorPhone)).slice(-10))

  const insert = async (creatorId: string, commissionPct: number) => {
    const { error } = await client.from('commissions').insert({
      creator_id: creatorId,
      order_id: order.id,
      order_total: order.subtotal,
      commission_pct: commissionPct,
      commission_amount: estimateCommission(order.subtotal, commissionPct),
      status: 'pending',
    })
    // A unique index on order_id turns a racing duplicate into this error.
    if (error && (error as any).code !== '23505') throw error
  }

  // 1. A store coupon the admin linked to a creator pays that creator, at the
  //    coupon's own rate if set (these never paid out before).
  if (order.coupon_code) {
    const { data: coupon } = await client
      .from('coupons')
      .select('creator_id, commission_rate')
      .eq('code', String(order.coupon_code).toUpperCase())
      .maybeSingle()
    if (coupon?.creator_id) {
      const { data: creator } = await client
        .from('creators')
        .select('id, phone, commission_pct, active')
        .eq('id', coupon.creator_id)
        .maybeSingle()
      if (creator && creator.active !== false) {
        if (isOwnOrder(creator.phone)) return
        await insert(creator.id, Number(coupon.commission_rate ?? creator.commission_pct ?? 10) || 10)
        return
      }
    }
  }

  // 2. Otherwise the creator whose code was used, or whose referral link the
  //    customer arrived through (a non-creator coupon used to block this).
  const codes = Array.from(new Set([order.coupon_code, refCode].filter(Boolean).map(code => String(code).trim().toUpperCase())))
  for (const code of codes) {
    const { data: creator } = await client
      .from('creators')
      .select('id, phone, commission_pct')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()
    if (!creator) continue
    if (isOwnOrder(creator.phone)) return

    await insert(creator.id, creator.commission_pct || 10)
    return
  }
}

/** Everything that should happen once an order is real (COD placed, or paid). */
export async function runOrderSideEffects(
  client: SupabaseClient,
  order: any,
  context: { refCode?: string | null; settings?: CheckoutSettings }
) {
  const settings = context.settings || (await loadCheckoutSettings(client))
  const step = async (name: string, work: () => Promise<unknown>) => {
    try {
      await work()
    } catch (error) {
      console.error(`[checkout] ${name} failed for order ${order.id}`, error)
    }
  }

  await step('cashback eligibility', async () => {
    if (!settings.enable_cashback_earning) return
    if ((await countCompletedOrders(client, order.customer_phone, order.id)) > 0) return
    await client.from('user_profiles').update({ is_cashback_eligible: true }).eq('phone', normalizePhone(order.customer_phone))
  })

  await step('wallet', async () => {
    // Normally already taken when the order was created; this only matters
    // if an abandoned attempt's hold was released and it got paid anyway.
    const amount = Number(order.wallet_used) || 0
    if (amount > 0 && !(await holdWalletForOrder(client, order, amount))) {
      await client
        .from('orders')
        .update({ notes: `${order.notes || ''} — wallet credit of ₹${(amount / 100).toFixed(2)} could not be taken, please review`.trim() })
        .eq('id', order.id)
    }
  })

  await step('coupon stats', () => recordCouponUse(client, order))
  await step('creator commission', () => recordCreatorCommission(client, order, context.refCode || null))

  await step('confirmation email', async () => {
    if (!order.customer_email) return
    await sendOrderConfirmation({
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      orderId: order.id,
      orderRef: order.order_ref,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      shipping: order.shipping || 0,
      discount: order.discount_amount || order.discount || 0,
      total: order.final_amount ?? order.total ?? 0,
      address: order.address,
      city: order.city,
      state: order.state || undefined,
      pincode: order.pincode,
    })
  })
}

/** Orders a customer should see: hides online attempts that were never paid. */
export function isVisibleToCustomer(order: any) {
  return !(order.notes === ORDER_NOTE.awaitingPayment && order.payment_status !== 'paid')
}

export function toCustomerOrder(order: any) {
  const { razorpay_signature: _signature, ...rest } = order
  return rest
}
