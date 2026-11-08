'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Leaf, Minus, Plus, ShoppingCart, Truck } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@/lib/utils'
import { openCart, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { baseGrams, canQuickAdd, cashbackOn, defaultVariant, displayName, gramsLabel, priceAt, productHref, weightChoices } from '../_lib/shared'

export function MarketCard({ product, badge, tag, priority = false }: { product: Product; badge?: string; tag?: string; priority?: boolean }) {
  const choices = weightChoices(product)
  const [grams, setGrams] = useState(baseGrams(product))
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()
  const setQuantity = useSetLineQuantity()
  const variant = defaultVariant(product)
  const moreOptions = Math.max(0, (product.variants || []).length - 1)
  const name = displayName(product.name)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[#ECEAE4] bg-white p-2.5 transition hover:border-[#0F7A47]/30 hover:shadow-[0_10px_28px_rgba(15,122,71,0.10)] sm:p-3">
      <Link href={productHref(product)} className="relative block aspect-square overflow-hidden rounded-xl bg-[#F6F5F1]">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 230px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#E7F6EC] text-[#0F7A47]">
            <Leaf size={28} />
            <span className="px-3 text-center text-xs font-bold">{name}</span>
          </span>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded-md bg-[#F59E0B] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1A1A1A]">
            {badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-2.5">
        <Link href={productHref(product)} className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-[#1A1A1A] transition hover:text-[#0F7A47] sm:text-sm">
          {name}
        </Link>
        <div className="mt-0.5 flex h-4 items-center gap-1 truncate text-[11px] text-[#6B6B6B]">
          {variant ? (
            <>
              <span className="truncate">{variant.name}</span>
              {moreOptions > 0 && (
                <Link href={productHref(product)} className="shrink-0 font-semibold text-[#0F7A47] hover:underline">
                  +{moreOptions} more
                </Link>
              )}
            </>
          ) : tag ? (
            <>
              <Leaf size={11} className="shrink-0 text-[#0F7A47]" /> {tag}
            </>
          ) : null}
        </div>

        {choices.length > 1 && (
          <div className="mt-2 grid grid-cols-3 gap-1" role="radiogroup" aria-label={`Pack size for ${name}`}>
            {choices.map(choice => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={grams === choice}
                onClick={() => setGrams(choice)}
                className={`h-7 rounded-md border text-[11px] font-bold transition ${
                  grams === choice
                    ? 'border-[#0F7A47] bg-[#E7F6EC] text-[#0B5E37]'
                    : 'border-[#ECEAE4] text-[#6B6B6B] hover:border-[#0F7A47]/40'
                }`}
              >
                {gramsLabel(choice)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold text-[#1A1A1A]">{formatPrice(priceAt(product, grams))}</div>
            <div className="text-[10px] font-medium text-[#6B6B6B]">
              {gramsLabel(grams)} · <span className="font-bold text-[#0F7A47]">{formatPrice(cashbackOn(priceAt(product, grams)))} back</span>
            </div>
          </div>
          {!canQuickAdd(product) ? (
            <Link href={productHref(product)} className="inline-flex h-9 items-center rounded-lg border border-[#ECEAE4] px-3 text-xs font-bold text-[#6B6B6B]">
              Options
            </Link>
          ) : quantity > 0 ? (
            <div className="flex h-9 w-[84px] items-center justify-between rounded-lg bg-[#0F7A47] text-white shadow-sm">
              <button type="button" aria-label={`Remove one ${name}`} onClick={() => setQuantity(product, grams, quantity - 1)} className="flex h-full w-7 items-center justify-center rounded-l-lg hover:bg-[#0B5E37]">
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="text-sm font-extrabold tabular-nums" aria-live="polite">{quantity}</span>
              <button type="button" aria-label={`Add one more ${name}`} onClick={() => setQuantity(product, grams, quantity + 1)} className="flex h-full w-7 items-center justify-center rounded-r-lg hover:bg-[#0B5E37]">
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add(product, { grams, silent: true })}
              aria-label={`Add ${name}, ${gramsLabel(grams)}`}
              className="h-9 w-[84px] rounded-lg border-[1.5px] border-[#0F7A47] bg-white text-[13px] font-extrabold tracking-wide text-[#0F7A47] transition hover:bg-[#E7F6EC]"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function MarketCartPill() {
  const { count, total } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart (${count} items)`}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#0F7A47] px-3.5 text-white transition hover:bg-[#0B5E37]"
    >
      <ShoppingCart size={18} />
      {count > 0 ? (
        <span className="text-left leading-tight">
          <span className="block text-[10px] font-semibold opacity-90">{count} item{count === 1 ? '' : 's'}</span>
          <span className="block text-[13px] font-extrabold">{formatPrice(total)}</span>
        </span>
      ) : (
        <span className="text-sm font-bold">Cart</span>
      )}
    </button>
  )
}

/** Sticky basket bar with a live free-delivery meter; appears once something is in the cart. */
export function MarketCartBar() {
  const { count, total } = useCartSummary()
  if (!count) return null
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <>
      {/* Room at the end of the page so the bar never covers the footer. */}
      <div aria-hidden className="h-28 bg-[#F6F5F1]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-5">
        <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-2xl bg-[#0F7A47] text-white shadow-[0_14px_36px_rgba(11,94,55,0.35)]">
          <div className="bg-[#0B5E37] px-4 pb-2 pt-2 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <Truck size={13} />
              {remaining > 0 ? (
                <span>Add <b>{formatPrice(remaining)}</b> more for <b>free delivery</b></span>
              ) : (
                <span>Yay! <b>Free delivery</b> unlocked on this order</span>
              )}
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#F59E0B] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button type="button" onClick={openCart} className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-[#0B5E37]/40">
            <span className="flex items-center gap-2.5">
              <ShoppingCart size={18} />
              <span className="text-left leading-tight">
                <span className="block text-[11px] opacity-90">{count} item{count === 1 ? '' : 's'}</span>
                <span className="block text-sm font-extrabold">{formatPrice(total)}</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-extrabold">
              View cart <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
