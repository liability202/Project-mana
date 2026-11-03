import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  COD_CHARGE,
  SMALL_ORDER_FEE,
  buildKitVariantId,
  cartLineKey,
  computeTotals,
  couponDiscount,
  priceCartLine,
  priceKitSelection,
  type CouponRules,
  type PricingProduct,
} from '../lib/pricing'

const TEN_PERCENT: CouponRules = { code: 'MANA10', discount_type: 'percentage', discount_value: 10 }

describe('coupon discount follows the cart', () => {
  it('recalculates when items are removed after applying (the reported bug)', () => {
    const big = computeTotals({ subtotal: 400000, coupon: TEN_PERCENT, paymentMethod: 'online' })
    assert.equal(big.discount, 40000)

    const afterRemoving = computeTotals({ subtotal: 80000, coupon: TEN_PERCENT, paymentMethod: 'online' })
    assert.equal(afterRemoving.discount, 8000)
  })

  it('stops applying, with a message, when the cart drops below the minimum', () => {
    const coupon: CouponRules = { ...TEN_PERCENT, min_order_amount: 100000 }
    const above = computeTotals({ subtotal: 150000, coupon, paymentMethod: 'online' })
    assert.equal(above.couponApplied, true)
    assert.equal(above.discount, 15000)

    const below = computeTotals({ subtotal: 80000, coupon, paymentMethod: 'online' })
    assert.equal(below.couponApplied, false)
    assert.equal(below.discount, 0)
    assert.match(below.couponMessage || '', /Add ₹200 more/)
  })

  it('drops free shipping/COD/handling perks with the coupon', () => {
    const coupon: CouponRules = { ...TEN_PERCENT, min_order_amount: 100000, free_shipping: true, free_cod: true, free_handling: true }
    const below = computeTotals({ subtotal: 40000, coupon, paymentMethod: 'cod', pincode: '400001' })
    assert.equal(below.shipping, 5900)
    assert.equal(below.codCharge, COD_CHARGE)
    assert.equal(below.smallOrderFee, SMALL_ORDER_FEE)

    const above = computeTotals({ subtotal: 120000, coupon, paymentMethod: 'cod', pincode: '400001' })
    assert.equal(above.shipping, 0)
    assert.equal(above.codCharge, 0)
  })

  it('respects max_discount and never exceeds the subtotal', () => {
    assert.equal(couponDiscount(1000000, { ...TEN_PERCENT, max_discount: 25000 }), 25000)
    assert.equal(couponDiscount(30000, { code: 'FLAT500', discount_type: 'fixed', discount_value: 50000 }), 30000)
    assert.equal(couponDiscount(30000, { code: 'BAD', discount_type: 'percentage', discount_value: 250 }), 30000)
  })
})

describe('order totals', () => {
  it('charges region shipping below the free-shipping threshold', () => {
    assert.equal(computeTotals({ subtotal: 60000, paymentMethod: 'online', pincode: '110001' }).shipping, 3900)
    assert.equal(computeTotals({ subtotal: 60000, paymentMethod: 'online', pincode: '560001' }).shipping, 5900)
    assert.equal(computeTotals({ subtotal: 100000, paymentMethod: 'online', pincode: '560001' }).shipping, 0)
  })

  it('adds COD and small-order fees', () => {
    const totals = computeTotals({ subtotal: 30000, paymentMethod: 'cod', pincode: '560001' })
    assert.equal(totals.total, 30000 + 5900 + COD_CHARGE + SMALL_ORDER_FEE)
  })

  it('caps wallet use at the discounted subtotal and keeps ₹1 for Razorpay', () => {
    const capped = computeTotals({ subtotal: 50000, coupon: TEN_PERCENT, paymentMethod: 'cod', walletBalance: 999999, useWallet: true, pincode: '560001' })
    assert.equal(capped.walletUsed, 45000)

    const online = computeTotals({ subtotal: 50000, paymentMethod: 'online', walletBalance: 999999, useWallet: true, pincode: '560001' })
    // Wallet covers the products, fees remain payable online.
    assert.equal(online.walletUsed, 50000)
    assert.equal(online.total, 5900)

    const tiny = computeTotals({
      subtotal: 50000,
      coupon: { code: 'X', discount_type: 'percentage', discount_value: 0, free_shipping: true, free_handling: true },
      paymentMethod: 'online',
      walletBalance: 49950,
      useWallet: true,
    })
    assert.equal(tiny.total, 100)
    assert.equal(tiny.walletUsed, 49900)
  })

  it('ignores the wallet unless spending is enabled', () => {
    const totals = computeTotals({ subtotal: 50000, paymentMethod: 'online', walletBalance: 10000, useWallet: true, walletSpendingEnabled: false })
    assert.equal(totals.walletUsed, 0)
  })
})

const almonds: PricingProduct = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Mamra Almonds',
  category: 'dry-fruits',
  price: 120000,
  price_per_unit: 'per 500g',
  variants: [
    { id: 'v1', name: 'Premium', price: 150000 },
    { id: 'v2', name: 'Standard', price: 100000 },
    { id: 'v3', name: 'Jumbo', price: 200000, in_stock: false },
  ],
}

describe('cart line pricing comes from the catalogue', () => {
  it('prices by variant and weight, ignoring any client price', () => {
    const result = priceCartLine(almonds, { product_id: almonds.id, variant_id: 'v2', weight_grams: 250, quantity: 2 })
    assert.ok(result.ok)
    if (!result.ok) return
    assert.equal(result.line.price, 50000)
    assert.equal(result.line.line_total, 100000)
  })

  it('uses the default variant when none was saved', () => {
    const result = priceCartLine(almonds, { product_id: almonds.id, weight_grams: 500, quantity: 1 })
    assert.ok(result.ok)
    if (!result.ok) return
    assert.equal(result.line.variant_id, 'v1')
    assert.equal(result.line.price, 150000)
  })

  it('rejects unknown or out-of-stock variants, bad weights and quantities', () => {
    assert.equal(priceCartLine(almonds, { product_id: almonds.id, variant_id: 'nope', weight_grams: 500 }).ok, false)
    assert.equal(priceCartLine(almonds, { product_id: almonds.id, variant_id: 'v3', weight_grams: 500 }).ok, false)
    assert.equal(priceCartLine(almonds, { product_id: almonds.id, variant_id: 'v1', weight_grams: 5 }).ok, false)
    assert.equal(priceCartLine(almonds, { product_id: almonds.id, variant_id: 'v1', weight_grams: 500, quantity: 11 }).ok, false)
    assert.equal(priceCartLine(almonds, { product_id: almonds.id, variant_id: 'v1', weight_grams: 500, quantity: 0 }).ok, false)
    assert.equal(priceCartLine({ ...almonds, in_stock: false }, { product_id: almonds.id, variant_id: 'v1', weight_grams: 500 }).ok, false)
  })

  it('keeps different weights of the same product as separate lines', () => {
    const quarter = cartLineKey({ product_id: almonds.id, variant_id: 'v1', weight_grams: 250 })
    const kilo = cartLineKey({ product_id: almonds.id, variant_id: 'v1', weight_grams: 1000 })
    assert.notEqual(quarter, kilo)
  })
})

const kit: PricingProduct = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Morning Ritual Kit',
  category: 'kits',
  price: 90000,
  variants: [
    {
      id: 'tier-1-small',
      name: 'Small',
      price: 60000,
      grams_each: 100,
      items: [
        { id: 'almond', name: 'Almonds', price: 100000 },
        { id: 'walnut', name: 'Walnuts', price: 80000, grams: 150 },
        { id: 'dates', name: 'Dates', price_per_gram: 120 },
      ],
    },
    { id: 'tier-1', name: 'Medium', price: 90000, items: [{ id: 'almond', name: 'Almonds', price: 100000 }] },
  ],
}

describe('kit pricing', () => {
  const small = kit.variants![0]

  it('matches the kit builder formula for a customised selection', () => {
    const selection = [
      { item: small.items![0], grams: 200 },
      { item: small.items![2], grams: 50 },
    ]
    const expected = priceKitSelection(small, kit.price, selection)
    const variantId = buildKitVariantId(small.id, 'whole', [{ id: 'almond', grams: 200 }, { id: 'dates', grams: 50 }])
    const result = priceCartLine(kit, { product_id: kit.id, variant_id: variantId, weight_grams: 250, quantity: 1 })
    assert.ok(result.ok)
    if (!result.ok) return
    assert.equal(result.line.price, expected)
    assert.equal(result.line.weight_grams, 250)
    assert.match(result.line.variant_name || '', /Essential - Whole - Almonds 200g, Dates 50g/)
  })

  it('charges the tier price for the default recipe', () => {
    const variantId = buildKitVariantId(small.id, 'powder', [{ id: 'almond', grams: 100 }, { id: 'walnut', grams: 150 }, { id: 'dates', grams: 100 }])
    const result = priceCartLine(kit, { product_id: kit.id, variant_id: variantId, quantity: 1 })
    assert.ok(result.ok)
    if (result.ok) assert.equal(result.line.price, 60000)
  })

  it('picks the right tier when one tier id is a prefix of another', () => {
    const smallId = buildKitVariantId('tier-1-small', 'whole', [{ id: 'almond', grams: 100 }])
    const small = priceCartLine(kit, { product_id: kit.id, variant_id: smallId, quantity: 1 })
    assert.ok(small.ok)
    // 100g almonds = ₹200 raw, scaled by the Small tier's ₹600 / ₹560 recipe factor.
    if (small.ok) assert.equal(small.line.price, 21429)

    const mediumId = buildKitVariantId('tier-1', 'whole', [{ id: 'almond', grams: 100 }])
    const medium = priceCartLine(kit, { product_id: kit.id, variant_id: mediumId, quantity: 1 })
    assert.ok(medium.ok)
    if (medium.ok) assert.equal(medium.line.price, 90000)
  })

  it('rejects tampered kit contents', () => {
    const foreignItem = buildKitVariantId(small.id, 'whole', [{ id: 'saffron', grams: 100 }])
    assert.equal(priceCartLine(kit, { product_id: kit.id, variant_id: foreignItem }).ok, false)
    const silly = buildKitVariantId(small.id, 'whole', [{ id: 'almond', grams: 999999 }])
    assert.equal(priceCartLine(kit, { product_id: kit.id, variant_id: silly }).ok, false)
    const duplicate = buildKitVariantId(small.id, 'whole', [{ id: 'almond', grams: 100 }, { id: 'almond', grams: 100 }])
    assert.equal(priceCartLine(kit, { product_id: kit.id, variant_id: duplicate }).ok, false)
  })

  it('prices a whole kit added from a product card at the tier price', () => {
    const result = priceCartLine(kit, { product_id: kit.id, variant_id: 'tier-1', weight_grams: 1000, quantity: 1 })
    assert.ok(result.ok)
    if (result.ok) assert.equal(result.line.price, 90000)
  })
})
