'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from './supabase'

type CartStore = {
  hydrated: boolean
  setHydrated: (value: boolean) => void
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQty: (productId: string, variantId: string | undefined, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      items: [],

      addItem: (item) => {
        const existing = get().items.find(
          i => i.product_id === item.product_id && i.variant_id === item.variant_id
        )
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.product_id === item.product_id && i.variant_id === item.variant_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }))
        } else {
          set(state => ({ items: [...state.items, { ...item, quantity: 1 }] }))
        }
      },

      removeItem: (productId, variantId) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.product_id === productId && i.variant_id === variantId)
          )
        }))
      },

      updateQty: (productId, variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.product_id === productId && i.variant_id === variantId
              ? { ...i, quantity: qty }
              : i
          )
        }))
      },

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'mana-cart',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

// ── COUPON STORE ──
type CouponStore = {
  code: string
  discount: number  // percentage e.g. 10 = 10%
  apply: (code: string) => boolean
  clear: () => void
}

const COUPONS: Record<string, number> = {
  'MANA-PRIYA': 10,
  'MANA-ROHAN': 12,
  'MANA-ANAN': 8,
  'MANA10': 10,
  'WELCOME': 5,
  'MANA15': 15,
}

export const useCoupon = create<CouponStore>()(
  persist(
    (set) => ({
      code: '',
      discount: 0,
      apply: (code) => {
        const upper = code.toUpperCase().trim()
        const pct = COUPONS[upper]
        if (pct) {
          set({ code: upper, discount: pct })
          return true
        }
        return false
      },
      clear: () => set({ code: '', discount: 0 }),
    }),
    { name: 'mana-coupon' }
  )
)
