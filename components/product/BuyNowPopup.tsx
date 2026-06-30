'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/store'
import { formatPrice, parseBaseWeightGrams } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Product } from '@/lib/supabase'

export function BuyNowPopup({ 
  isOpen, 
  onClose, 
  category, 
  currentSlug 
}: { 
  isOpen: boolean
  onClose: () => void
  category: string
  currentSlug: string
}) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const addItem = useCart(s => s.addItem)
  const cartItems = useCart(s => s.items)
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) return
    let active = true

    async function fetchRecs() {
      setLoading(true)
      setItems([])

      // 1. Fetch Kits to see if this product belongs to any
      const { data: kits } = await supabase.from('products').select('variants').eq('category', 'kits')
      
      const kitMates = new Set<string>()
      if (kits) {
        for (const kit of kits) {
          const kitItems = kit.variants?.[0]?.items || []
          const hasCurrent = kitItems.some((i: any) => i.slug === currentSlug)
          if (hasCurrent) {
            kitItems.forEach((i: any) => {
              if (i.slug !== currentSlug) kitMates.add(i.slug)
            })
          }
        }
      }

      const kitSlugsArray = Array.from(kitMates)

      // 2. Fetch products
      let query = supabase.from('products').select('*').neq('slug', currentSlug)
      
      if (kitSlugsArray.length > 0) {
        query = query.or(`slug.in.(${kitSlugsArray.join(',')}),category.eq.${category}`)
      } else {
        query = query.eq('category', category)
      }

      const { data } = await query.limit(20)
      if (!active) return
      if (!data) {
        setLoading(false)
        return
      }

      // 3. Sort: kit items first, then others, limit 4
      const sorted = data.sort((a, b) => {
        const aIsKit = kitMates.has(a.slug)
        const bIsKit = kitMates.has(b.slug)
        if (aIsKit && !bIsKit) return -1
        if (!aIsKit && bIsKit) return 1
        return 0
      }).slice(0, 4)

      setItems(sorted)
      setLoading(false)
    }

    void fetchRecs().catch(() => {
      if (active) {
        setItems([])
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [isOpen, currentSlug, category])

  if (!isOpen) return null

  const exploreMoreLink = category === 'kits' ? '/kits' : `/products?category=${category}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-ivory rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ivory-3 bg-white">
          <div className="flex items-center gap-3 text-green">
            <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif text-xl text-ink font-medium">Added to Cart!</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-ink-3 hover:text-ink transition-colors rounded-full hover:bg-ivory-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 pb-8">
          {loading ? (
            <div className="py-10 text-center text-sm text-ink-3">Finding products that go well with this...</div>
          ) : items.length > 0 ? (
            <>
              <h4 className="font-serif text-lg text-ink mb-4">Frequently bought together</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {items.map(product => {
                  const defaultVariant = product.variants?.[0]
                  const basePrice = defaultVariant?.price || product.price
                  const baseWeight = parseBaseWeightGrams(product.price_per_unit)
                  const inCart = cartItems.some(i => i.product_id === product.id)
                  const productHref = product.category === 'kits' ? `/kits/${product.slug}` : `/products/${product.slug}`

                  return (
                    <div 
                      key={product.id} 
                      className="bg-white border border-ivory-3 rounded-xl p-2.5 flex flex-col transition-shadow hover:shadow-soft"
                    >
                      <Link href={productHref} onClick={onClose} className="block relative aspect-square rounded-lg overflow-hidden bg-ivory-3 mb-2.5">
                        {product.images?.[0] ? (
                          <Image 
                            src={product.images[0]} 
                            alt={product.name} 
                            fill 
                            className="object-cover transition-transform hover:scale-105" 
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-ink-4 text-xs">No Image</span>
                        )}
                      </Link>

                      <div className="flex-1 flex flex-col">
                        <Link href={productHref} onClick={onClose} className="font-serif text-sm text-ink mb-1 line-clamp-2 hover:text-green transition-colors leading-snug">
                          {product.name}
                        </Link>
                        
                        <div className="mt-auto pt-2 flex flex-col gap-2">
                          <div className="font-serif text-base text-green leading-none font-medium">
                            {formatPrice(basePrice)}
                          </div>
                          
                          {inCart ? (
                            <button 
                              onClick={() => {
                                onClose()
                                router.push('/checkout')
                              }}
                              className="w-full bg-green-6 text-green px-2 py-1.5 rounded-md text-xs font-sans hover:bg-green/20 transition-colors whitespace-nowrap font-medium"
                            >
                              In Cart
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                addItem({
                                  product_id: product.id,
                                  product_name: product.name,
                                  product_image: product.images?.[0] || '',
                                  variant_id: defaultVariant?.id,
                                  variant_name: defaultVariant?.name,
                                  weight_grams: product.category === 'kits' ? 1000 : baseWeight,
                                  price: basePrice,
                                  quantity: 1,
                                })
                                showToast(`✦ ${product.name} added!`)
                              }}
                              className="w-full bg-white border border-green-5 text-green-3 px-2 py-1.5 rounded-md text-xs font-sans hover:border-green hover:text-green transition-colors whitespace-nowrap"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <h4 className="font-serif text-xl text-ink mb-2">Added to Cart!</h4>
              <p className="text-sm text-ink-3">No extra recommendations found for this item yet.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-ivory-3 bg-ivory-2 grid grid-cols-2 gap-3 shrink-0">
          <Link 
            href={exploreMoreLink}
            onClick={onClose}
            className="btn-outline flex items-center justify-center py-3"
          >
            Explore More
          </Link>
          <Link 
            href="/checkout"
            onClick={onClose}
            className="btn-primary flex items-center justify-center py-3"
          >
            <span>Proceed to Checkout</span>
          </Link>
        </div>

      </div>
    </div>
  )
}
