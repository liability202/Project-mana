'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from './supabase'
import { MAX_LINE_QUANTITY, cartLineKey } from './pricing'

type ServerLine = {
  input_key?: string
  product_id: string
  product_name: string
  product_image?: string
  variant_id: string | null
  variant_name: string | null
  weight_grams: number
  price: number
}

type CartStore = {
  hydrated: boolean
  setHydrated: (value: boolean) => void
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string, weightGrams?: number) => void
  updateQty: (productId: string, variantId: string | undefined, qty: number, weightGrams?: number) => void
  syncPrices: (lines: ServerLine[]) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

// Omitting weightGrams matches every weight of that product + variant.
function isLine(item: CartItem, productId: string, variantId?: string, weightGrams?: number) {
  return item.product_id === productId
    && (item.variant_id || '') === (variantId || '')
    && (weightGrams === undefined || Number(item.weight_grams) === Number(weightGrams))
}

function clampQuantity(quantity: number) {
  return Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.round(quantity) || 1))
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      items: [],

      addItem: (item) => {
        const key = cartLineKey(item)
        const quantity = clampQuantity(item.quantity || 1)
        const existing = get().items.find(i => cartLineKey(i) === key)
        if (existing) {
          if (existing.quantity >= MAX_LINE_QUANTITY) return
          set(state => ({
            items: state.items.map(i =>
              cartLineKey(i) === key ? { ...i, quantity: clampQuantity(i.quantity + quantity) } : i
            ),
          }))
        } else {
          set(state => ({ items: [...state.items, { ...item, quantity }] }))
        }
      },

      removeItem: (productId, variantId, weightGrams) => {
        set(state => ({
          items: state.items.filter(i => !isLine(i, productId, variantId, weightGrams)),
        }))
      },

      updateQty: (productId, variantId, qty, weightGrams) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId, weightGrams)
          return
        }
        if (qty > MAX_LINE_QUANTITY) return
        set(state => ({
          items: state.items.map(i =>
            isLine(i, productId, variantId, weightGrams) ? { ...i, quantity: qty } : i
          ),
        }))
      },

      // Adopt the server's price and naming for each line, so the cart never
      // shows a stale price (e.g. a reorder, or a price changed by the admin).
      syncPrices: (lines) => {
        const byKey = new Map(lines.filter(line => line.input_key).map(line => [line.input_key as string, line]))
        let changed = false
        const items = get().items.map(item => {
          const line = byKey.get(cartLineKey(item))
          if (!line) return item
          const next = {
            ...item,
            price: line.price,
            product_name: line.product_name || item.product_name,
            product_image: item.product_image || line.product_image || '',
            variant_id: line.variant_id || undefined,
            variant_name: line.variant_name || undefined,
            weight_grams: line.weight_grams,
          }
          if (
            next.price !== item.price ||
            next.product_name !== item.product_name ||
            next.product_image !== item.product_image ||
            (next.variant_id || '') !== (item.variant_id || '') ||
            (next.variant_name || '') !== (item.variant_name || '') ||
            next.weight_grams !== item.weight_grams
          ) {
            changed = true
            return next
          }
          return item
        })
        if (changed) set({ items })
      },

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'mana-cart',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
