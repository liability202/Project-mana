'use client'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/store'
import { showToast } from '@/components/ui/Toaster'
import { cartLineKey } from '@/lib/pricing'
import type { Product } from '@/lib/supabase'
import { baseGrams, defaultVariant, displayName, priceAt } from './shared'

/** Adds a product's default option at a pack size; the server re-prices it at checkout. */
export function useQuickAdd() {
  const addItem = useCart(state => state.addItem)
  return (product: Product, options: { grams?: number; openCart?: boolean; silent?: boolean } = {}) => {
    const variant = defaultVariant(product)
    const grams = options.grams ?? baseGrams(product)
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || '',
      variant_id: variant?.id,
      variant_name: variant?.name,
      weight_grams: grams,
      price: priceAt(product, grams),
      quantity: 1,
    })
    if (!options.silent) showToast(`Added ${displayName(product.name)}`)
    if (options.openCart) openCart()
  }
}

/** Set the quantity of one product/option/pack size line (0 removes it). */
export function useSetLineQuantity() {
  const updateQty = useCart(state => state.updateQty)
  return (product: Product, grams: number, quantity: number) =>
    updateQty(product.id, defaultVariant(product)?.id, quantity, grams)
}

/** True once the persisted cart has loaded, so server and first client render match. */
function useHydrated() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready
}

/** Cart totals that render as 0 until the persisted cart has loaded (no hydration mismatch). */
export function useCartSummary() {
  const items = useCart(state => state.items)
  const list = useHydrated() ? items : []
  return {
    count: list.reduce((sum, item) => sum + item.quantity, 0),
    total: list.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }
}

/** Quantity of one product/option/pack size already in the cart. */
export function useLineQuantity(product: Product, grams: number) {
  const items = useCart(state => state.items)
  const ready = useHydrated()
  if (!ready) return 0
  const key = cartLineKey({ product_id: product.id, variant_id: defaultVariant(product)?.id, weight_grams: grams })
  return items.find(item => cartLineKey(item) === key)?.quantity || 0
}

export function openCart() {
  window.dispatchEvent(new CustomEvent('mana:open-cart'))
}
