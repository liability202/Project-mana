'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/store'
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '@/lib/utils'

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { items, removeItem, updateQty, total, count } = useCart()

  // ✅ Only compute cart values after client hydration
  const subtotal = mounted ? total() : 0
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6000
  const orderTotal = subtotal + shipping
  const cartCount = mounted ? count() : 0
  const cartItems = mounted ? items : []

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('mana:open-cart', handler)
    return () => window.removeEventListener('mana:open-cart', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-ink/30 z-[999] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white z-[1000] flex flex-col shadow-[-4px_0_32px_rgba(26,18,8,0.1)] border-l border-ivory-3 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-ivory-3">
          <h2 className="font-serif text-xl font-normal text-ink">
            Your Cart{' '}
            <span className="text-sm text-ink-4 font-sans font-light">
              ({cartCount} items)
            </span>
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 bg-transparent border-none cursor-pointer text-ink-3 hover:text-green transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag size={40} className="text-ink-4 mb-3" />
              <p className="text-sm text-ink-3 mb-1">Your cart is empty</p>
              <p className="text-xs text-ink-4">Discover nature's finest</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-4 btn-outline text-sm py-2 px-6"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-ivory-3">
              {cartItems.map((item, i) => (
                <div key={`${item.product_id}-${item.variant_id}-${i}`} className="flex gap-3 py-4">
                  <div className="w-[62px] h-[62px] rounded-lg overflow-hidden flex-shrink-0 bg-ivory-2">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        width={62}
                        height={62}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-ivory-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink leading-tight">{item.product_name}</div>
                    {item.variant_name && (
                      <div className="text-xs text-ink-3 mt-0.5">{item.variant_name}</div>
                    )}
                    {item.weight_grams > 0 && (
                      <div className="text-xs text-ink-3">
                        {item.weight_grams >= 1000
                          ? (item.weight_grams / 1000).toFixed(1) + 'kg'
                          : item.weight_grams + 'g'}
                      </div>
                    )}
                    <div className="font-serif text-base text-green mt-1">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                        className="w-6 h-6 rounded border border-ivory-4 bg-transparent text-green text-base flex items-center justify-center cursor-pointer hover:bg-green-6 transition-colors"
                      >−</button>
                      <span className="text-sm font-medium text-ink min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)}
                        className="w-6 h-6 rounded border border-ivory-4 bg-transparent text-green text-base flex items-center justify-center cursor-pointer hover:bg-green-6 transition-colors"
                      >+</button>
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="text-xs text-ink-4 underline bg-transparent border-none cursor-pointer hover:text-terra transition-colors ml-1"
                      >Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-5 py-5 border-t border-ivory-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-ink-3">Subtotal</span>
              <span className="text-sm font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-ink-3">Shipping</span>
              <span className="text-sm">
                {shipping === 0
                  ? <span className="text-green-3">Free</span>
                  : formatPrice(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <div className="bg-green-6 border border-green-5 rounded px-3 py-2 text-xs text-green-2 text-center mb-3">
                Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping 🚚
              </div>
            )}
            <div className="flex justify-between mb-4 pt-2 border-t border-ivory-3">
              <span className="font-medium text-ink">Total</span>
              <span className="font-serif text-xl text-green">{formatPrice(orderTotal)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-center no-underline justify-center mb-2 flex"
            >
              Checkout
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="btn-outline w-full text-center justify-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
