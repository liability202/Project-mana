'use client'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Leaf, Minus, Plus, ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@/lib/utils'
import { openCart, useAddMany, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { baseGrams, canQuickAdd, defaultVariant, displayName, gramsLabel, localName, priceAt, productHref, weightChoices } from '../_lib/shared'
import { COLORS, type CravingIcon, type PopColor } from './data'
import { CRAVING_ICONS } from './icons'

/** Snack-sized packs: 250 g dry fruits also come in 100 g on the product page, a cheap way to try something. */
function snackSizes(product: Product) {
  if (product.category === 'dry-fruits' && baseGrams(product) === 250) return [100, 250, 500]
  return weightChoices(product)
}

/* ------------------------------------------------------------------ cart */

export function PopCartButton() {
  const { count, total } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-[#151515] bg-[#FF6B2C] pl-3.5 pr-4 text-sm font-extrabold text-[#151515] shadow-[3px_3px_0_#151515] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#151515]"
    >
      <ShoppingBag size={18} strokeWidth={2.5} />
      <span className="hidden sm:inline">{count > 0 ? formatPrice(total) : 'Cart'}</span>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#151515] bg-white px-1 text-[11px] leading-none tabular-nums">
        {count}
      </span>
    </button>
  )
}

/** Sticky basket pill for phones, with a free-delivery meter. Shows once something is in the cart. */
export function PopCartBar() {
  const { count, total } = useCartSummary()
  if (!count) return null
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <>
      <div aria-hidden className="h-24 lg:hidden" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
        <button
          type="button"
          onClick={openCart}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-3 rounded-[22px] border-2 border-[#151515] bg-[#151515] p-2 pl-3 text-left text-white shadow-[4px_4px_0_#FF6B2C]"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
            <ShoppingBag size={19} strokeWidth={2.5} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#151515] bg-[#FFD84D] px-1 text-[10px] font-extrabold text-[#151515]">
              {count}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold leading-tight">{formatPrice(total)}</span>
            <span className="block truncate text-[11px] font-medium text-white/75">
              {remaining > 0 ? `${formatPrice(remaining)} more for free delivery` : 'Free delivery unlocked!'}
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/20">
              <span className="block h-full rounded-full bg-[#8EE3C0] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </span>
          </span>
          <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-[#FFD84D] px-4 text-sm font-extrabold text-[#151515]">
            View cart <ArrowRight size={15} strokeWidth={2.75} />
          </span>
        </button>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ add controls */

function Stepper({ product, grams, quantity, size = 'md' }: { product: Product; grams: number; quantity: number; size?: 'sm' | 'md' }) {
  const setQuantity = useSetLineQuantity()
  const name = displayName(product.name)
  const height = size === 'sm' ? 'h-10' : 'h-11'
  return (
    <div className={`flex ${height} w-[108px] shrink-0 items-center justify-between rounded-full border-2 border-[#151515] bg-[#151515] text-white`}>
      <button type="button" aria-label={`Remove one ${name}`} onClick={() => setQuantity(product, grams, quantity - 1)} className="flex h-full w-10 items-center justify-center rounded-l-full transition hover:bg-white/15">
        <Minus size={15} strokeWidth={3} />
      </button>
      <span className="text-[15px] font-extrabold tabular-nums" aria-live="polite">{quantity}</span>
      <button type="button" aria-label={`Add one more ${name}`} onClick={() => setQuantity(product, grams, quantity + 1)} className="flex h-full w-10 items-center justify-center rounded-r-full transition hover:bg-white/15">
        <Plus size={15} strokeWidth={3} />
      </button>
    </div>
  )
}

/** ADD that turns into a chunky − 1 + stepper. */
export function AddControl({ product, grams, size = 'md' }: { product: Product; grams?: number; size?: 'sm' | 'md' }) {
  const pack = grams ?? baseGrams(product)
  const quantity = useLineQuantity(product, pack)
  const add = useQuickAdd()
  const name = displayName(product.name)
  const height = size === 'sm' ? 'h-10' : 'h-11'

  if (!canQuickAdd(product)) {
    return (
      <Link href={productHref(product)} className={`inline-flex ${height} shrink-0 items-center rounded-full border-2 border-[#151515] bg-white px-4 text-sm font-extrabold`}>
        Options
      </Link>
    )
  }
  if (quantity > 0) return <Stepper product={product} grams={pack} quantity={quantity} size={size} />
  return (
    <button
      type="button"
      onClick={() => add(product, { grams: pack, silent: true })}
      aria-label={`Add ${name}, ${gramsLabel(pack)}`}
      className={`inline-flex ${height} min-w-[84px] shrink-0 items-center justify-center gap-1 rounded-full border-2 border-[#151515] bg-[#FFD84D] px-4 text-[14px] font-extrabold tracking-wide text-[#151515] shadow-[3px_3px_0_#151515] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#151515]`}
    >
      <Plus size={15} strokeWidth={3} /> ADD
    </button>
  )
}

/* ------------------------------------------------------------------ product card */

export function PopCard({ product, badge, color }: { product: Product; badge?: string; color: PopColor }) {
  const sizes = snackSizes(product)
  const [grams, setGrams] = useState(sizes.includes(baseGrams(product)) ? baseGrams(product) : sizes[0])
  const name = displayName(product.name)
  const variant = defaultVariant(product)
  const local = localName(product.name)
  const sub = variant?.name ? `${variant.name}${(product.variants || []).length > 1 ? ` · +${(product.variants || []).length - 1} more` : ''}` : local

  return (
    <article className="group flex w-[64%] shrink-0 snap-start flex-col rounded-[24px] border-2 border-[#151515] bg-white p-2.5 shadow-[4px_4px_0_#151515] sm:w-[40%] md:w-[30%] lg:w-auto">
      <Link
        href={productHref(product)}
        className="relative block rounded-[18px] border-2 border-[#151515] p-[5px]"
        style={{ backgroundColor: COLORS[color].bg }}
      >
        <span className="relative block aspect-square overflow-hidden rounded-[12px] bg-[#151515]">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={name}
              fill
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 34vw, 230px"
              className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white p-3 text-center text-sm font-extrabold">
              <Leaf size={26} /> {name}
            </span>
          )}
        </span>
        {badge && (
          <span className="absolute left-2 top-2 -rotate-6 rounded-full border-2 border-[#151515] bg-[#FFD84D] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#151515]">
            {badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <Link href={productHref(product)} className="line-clamp-2 min-h-[2.5rem] text-[15px] font-extrabold leading-[1.2] text-[#151515] hover:underline">
          {name}
        </Link>
        <div className="mt-0.5 h-4 truncate text-xs font-medium text-[#5A5A5A]">{sub}</div>

        {sizes.length > 1 && (
          <div className="mt-2.5 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={`Pack size for ${name}`}>
            {sizes.map(size => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={grams === size}
                onClick={() => setGrams(size)}
                className={`h-9 rounded-full border-2 text-[12px] font-bold transition ${
                  grams === size ? 'border-[#151515] bg-[#151515] text-white' : 'border-[#151515]/25 bg-white text-[#151515] hover:border-[#151515]'
                }`}
              >
                {gramsLabel(size)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="leading-tight">
            <div className="text-[19px] font-extrabold tracking-tight">{formatPrice(priceAt(product, grams))}</div>
            <div className="text-[11px] font-semibold text-[#5A5A5A]">{gramsLabel(grams)}</div>
          </div>
          <AddControl product={product} grams={grams} />
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ cravings */

export type CravingData = {
  id: string
  label: string
  line: string
  icon: CravingIcon
  color: PopColor
  products: { product: Product; badge?: string }[]
}

export function CravingTabs({ cravings }: { cravings: CravingData[] }) {
  const [active, setActive] = useState(cravings[0]?.id || '')
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  // The bento hero links to #craving-<id>; open that tab when the hash changes.
  useEffect(() => {
    const fromHash = () => {
      const match = window.location.hash.match(/^#craving-(.+)$/)
      if (match && cravings.some(craving => craving.id === match[1])) setActive(match[1])
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [cravings])

  const current = cravings.find(craving => craving.id === active) || cravings[0]
  if (!current) return null
  const tone = COLORS[current.color]

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = cravings.length - 1
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null
    if (next === null) return
    event.preventDefault()
    setActive(cravings[next].id)
    tabs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label="Pick a craving" className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {cravings.map((craving, index) => {
          const Icon = CRAVING_ICONS[craving.icon]
          const selected = craving.id === current.id
          const colors = COLORS[craving.color]
          return (
            <button
              key={craving.id}
              id={`craving-${craving.id}`}
              ref={element => { tabs.current[index] = element }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="craving-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(craving.id)}
              onKeyDown={event => onKeyDown(event, index)}
              className={`inline-flex h-12 shrink-0 snap-start scroll-mt-32 items-center gap-2 rounded-full border-2 border-[#151515] px-4 text-[15px] font-extrabold transition ${
                selected ? 'shadow-[3px_3px_0_#151515] motion-safe:-translate-y-0.5' : 'bg-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#151515]'
              }`}
              style={selected ? { backgroundColor: colors.bg, color: colors.text } : undefined}
            >
              <Icon size={18} strokeWidth={2.5} /> {craving.label}
            </button>
          )
        })}
      </div>

      <div id="craving-panel" role="tabpanel" aria-labelledby={`craving-${current.id}`} className="mt-4">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center rounded-full border-2 border-[#151515] px-3 py-1 text-[13px] font-extrabold" style={{ backgroundColor: tone.bg, color: tone.text }}>
            {current.label}
          </span>
          <p className="text-[15px] font-semibold text-[#3A3A3A]">{current.line}</p>
        </div>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {current.products.map(({ product, badge }) => (
            <PopCard key={`${current.id}-${product.id}`} product={product} badge={badge} color={current.color} />
          ))}
          {current.products.length < 5 && (
            <Link
              href="/products?category=dry-fruits"
              className="group flex w-[52%] shrink-0 snap-start flex-col justify-between rounded-[24px] border-2 border-dashed border-[#151515] p-5 transition hover:bg-white sm:w-[34%] md:w-[26%] lg:w-auto"
              style={{ backgroundColor: tone.soft }}
            >
              <span className="text-[22px] font-extrabold leading-[1.05]">More snacks this way</span>
              <span className="mt-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#151515] bg-white transition motion-safe:group-hover:translate-x-1">
                <ArrowRight size={20} strokeWidth={2.75} />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ snack packs */

export type PackData = {
  id: string
  name: string
  line: string
  color: PopColor
  items: { product: Product; grams: number }[]
}

export function PackCard({ pack }: { pack: PackData }) {
  const addMany = useAddMany()
  const [added, setAdded] = useState(false)
  const tone = COLORS[pack.color]
  const total = pack.items.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0)

  const addPack = () => {
    const count = addMany(
      pack.items.map(item => ({ product: item.product, grams: item.grams })),
      { message: `Added ${pack.name} (${pack.items.length} snacks)` }
    )
    if (count) setAdded(true)
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border-2 border-[#151515] bg-white shadow-[6px_6px_0_#151515]">
      <div className="relative border-b-2 border-[#151515] px-5 pb-5 pt-5" style={{ backgroundColor: tone.bg, color: tone.text }}>
        <span className="absolute right-4 top-4 rotate-6 rounded-full border-2 border-[#151515] bg-white px-2.5 py-0.5 text-[11px] font-extrabold text-[#151515]">
          {pack.items.length} snacks
        </span>
        <h3 className="pr-20 text-[26px] font-extrabold leading-[1.02] tracking-[-0.02em]">{pack.name}</h3>
        <p className="mt-1.5 text-[14px] font-semibold opacity-90">{pack.line}</p>
        <div className="mt-4 flex -space-x-3">
          {pack.items.map(item => (
            <span key={item.product.id} className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#151515] bg-[#151515]">
              {item.product.images?.[0] && <Image src={item.product.images[0]} alt="" fill sizes="64px" className="scale-[1.35] object-cover object-[50%_62%]" />}
            </span>
          ))}
        </div>
      </div>

      <ul className="flex-1 divide-y-2 divide-dashed divide-[#151515]/15 px-5 py-2">
        {pack.items.map(item => (
          <li key={item.product.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
            <Link href={productHref(item.product)} className="min-w-0 truncate font-bold hover:underline">
              {displayName(item.product.name)}
            </Link>
            <span className="shrink-0 font-semibold text-[#5A5A5A]">
              {gramsLabel(item.grams)} · <span className="text-[#151515]">{formatPrice(priceAt(item.product, item.grams))}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t-2 border-[#151515] px-5 pb-5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-wide text-[#5A5A5A]">Pack total</div>
            <div className="text-[30px] font-extrabold leading-none tracking-tight">{formatPrice(total)}</div>
          </div>
          <div className="text-right text-[12px] font-semibold text-[#5A5A5A]">
            {total >= FREE_SHIPPING_THRESHOLD ? (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#151515] bg-[#8EE3C0] px-2.5 py-1 font-extrabold text-[#151515]">
                <Check size={13} strokeWidth={3} /> Free delivery
              </span>
            ) : (
              <>
                <span className="font-extrabold text-[#151515]">{formatPrice(FREE_SHIPPING_THRESHOLD - total)}</span> away from
                <br />free delivery
              </>
            )}
          </div>
        </div>
        {added ? (
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={openCart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-[#151515] bg-[#8EE3C0] px-5 text-[15px] font-extrabold text-[#151515] shadow-[3px_3px_0_#151515]"
            >
              <Check size={17} strokeWidth={3} /> Added — view cart
            </button>
            <button
              type="button"
              onClick={addPack}
              aria-label={`Add ${pack.name} again`}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#151515] bg-white"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={addPack}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#151515] bg-[#151515] px-5 text-[15px] font-extrabold text-white transition hover:-translate-y-0.5 active:translate-y-[1px]"
            style={{ boxShadow: `4px 4px 0 ${tone.bg === '#151515' ? '#FFD84D' : tone.bg}` }}
          >
            Add the pack <ArrowRight size={17} strokeWidth={2.75} />
          </button>
        )}
      </div>
    </article>
  )
}

