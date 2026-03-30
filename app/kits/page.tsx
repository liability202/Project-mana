'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Product, Variant } from '@/lib/supabase'

type KitItem = {
  id: string
  name: string
  slug?: string
  price: number
  category?: string
  image?: string
}

type KitProduct = Product & {
  variants: (Variant & { items?: KitItem[] })[]
}

export default function KitsPage() {
  const [kits, setKits] = useState<KitProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void fetch('/api/products?category=kits&limit=50')
      .then(res => res.json())
      .then((data: KitProduct[]) => {
        if (!active) return
        setKits(Array.isArray(data) ? data : [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <div className="bg-green px-[5%] py-12">
        <div className="eyebrow" style={{ color: 'var(--green4)' }}>Curated Kits</div>
        <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] text-ivory font-light">
          Everything you need, <em className="not-italic text-green-4">together.</em>
        </h1>
        <p className="text-[.88rem] text-green-4 mt-2 max-w-lg">
          Admin-created kits now render directly from your product catalog, so whatever you build in admin shows up here automatically.
        </p>
      </div>

      <div className="px-[5%] py-10 flex flex-col gap-10 max-w-[1280px] mx-auto">
        {loading ? (
          <div className="text-ink-3">Loading kits...</div>
        ) : kits.length === 0 ? (
          <div className="bg-white border border-ivory-3 rounded-2xl p-8 text-center">
            <div className="font-serif text-2xl text-ink mb-2">No kits yet</div>
            <div className="text-sm text-ink-3 mb-4">Create your first kit from the admin panel and it will appear here automatically.</div>
            <Link href="/admin/kit/new" className="btn-primary no-underline">Create Kit</Link>
          </div>
        ) : (
          kits.map(kit => <KitCard key={kit.id} kit={kit} />)
        )}
      </div>
    </>
  )
}

function KitCard({ kit }: { kit: KitProduct }) {
  const addItem = useCart(s => s.addItem)
  const activeVariant = (kit.variants?.[0] || null) as (Variant & { items?: KitItem[] }) | null
  const includedItems = activeVariant?.items || []
  const image = kit.images?.[0] || includedItems[0]?.image || ''

  const handleAddToCart = () => {
    addItem({
      product_id: kit.id,
      product_name: kit.name,
      product_image: image,
      variant_id: activeVariant?.id,
      variant_name: activeVariant?.name || 'Kit',
      weight_grams: 0,
      price: activeVariant?.price || kit.price,
      quantity: 1,
    })
    showToast(`${kit.name} added`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  return (
    <div className="bg-white border border-ivory-3 rounded-[28px] overflow-hidden shadow-soft">
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="p-5 sm:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-ivory-3">
          <div className="relative overflow-hidden rounded-[24px] border border-ivory-3 bg-ivory2 aspect-[4/3]">
            {image ? (
              <Image src={image} alt={kit.name} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-ink-4">No image</div>
            )}
          </div>
          <div className="mt-5 rounded-[20px] border border-green-5 bg-green-6/50 p-5">
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Description</div>
            <p className="text-[.9rem] text-ink-3 leading-[1.8]">{kit.description}</p>
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8 flex flex-col gap-5">
          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Dynamic admin kit</div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-ink font-light">{kit.name}</h2>
            {kit.vendor && <div className="text-sm text-ink-4 mt-2">{kit.vendor}</div>}
          </div>

          <div className="rounded-2xl border border-ivory-3 bg-ivory/70 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4">Included products</div>
              <div className="text-[.68rem] text-ink-3">{includedItems.length} items</div>
            </div>
            <div className="flex flex-col gap-3">
              {includedItems.length === 0 ? (
                <div className="text-sm text-ink-3">No linked products were saved inside this kit yet.</div>
              ) : (
                includedItems.map(item => (
                  <div key={item.id} className="rounded-xl border border-ivory-3 bg-white p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-ivory-3 bg-ivory2 flex items-center justify-center text-[.58rem] uppercase tracking-[.12em] text-ink-4">
                        {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <span>Img</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[.9rem] font-medium text-ink">{item.name}</div>
                        <div className="text-[.68rem] text-ink-4">{item.category || 'product'}</div>
                      </div>
                    </div>
                    <div className="text-[.84rem] font-medium text-green">{formatPrice(item.price)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-green-5 bg-green-6/60 p-4">
            <div className="space-y-1.5 border-b border-green-5 pb-3 mb-3">
              {includedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-[.78rem] text-ink-3">
                  <span>{item.name}</span>
                  <span>{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <div className="font-serif text-3xl text-green">{formatPrice(activeVariant?.price || kit.price)}</div>
              {kit.compare_price ? <div className="text-sm text-ink-4 line-through">{formatPrice(kit.compare_price)}</div> : null}
            </div>
            <div className="text-[.72rem] text-ink-3 mb-4">{kit.price_per_unit || 'per kit'}</div>
            <div className="flex gap-2.5 flex-wrap">
              <button onClick={handleAddToCart} className="btn-primary flex-1 justify-center min-w-[140px]">
                <span>Add to Cart</span>
              </button>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Mana! I want to buy the ${kit.name} for ${formatPrice(activeVariant?.price || kit.price)}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex-1 justify-center min-w-[140px] no-underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
