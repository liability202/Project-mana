'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Plus, ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { openCart, useCartSummary, useQuickAdd } from '../_lib/cart'
import { canQuickAdd, displayName, productHref } from '../_lib/shared'

export function NoirAddButton({ product, wide = false }: { product: Product; wide?: boolean }) {
  const add = useQuickAdd()
  const [added, setAdded] = useState(false)

  if (!canQuickAdd(product)) {
    return (
      <Link
        href={productHref(product)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D6B26C]/50 text-xs font-semibold text-[#EBD29C] ${wide ? 'h-11 w-full' : 'h-9 px-3.5'}`}
      >
        View options <ArrowRight size={14} />
      </Link>
    )
  }

  const onClick = () => {
    add(product, { silent: true })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  if (wide) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#D6B26C] text-sm font-semibold text-[#0C0A08] transition hover:bg-[#EBD29C]"
      >
        {added ? <Check size={16} /> : <ShoppingBag size={16} />}
        {added ? 'Added to bag' : 'Add to bag'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Add ${displayName(product.name)} to bag`}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${
        added
          ? 'border-[#D6B26C] bg-[#D6B26C] text-[#0C0A08]'
          : 'border-[#D6B26C]/50 text-[#EBD29C] hover:border-[#D6B26C] hover:bg-[#D6B26C] hover:text-[#0C0A08]'
      }`}
    >
      {added ? <Check size={14} /> : <Plus size={14} />}
      {added ? 'Added' : 'Add'}
    </button>
  )
}

export function NoirCartButton() {
  const { count } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open bag (${count} items)`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#F3ECDF] transition hover:bg-white/5"
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D6B26C] px-1 text-[10px] font-bold text-[#0C0A08]">
          {count}
        </span>
      )}
    </button>
  )
}
