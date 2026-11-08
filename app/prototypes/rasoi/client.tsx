'use client'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, Clock, Minus, Plus, Search, ShoppingBag, Truck, Users, X } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@/lib/utils'
import { openCart, useAddMany, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { canQuickAdd, cashbackOn, defaultVariant, displayName, gramsLabel, priceAt, productHref } from '../_lib/shared'

export type RecipeItem = {
  key: string
  product: Product
  grams: number
  note?: string
  alsoCalled?: string
  sizes: number[]
}

export type RecipeView = {
  id: string
  name: string
  local: string
  line: string
  serves: string
  time: string
  tag: string
  kitchen: string[]
  steps: string[]
  items: RecipeItem[]
}

export type SpiceView = { key: string; product: Product; uses: string; alsoCalled?: string; sizes: number[] }

/** "Almonds (Badaam)" → "Almonds", "Clove/ Long" → "Clove". */
export function shortName(name: string) {
  return displayName(name).replace(/\s*\([^)]*\)/g, '').split(' / ')[0].trim()
}

/** Round crop of a product photo, zoomed into the pouch window so the food shows. */
function Thumb({ product, sizes, className = '' }: { product: Product; sizes: string; className?: string }) {
  const src = product.images?.[0]
  return (
    <span className={`relative block overflow-hidden rounded-full bg-[#2A221C] ${className}`}>
      {src && (
        <Image src={src} alt="" fill sizes={sizes} className="scale-[1.55] object-cover" style={{ objectPosition: '50% 66%' }} />
      )}
    </span>
  )
}

function SizeChips({ sizes, value, onChange, label, small = false, fill = false }: { sizes: number[]; value: number; onChange: (grams: number) => void; label: string; small?: boolean; fill?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className={fill ? 'grid grid-cols-3 gap-1' : 'flex gap-1.5'}>
      {sizes.map(size => (
        <button
          key={size}
          type="button"
          role="radio"
          aria-checked={value === size}
          onClick={() => onChange(size)}
          className={`whitespace-nowrap rounded-full border font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A51A] ${
            fill ? 'h-8 px-0 text-[11.5px] sm:text-[12px]' : small ? 'h-8 px-2.5 text-[12px]' : 'h-9 px-3 text-[13px]'
          } ${
            value === size
              ? 'border-[#1D3F9A] bg-[#1D3F9A] text-white'
              : 'border-[#1D3F9A]/20 bg-white text-[#1D3F9A] hover:border-[#1D3F9A]/60'
          }`}
        >
          {gramsLabel(size)}
        </button>
      ))}
    </div>
  )
}

/** ADD button that turns into a − qty + stepper once the pack is in the cart. */
function AddStepper({ product, grams, name, wide = false }: { product: Product; grams: number; name: string; wide?: boolean }) {
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()
  const setQuantity = useSetLineQuantity()
  const width = wide ? 'w-full' : 'w-[96px]'

  if (!canQuickAdd(product)) {
    return (
      <Link href={productHref(product)} className={`inline-flex h-11 ${width} items-center justify-center rounded-full border border-[#1D3F9A]/25 text-[13px] font-bold text-[#1D3F9A]`}>
        Options
      </Link>
    )
  }
  if (quantity > 0) {
    return (
      <div className={`flex h-11 ${width} items-center justify-between rounded-full bg-[#1D3F9A] text-white`}>
        <button type="button" aria-label={`Remove one ${name}`} onClick={() => setQuantity(product, grams, quantity - 1)} className="flex h-full w-10 items-center justify-center rounded-l-full hover:bg-white/10">
          <Minus size={15} strokeWidth={2.6} />
        </button>
        <span className="text-sm font-bold tabular-nums" aria-live="polite">{quantity}</span>
        <button type="button" aria-label={`Add one more ${name}`} onClick={() => setQuantity(product, grams, quantity + 1)} className="flex h-full w-10 items-center justify-center rounded-r-full hover:bg-white/10">
          <Plus size={15} strokeWidth={2.6} />
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => add(product, { grams })}
      aria-label={`Add ${name}, ${gramsLabel(grams)}`}
      className={`inline-flex h-11 ${width} items-center justify-center gap-1.5 rounded-full border-2 border-[#1D3F9A] bg-white text-[13px] font-extrabold tracking-wide text-[#1D3F9A] transition hover:bg-[#DCE6FB]`}
    >
      <Plus size={15} strokeWidth={3} /> ADD
    </button>
  )
}

export function CartButton() {
  const { count } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative inline-flex h-11 items-center gap-2 rounded-full bg-[#1D3F9A] px-4 text-sm font-bold text-white transition hover:bg-[#16317A]"
    >
      <ShoppingBag size={18} />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#F2A51A] px-1.5 text-[11px] font-extrabold leading-5 text-[#1C1A17]">{count}</span>
      )}
    </button>
  )
}

/** Phones get a search icon that opens a full-width search row under the header. */
export function SearchToggle() {
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close search' : 'Search products'}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1D3F9A] transition hover:bg-[#DCE6FB] md:hidden"
      >
        {open ? <X size={20} /> : <Search size={20} />}
      </button>
      {open && (
        <form action="/products" className="absolute inset-x-0 top-full border-b border-[#1D3F9A]/10 bg-[#FBFAF6] px-4 pb-3 pt-1 md:hidden">
          <label className="flex h-12 items-center gap-2 rounded-full border border-[#1D3F9A]/20 bg-white px-4 focus-within:border-[#1D3F9A]">
            <Search size={17} className="text-[#1D3F9A]" />
            <input ref={input} name="q" type="search" placeholder="Search almonds, elaichi, kaju…" className="h-full w-full bg-transparent text-[15px] text-[#1C1A17] outline-none placeholder:text-[#8A847A]" />
          </label>
        </form>
      )}
    </>
  )
}

type Choice = { on: boolean; grams: number }

function IngredientRow({ item, choice, onToggle, onGrams }: { item: RecipeItem; choice: Choice; onToggle: () => void; onGrams: (grams: number) => void }) {
  const name = shortName(item.product.name)
  const inCart = useLineQuantity(item.product, choice.grams)
  const variant = defaultVariant(item.product)
  const detail = [item.alsoCalled, variant?.name, item.note].filter(Boolean).join(' · ')

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_4.75rem] sm:px-4">
      <label className="col-start-1 row-start-1 flex min-w-0 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={choice.on} onChange={onToggle} className="peer sr-only" />
        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#F2A51A] peer-focus-visible:ring-offset-2 ${
            choice.on ? 'border-[#1D3F9A] bg-[#1D3F9A] text-white' : 'border-[#1D3F9A]/35 bg-white text-transparent'
          }`}
        >
          <Check size={15} strokeWidth={3.2} />
        </span>
        <Thumb product={item.product} sizes="48px" className={`h-12 w-12 shrink-0 ring-2 ring-white transition ${choice.on ? '' : 'opacity-40 grayscale'}`} />
        <span className={`min-w-0 transition ${choice.on ? '' : 'opacity-55'}`}>
          <span className="block truncate text-[15px] font-semibold text-[#1C1A17]">{name}</span>
          {detail && <span className="line-clamp-2 block text-[12.5px] leading-snug text-[#6A645A]">{detail}</span>}
        </span>
      </label>
      <div className={`col-span-2 row-start-2 pl-[5.25rem] sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:pl-0 ${choice.on ? '' : 'opacity-50'}`}>
        <SizeChips sizes={item.sizes} value={choice.grams} onChange={onGrams} label={`Pack size for ${name}`} small />
      </div>
      <div className="col-start-2 row-start-1 text-right sm:col-start-3">
        <div className={`text-[15px] font-bold tabular-nums ${choice.on ? 'text-[#1C1A17]' : 'text-[#9C968C] line-through decoration-[#9C968C]/60'}`}>
          {formatPrice(priceAt(item.product, choice.grams))}
        </div>
        {inCart > 0 && <div className="text-[11px] font-semibold text-[#2F7D32]">In cart ×{inCart}</div>}
      </div>
    </li>
  )
}

/** Dish picker + the recipe card with its "add every ingredient" checklist. */
export function RecipeStudio({ recipes, art }: { recipes: RecipeView[]; art: Record<string, ReactNode> }) {
  const [selectedId, setSelectedId] = useState(recipes[0]?.id)
  const [choices, setChoices] = useState<Record<string, Choice>>({})
  const [added, setAdded] = useState<string | null>(null)
  const [stepsOpen, setStepsOpen] = useState(false)
  const [listInView, setListInView] = useState(false)
  const [buttonInView, setButtonInView] = useState(true)
  const card = useRef<HTMLElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const inlineButton = useRef<HTMLDivElement>(null)
  const addMany = useAddMany()
  const { total: cartTotal } = useCartSummary()

  const startTotals = useMemo(
    () => Object.fromEntries(recipes.map(entry => [entry.id, entry.items.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0)])),
    [recipes]
  )

  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(null), 6000)
    return () => window.clearTimeout(timer)
  }, [added])

  // On phones, keep an "add all" bar on screen while the shopper reads the checklist.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === list.current) setListInView(entry.isIntersecting)
        if (entry.target === inlineButton.current) setButtonInView(entry.isIntersecting)
      }
    })
    if (list.current) observer.observe(list.current)
    if (inlineButton.current) observer.observe(inlineButton.current)
    return () => observer.disconnect()
  }, [])

  const recipe = recipes.find(entry => entry.id === selectedId) || recipes[0]
  if (!recipe) return null

  const choiceOf = (item: RecipeItem): Choice => choices[item.key] || { on: true, grams: item.grams }
  const update = (item: RecipeItem, change: Partial<Choice>) => {
    setAdded(null)
    setChoices(current => ({ ...current, [item.key]: { ...(current[item.key] || { on: true, grams: item.grams }), ...change } }))
  }

  const chosen = recipe.items.filter(item => choiceOf(item).on)
  const total = chosen.reduce((sum, item) => sum + priceAt(item.product, choiceOf(item).grams), 0)

  const pick = (id: string) => {
    setSelectedId(id)
    setAdded(null)
    setStepsOpen(false)
    const top = card.current?.getBoundingClientRect().top ?? 0
    if (top > window.innerHeight * 0.7) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      card.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
  }

  const addAll = () => {
    const count = addMany(
      chosen.map(item => ({ product: item.product, grams: choiceOf(item).grams })),
      { message: `Added ${chosen.length} ingredient${chosen.length === 1 ? '' : 's'} for ${recipe.name.toLowerCase()}` }
    )
    if (count) setAdded(recipe.id)
  }

  const allOn = chosen.length === recipe.items.length
  const toggleAll = () => {
    setAdded(null)
    setChoices(current => {
      const next = { ...current }
      for (const item of recipe.items) next[item.key] = { ...(current[item.key] || { on: true, grams: item.grams }), on: !allOn }
      return next
    })
  }

  const justAdded = added === recipe.id
  const remaining = FREE_SHIPPING_THRESHOLD - (cartTotal + (justAdded ? 0 : total))
  const ring = recipe.items

  return (
    <div>
      {/* Dish picker */}
      <div className="-mx-4 scroll-px-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
        <ul className="flex snap-x snap-mandatory gap-2 sm:gap-3 lg:grid lg:grid-cols-8 lg:gap-4" aria-label="Pick a dish">
          {recipes.map(entry => {
            const selected = entry.id === recipe.id
            return (
              <li key={entry.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => pick(entry.id)}
                  aria-pressed={selected}
                  aria-controls="rasoi-recipe"
                  className="group flex w-[96px] flex-col items-center rounded-2xl px-1 pb-2 pt-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A51A] sm:w-[112px] lg:w-full"
                >
                  <span
                    className={`block aspect-square w-[84px] rounded-full transition duration-300 sm:w-[96px] ${
                      selected
                        ? 'scale-[1.04] shadow-[0_10px_24px_-8px_rgba(29,63,154,0.55)] ring-[3px] ring-[#F2A51A] ring-offset-[3px] ring-offset-[#FBFAF6]'
                        : 'shadow-[0_6px_16px_-10px_rgba(29,63,154,0.5)] group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0'
                    }`}
                  >
                    {art[entry.id]}
                  </span>
                  <span className={`mt-2.5 flex min-h-[2.1rem] items-start justify-center text-[13px] font-bold leading-tight lg:min-h-0 ${selected ? 'text-[#1D3F9A]' : 'text-[#1C1A17]'}`}>{entry.name}</span>
                  <span className="mt-0.5 block text-[11.5px] tabular-nums text-[#6A645A]">
                    {entry.items.length} items · {formatPrice(startTotals[entry.id])}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Recipe card */}
      <article
        ref={card}
        id="rasoi-recipe"
        aria-label={`${recipe.name} — ingredients`}
        className="relative mt-5 scroll-mt-24 overflow-clip rounded-[28px] border border-[#1D3F9A]/12 bg-white shadow-[0_30px_60px_-36px_rgba(29,63,154,0.45)] lg:mt-8"
      >
        <div className="h-1.5 bg-[repeating-linear-gradient(90deg,#1D3F9A_0_18px,#DCE6FB_18px_24px,#F2A51A_24px_30px,#DCE6FB_30px_36px)]" aria-hidden />
        <div className="grid gap-x-10 gap-y-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr] lg:p-10">
          {/* Plate with the ingredients around it */}
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="relative mx-auto aspect-square w-[80%] max-w-[400px] sm:w-[88%]">
              <div className="absolute inset-[16%] rounded-full shadow-[0_18px_40px_-18px_rgba(28,26,23,0.5)]">{art[recipe.id]}</div>
              {ring.map((item, index) => {
                const angle = ((-90 + (360 / ring.length) * index) * Math.PI) / 180
                const on = choiceOf(item).on
                return (
                  <span
                    key={item.key}
                    title={shortName(item.product.name)}
                    style={{ left: `${(50 + Math.cos(angle) * 40).toFixed(2)}%`, top: `${(50 + Math.sin(angle) * 40).toFixed(2)}%` }}
                    className="absolute h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2"
                  >
                    <Thumb product={item.product} sizes="80px" className={`h-full w-full shadow-[0_8px_18px_-8px_rgba(0,0,0,0.6)] ring-[3px] ring-white transition duration-300 ${on ? '' : 'opacity-35 grayscale'}`} />
                  </span>
                )
              })}
            </div>
          </div>

          {/* What to buy */}
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold">
              <span className="rounded-full bg-[#F2A51A] px-3 py-1 text-[#1C1A17]">{recipe.tag}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DCE6FB] px-3 py-1 text-[#1D3F9A]"><Users size={13} /> {recipe.serves}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DCE6FB] px-3 py-1 text-[#1D3F9A]"><Clock size={13} /> {recipe.time}</span>
            </div>
            <h2 className="mt-3 text-[2rem] leading-[1.05] text-[#1D3F9A] [font-family:var(--rasoi-display)] sm:text-[2.6rem]">{recipe.name}</h2>
            <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#C8361B]">{recipe.local}</p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#4A453E]">{recipe.line}</p>

            <div ref={list} className="mt-6 overflow-hidden rounded-2xl border border-[#1D3F9A]/12">
              <div className="flex items-center justify-between gap-3 border-b border-[#1D3F9A]/10 bg-[#F4F7FE] px-3 py-3 sm:px-4">
                <h3 className="text-[15px] font-bold text-[#1C1A17]">From Mana</h3>
                <div className="flex items-center gap-3 text-[12.5px] text-[#6A645A]">
                  <span className="tabular-nums">{chosen.length} of {recipe.items.length} selected</span>
                  <button type="button" onClick={toggleAll} className="font-bold text-[#1D3F9A] underline-offset-2 hover:underline">
                    {allOn ? 'Clear' : 'Select all'}
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-[#1D3F9A]/8">
                {recipe.items.map(item => (
                  <IngredientRow key={item.key} item={item} choice={choiceOf(item)} onToggle={() => update(item, { on: !choiceOf(item).on })} onGrams={grams => update(item, { grams, on: true })} />
                ))}
              </ul>
              <div className="border-t border-[#1D3F9A]/10 bg-[#FBFAF6] px-3 py-3 sm:px-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#8A847A]">From your kitchen</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recipe.kitchen.map(thing => (
                    <span key={thing} className="rounded-full border border-dashed border-[#8A847A]/40 px-2.5 py-1 text-[12.5px] text-[#6A645A]">{thing}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Add everything */}
            <div ref={inlineButton} className="mt-4 rounded-2xl bg-white p-3 shadow-[0_-6px_30px_-6px_rgba(29,63,154,0.25)] ring-1 ring-[#1D3F9A]/10 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12.5px]">
                <span className={`inline-flex items-center gap-1.5 font-semibold ${remaining <= 0 ? 'text-[#2F7D32]' : 'text-[#4A453E]'}`}>
                  <Truck size={15} />
                  {remaining <= 0 ? 'Free delivery on this order' : <>Add {formatPrice(remaining)} more for free delivery</>}
                </span>
                {total > 0 && <span className="text-[#6A645A]">{formatPrice(cashbackOn(total))} back as wallet cashback</span>}
              </div>
              {justAdded ? (
                <button type="button" onClick={openCart} className="mt-2.5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#2F7D32] px-5 text-[15px] font-bold text-white transition hover:bg-[#276A2A]">
                  <Check size={18} strokeWidth={3} /> Added to your cart · View cart
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addAll}
                  disabled={!chosen.length}
                  className="mt-2.5 flex h-[52px] w-full items-center justify-between gap-3 rounded-xl bg-[#1D3F9A] px-5 text-[15px] font-bold text-white transition hover:bg-[#16317A] disabled:cursor-not-allowed disabled:bg-[#9AA7C9]"
                >
                  <span>{chosen.length ? `Add ${chosen.length} ingredient${chosen.length === 1 ? '' : 's'}` : 'Tick something to add'}</span>
                  {chosen.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {formatPrice(total)} <ArrowRight size={17} />
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Method */}
          <div className="lg:col-start-1 lg:row-start-2">
            <button
              type="button"
              onClick={() => setStepsOpen(value => !value)}
              aria-expanded={stepsOpen}
              className="flex w-full items-center justify-between rounded-xl border border-[#1D3F9A]/15 px-4 py-3 text-left text-[15px] font-bold text-[#1D3F9A] lg:hidden"
            >
              How to make it · {recipe.steps.length} steps
              <ChevronDown size={18} className={`transition ${stepsOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`${stepsOpen ? 'block' : 'hidden'} lg:block`}>
              <h3 className="mt-4 hidden text-xl text-[#1D3F9A] [font-family:var(--rasoi-display)] lg:mt-0 lg:block">How to make it</h3>
              <ol className="mt-3 space-y-3">
                {recipe.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-[14.5px] leading-relaxed text-[#3D3933]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DCE6FB] text-[13px] font-bold text-[#1D3F9A]">{index + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </article>

      {/* Phones: a floating "add all" bar while the checklist is on screen but its button isn't */}
      {listInView && !buttonInView && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white py-2.5 pl-4 pr-2.5 shadow-[0_14px_40px_-8px_rgba(29,63,154,0.5)] ring-1 ring-[#1D3F9A]/15">
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13.5px] font-bold text-[#1C1A17]">{recipe.name}</div>
              <div className="text-[12px] tabular-nums text-[#6A645A]">
                {chosen.length} of {recipe.items.length} ingredients · {formatPrice(total)}
              </div>
            </div>
            {justAdded ? (
              <button type="button" onClick={openCart} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#2F7D32] px-4 text-[14px] font-bold text-white">
                <Check size={16} strokeWidth={3} /> View cart
              </button>
            ) : (
              <button
                type="button"
                onClick={addAll}
                disabled={!chosen.length}
                aria-label={`Add ${chosen.length} ingredients for ${recipe.name}`}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#1D3F9A] px-4 text-[14px] font-bold text-white disabled:bg-[#9AA7C9]"
              >
                Add all <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** A round steel masala dabba: tap a katori to see the spice, or fill the whole tin. */
export function MasalaDabba({ spices, fills }: { spices: SpiceView[]; fills: Record<string, ReactNode> }) {
  const [activeKey, setActiveKey] = useState(spices[0]?.key)
  const [grams, setGrams] = useState<Record<string, number>>({})
  const addMany = useAddMany()
  const active = spices.find(spice => spice.key === activeKey) || spices[0]
  if (!active) return null

  const activeGrams = grams[active.key] ?? active.sizes[0]
  const name = shortName(active.product.name)
  const variant = defaultVariant(active.product)
  const fullTin = spices.reduce((sum, spice) => sum + priceAt(spice.product, spice.sizes[0]), 0)

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <div className="relative mx-auto aspect-square w-full max-w-[400px]">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 32% 26%, #FFFFFF 0%, #E9ECF0 26%, #C3C9D1 60%, #959CA7 100%)',
            boxShadow: 'inset 0 0 0 5px rgba(255,255,255,0.55), inset 0 -14px 30px rgba(0,0,0,0.16), 0 28px 50px -22px rgba(28,26,23,0.55)',
          }}
        />
        <div aria-hidden className="absolute inset-[3.5%] rounded-full border border-white/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]" />
        {spices.map((spice, index) => {
          const angle = ((-90 + (360 / spices.length) * index) * Math.PI) / 180
          const selected = spice.key === active.key
          return (
            <button
              key={spice.key}
              type="button"
              onClick={() => setActiveKey(spice.key)}
              aria-pressed={selected}
              aria-label={shortName(spice.product.name)}
              style={{ left: `${(50 + Math.cos(angle) * 29.5).toFixed(2)}%`, top: `${(50 + Math.sin(angle) * 29.5).toFixed(2)}%` }}
              className={`absolute h-[27%] w-[27%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[6%] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A51A] ${
                selected ? 'scale-[1.06] ring-[3px] ring-[#F2A51A]' : 'hover:scale-[1.03]'
              }`}
              data-spice={spice.key}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 30%, #FDFDFD, #CDD2D9 55%, #A2A9B3)', boxShadow: '0 4px 10px -4px rgba(0,0,0,0.45)' }}
              />
              <span aria-hidden className="relative block h-full w-full overflow-hidden rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]">
                {fills[spice.key]}
              </span>
            </button>
          )
        })}
        <div className="absolute left-1/2 top-1/2 h-[27%] w-[27%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-[#2A221C] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6)] ring-[5px] ring-white/80">
          {active.product.images?.[0] && (
            <Image key={active.key} src={active.product.images[0]} alt={name} fill sizes="120px" className="scale-[1.2] object-cover" style={{ objectPosition: '50% 55%' }} />
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Spices in the dabba">
          {spices.map(spice => (
            <button
              key={spice.key}
              type="button"
              onClick={() => setActiveKey(spice.key)}
              aria-pressed={spice.key === active.key}
              className={`h-9 rounded-full px-3.5 text-[13px] font-semibold transition ${
                spice.key === active.key ? 'bg-[#1D3F9A] text-white' : 'bg-white text-[#1D3F9A] ring-1 ring-[#1D3F9A]/20 hover:ring-[#1D3F9A]/50'
              }`}
            >
              {shortName(spice.product.name)}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-white p-5 ring-1 ring-[#1D3F9A]/10 sm:p-6" aria-live="polite">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#C8361B]">{active.alsoCalled || 'Whole spice'}</div>
          <h3 className="mt-1 text-[1.9rem] leading-tight text-[#1D3F9A] [font-family:var(--rasoi-display)]">{name}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[#4A453E]">
            <span className="font-semibold text-[#1C1A17]">Use it in:</span> {active.uses}.
          </p>
          {variant && <p className="mt-1 text-[13px] text-[#6A645A]">Option: {variant.name}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SizeChips sizes={active.sizes} value={activeGrams} onChange={value => setGrams(current => ({ ...current, [active.key]: value }))} label={`Pack size for ${name}`} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-bold tabular-nums text-[#1C1A17]">{formatPrice(priceAt(active.product, activeGrams))}</div>
              <Link href={productHref(active.product)} className="text-[13px] font-semibold text-[#1D3F9A] underline-offset-2 hover:underline">
                See details
              </Link>
            </div>
            <AddStepper product={active.product} grams={activeGrams} name={name} />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            addMany(
              spices.map(spice => ({ product: spice.product, grams: spice.sizes[0] })),
              { message: `Added all ${spices.length} dabba spices` }
            )
          }
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-[#F2A51A] px-5 py-4 text-left text-[#1C1A17] transition hover:bg-[#E59A12]"
        >
          <span>
            <span className="block text-[15px] font-extrabold">Fill my whole dabba</span>
            <span className="block text-[12.5px] font-medium text-[#3D3933]">All {spices.length} spices, {gramsLabel(spices[0].sizes[0])} each</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold tabular-nums">
            {formatPrice(fullTin)} <ArrowRight size={17} />
          </span>
        </button>
      </div>
    </div>
  )
}

/** Pantry card: framed photo, everyday name, pack sizes and ADD. */
export function PantryCard({ product, alsoCalled, badge, sizes }: { product: Product; alsoCalled?: string; badge?: string; sizes: number[] }) {
  const [grams, setGrams] = useState(sizes.includes(250) ? 250 : sizes[0])
  const name = shortName(product.name)
  return (
    <article className="group flex h-full flex-col rounded-[24px] bg-white p-2 ring-1 ring-[#1D3F9A]/10 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-26px_rgba(29,63,154,0.6)] motion-reduce:hover:translate-y-0">
      <Link href={productHref(product)} className="relative block aspect-square overflow-hidden rounded-[18px] bg-[#2A221C] sm:aspect-[4/5]">
        {product.images?.[0] && (
          <Image src={product.images[0]} alt={name} fill sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 260px" className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100" />
        )}
        {badge && <span className="absolute left-2.5 top-2.5 rounded-full bg-[#F2A51A] px-2.5 py-1 text-[11px] font-bold text-[#1C1A17]">{badge}</span>}
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
        <Link href={productHref(product)} className="text-[1.08rem] leading-tight text-[#1C1A17] [font-family:var(--rasoi-display)] hover:text-[#1D3F9A]">
          {name}
        </Link>
        <span className="mt-0.5 text-[12.5px] text-[#6A645A]">{[alsoCalled, defaultVariant(product)?.name].filter(Boolean).join(' · ') || ' '}</span>
        <div className="mt-3">
          <SizeChips sizes={sizes} value={grams} onChange={setGrams} label={`Pack size for ${name}`} fill />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-[17px] font-bold tabular-nums text-[#1C1A17]">{formatPrice(priceAt(product, grams))}</span>
          <AddStepper product={product} grams={grams} name={name} />
        </div>
      </div>
    </article>
  )
}
