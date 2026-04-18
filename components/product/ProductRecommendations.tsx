'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Product } from '@/lib/supabase'

export function ProductRecommendations({ 
  currentSlug, 
  category, 
  grams = 500 
}: { 
  currentSlug: string
  category: string
  grams?: number
}) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const addItem = useCart(s => s.addItem)
  const cartItems = useCart(s => s.items)
  const router = useRouter()

  useEffect(() => {
    let active = true

    async function fetchRecs() {
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
      if (!active || !data) return

      // 3. Sort: kit items first, then others, limit 8
      const sorted = data.sort((a, b) => {
        const aIsKit = kitMates.has(a.slug)
        const bIsKit = kitMates.has(b.slug)
        if (aIsKit && !bIsKit) return -1
        if (!aIsKit && bIsKit) return 1
        return 0
      }).slice(0, 8)

      setItems(sorted)
      setLoading(false)
    }

    fetchRecs()
    return () => { active = false }
  }, [currentSlug, category])

  if (loading || items.length === 0) return null

  return (
    <div className="border-t border-ivory-3 pt-12 pb-4 mt-6">
      <h2 className="font-serif text-2xl text-ink mb-6 px-[5%] max-w-[1400px] mx-auto">
        Frequently bought together
      </h2>
      
      <div className="flex overflow-x-auto gap-4 px-[5%] pb-6 snap-x snap-mandatory hide-scrollbar max-w-[1400px] mx-auto">
        {items.map(product => {
          const defaultVariant = product.variants?.[0]
          const basePrice = defaultVariant?.price || product.price
          // Calculate price matching the requested grams if it's not a kit
          const calculatedPrice = product.category === 'kits' ? basePrice : Math.round((basePrice / 500) * grams)
          
          // Check if this specific item + weight is in cart
          const inCart = cartItems.some(i => i.product_id === product.id && i.weight_grams === grams)

          return (
            <div 
              key={product.id} 
              className="flex-shrink-0 w-[240px] snap-start bg-ivory-2 border border-ivory-3 rounded-xl p-3 flex flex-col"
            >
              <Link href={`/products/${product.slug}`} className="block relative aspect-square rounded-lg overflow-hidden bg-ivory-3 mb-3">
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
                {product.vendor && <div className="text-[.55rem] tracking-widest uppercase text-ink-4 mb-1">{product.vendor}</div>}
                <Link href={`/products/${product.slug}`} className="font-serif text-base text-ink mb-1 line-clamp-1 hover:text-green transition-colors">
                  {product.name}
                </Link>
                <div className="text-xs text-ink-3 mb-3">
                  {product.category === 'kits' ? 'Full Kit' : `${grams >= 1000 ? (grams / 1000).toFixed(1) + 'kg' : grams + 'g'}`}
                </div>
                
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="font-serif text-lg text-green leading-none">
                    {formatPrice(calculatedPrice)}
                  </div>
                  
                  {inCart ? (
                    <button 
                      onClick={() => router.push('/checkout')}
                      className="bg-green text-ivory px-4 py-2 rounded-md text-xs font-sans hover:bg-green-2 transition-colors whitespace-nowrap"
                    >
                      Checkout
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
                          weight_grams: product.category === 'kits' ? 1000 : grams,
                          price: calculatedPrice,
                          quantity: 1,
                        })
                        // Use showToast directly
                        showToast(`✦ ${product.name} added!`)
                      }}
                      className="bg-white border border-green-5 text-green-3 px-4 py-2 rounded-md text-xs font-sans hover:border-green hover:text-green transition-colors whitespace-nowrap"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
