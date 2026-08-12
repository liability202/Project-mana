'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useCart } from '@/lib/store'
import { calcPriceForWeight, formatPrice, parseBaseWeightGrams } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Product } from '@/lib/supabase'

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart(s => s.addItem)
  const firstVariant = product.variants?.[0]
  const basePrice = firstVariant?.price || product.price
  const baseWeight = parseBaseWeightGrams(product.price_per_unit)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || '',
      variant_id: firstVariant?.id,
      variant_name: firstVariant?.name,
      weight_grams: baseWeight,
      price: basePrice,
      quantity: 1,
    })
    showToast(`✦ ${product.name} added to cart`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  return (
    <Link
      href={product.category === 'kits' ? `/kits/${product.slug}` : `/products/${product.slug}`}
      className="card flex flex-col no-underline group"
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden relative" style={{ background: 'rgb(var(--c-ivory2))' }}>
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: 'rgb(var(--c-ivory2))', color: 'var(--ink4)' }}>No image</div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.tags?.includes('bestseller') && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 bg-terra text-white font-medium rounded-sm">Bestseller</span>
          )}
          {product.tags?.includes('organic') && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 font-medium rounded-sm text-ivory" style={{ background: 'var(--green)' }}>Organic</span>
          )}
          {product.tags?.includes('premium') && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 font-medium rounded-sm border" style={{ background: 'rgb(var(--c-ivory))', color: 'var(--green2)', borderColor: 'rgba(var(--c-green5), 0.5)' }}>Premium</span>
          )}
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 font-medium rounded-sm border" style={{ background: 'rgb(var(--c-ivory))', color: 'var(--green2)', borderColor: 'rgba(var(--c-green5), 0.5)' }}>
              Save {Math.round((product.compare_price - product.price) / product.compare_price * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); showToast('Saved ♡') }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
          style={{ background: 'rgba(var(--c-ivory), 0.9)', border: '1px solid rgba(var(--c-ivory3), 1)' }}
          aria-label="Save"
        >
          <Heart size={14} style={{ color: 'var(--ink3)' }} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        {product.vendor && (
          <div className="text-[.6rem] tracking-[.15em] uppercase mb-1" style={{ color: 'var(--ink4)' }}>{product.vendor}</div>
        )}
        <div className="text-[.68rem] mb-1" style={{ color: 'var(--terra)' }}>★★★★★</div>
        <div className="font-serif text-[1.12rem] mb-1 leading-tight" style={{ color: 'var(--ink)' }}>{product.name}</div>
        {product.variants && product.variants.length > 1 && (
          <div className="text-[.66rem] mb-3" style={{ color: 'var(--ink3)' }}>{product.variants.length} varieties</div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="font-serif text-[1.18rem] leading-none" style={{ color: 'var(--green)' }}>{formatPrice(basePrice)}</div>
            {product.price_per_unit && (
              <div className="text-[.6rem] mt-0.5" style={{ color: 'var(--ink4)' }}>{product.price_per_unit}</div>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            className="btn-primary btn-sm text-xs py-2 px-3.5 disabled:opacity-50"
          >
            <span>{product.in_stock ? '+ Add' : 'Sold Out'}</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
