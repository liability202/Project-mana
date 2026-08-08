'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  grams?: number
  base_price?: number
  price_per_gram?: number
  benefit?: string
}

type KitVariant = Omit<Variant, 'items'> & {
  items?: KitItem[]
  grams_each?: number
  size_desc?: string
  form_options?: {
    powder?: boolean
    whole?: boolean
  }
  benefits?: string[]
  how_to_use?: string
}

type KitProduct = Omit<Product, 'variants'> & {
  variants: KitVariant[]
}

type Form = 'powder' | 'whole'

type ItemState = {
  id: string
  selected: boolean
  grams: number
  ratio: number
}

const CREATIVE_SIZE_NAMES = ['Essential', 'Signature', 'Reserve']

function getSizeDisplayName(name: string | undefined, index: number) {
  if (!name) return CREATIVE_SIZE_NAMES[index] || `Kit Size ${index + 1}`
  const normalized = name.trim().toLowerCase()
  if (['small', 'mini', 'mini ritual'].includes(normalized)) return 'Essential'
  if (['medium', 'regular', 'daily bhandar'].includes(normalized)) return 'Signature'
  if (['large', 'family', 'family reserve'].includes(normalized)) return 'Reserve'
  return name
}

function roundToStep(value: number, step = 25) {
  return Math.max(step, Math.round(value / step) * step)
}

function pricePerGram(item: KitItem) {
  if (item.price_per_gram && item.price_per_gram > 0) return item.price_per_gram
  return (item.price || 0) / 500
}

function getBasePrice(item: KitItem, grams: number) {
  return Math.round(pricePerGram(item) * grams)
}

function normalizeVariants(kit: KitProduct): KitVariant[] {
  if (kit.variants?.length) return kit.variants

  return [{
    id: 'kit-default',
    name: 'Signature',
    description: 'Default kit size',
    price: kit.price,
    grams_each: 100,
    items: [],
  }]
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
      {/* Hero header — always stays deep green */}
      <div className="bg-green dark:bg-[#0A1810] px-[5%] py-12">
        <div className="eyebrow" style={{ color: 'var(--green4)' }}>Curated Kits</div>
        <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] text-ivory font-light">
          Everything you need, <em className="not-italic" style={{ color: 'var(--green4)' }}>in one kit.</em>
        </h1>
        <p className="text-[.88rem] mt-2 max-w-xl" style={{ color: 'var(--green4)' }}>
          Browse Mana wellness kits first. Open any kit to choose size, form, and exact item weights.
        </p>
      </div>

      {/* Kit grid */}
      <div className="px-[5%] py-10 flex flex-col gap-10 max-w-[1320px] mx-auto" style={{ background: 'rgb(var(--c-ivory))' }}>
        {loading ? (
          <div style={{ color: 'var(--ink3)' }}>Loading kits...</div>
        ) : kits.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
            <div className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>No kits yet</div>
            <div className="text-sm mb-4" style={{ color: 'var(--ink3)' }}>Create your first kit from the admin panel and it will appear here automatically.</div>
            <Link href="/admin/kit/new" className="btn-primary no-underline">Create Kit</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {kits.map(kit => (
              <KitOverviewCard key={kit.id} kit={kit} selected={false} onSelect={() => {}} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function KitOverviewCard({ kit, selected, onSelect }: { kit: KitProduct; selected: boolean; onSelect: () => void }) {
  const variants = normalizeVariants(kit)
  const firstVariant = variants[0]
  const items = firstVariant?.items || []
  const image = kit.images?.[0] || items[0]?.image || ''
  const sizeCount = variants.length

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className={`group block text-left rounded-[24px] p-3 transition-all hover:-translate-y-1 hover:shadow-lg no-underline`}
      style={{
        background: 'rgb(var(--c-ivory2))',
        border: selected
          ? '1px solid var(--green)'
          : '1px solid rgb(var(--c-ivory3))',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <div
        className="relative overflow-hidden rounded-[20px] aspect-[4/3]"
        style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory3))' }}
      >
        {image ? (
          <Image src={image} alt={kit.name} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ color: 'var(--ink4)' }}>No image</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[.62rem] tracking-[.2em] uppercase mb-2" style={{ color: 'var(--terra)' }}>Mana wellness kit</div>
        <h2 className="font-serif text-2xl leading-tight font-light" style={{ color: 'var(--ink)' }}>{kit.name}</h2>
        <p className="mt-2 text-sm leading-[1.65] line-clamp-2" style={{ color: 'var(--ink3)' }}>{kit.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs" style={{ color: 'var(--ink4)' }}>{items.length || 'Custom'} items · {sizeCount} ritual size{sizeCount === 1 ? '' : 's'}</div>
            <div className="font-serif text-2xl mt-1" style={{ color: 'var(--green)' }}>{formatPrice(firstVariant?.price || kit.price)}</div>
          </div>
          <span className="rounded-full bg-green px-4 py-2 text-xs font-medium text-white transition-colors group-hover:bg-terra">
            View Kit
          </span>
        </div>
      </div>
    </Link>
  )
}
