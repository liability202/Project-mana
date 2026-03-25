'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Product } from '@/lib/supabase'

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart(s => s.addItem)
  const firstVariant = product.variants?.[0]

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || '',
      variant_id: firstVariant?.id,
      variant_name: firstVariant?.name,
      weight_grams: 500,
      price: firstVariant?.price || product.price,
      quantity: 1,
    })
    showToast(`✦ ${product.name} added to cart`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card flex flex-col no-underline group"
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden relative bg-ivory-2">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-ivory-2 flex items-center justify-center text-ink-4 text-xs">No image</div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.tags?.includes('bestseller') && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 bg-terra text-white font-medium rounded-sm">Bestseller</span>
          )}
          {product.tags?.includes('organic') && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 bg-green text-ivory font-medium rounded-sm">Organic</span>
          )}
          {product.tags?.includes('premium') && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 bg-ivory text-green-2 border border-green-5 font-medium rounded-sm">Premium</span>
          )}
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-[.52rem] tracking-wide uppercase px-1.5 py-0.5 bg-ivory text-green-2 border border-green-5 font-medium rounded-sm">
              Save {Math.round((product.compare_price - product.price) / product.compare_price * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); showToast('Saved ♡') }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 border border-ivory-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:border-green-4 z-10"
          aria-label="Save"
        >
          <Heart size={14} className="text-ink-3" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        {product.vendor && (
          <div className="text-[.6rem] tracking-[.15em] uppercase text-ink-4 mb-1">{product.vendor}</div>
        )}
        <div className="text-[.68rem] text-terra mb-1">★★★★★</div>
        <div className="font-serif text-[1.12rem] text-ink mb-1 leading-tight">{product.name}</div>
        {product.variants && product.variants.length > 1 && (
          <div className="text-[.66rem] text-ink-3 mb-3">{product.variants.length} varieties</div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="font-serif text-[1.18rem] text-green leading-none">{formatPrice(product.price)}</div>
            <div className="text-[.6rem] text-ink-4 mt-0.5">{product.price_per_unit}</div>
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
