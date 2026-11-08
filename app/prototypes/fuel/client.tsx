'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Truck, X, Zap } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { useCart } from '@/lib/store'
import { showToast } from '@/components/ui/Toaster'
import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@/lib/utils'
import { openCart, useAddMany, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { baseGrams, canQuickAdd, cashbackOn, defaultVariant, displayName, gramsLabel, priceAt, productHref, weightChoices } from '../_lib/shared'
import { per30, type FoodKey, type Nutrient } from './data'

export type Food = Nutrient & { product: Product }

const mono = '[font-family:var(--fuel-mono)]'
const display = '[font-family:var(--fuel-display)]'

/* ───────────────────────────── Header bits ───────────────────────────── */

export function FuelCartButton() {
  const { count } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart (${count} item${count === 1 ? '' : 's'})`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-[#F2F2EE] transition hover:border-[#D6FF3D]/60 hover:text-[#D6FF3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D6FF3D]"
    >
      <ShoppingBag size={19} />
      {count > 0 && (
        <span className={`${mono} absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D6FF3D] px-1 text-[11px] font-bold text-[#0C0D0B]`}>
          {count}
        </span>
      )}
    </button>
  )
}

/** On phones the search box opens under the header row. */
export function MobileSearch() {
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
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-[#F2F2EE] transition hover:text-[#D6FF3D] md:hidden"
      >
        {open ? <X size={19} /> : <Search size={19} />}
      </button>
      {open && (
        <form action="/products" method="get" role="search" className="absolute inset-x-0 top-full border-b border-white/10 bg-[#0C0D0B] px-4 pb-3 pt-1 md:hidden">
          <label htmlFor="fuel-mobile-search" className="sr-only">Search products</label>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#141612] px-3 focus-within:border-[#D6FF3D]/70">
            <Search size={16} className="text-[#A3A89A]" />
            <input ref={input} id="fuel-mobile-search" name="q" placeholder="Search almonds, chia, makhana…" className="h-full w-full bg-transparent text-[15px] text-[#F2F2EE] placeholder:text-[#A3A89A]/70 focus:outline-none" />
          </div>
        </form>
      )}
    </>
  )
}

/* ───────────────────────────── Add buttons ───────────────────────────── */

function Stepper({ product, grams, quantity, compact = false }: { product: Product; grams: number; quantity: number; compact?: boolean }) {
  const setQuantity = useSetLineQuantity()
  const name = displayName(product.name)
  return (
    <div className={`flex items-center justify-between rounded-xl bg-[#D6FF3D] text-[#0C0D0B] ${compact ? 'h-10 w-[92px]' : 'h-11 w-full min-w-[104px]'}`}>
      <button type="button" aria-label={`Remove one ${name} (${gramsLabel(grams)})`} onClick={() => setQuantity(product, grams, quantity - 1)} className="flex h-full w-9 items-center justify-center rounded-l-xl transition hover:bg-black/10">
        <Minus size={15} strokeWidth={3} />
      </button>
      <span className={`${mono} text-sm font-bold tabular-nums`} aria-live="polite">{quantity}</span>
      <button type="button" aria-label={`Add one more ${name} (${gramsLabel(grams)})`} onClick={() => setQuantity(product, grams, quantity + 1)} className="flex h-full w-9 items-center justify-center rounded-r-xl transition hover:bg-black/10">
        <Plus size={15} strokeWidth={3} />
      </button>
    </div>
  )
}

/** "+" that turns into a − 1 + stepper once the pack is in the cart. */
export function FuelAddButton({ product, grams, compact = false }: { product: Product; grams: number; compact?: boolean }) {
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()
  const name = displayName(product.name)

  if (!canQuickAdd(product)) {
    return (
      <Link href={productHref(product)} className="inline-flex h-10 items-center rounded-xl border border-white/15 px-3 text-xs font-semibold text-[#A3A89A] hover:text-[#F2F2EE]">
        Options
      </Link>
    )
  }
  if (quantity > 0) return <Stepper product={product} grams={grams} quantity={quantity} compact={compact} />
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => add(product, { grams, silent: true })}
        aria-label={`Add ${name}, ${gramsLabel(grams)}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6FF3D]/50 text-[#D6FF3D] transition hover:bg-[#D6FF3D] hover:text-[#0C0D0B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D6FF3D]"
      >
        <Plus size={18} strokeWidth={2.75} />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => add(product, { grams, silent: true })}
      aria-label={`Add ${name}, ${gramsLabel(grams)}`}
      className="inline-flex h-11 w-full min-w-[104px] items-center justify-center gap-1.5 rounded-xl border border-[#D6FF3D]/60 text-sm font-bold uppercase tracking-wide text-[#D6FF3D] transition hover:bg-[#D6FF3D] hover:text-[#0C0D0B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D6FF3D]"
    >
      <Plus size={16} strokeWidth={3} /> Add
    </button>
  )
}

/* ───────────────────────────── Leaderboard ───────────────────────────── */

export function Leaderboard({ foods }: { foods: Food[] }) {
  const [metric, setMetric] = useState<'protein' | 'fibre'>('protein')
  const ranked = useMemo(() => foods.filter(food => !food.energy).sort((a, b) => b[metric] - a[metric]), [foods, metric])
  const max = per30(ranked[0]?.[metric] || 1)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Rank foods by" className="inline-flex rounded-xl border border-white/10 bg-[#141612] p-1">
          {(['protein', 'fibre'] as const).map(option => (
            <button
              key={option}
              type="button"
              aria-pressed={metric === option}
              onClick={() => setMetric(option)}
              className={`h-9 rounded-lg px-4 text-sm font-semibold capitalize transition ${metric === option ? 'bg-[#D6FF3D] text-[#0C0D0B]' : 'text-[#A3A89A] hover:text-[#F2F2EE]'}`}
            >
              {option}
            </button>
          ))}
        </div>
        <span className={`${mono} text-[11px] uppercase tracking-[0.14em] text-[#A3A89A]`}>Per 30 g handful · tap + to add a pack</span>
      </div>

      <ol className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141612]">
        {ranked.map((food, index) => {
          const value = per30(food[metric])
          const other = metric === 'protein' ? `fibre ${per30(food.fibre).toFixed(1)} g` : `protein ${per30(food.protein).toFixed(1)} g`
          const grams = baseGrams(food.product)
          const name = displayName(food.product.name)
          return (
            <li key={food.key} className="grid grid-cols-[1.75rem_3rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-white/[0.06] px-3 py-3 first:border-t-0 sm:grid-cols-[2.25rem_3.5rem_minmax(0,13rem)_minmax(0,1fr)_7rem_auto] sm:gap-x-4 sm:px-5">
              <span className={`${mono} text-xs font-bold ${index < 3 ? 'text-[#D6FF3D]' : 'text-[#A3A89A]'}`}>{String(index + 1).padStart(2, '0')}</span>
              <Link href={productHref(food.product)} className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#1C1F1A] ring-1 ring-white/10 sm:h-14 sm:w-14">
                {food.product.images?.[0] && <Image src={food.product.images[0]} alt={name} fill sizes="56px" className="object-cover" />}
              </Link>
              <div className="min-w-0">
                <Link href={productHref(food.product)} className="block truncate text-[15px] font-semibold text-[#F2F2EE] hover:text-[#D6FF3D]">{food.label}</Link>
                <div className={`${mono} truncate text-[11px] text-[#A3A89A]`}>{other} · {Math.round(food.kcal * 0.3)} kcal</div>
                {/* Phones: bar and price live under the name. */}
                <div className="mt-2 flex items-center gap-2 sm:hidden">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
                    <div className="h-full rounded-full bg-[#D6FF3D] transition-[width] duration-500" style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                  <span className={`${mono} w-12 text-right text-[13px] font-bold text-[#F2F2EE]`}>{value.toFixed(1)} g</span>
                </div>
                <div className={`${mono} mt-1 text-[11px] text-[#A3A89A] sm:hidden`}>{formatPrice(priceAt(food.product, grams))} / {gramsLabel(grams)}</div>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
                  <div className="h-full rounded-full bg-[#D6FF3D] transition-[width] duration-500" style={{ width: `${(value / max) * 100}%` }} />
                </div>
                <span className={`${mono} w-14 text-right text-[15px] font-bold text-[#F2F2EE]`}>{value.toFixed(1)} g</span>
              </div>
              <div className={`${mono} hidden text-right text-[13px] sm:block`}>
                <div className="font-bold text-[#F2F2EE]">{formatPrice(priceAt(food.product, grams))}</div>
                <div className="text-[11px] text-[#A3A89A]">{gramsLabel(grams)} pack</div>
              </div>
              <div className="justify-self-end">
                <FuelAddButton product={food.product} grams={grams} compact />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ───────────────────────────── Stack builder ───────────────────────────── */

type PackLine = { grams: number; quantity: number }

/** Cheapest way to cover `need` grams with the product's pack sizes (price is per gram, so least grams wins; then fewest packs). */
export function planPacks(need: number, sizes: number[]): PackLine[] {
  if (need <= 0 || !sizes.length) return []
  const sorted = [...sizes].sort((a, b) => a - b)
  let best: { total: number; packs: number; counts: number[] } | null = null
  const limits = sorted.map(size => Math.ceil(need / size))
  const counts = new Array(sorted.length).fill(0)
  const walk = (index: number, total: number, packs: number) => {
    if (index === sorted.length) {
      if (total < need) return
      if (!best || total < best.total || (total === best.total && packs < best.packs)) best = { total, packs, counts: [...counts] }
      return
    }
    for (let count = 0; count <= limits[index]; count++) {
      counts[index] = count
      walk(index + 1, total + count * sorted[index], packs + count)
      if (total + count * sorted[index] >= need) break
    }
    counts[index] = 0
  }
  walk(0, 0, 0)
  const chosen = best as { total: number; packs: number; counts: number[] } | null
  if (!chosen) return []
  return sorted
    .map((size, index) => ({ grams: size, quantity: chosen.counts[index] }))
    .filter(line => line.quantity > 0)
    .sort((a, b) => b.grams - a.grams)
}

function packText(lines: PackLine[]) {
  return lines.map(line => (line.quantity > 1 ? `${line.quantity} × ${gramsLabel(line.grams)}` : gramsLabel(line.grams))).join(' + ')
}

const STEP = 5
const MAX_PER_DAY = 60

export function StackBuilder({ foods, presets }: { foods: Food[]; presets: { key: string; label: string; line: string; grams: Partial<Record<FoodKey, number>> }[] }) {
  const [grams, setGrams] = useState<Partial<Record<FoodKey, number>>>(() => ({ ...(presets[0]?.grams || {}) }))
  const [days, setDays] = useState<14 | 30>(30)
  const addMany = useAddMany()

  const chosen = foods.filter(food => (grams[food.key] || 0) > 0)
  const perDay = chosen.reduce(
    (sum, food) => {
      const amount = grams[food.key] || 0
      return {
        protein: sum.protein + amount * food.protein / 100,
        fibre: sum.fibre + amount * food.fibre / 100,
        kcal: sum.kcal + amount * food.kcal / 100,
        grams: sum.grams + amount,
      }
    },
    { protein: 0, fibre: 0, kcal: 0, grams: 0 }
  )
  const plan = chosen.map(food => {
    const need = (grams[food.key] || 0) * days
    const packs = planPacks(need, weightChoices(food.product))
    const price = packs.reduce((sum, line) => sum + priceAt(food.product, line.grams) * line.quantity, 0)
    return { food, need, packs, price }
  })
  const total = plan.reduce((sum, line) => sum + line.price, 0)
  const packCount = plan.reduce((sum, line) => sum + line.packs.reduce((count, pack) => count + pack.quantity, 0), 0)
  const activePreset = presets.find(preset => {
    const keys = new Set([...Object.keys(preset.grams), ...Object.keys(grams).filter(key => (grams[key as FoodKey] || 0) > 0)])
    return Array.from(keys).every(key => (preset.grams[key as FoodKey] || 0) === (grams[key as FoodKey] || 0))
  })?.key

  const change = (key: FoodKey, delta: number) =>
    setGrams(current => ({ ...current, [key]: Math.min(MAX_PER_DAY, Math.max(0, (current[key] || 0) + delta)) }))

  const addSupply = () => {
    const lines = plan.flatMap(line => line.packs.map(pack => ({ product: line.food.product, grams: pack.grams, quantity: pack.quantity })))
    if (!lines.length) return
    addMany(lines, { openCart: true, message: `Added ${days === 30 ? 'a month' : 'two weeks'} of your stack · ${packCount} pack${packCount === 1 ? '' : 's'}` })
  }

  const summaryLine = chosen.length
    ? `${perDay.protein.toFixed(1)} g protein · ${Math.round(perDay.kcal)} kcal a day · ${formatPrice(total)}`
    : 'Pick a food to start your stack'

  return (
    <div>
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${mono} mr-1 text-[11px] uppercase tracking-[0.14em] text-[#A3A89A]`}>Start from</span>
        {presets.map(preset => (
          <button
            key={preset.key}
            type="button"
            aria-pressed={activePreset === preset.key}
            onClick={() => setGrams({ ...preset.grams })}
            className={`h-10 rounded-xl border px-3.5 text-left text-sm font-semibold transition ${
              activePreset === preset.key ? 'border-[#D6FF3D] bg-[#D6FF3D] text-[#0C0D0B]' : 'border-white/15 text-[#F2F2EE] hover:border-[#D6FF3D]/60'
            }`}
            title={preset.line}
          >
            {preset.label}
          </button>
        ))}
        <button type="button" onClick={() => setGrams({})} className="h-10 rounded-xl px-3 text-sm font-semibold text-[#A3A89A] underline-offset-4 hover:text-[#F2F2EE] hover:underline">
          Clear
        </button>
      </div>

      {/* Phones: a live summary that follows you down the list. */}
      <div className="sticky top-14 z-20 -mx-4 mt-4 border-y border-white/10 bg-[#0C0D0B] px-4 py-2.5 lg:hidden" aria-hidden>
        <div className={`${mono} flex items-center gap-2 text-[12px] text-[#F2F2EE]`}>
          <Zap size={14} className="shrink-0 text-[#D6FF3D]" />
          <span className="truncate">{summaryLine}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        {/* Foods */}
        <ul className="grid gap-2 sm:grid-cols-2">
          {foods.map(food => {
            const amount = grams[food.key] || 0
            const name = displayName(food.product.name)
            return (
              <li
                key={food.key}
                className={`flex items-center gap-3 rounded-2xl border p-2.5 pr-2 transition ${amount > 0 ? 'border-[#D6FF3D]/70 bg-[#171A12]' : 'border-white/[0.08] bg-[#141612]'}`}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#1C1F1A] ring-1 ring-white/10">
                  {food.product.images?.[0] && <Image src={food.product.images[0]} alt={name} fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-[#F2F2EE]">{food.label}</div>
                  <div className={`${mono} truncate text-[11px] text-[#A3A89A]`}>
                    {food.energy ? `${per30(food.fibre).toFixed(1)} g fibre` : `${per30(food.protein).toFixed(1)} g protein`} / 30 g
                  </div>
                </div>
                <div className="flex shrink-0 items-center rounded-xl border border-white/10 bg-[#0C0D0B]">
                  <button type="button" onClick={() => change(food.key, -STEP)} disabled={amount === 0} aria-label={`Less ${food.label} per day`} className="flex h-11 w-10 items-center justify-center rounded-l-xl text-[#F2F2EE] transition hover:text-[#D6FF3D] disabled:opacity-30">
                    <Minus size={15} strokeWidth={2.75} />
                  </button>
                  <span className={`${mono} w-12 text-center text-[13px] font-bold tabular-nums ${amount > 0 ? 'text-[#D6FF3D]' : 'text-[#A3A89A]'}`} aria-live="polite" aria-label={`${amount} grams of ${food.label} per day`}>
                    {amount} g
                  </span>
                  <button type="button" onClick={() => change(food.key, STEP)} disabled={amount >= MAX_PER_DAY} aria-label={`More ${food.label} per day`} className="flex h-11 w-10 items-center justify-center rounded-r-xl text-[#F2F2EE] transition hover:text-[#D6FF3D] disabled:opacity-30">
                    <Plus size={15} strokeWidth={2.75} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Summary */}
        <aside aria-label="Your daily stack" className="rounded-3xl border border-white/10 bg-[#141612] p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h3 className={`${display} text-2xl uppercase tracking-wide text-[#F2F2EE]`}>Your daily stack</h3>
            <span className={`${mono} rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-[#A3A89A]`}>{Math.round(perDay.grams)} g / day</span>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-2" aria-live="polite">
            {[
              { label: 'Protein', value: `${perDay.protein.toFixed(1)}`, unit: 'g' },
              { label: 'Fibre', value: `${perDay.fibre.toFixed(1)}`, unit: 'g' },
              { label: 'Energy', value: `${Math.round(perDay.kcal)}`, unit: 'kcal' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl bg-[#0C0D0B] px-3 py-3">
                <dt className={`${mono} text-[10px] uppercase tracking-[0.14em] text-[#A3A89A]`}>{stat.label}</dt>
                <dd className="mt-1 flex items-baseline gap-1">
                  <span className={`${display} text-[2rem] leading-none ${stat.label === 'Protein' ? 'text-[#D6FF3D]' : 'text-[#F2F2EE]'}`}>{stat.value}</span>
                  <span className={`${mono} text-[11px] text-[#A3A89A]`}>{stat.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className={`${mono} text-[11px] uppercase tracking-[0.14em] text-[#A3A89A]`}>Stock up for</span>
            <div role="group" aria-label="Stock up for" className="inline-flex rounded-xl border border-white/10 p-1">
              {([14, 30] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={days === option}
                  onClick={() => setDays(option)}
                  className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition ${days === option ? 'bg-[#F2F2EE] text-[#0C0D0B]' : 'text-[#A3A89A] hover:text-[#F2F2EE]'}`}
                >
                  {option === 30 ? '1 month' : '2 weeks'}
                </button>
              ))}
            </div>
          </div>

          {plan.length ? (
            <ul className="mt-4 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {plan.map(line => (
                <li key={line.food.key} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#F2F2EE]">{displayName(line.food.product.name)}</div>
                    <div className={`${mono} text-[11px] text-[#A3A89A]`}>
                      needs {gramsLabel(line.need)} → <span className="text-[#F2F2EE]">{packText(line.packs)}</span>
                    </div>
                  </div>
                  <span className={`${mono} shrink-0 font-bold text-[#F2F2EE]`}>{formatPrice(line.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-[#A3A89A]">
              Add grams to any food, or start from a preset above.
            </p>
          )}

          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className={`${mono} text-[11px] uppercase tracking-[0.14em] text-[#A3A89A]`}>{days === 30 ? 'Month' : 'Two weeks'} · {packCount} pack{packCount === 1 ? '' : 's'}</div>
              <div className={`${display} text-[2.4rem] leading-none text-[#F2F2EE]`}>{formatPrice(total)}</div>
            </div>
            <div className={`${mono} text-right text-[11px] leading-relaxed text-[#A3A89A]`}>
              {total >= FREE_SHIPPING_THRESHOLD ? (
                <span className="inline-flex items-center gap-1 text-[#D6FF3D]"><Check size={13} /> Free delivery</span>
              ) : total > 0 ? (
                <span>{formatPrice(FREE_SHIPPING_THRESHOLD - total)} more for free delivery</span>
              ) : null}
              {total > 0 && <div>{formatPrice(cashbackOn(total))} back as cashback</div>}
            </div>
          </div>

          <button
            type="button"
            onClick={addSupply}
            disabled={!plan.length}
            className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#D6FF3D] text-[15px] font-extrabold uppercase tracking-wide text-[#0C0D0B] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6FF3D] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add {days === 30 ? 'a month’s' : 'two weeks’'} supply <ArrowRight size={18} />
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-[#A3A89A]">
            Values are approximate (USDA FoodData Central, plain ingredient) and vary by batch. A food guide, not medical advice.
          </p>
        </aside>
      </div>
    </div>
  )
}

/* ───────────────────────────── Gym Kit ───────────────────────────── */

export type KitOption = { id: string; name: string; price: number; grams: number; inStock: boolean }

export function KitPicker({ kit, options }: { kit: Product; options: KitOption[] }) {
  const available = options.filter(option => option.inStock)
  const [selected, setSelected] = useState(available[0]?.id || '')
  const addItem = useCart(state => state.addItem)
  const option = available.find(item => item.id === selected) || available[0]
  if (!option) {
    return (
      <Link href={productHref(kit)} className="inline-flex h-12 items-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-[#F2F2EE]">
        See kit options
      </Link>
    )
  }

  const add = () => {
    addItem({
      product_id: kit.id,
      product_name: kit.name,
      product_image: kit.images?.[0] || '',
      variant_id: option.id,
      variant_name: option.name,
      weight_grams: option.grams || 1000,
      price: option.price,
      quantity: 1,
    })
    showToast(`Added ${displayName(kit.name)} · ${option.name}`)
    openCart()
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Kit size" className="grid grid-cols-2 gap-2">
        {available.map(item => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === option.id}
            onClick={() => setSelected(item.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${item.id === option.id ? 'border-[#D6FF3D] bg-[#171A12]' : 'border-white/10 hover:border-white/30'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F2F2EE]">{item.name}</span>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${item.id === option.id ? 'border-[#D6FF3D] bg-[#D6FF3D]' : 'border-white/30'}`}>
                {item.id === option.id && <Check size={11} strokeWidth={3.5} className="text-[#0C0D0B]" />}
              </span>
            </div>
            <div className={`${mono} mt-1 text-[13px] font-bold text-[#F2F2EE]`}>{formatPrice(item.price)}</div>
            {item.grams > 0 && <div className={`${mono} text-[11px] text-[#A3A89A]`}>{gramsLabel(item.grams)} in total</div>}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={add}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#D6FF3D] px-5 text-sm font-extrabold uppercase tracking-wide text-[#0C0D0B] sm:flex-1 transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6FF3D]"
        >
          Add Gym Kit · {formatPrice(option.price)}
        </button>
        <Link href={productHref(kit)} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-white/15 px-5 text-sm font-semibold text-[#F2F2EE] transition hover:border-white/40">
          Customise contents <ArrowRight size={16} />
        </Link>
      </div>
      <p className={`${mono} mt-3 text-[11px] text-[#A3A89A]`}>
        {option.price >= FREE_SHIPPING_THRESHOLD ? 'Free delivery · ' : ''}{formatPrice(cashbackOn(option.price))} back as cashback after delivery
      </p>
    </div>
  )
}

/* ───────────────────────────── Shelf ───────────────────────────── */

export function ShelfCard({ product, note }: { product: Product; note?: string }) {
  const isKit = product.category === 'kits'
  const choices = isKit ? [baseGrams(product)] : weightChoices(product)
  const [grams, setGrams] = useState(baseGrams(product))
  const variant = defaultVariant(product)
  const name = displayName(product.name)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-[#141612] p-2.5 transition hover:border-[#D6FF3D]/40 sm:p-3">
      <Link href={productHref(product)} className="relative block aspect-square overflow-hidden rounded-xl bg-[#1C1F1A]">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 220px"
            className={`${isKit ? 'object-contain p-1' : 'object-cover'} transition duration-500 group-hover:scale-[1.04]`}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm font-semibold text-[#A3A89A]">{name}</span>
        )}
        {note && (
          <span className={`${mono} absolute left-2 top-2 rounded-md bg-[#0C0D0B]/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D6FF3D]`}>{note}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        <Link href={productHref(product)} className="line-clamp-2 min-h-[2.6rem] text-[15px] font-semibold leading-snug text-[#F2F2EE] hover:text-[#D6FF3D]">
          {name}
        </Link>
        <div className={`${mono} mt-0.5 h-4 truncate text-[11px] text-[#A3A89A]`}>{isKit ? `${variant?.name || 'Kit'} size` : variant?.name || ''}</div>
        {!isKit && choices.length > 1 && (
          <div className="mt-2.5 grid grid-cols-3 gap-1" role="radiogroup" aria-label={`Pack size for ${name}`}>
            {choices.map(choice => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={grams === choice}
                onClick={() => setGrams(choice)}
                className={`${mono} h-8 rounded-lg border text-[11px] font-bold transition ${grams === choice ? 'border-[#D6FF3D] text-[#D6FF3D]' : 'border-white/10 text-[#A3A89A] hover:border-white/30'}`}
              >
                {gramsLabel(choice)}
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className={`${mono} leading-tight`}>
            <div className="text-[15px] font-bold text-[#F2F2EE]">{formatPrice(priceAt(product, grams))}</div>
            <div className="text-[10px] text-[#A3A89A]">{isKit ? 'per kit' : gramsLabel(grams)}</div>
          </div>
          <div className="w-[104px]">
            <FuelAddButton product={product} grams={grams} />
          </div>
        </div>
      </div>
    </article>
  )
}

/* ───────────────────────────── Ideas ───────────────────────────── */

export function IdeaAddButton({ products, total }: { products: Product[]; total: number }) {
  const addMany = useAddMany()
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const timer = window.setTimeout(() => setAdded(false), 1800)
    return () => window.clearTimeout(timer)
  }, [added])
  return (
    <button
      type="button"
      onClick={() => {
        addMany(products.map(product => ({ product })), { message: `Added ${products.map(product => displayName(product.name)).join(' & ')}` })
        setAdded(true)
      }}
      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D6FF3D] ${
        added ? 'border-[#D6FF3D] bg-[#D6FF3D] text-[#0C0D0B]' : 'border-[#D6FF3D]/60 text-[#D6FF3D] hover:bg-[#D6FF3D] hover:text-[#0C0D0B]'
      }`}
    >
      {added ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
      {added ? 'Added to cart' : <>Add both · {formatPrice(total)}</>}
    </button>
  )
}

/* ───────────────────────────── Cart bar ───────────────────────────── */

/** Basket bar with a free-delivery meter; appears once something is in the cart. */
export function FuelCartBar() {
  const { count, total } = useCartSummary()
  if (!count) return null
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <>
      <div aria-hidden className="h-24 bg-[#0C0D0B] sm:hidden" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[360px] sm:p-0">
        <button
          type="button"
          onClick={openCart}
          className="pointer-events-auto block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141612] text-left shadow-[0_18px_40px_rgba(0,0,0,0.55)] transition hover:border-[#D6FF3D]/60"
        >
          <div className="h-1 bg-white/[0.07]">
            <div className="h-full bg-[#D6FF3D] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className={`${mono} text-[11px] text-[#A3A89A]`}>
                <Truck size={12} className="mr-1 inline -translate-y-px text-[#D6FF3D]" />
                {remaining > 0 ? <>{formatPrice(remaining)} more for free delivery</> : <>Free delivery unlocked</>}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-[#F2F2EE]">
                {count} item{count === 1 ? '' : 's'} · <span className={mono}>{formatPrice(total)}</span>
              </div>
            </div>
            <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[#D6FF3D] px-3.5 text-sm font-extrabold uppercase text-[#0C0D0B]">
              Cart <ArrowRight size={15} />
            </span>
          </div>
        </button>
      </div>
    </>
  )
}
