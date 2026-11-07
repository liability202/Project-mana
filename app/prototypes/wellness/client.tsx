'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Plus, ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { openCart, useCartSummary, useQuickAdd } from '../_lib/cart'
import { canQuickAdd, displayName, productHref } from '../_lib/shared'

export function WellnessAddButton({ product, size = 'md' }: { product: Product; size?: 'sm' | 'md' }) {
  const add = useQuickAdd()
  const [added, setAdded] = useState(false)
  const height = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'

  if (!canQuickAdd(product)) {
    return (
      <Link href={productHref(product)} className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-[#1E3A2B]/25 font-semibold text-[#1E3A2B] ${height}`}>
        Options <ArrowRight size={14} />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(product, { silent: true })
        setAdded(true)
        setTimeout(() => setAdded(false), 1600)
      }}
      aria-label={`Add ${displayName(product.name)} to bag`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold transition ${height} ${
        added ? 'bg-[#E0A43A] text-[#24231F]' : 'bg-[#1E3A2B] text-[#F7F2E8] hover:bg-[#2E5641]'
      }`}
    >
      {added ? <Check size={15} /> : <Plus size={15} />}
      {added ? 'Added' : 'Add'}
    </button>
  )
}

export function WellnessCartButton() {
  const { count } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open bag (${count} items)`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1E3A2B] transition hover:bg-[#1E3A2B]/5"
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E0A43A] px-1 text-[10px] font-bold text-[#24231F]">
          {count}
        </span>
      )}
    </button>
  )
}
