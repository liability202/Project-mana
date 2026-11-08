'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Gift, Minus, Plus, Search, ShoppingBag, Sparkles, Truck, X } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { FREE_SHIPPING_THRESHOLD, formatPrice, whatsappUrl } from '@/lib/utils'
import { openCart, useAddMany, useCartSummary } from '../_lib/cart'
import { cashbackOn, gramsLabel, priceAt, productHref } from '../_lib/shared'
import { shortName, type OccasionId } from './data'

const display = '[font-family:var(--utsav-display)]'

/* ───────────────────────── Header bits ───────────────────────── */

export function UtsavCartButton() {
  const { count, total } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart (${count} item${count === 1 ? '' : 's'})`}
      className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#5E0B1E] pl-3 pr-3.5 text-[#FFF6E6] transition hover:bg-[#470817] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A3C]"
    >
      <ShoppingBag size={18} />
      <span className="hidden text-sm font-semibold sm:inline">{count > 0 ? formatPrice(total) : 'Cart'}</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F2A007] px-1 text-[11px] font-bold text-[#2B0F14] ring-2 ring-[#FFF6E6]">
          {count}
        </span>
      )}
    </button>
  )
}

/** Search: inline on desktop, a drop-down row on phones. */
export function UtsavSearch() {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <>
      <form action="/products" method="get" role="search" className="relative hidden w-56 lg:block xl:w-64">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A6326]" />
        <input
          name="q"
          type="search"
          placeholder="Search almonds, kaju…"
          aria-label="Search products"
          className="h-11 w-full rounded-full border border-[#E2C994] bg-white/70 pl-10 pr-4 text-sm text-[#2B0F14] placeholder:text-[#8A6F5A] focus:border-[#5E0B1E] focus:outline-none focus:ring-2 focus:ring-[#C99A3C]/40"
        />
      </form>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-controls="utsav-mobile-search"
        aria-label={open ? 'Close search' : 'Search products'}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#5E0B1E] transition hover:bg-[#F6E3C2] lg:hidden"
      >
        {open ? <X size={20} /> : <Search size={20} />}
      </button>
      {open && (
        <form id="utsav-mobile-search" action="/products" method="get" role="search" className="absolute inset-x-0 top-full border-b border-[#E9D3A6] bg-[#FFF6E6] px-4 pb-3 pt-1 lg:hidden">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A6326]" />
            <input
              ref={inputRef}
              name="q"
              type="search"
              placeholder="Search almonds, kaju, makhana…"
              aria-label="Search products"
              className="h-12 w-full rounded-full border border-[#E2C994] bg-white pl-10 pr-4 text-[15px] text-[#2B0F14] placeholder:text-[#8A6F5A] focus:border-[#5E0B1E] focus:outline-none focus:ring-2 focus:ring-[#C99A3C]/40"
            />
          </div>
        </form>
      )}
    </>
  )
}

/* ───────────────────────── Ready-made gift sets ───────────────────────── */

export type GiftSetView = {
  id: string
  name: string
  label: string
  line: string
  occasions: OccasionId[]
  items: { product: Product; grams: number }[]
}

export function GiftSets({ sets, occasions }: { sets: GiftSetView[]; occasions: { id: OccasionId; label: string }[] }) {
  const [occasion, setOccasion] = useState<OccasionId | 'all'>('all')
  const visible = occasion === 'all' ? sets : sets.filter(set => set.occasions.includes(occasion))
  const chips: { id: OccasionId | 'all'; label: string }[] = [{ id: 'all', label: 'All occasions' }, ...occasions]

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 sm:mx-auto sm:w-auto sm:flex-wrap sm:justify-center" role="group" aria-label="Filter gift sets by occasion">
          {chips.map(chip => {
            const active = occasion === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => setOccasion(chip.id)}
                className={`h-11 shrink-0 rounded-full border px-4 text-[14px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A3C] ${
                  active
                    ? 'border-[#5E0B1E] bg-[#5E0B1E] text-[#FFF6E6] shadow-[0_8px_20px_-10px_rgba(94,11,30,0.8)]'
                    : 'border-[#E2C994] bg-white/60 text-[#4A2A22] hover:border-[#5E0B1E]/40 hover:bg-white'
                }`}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} gift set{visible.length === 1 ? '' : 's'} shown
      </p>

      <div className="-mx-4 mt-7 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 md:grid md:items-stretch md:snap-none md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map(set => (
          <GiftSetCard key={set.id} set={set} />
        ))}
      </div>
    </div>
  )
}

function GiftSetCard({ set }: { set: GiftSetView }) {
  const addMany = useAddMany()
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(false), 2600)
    return () => window.clearTimeout(timer)
  }, [added])

  const total = set.items.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0)
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const columns = set.items.length > 4 ? 'grid-cols-3' : 'grid-cols-2'
  const cells = set.items.length > 4 ? 6 : 4

  return (
    <article className="flex w-[86%] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] border border-[#EAD5AA] bg-[#FFFDF8] shadow-[0_24px_50px_-34px_rgba(94,11,30,0.55)] sm:w-[58%] md:w-auto">
      {/* The open "tray" of the set */}
      <div className="relative bg-[#3A0712] p-3">
        <div className={`grid aspect-[4/3] grid-rows-2 gap-2 rounded-[20px] border border-[#C99A3C]/50 p-2 md:aspect-[16/11] ${columns}`}>
          {Array.from({ length: cells }).map((_, index) => {
            const item = set.items[index]
            if (!item) {
              return (
                <div key={`seal-${index}`} className="flex flex-col items-center justify-center rounded-xl bg-[#5E0B1E] text-center ring-1 ring-[#C99A3C]/40">
                  <span className={`${display} text-xl leading-none text-[#E9C77F]`}>Mana</span>
                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#E9C77F]/80">packed fresh</span>
                </div>
              )
            }
            return (
              <div key={item.product.id} className="relative overflow-hidden rounded-xl bg-[#241014] ring-1 ring-[#C99A3C]/30">
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt="" fill sizes="(max-width: 768px) 30vw, 140px" className="object-cover" />
                ) : null}
              </div>
            )
          })}
        </div>
        <span className="absolute bottom-0 left-6 translate-y-1/2 rounded-full bg-[#F2A007] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2B0F14] shadow-sm">
          {set.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-7">
        <h3 className={`${display} text-[1.6rem] leading-tight text-[#5E0B1E]`}>{set.name}</h3>
        <p className="mt-1 text-[14px] leading-snug text-[#6B4A3F]">{set.line}</p>

        <ul className="mt-4 space-y-1.5 border-t border-dashed border-[#E2C994] pt-3.5 text-[14px]">
          {set.items.map(item => (
            <li key={item.product.id} className="flex items-baseline gap-2">
              <Link href={productHref(item.product)} className="min-w-0 truncate text-[#2B0F14] hover:text-[#5E0B1E] hover:underline">
                {shortName(item.product.name)}
              </Link>
              <span className="shrink-0 text-[12px] text-[#8A6F5A]">{gramsLabel(item.grams)}</span>
              <span aria-hidden className="mx-0.5 flex-1 translate-y-[-3px] border-b border-dotted border-[#E2C994]" />
              <span className="shrink-0 font-semibold tabular-nums text-[#2B0F14]">{formatPrice(priceAt(item.product, item.grams))}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8A6326]">Set total</div>
              <div className={`${display} text-[1.9rem] leading-none text-[#2B0F14]`}>{formatPrice(total)}</div>
            </div>
            {remaining === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9F4E4] px-3 py-1.5 text-[12px] font-bold text-[#24572B]">
                <Truck size={14} /> Free delivery
              </span>
            ) : (
              <span className="rounded-full bg-[#FBEFD6] px-3 py-1.5 text-right text-[12px] font-semibold leading-tight text-[#6B4A3F]">
                {formatPrice(remaining)} to free delivery
              </span>
            )}
          </div>
          <div className="mt-1.5 text-[12px] text-[#6B4A3F]">+ {formatPrice(cashbackOn(total))} back as cashback after delivery</div>

          <button
            type="button"
            onClick={() => {
              const count = addMany(
                set.items.map(item => ({ product: item.product, grams: item.grams })),
                { openCart: true, message: `${set.name} added — ${set.items.length} items` }
              )
              if (count) setAdded(true)
            }}
            className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A3C] ${
              added ? 'bg-[#24572B] text-white' : 'bg-[#5E0B1E] text-[#FFF6E6] hover:bg-[#470817]'
            }`}
          >
            {added ? (
              <>
                <Check size={18} /> Added to cart
              </>
            ) : (
              <>
                <Gift size={18} /> Add set to cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

/* ───────────────────────── Build your own gift box ───────────────────────── */

const BOX_SIZES = [4, 6] as const
const PACK_SIZES = [100, 250, 500] as const

export function GiftBoxBuilder({ picks, starters }: { picks: Product[]; starters: string[] }) {
  const [slots, setSlots] = useState<(typeof BOX_SIZES)[number]>(4)
  const [grams, setGrams] = useState<(typeof PACK_SIZES)[number]>(250)
  const [chosen, setChosen] = useState<string[]>(starters)
  const [added, setAdded] = useState(false)
  const addMany = useAddMany()

  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(false), 2600)
    return () => window.clearTimeout(timer)
  }, [added])

  const products = chosen.map(id => picks.find(product => product.id === id)).filter((product): product is Product => Boolean(product))
  const total = products.reduce((sum, product) => sum + priceAt(product, grams), 0)
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))
  const full = products.length >= slots
  const ready = products.length >= 2

  const toggle = (product: Product) => {
    setChosen(current => {
      if (current.includes(product.id)) return current.filter(id => id !== product.id)
      if (current.length >= slots) return current
      return [...current, product.id]
    })
  }
  const changeSlots = (size: (typeof BOX_SIZES)[number]) => {
    setSlots(size)
    setChosen(current => current.slice(0, size))
  }
  const addBox = () => {
    const count = addMany(
      products.map(product => ({ product, grams })),
      { openCart: true, message: `Your gift box is in the cart — ${products.length} items, ${gramsLabel(grams)} each` }
    )
    if (count) setAdded(true)
  }

  const addButton = (compact = false) => (
    <button
      type="button"
      onClick={addBox}
      disabled={!ready}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A3C] disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? 'h-11 shrink-0 px-4 text-[14px]' : 'h-12 w-full text-[15px]'
      } ${added ? 'bg-[#24572B] text-white' : 'bg-[#5E0B1E] text-[#FFF6E6] hover:bg-[#470817]'}`}
    >
      {added ? <Check size={18} /> : <Gift size={18} />}
      {added ? 'Added to cart' : compact ? 'Add my box' : `Add my box to cart · ${formatPrice(total)}`}
    </button>
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
      {/* The box */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative mx-auto max-w-[420px] pt-6">
          <Bow className="absolute left-1/2 top-0 z-10 h-14 w-28 -translate-x-1/2" />
          <div className="rounded-[30px] border-2 border-[#C99A3C] bg-[#5E0B1E] p-3 shadow-[0_40px_70px_-35px_rgba(71,8,23,0.9)] sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1 pt-3 text-[#E9C77F]">
              <span className={`${display} text-xl`}>Your gift box</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em]" aria-live="polite">
                {products.length} of {slots} filled
              </span>
            </div>
            <div className={`grid gap-2.5 ${slots === 6 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {Array.from({ length: slots }).map((_, index) => {
                const product = products[index]
                if (!product) {
                  return (
                    <a
                      key={`empty-${index}`}
                      href="#box-picks"
                      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#C99A3C]/45 bg-[#470817] text-center text-[#E9C77F]/85 transition hover:border-[#F2A007] hover:text-[#F2A007]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current">
                        <Plus size={18} />
                      </span>
                      <span className="px-2 text-[12px] font-semibold leading-tight">Add an item</span>
                    </a>
                  )
                }
                return (
                  <div key={product.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-[#241014] ring-1 ring-[#C99A3C]/40">
                    {product.images?.[0] && <Image src={product.images[0]} alt="" fill sizes="(max-width: 640px) 44vw, 200px" className="object-cover" />}
                    <div className="absolute inset-x-1.5 bottom-1.5 rounded-xl bg-[#1A0508]/90 px-2.5 py-1.5 text-[#FFF6E6] ring-1 ring-[#C99A3C]/30">
                      <div className="truncate text-[13px] font-semibold leading-tight">{shortName(product.name)}</div>
                      <div className="text-[11px] text-[#E9C77F]">{gramsLabel(grams)} · {formatPrice(priceAt(product, grams))}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(product)}
                      aria-label={`Remove ${shortName(product.name)} from the box`}
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-[2px] transition hover:bg-[#C2185B]"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Summary (desktop and tablet; phones get the sticky bar below) */}
        <div className="mx-auto mt-5 hidden max-w-[420px] rounded-[24px] border border-[#EAD5AA] bg-[#FFFDF8] p-5 sm:block">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8A6326]">Box total</div>
              <div className={`${display} text-[2rem] leading-none text-[#2B0F14]`}>{formatPrice(total)}</div>
            </div>
            <div className="text-right text-[12px] text-[#6B4A3F]">
              {products.length} item{products.length === 1 ? '' : 's'} × {gramsLabel(grams)}
              <br />+ {formatPrice(cashbackOn(total))} cashback
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F3E2BF]">
            <div className="h-full rounded-full bg-[#F2A007] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 text-[12px] font-medium text-[#6B4A3F]">
            {remaining > 0 ? `${formatPrice(remaining)} more for free delivery` : 'Free delivery unlocked on this box'}
          </div>
          <div className="mt-4">{addButton()}</div>
          {!ready && <p className="mt-2 text-center text-[12px] text-[#8A6F5A]">Pick at least two items for your box.</p>}
        </div>
      </div>

      {/* Controls and picks */}
      <div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <Segmented
            label="Box size"
            value={slots}
            options={BOX_SIZES.map(size => ({ value: size, label: `${size} items` }))}
            onChange={changeSlots}
          />
          <Segmented
            label="Pack size, each item"
            value={grams}
            options={PACK_SIZES.map(size => ({ value: size, label: gramsLabel(size) }))}
            onChange={setGrams}
          />
        </div>

        <div id="box-picks" className="mt-6 grid scroll-mt-32 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {picks.map(product => {
            const selected = chosen.includes(product.id)
            const blocked = !selected && full
            return (
              <button
                key={product.id}
                type="button"
                aria-pressed={selected}
                disabled={blocked}
                onClick={() => toggle(product)}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-[#FFFDF8] text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C99A3C] ${
                  selected
                    ? 'border-[#5E0B1E] shadow-[0_0_0_2px_#5E0B1E]'
                    : blocked
                      ? 'cursor-not-allowed border-[#EAD5AA] opacity-55'
                      : 'border-[#EAD5AA] hover:-translate-y-0.5 hover:border-[#C99A3C] hover:shadow-[0_16px_30px_-22px_rgba(94,11,30,0.7)]'
                }`}
              >
                <span className="relative block aspect-square bg-[#241014]">
                  {product.images?.[0] && (
                    <Image src={product.images[0]} alt="" fill sizes="(max-width: 640px) 46vw, (max-width: 1280px) 220px, 180px" className="object-cover" />
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#F2A007] text-[#2B0F14] shadow">
                      <Check size={16} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col p-3">
                  <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#2B0F14]">{shortName(product.name)}</span>
                  <span className="mt-0.5 text-[13px] text-[#6B4A3F]">
                    {formatPrice(priceAt(product, grams))} <span className="text-[#8A6F5A]">· {gramsLabel(grams)}</span>
                  </span>
                  <span
                    className={`mt-2.5 inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold ${
                      selected ? 'bg-[#5E0B1E] text-[#FFF6E6]' : blocked ? 'bg-[#F3E2BF] text-[#8A6F5A]' : 'border border-[#5E0B1E] text-[#5E0B1E] group-hover:bg-[#5E0B1E] group-hover:text-[#FFF6E6]'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Minus size={14} strokeWidth={3} /> Remove
                      </>
                    ) : blocked ? (
                      'Box is full'
                    ) : (
                      <>
                        <Plus size={14} strokeWidth={3} /> Add to box
                      </>
                    )}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-5 flex gap-2 rounded-2xl bg-[#FBEFD6] px-4 py-3 text-[13px] leading-relaxed text-[#5A3A30]">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-[#8A6326]" />
          <span>
            Each pick is packed fresh in our black-and-gold pouch. Want them in a gift box, or a note added?{' '}
            <a
              href={whatsappUrl('Hi Mana! I am ordering a gift box and would like it packed as a hamper with a note.')}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#5E0B1E] underline underline-offset-2"
            >
              Message us — we make custom hampers.
            </a>
          </span>
        </p>

        {/* Phones: a sticky summary that follows you through the picks */}
        <div className="sticky bottom-3 z-30 mt-6 sm:hidden">
          <div className="flex items-center gap-3 rounded-[22px] border border-[#C99A3C] bg-[#5E0B1E] p-2.5 pl-4 text-[#FFF6E6] shadow-[0_18px_40px_-14px_rgba(71,8,23,0.9)]">
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1" aria-hidden>
                {Array.from({ length: slots }).map((_, index) => (
                  <span key={index} className={`h-2 w-2 rounded-full ${index < products.length ? 'bg-[#F2A007]' : 'bg-white/25'}`} />
                ))}
              </div>
              <div className="mt-1 text-[15px] font-bold">{formatPrice(total)}</div>
              <div className="truncate text-[11px] text-[#E9C77F]">
                {remaining > 0 ? `${formatPrice(remaining)} to free delivery` : 'Free delivery unlocked'}
              </div>
            </div>
            {addButton(true)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Segmented<T extends number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#8A6326]">{label}</div>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-[#E2C994] bg-[#FFFDF8] p-1">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`h-10 rounded-full px-4 text-[14px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#C99A3C] ${
              value === option.value ? 'bg-[#5E0B1E] text-[#FFF6E6]' : 'text-[#4A2A22] hover:bg-[#FBEFD6]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Bow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 112 56" className={className} aria-hidden>
      <path d="M56 28 C38 6 10 6 12 24 C14 40 40 36 56 28Z" fill="#F2A007" stroke="#B87500" strokeWidth="1.5" />
      <path d="M56 28 C74 6 102 6 100 24 C98 40 72 36 56 28Z" fill="#F2A007" stroke="#B87500" strokeWidth="1.5" />
      <path d="M50 30 L38 54 L46 50 L50 56 L56 32Z" fill="#E08E00" />
      <path d="M62 30 L74 54 L66 50 L62 56 L56 32Z" fill="#E08E00" />
      <ellipse cx="56" cy="28" rx="8" ry="7" fill="#C99A3C" stroke="#8A6326" strokeWidth="1.5" />
    </svg>
  )
}

/* ───────────────────────── Corporate enquiry ───────────────────────── */

export function CorporateEnquiry() {
  const [people, setPeople] = useState('25')
  const [budget, setBudget] = useState('1000')
  const [city, setCity] = useState('')
  const message = `Hi Mana, corporate gifting enquiry: ${people.trim() || '__'} people, budget ₹${budget.trim() || '__'} each${
    city.trim() ? `, delivery in ${city.trim()}` : ''
  }. Please share hamper options.`

  const field = 'mt-1.5 h-12 w-full rounded-xl border border-[#E2C994] bg-white px-3.5 text-[15px] text-[#2B0F14] focus:border-[#5E0B1E] focus:outline-none focus:ring-2 focus:ring-[#C99A3C]/40'

  return (
    <div className="rounded-[28px] bg-[#FFF6E6] p-5 text-[#2B0F14] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] ring-1 ring-[#C99A3C]/60 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className={`${display} text-2xl text-[#5E0B1E]`}>Your enquiry</div>
        <span className="rounded-full bg-[#FBEFD6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A6326]">Takes 10 seconds</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="text-[13px] font-semibold text-[#4A2A22]">
          Number of gifts
          <input value={people} onChange={event => setPeople(event.target.value.replace(/[^\d]/g, '').slice(0, 5))} inputMode="numeric" className={field} />
        </label>
        <label className="text-[13px] font-semibold text-[#4A2A22]">
          Budget per gift (₹)
          <input value={budget} onChange={event => setBudget(event.target.value.replace(/[^\d]/g, '').slice(0, 6))} inputMode="numeric" className={field} />
        </label>
        <label className="col-span-2 text-[13px] font-semibold text-[#4A2A22]">
          Delivery city <span className="font-normal text-[#8A6F5A]">(optional)</span>
          <input value={city} onChange={event => setCity(event.target.value.slice(0, 40))} placeholder="e.g. Gurugram" className={field} />
        </label>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-[#E2C994] bg-white/60 px-3.5 py-3 text-[13px] leading-relaxed text-[#5A3A30]">
        <span className="font-semibold text-[#2B0F14]">Message preview: </span>
        {message}
      </div>
      <a
        href={whatsappUrl(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-[15px] font-bold text-[#0B3B22] transition hover:brightness-95"
      >
        Send enquiry on WhatsApp
      </a>
      <p className="mt-2.5 text-center text-[12px] text-[#8A6F5A]">Opens WhatsApp with this message. Nothing is sent until you tap send.</p>
    </div>
  )
}
