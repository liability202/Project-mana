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
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] z-[1000] flex flex-col shadow-[-4px_0_32px_rgba(26,18,8,0.1)] border-l transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'rgb(var(--c-ivory2))', borderColor: 'rgb(var(--c-ivory3))' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--c-ivory3))' }}>
          <h2 className="font-serif text-xl font-normal" style={{ color: 'var(--ink)' }}>
            Your Cart{' '}
            <span className="text-sm font-sans font-light" style={{ color: 'var(--ink4)' }}>
              ({cartCount} items)
            </span>
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 bg-transparent border-none cursor-pointer transition-colors"
            style={{ color: 'var(--ink3)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag size={40} className="mb-3" style={{ color: 'var(--ink4)' }} />
              <p className="text-sm mb-1" style={{ color: 'var(--ink3)' }}>Your cart is empty</p>
              <p className="text-xs" style={{ color: 'var(--ink4)' }}>Discover nature's finest</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-4 btn-outline text-sm py-2 px-6"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-ivory-3 dark:divide-green-5/20">
              {cartItems.map((item, i) => (
                <div key={`${item.product_id}-${item.variant_id}-${i}`} className="flex gap-3 py-4" style={{ borderColor: 'rgb(var(--c-ivory3))' }}>
                  <div className="w-[62px] h-[62px] rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgb(var(--c-ivory3))' }}>
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        width={62}
                        height={62}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: 'rgb(var(--c-ivory3))' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight" style={{ color: 'var(--ink)' }}>{item.product_name}</div>
                    {item.variant_name && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--ink3)' }}>{item.variant_name}</div>
                    )}
                    {item.weight_grams > 0 && (
                      <div className="text-xs" style={{ color: 'var(--ink3)' }}>
                        {item.weight_grams >= 1000
                          ? (item.weight_grams / 1000).toFixed(1) + 'kg'
                          : item.weight_grams + 'g'}
                      </div>
                    )}
                    <div className="font-serif text-base mt-1" style={{ color: 'var(--green)' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                        className="w-6 h-6 rounded border bg-transparent text-base flex items-center justify-center cursor-pointer transition-colors"
                        style={{ color: 'var(--green)', borderColor: 'rgb(var(--c-ivory3))' }}
                      >−</button>
                      <span className="text-sm font-medium min-w-[20px] text-center" style={{ color: 'var(--ink)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product_id, item.variant_id, Math.min(10, item.quantity + 1))}
                        disabled={item.quantity >= 10}
                        className="w-6 h-6 rounded border bg-transparent text-base flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                        style={{ color: 'var(--green)', borderColor: 'rgb(var(--c-ivory3))' }}
                      >+</button>
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="text-xs underline bg-transparent border-none cursor-pointer hover:text-terra transition-colors ml-1"
                        style={{ color: 'var(--ink4)' }}
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
          <div className="px-5 py-5 border-t" style={{ borderColor: 'rgb(var(--c-ivory3))' }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm" style={{ color: 'var(--ink3)' }}>Subtotal</span>
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm" style={{ color: 'var(--ink3)' }}>Shipping</span>
              <span className="text-sm" style={{ color: 'var(--ink)' }}>
                {shipping === 0
                  ? <span style={{ color: 'var(--green)' }}>Free</span>
                  : formatPrice(shipping)}
              </span>
            </div>
            <div className="mb-4 mt-2">
              {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                <div className="rounded-lg px-3 py-2 text-center" style={{ background: 'rgba(var(--c-green5), 0.1)', border: '1px solid var(--green)' }}>
                  <div className="text-xs font-bold tracking-wide" style={{ color: 'var(--green)' }}>🎉 You've unlocked Free Shipping!</div>
                </div>
              ) : (
                <div className="rounded-lg p-3" style={{ background: 'rgb(var(--c-ivory3))', border: '1px solid rgb(var(--c-ivory3))' }}>
                  <div className="text-xs font-medium text-center mb-2" style={{ color: 'var(--ink3)' }}>
                    Add <span className="font-bold" style={{ color: 'var(--green)' }}>{formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}</span> more for <span className="font-bold" style={{ color: 'var(--green)' }}>Free Shipping</span>! 🚚
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgb(var(--c-ivory2))' }}>
                    <div 
                      className="h-full bg-green transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between mb-4 pt-2 border-t" style={{ borderColor: 'rgb(var(--c-ivory3))' }}>
              <span className="font-medium text-ink">Total</span>
              <span className="font-serif text-xl" style={{ color: 'var(--green)' }}>{formatPrice(orderTotal)}</span>
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
