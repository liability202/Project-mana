/**
 * Pricing rules shared by the browser and the server.
 *
 * The checkout page uses these to show totals instantly; the API routes use the
 * very same functions to decide what is actually charged. Keeping one copy is
 * what stops the two from drifting — e.g. a coupon's discount is always derived
 * from the *current* subtotal, never remembered from when it was applied.
 *
 * Everything here is pure (no DB, no env secrets) so it can run anywhere and be
 * unit-tested directly. All money values are integer paise.
 */
import { calcPrice, parseBaseWeightGrams, shippingCost } from './utils'

export const COD_CHARGE = 2900 // ₹29
export const SMALL_ORDER_FEE = 1900 // ₹19, charged below SMALL_ORDER_THRESHOLD
export const SMALL_ORDER_THRESHOLD = 50000 // ₹500
export const CASHBACK_PERCENT = 5
export const MAX_LINE_QUANTITY = 10
export const MIN_ONLINE_PAYMENT = 100 // Razorpay rejects orders below ₹1
export const MIN_LINE_GRAMS = 25
export const MAX_LINE_GRAMS = 10000

export type PaymentMethod = 'online' | 'cod'

/** The parts of a coupon that affect price. Safe to send to the browser. */
export type CouponRules = {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount?: number | null
  max_discount?: number | null
  free_shipping?: boolean
  free_cod?: boolean
  free_handling?: boolean
}

/** Why a coupon cannot apply to this subtotal, or null if it can. */
export function couponIneligibility(subtotal: number, rules: CouponRules): string | null {
  const minimum = rules.min_order_amount || 0
  if (minimum > 0 && subtotal < minimum) {
    return `Add ${formatRupees(minimum - subtotal)} more to use ${rules.code} (minimum order ${formatRupees(minimum)}).`
  }
  return null
}

export function couponDiscount(subtotal: number, rules: CouponRules): number {
  if (subtotal <= 0 || couponIneligibility(subtotal, rules)) return 0
  const value = Math.max(0, Number(rules.discount_value) || 0)
  const raw = rules.discount_type === 'fixed'
    ? value
    : Math.round((subtotal * Math.min(value, 100)) / 100)
  const capped = rules.max_discount && rules.max_discount > 0 ? Math.min(raw, rules.max_discount) : raw
  return Math.min(subtotal, capped)
}

export type TotalsInput = {
  subtotal: number
  coupon?: CouponRules | null
  paymentMethod: PaymentMethod
  city?: string
  state?: string
  pincode?: string
  walletBalance?: number
  useWallet?: boolean
  walletSpendingEnabled?: boolean
  cashbackEarningEnabled?: boolean
}

export type Totals = {
  subtotal: number
  discount: number
  couponApplied: boolean
  couponMessage: string | null
  shipping: number
  codCharge: number
  smallOrderFee: number
  walletUsed: number
  total: number
  cashback: number
}

export function computeTotals(input: TotalsInput): Totals {
  const subtotal = Math.max(0, Math.round(input.subtotal || 0))
  const coupon = input.coupon || null
  const couponMessage = coupon ? couponIneligibility(subtotal, coupon) : null
  // A coupon that doesn't meet its minimum gives none of its perks either.
  const activeCoupon = coupon && !couponMessage ? coupon : null

  const discount = activeCoupon ? couponDiscount(subtotal, activeCoupon) : 0
  const shipping = activeCoupon?.free_shipping ? 0 : shippingCost(subtotal, input.city, input.state, input.pincode)
  const codCharge = input.paymentMethod === 'cod' && !activeCoupon?.free_cod ? COD_CHARGE : 0
  const smallOrderFee = subtotal < SMALL_ORDER_THRESHOLD && !activeCoupon?.free_handling ? SMALL_ORDER_FEE : 0

  const walletAllowed = Boolean(input.useWallet) && input.walletSpendingEnabled !== false
  let walletUsed = walletAllowed
    ? Math.min(Math.max(0, input.walletBalance || 0), Math.max(0, subtotal - discount))
    : 0

  let total = Math.max(0, subtotal + shipping + codCharge + smallOrderFee - discount - walletUsed)

  // Razorpay cannot take less than ₹1, so leave that much unpaid by the wallet.
  if (input.paymentMethod === 'online' && total > 0 && total < MIN_ONLINE_PAYMENT && walletUsed > 0) {
    const giveBack = Math.min(walletUsed, MIN_ONLINE_PAYMENT - total)
    walletUsed -= giveBack
    total += giveBack
  }

  const cashback = input.cashbackEarningEnabled === false ? 0 : Math.round((total * CASHBACK_PERCENT) / 100)

  return {
    subtotal,
    discount,
    couponApplied: Boolean(activeCoupon),
    couponMessage,
    shipping,
    codCharge,
    smallOrderFee,
    walletUsed,
    total,
    cashback,
  }
}

// ── CART LINES ──

export type CartLineInput = {
  product_id: string
  variant_id?: string | null
  weight_grams?: number | null
  quantity?: number | null
}

/** Cart lines are distinct per product, variant AND weight (250g ≠ 1kg). */
export function cartLineKey(line: { product_id: string; variant_id?: string | null; weight_grams?: number | null }) {
  return `${line.product_id}::${line.variant_id || ''}::${Number(line.weight_grams) || 0}`
}

export type KitItem = {
  id: string
  name: string
  price?: number
  price_per_gram?: number
  grams?: number
  image?: string
}

export type PricingVariant = {
  id: string
  name?: string
  price?: number
  in_stock?: boolean
  images?: string[]
  tier_name?: string
  tier_images?: string[]
  items?: KitItem[]
  grams_each?: number
  form_options?: { powder?: boolean; whole?: boolean }
}

export type PricingProduct = {
  id: string
  name: string
  slug?: string
  category?: string
  price: number
  price_per_unit?: string | null
  in_stock?: boolean
  images?: string[] | null
  variants?: PricingVariant[] | null
}

export type PricedLine = {
  product_id: string
  product_name: string
  product_slug: string | null
  product_image: string
  variant_id: string | null
  variant_name: string | null
  weight_grams: number
  quantity: number
  price: number // per unit
  line_total: number
}

export type PriceLineResult = { ok: true; line: PricedLine } | { ok: false; error: string }

const KIT_SIZE_NAMES = ['Essential', 'Signature', 'Reserve']

/** Customer-facing name for a kit size; mirrors what the kit builder shows. */
export function getKitSizeDisplayName(name: string | undefined, index: number) {
  if (!name) return KIT_SIZE_NAMES[index] || `Kit Size ${index + 1}`
  const normalized = name.trim().toLowerCase()
  if (['small', 'mini', 'mini ritual'].includes(normalized)) return 'Essential'
  if (['medium', 'regular', 'daily bhandar'].includes(normalized)) return 'Signature'
  if (['large', 'family', 'family reserve'].includes(normalized)) return 'Reserve'
  return name
}

export function kitItemPricePerGram(item: KitItem) {
  if (item.price_per_gram && item.price_per_gram > 0) return item.price_per_gram
  return (item.price || 0) / 500
}

export function kitItemBasePrice(item: KitItem, grams: number) {
  return Math.round(kitItemPricePerGram(item) * grams)
}

/**
 * Price of a customised kit. The tier's list price is spread across its default
 * recipe (`kitFactor`), so changing grams or dropping items scales from there.
 */
export function priceKitSelection(
  variant: PricingVariant,
  fallbackPrice: number,
  selection: { item: KitItem; grams: number }[]
) {
  const defaultRawTotal = (variant.items || []).reduce(
    (sum, item) => sum + kitItemBasePrice(item, item.grams || variant.grams_each || 100),
    0
  )
  const dynamicRawTotal = selection.reduce((sum, entry) => sum + kitItemBasePrice(entry.item, entry.grams), 0)
  const kitFactor = defaultRawTotal > 0 ? (variant.price || fallbackPrice || defaultRawTotal) / defaultRawTotal : 1
  return Math.max(0, Math.round(dynamicRawTotal * kitFactor))
}

/** The variant_id the kit builder writes for a customised kit. */
export function buildKitVariantId(variantId: string, form: 'powder' | 'whole', selection: { id: string; grams: number }[]) {
  return `${variantId || 'kit'}-${form}-${selection.map(entry => `${entry.id}:${entry.grams}`).join('|')}`
}

type ParsedKitSelection = {
  variant: PricingVariant
  variantIndex: number
  form: 'powder' | 'whole'
  selection: { item: KitItem; grams: number }[]
}

function parseKitVariantId(product: PricingProduct, variantId: string): ParsedKitSelection | { error: string } {
  const variants = product.variants || []
  // Variant ids can themselves contain '-', so match the longest known id first.
  const candidates = variants
    .map((variant, index) => ({ variant, index }))
    .filter(({ variant }) => variant.id && variantId.startsWith(`${variant.id}-`))
    .sort((a, b) => b.variant.id.length - a.variant.id.length)

  for (const { variant, index } of candidates) {
    const rest = variantId.slice(variant.id.length + 1)
    const form = rest.startsWith('powder-') ? 'powder' : rest.startsWith('whole-') ? 'whole' : null
    if (!form) continue
    if (variant.form_options?.[form] === false) return { error: `${product.name} is not available as ${form}.` }

    const itemsById = new Map((variant.items || []).map(item => [item.id, item]))
    const selection: { item: KitItem; grams: number }[] = []
    const seen = new Set<string>()

    for (const part of rest.slice(form.length + 1).split('|')) {
      const separator = part.lastIndexOf(':')
      const id = separator > 0 ? part.slice(0, separator) : ''
      const grams = Number(part.slice(separator + 1))
      const item = itemsById.get(id)
      if (!item || seen.has(id)) return { error: `${product.name} has an item that is no longer available. Please rebuild the kit.` }
      if (!Number.isInteger(grams) || grams < 1 || grams > MAX_LINE_GRAMS) {
        return { error: `${product.name} has an invalid quantity for ${item.name}.` }
      }
      seen.add(id)
      selection.push({ item, grams })
    }

    if (!selection.length) return { error: `${product.name} needs at least one item.` }
    return { variant, variantIndex: index, form, selection }
  }

  return { error: `${product.name} has changed since it was added. Please add it to the cart again.` }
}

function normalizeQuantity(quantity: unknown) {
  const value = Number(quantity ?? 1)
  if (!Number.isInteger(value) || value < 1 || value > MAX_LINE_QUANTITY) return null
  return value
}

/** Price one cart line from catalogue data. Never trusts a client-sent price. */
export function priceCartLine(product: PricingProduct, input: CartLineInput): PriceLineResult {
  if (product.in_stock === false) return { ok: false, error: `${product.name} is out of stock.` }

  const quantity = normalizeQuantity(input.quantity)
  if (quantity === null) {
    return { ok: false, error: `Quantity for ${product.name} must be between 1 and ${MAX_LINE_QUANTITY}.` }
  }

  const variants = product.variants || []
  const requestedVariantId = String(input.variant_id || '').trim()
  const image = product.images?.[0] || ''

  if (product.category === 'kits' && requestedVariantId && !variants.some(v => v.id === requestedVariantId)) {
    const parsed = parseKitVariantId(product, requestedVariantId)
    if ('error' in parsed) return { ok: false, error: parsed.error }
    if (parsed.variant.in_stock === false) return { ok: false, error: `${product.name} is out of stock.` }

    const price = priceKitSelection(parsed.variant, product.price, parsed.selection)
    if (price <= 0) return { ok: false, error: `${product.name} cannot be priced right now. Please contact us.` }

    const tierPrefix = parsed.variant.tier_name ? `${parsed.variant.tier_name} - ` : ''
    const sizeLabel = getKitSizeDisplayName(parsed.variant.name, parsed.variantIndex)
    const formLabel = parsed.form === 'powder' ? 'Powder' : 'Whole'
    const contents = parsed.selection.map(entry => `${entry.item.name} ${entry.grams}g`).join(', ')

    return {
      ok: true,
      line: {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug || null,
        product_image: parsed.variant.tier_images?.[0] || image,
        variant_id: buildKitVariantId(parsed.variant.id, parsed.form, parsed.selection.map(entry => ({ id: entry.item.id, grams: entry.grams }))),
        variant_name: `${tierPrefix}${sizeLabel} - ${formLabel} - ${contents}`,
        weight_grams: parsed.selection.reduce((sum, entry) => sum + entry.grams, 0),
        quantity,
        price,
        line_total: price * quantity,
      },
    }
  }

  // Lines saved without a variant (older carts, reorders) get the default
  // variant, matching what the product card adds.
  const variant = requestedVariantId
    ? variants.find(v => v.id === requestedVariantId)
    : variants[0]
  if (requestedVariantId && !variant) {
    return { ok: false, error: `The selected option for ${product.name} is no longer available.` }
  }
  if (variant?.in_stock === false) {
    return { ok: false, error: `${product.name}${variant.name ? ` (${variant.name})` : ''} is out of stock.` }
  }

  const basePrice = variant?.price || product.price
  if (!basePrice || basePrice <= 0) return { ok: false, error: `${product.name} cannot be priced right now. Please contact us.` }

  let price: number
  let grams: number
  if (product.category === 'kits') {
    // A whole kit at its list price; weight only matters for shipping.
    price = basePrice
    const defaultGrams = (variant?.items || []).reduce((sum, item) => sum + (item.grams || variant?.grams_each || 100), 0)
    grams = clampGrams(input.weight_grams) ?? (defaultGrams || 1000)
  } else {
    const requestedGrams = input.weight_grams == null ? parseBaseWeightGrams(product.price_per_unit) : clampGrams(input.weight_grams)
    if (requestedGrams === null) {
      return { ok: false, error: `Please choose a weight between ${MIN_LINE_GRAMS}g and ${MAX_LINE_GRAMS / 1000}kg for ${product.name}.` }
    }
    grams = requestedGrams
    price = calcPrice(basePrice, parseBaseWeightGrams(product.price_per_unit), grams)
  }

  return {
    ok: true,
    line: {
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug || null,
      product_image: variant?.images?.[0] || image,
      variant_id: variant?.id || null,
      variant_name: variant?.name || null,
      weight_grams: grams,
      quantity,
      price,
      line_total: price * quantity,
    },
  }
}

function clampGrams(value: unknown): number | null {
  const grams = Number(value)
  if (!Number.isFinite(grams) || !Number.isInteger(grams)) return null
  if (grams < MIN_LINE_GRAMS || grams > MAX_LINE_GRAMS) return null
  return grams
}

function formatRupees(paise: number) {
  return '₹' + Math.ceil(paise / 100).toLocaleString('en-IN')
}
