'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown, LayoutGrid, List, Minus, Plus, Search, X } from 'lucide-react'
import { MAX_LINE_QUANTITY } from '@/lib/pricing'
import { FREE_SHIPPING_THRESHOLD, formatPrice, whatsappUrl } from '@/lib/utils'
import { openCart, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { baseGrams, canQuickAdd, gramsLabel, priceAt, productHref, weightChoices } from '../_lib/shared'
import { GROUP_INFO, GROUP_ORDER, TABS, type MonoItem, type TabKey } from './data'

const SERIF = '[font-family:var(--mono-serif)]'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C7A2F]'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name'
type View = 'list' | 'gallery'

const SORTS: { key: Sort; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'name', label: 'Name: A to Z' },
]

const VIEW_KEY = 'mana-mono-view'

function tokenize(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Substring match that also forgives plurals ("cashews" finds "cashew nuts"). */
function hasToken(text: string, token: string) {
  if (text.includes(token)) return true
  if (token.length > 4 && token.endsWith('es') && text.includes(token.slice(0, -2))) return true
  if (token.length > 3 && token.endsWith('s') && text.includes(token.slice(0, -1))) return true
  return false
}

const tabOf = (item: MonoItem): TabKey => GROUP_INFO[item.group].tab
const listPrice = (item: MonoItem) => item.fromPrice ?? priceAt(item.product, baseGrams(item.product))
const isKit = (item: MonoItem) => item.product.category === 'kits'

/* ------------------------------------------------------------------ */
/* The catalogue: search, shelves, list or gallery                     */
/* ------------------------------------------------------------------ */

export function MonoCatalog({ items }: { items: MonoItem[] }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [sort, setSort] = useState<Sort>('featured')
  const [view, setView] = useState<View>('list')
  const [roomy, setRoomy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const settled = useRef(false)

  // Remember list/gallery for this browser only (and never break without storage).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY)
      if (saved === 'list' || saved === 'gallery') setView(saved)
    } catch {}
  }, [])

  const chooseView = (next: View) => {
    setView(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {}
  }

  // Wider screens get a placeholder with examples (Hindi names work too).
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const update = () => setRoomy(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // "/" jumps to search from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tokens = useMemo(() => tokenize(query), [query])
  const matched = useMemo(
    () => (tokens.length ? items.filter(item => tokens.every(token => hasToken(item.search, token))) : items),
    [items, tokens]
  )
  const counts = useMemo(() => {
    const result: Record<TabKey, number> = { all: matched.length, 'dry-fruits': 0, herbs: 0, spices: 0, kits: 0 }
    for (const item of matched) result[tabOf(item)] += 1
    return result
  }, [matched])

  const visible = useMemo(() => {
    const inTab = tab === 'all' ? [...matched] : matched.filter(item => tabOf(item) === tab)
    if (sort === 'price-asc') return inTab.sort((a, b) => listPrice(a) - listPrice(b))
    if (sort === 'price-desc') return inTab.sort((a, b) => listPrice(b) - listPrice(a))
    if (sort === 'name') return inTab.sort((a, b) => a.name.localeCompare(b.name))
    if (tokens.length) {
      // While searching, things whose own name matches come before matches on tags or other names.
      const misses = (item: MonoItem) => {
        const title = `${item.name} ${item.local}`.toLowerCase()
        return tokens.filter(token => !hasToken(title, token)).length
      }
      return inTab.sort((a, b) => misses(a) - misses(b) || a.rank - b.rank)
    }
    return inTab.sort((a, b) => a.rank - b.rank)
  }, [matched, tab, sort, tokens])

  // Shelves (with headings) while browsing; one flat list while searching or sorting.
  const shelves = useMemo(() => {
    if (sort !== 'featured' || tokens.length) return null
    return GROUP_ORDER.map(group => ({ group, items: visible.filter(item => item.group === group) })).filter(shelf => shelf.items.length)
  }, [sort, tokens.length, visible])

  // When the filter changes while scrolled deep into the list, bring the results back under the toolbar.
  const keepResultsInView = useCallback(() => {
    const list = listRef.current
    const toolbar = toolbarRef.current
    if (!list || !toolbar) return
    const top = list.getBoundingClientRect().top
    const offset = toolbar.offsetHeight
    if (top < offset) window.scrollTo({ top: window.scrollY + top - offset })
  }, [])

  const filterKey = `${tokens.join(' ')}|${tab}|${sort}|${view}`
  useEffect(() => {
    if (!settled.current) {
      settled.current = true
      return
    }
    keepResultsInView()
  }, [filterKey, keepResultsInView])

  const trimmed = query.trim()
  const summary = trimmed
    ? `${visible.length} result${visible.length === 1 ? '' : 's'} for “${trimmed}”`
    : `${visible.length} product${visible.length === 1 ? '' : 's'}`

  return (
    <section aria-label="All products">
      {/* Search + shelves: stays under your thumb while you scroll. */}
      <div ref={toolbarRef} className="sticky top-0 z-30 border-b border-[#E6E4DE] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-3 pt-3">
            <label className="relative flex h-12 min-w-0 flex-1 items-center rounded-full bg-[#F5F4F0] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#9C7A2F] md:h-14">
              <span className="sr-only">Search products</span>
              <Search size={18} aria-hidden className="pointer-events-none absolute left-4 text-[#6F6F6B] md:left-5" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Escape') setQuery('')
                }}
                placeholder={roomy ? `Search ${items.length} products — badam, chia, triphala…` : `Search ${items.length} products…`}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                className="h-full w-full min-w-0 rounded-full bg-transparent pl-11 pr-12 text-[16px] text-[#111111] outline-none placeholder:text-[#8A8A85] md:pl-12 md:text-[17px] [&::-webkit-search-cancel-button]:[appearance:none]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                  aria-label="Clear search"
                  className={`absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full text-[#6F6F6B] transition hover:bg-[#F5F4F0] hover:text-[#111111] md:right-2 ${FOCUS}`}
                >
                  <X size={17} />
                </button>
              ) : (
                <kbd aria-hidden className="pointer-events-none absolute right-5 hidden h-6 min-w-6 items-center justify-center rounded-md border border-[#D9D6CE] px-1.5 text-[11px] text-[#6F6F6B] md:flex">
                  /
                </kbd>
              )}
            </label>
            <BagMini />
          </div>

          <div className="flex items-center gap-4">
            {/* On phones the shelves scroll sideways; a soft fade hints there is more. */}
            <div className="relative -mx-4 min-w-0 flex-1 after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-10 after:bg-gradient-to-l after:from-white after:to-white/0 after:content-[''] sm:mx-0 sm:after:hidden">
              <div role="group" aria-label="Shelves" className="flex min-w-0 gap-0.5 overflow-x-auto px-2.5 pr-10 [scrollbar-width:none] sm:px-0 sm:pr-0 [&::-webkit-scrollbar]:hidden">
                {TABS.map(option => {
                  const active = tab === option.key
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTab(option.key)}
                      className={`relative flex h-12 shrink-0 items-center gap-1.5 whitespace-nowrap px-2 text-[14px] transition ${
                        active ? 'text-[#111111]' : 'text-[#6F6F6B] hover:text-[#111111]'
                      } ${FOCUS}`}
                    >
                      {option.label}
                      <span className={`text-[11px] tabular-nums ${counts[option.key] ? 'text-[#8A8A85]' : 'text-[#C9C6BE]'}`}>{counts[option.key]}</span>
                      {active && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#111111]" />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <SortPicker sort={sort} onChange={setSort} />
              <ViewToggle view={view} onChange={chooseView} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <p aria-live="polite" className="min-w-0 truncate text-[13px] text-[#6F6F6B]">
          {summary}
        </p>
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <SortPicker sort={sort} onChange={setSort} />
          <ViewToggle view={view} onChange={chooseView} />
        </div>
      </div>

      <div ref={listRef} className="mx-auto max-w-6xl scroll-mt-40 px-4 pb-16 sm:px-6 md:pb-24">
        {visible.length === 0 ? (
          <EmptyState
            query={trimmed}
            elsewhere={tab !== 'all' ? counts.all : 0}
            onShowAll={() => setTab('all')}
            onClear={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          />
        ) : shelves ? (
          shelves.map(shelf => (
            <section key={shelf.group} aria-labelledby={`mono-shelf-${shelf.group}`} className="pt-8 md:pt-14">
              <div className="flex items-end justify-between gap-4 border-b border-[#111111] pb-3">
                <h2 id={`mono-shelf-${shelf.group}`} className={`${SERIF} text-[30px] leading-none tracking-[-0.01em] md:text-[44px]`}>
                  {GROUP_INFO[shelf.group].title}
                </h2>
                <p className="pb-0.5 text-right text-[12.5px] text-[#6F6F6B]">
                  <span className="hidden sm:inline">{GROUP_INFO[shelf.group].note} · </span>
                  <span className="tabular-nums">{shelf.items.length}</span>
                </p>
              </div>
              <Items items={shelf.items} view={view} eager={shelf.group === shelves[0].group ? 6 : 0} />
            </section>
          ))
        ) : (
          <div className="pt-2">
            <Items items={visible} view={view} eager={6} />
          </div>
        )}
      </div>
    </section>
  )
}

function Items({ items, view, eager }: { items: MonoItem[]; view: View; eager: number }) {
  if (view === 'gallery') {
    return (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-9 pt-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
        {items.map((item, index) => (
          <Tile key={item.product.id} item={item} eager={index < eager} />
        ))}
      </ul>
    )
  }
  return (
    <ul className="divide-y divide-[#E6E4DE]">
      {items.map((item, index) => (
        <Row key={item.product.id} item={item} eager={index < eager} />
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* A line in the price list                                            */
/* ------------------------------------------------------------------ */

function Row({ item, eager }: { item: MonoItem; eager: boolean }) {
  const { product } = item
  const kit = isKit(item)
  const choices = weightChoices(product)
  const [grams, setGrams] = useState(baseGrams(product))
  const price = kit ? listPrice(item) : priceAt(product, grams)
  const perKilo = kit || grams >= 1000 ? 0 : priceAt(product, 1000)

  return (
    <li className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 py-4 md:grid-cols-[64px_minmax(0,1fr)_auto_7.5rem_auto] md:gap-x-6 md:py-[1.1rem]">
      <Thumb item={item} sizes="64px" eager={eager} className="h-14 w-14 rounded-md md:h-16 md:w-16" />

      <div className="min-w-0">
        <div className="line-clamp-2 text-[15px] leading-snug md:text-[16px]">
          <Link href={productHref(product)} className={`font-medium decoration-[#C9C6BE] underline-offset-4 hover:underline ${FOCUS}`}>
            {item.name}
          </Link>
          {item.local && (
            <>
              {'\u2002'}
              <span className="text-[#6F6F6B]">{item.local}</span>
            </>
          )}
        </div>
        {item.hint && <div className="mt-0.5 truncate text-[12.5px] text-[#6F6F6B]">{item.hint}</div>}
        <div className="mt-2 flex items-center gap-2.5 md:hidden">
          <span className="text-[15px] font-medium tabular-nums">
            {kit && <span className="text-[12.5px] font-normal text-[#6F6F6B]">from </span>}
            {formatPrice(price)}
          </span>
          {!kit && <SizeSelect choices={choices} grams={grams} onChange={setGrams} name={item.name} />}
        </div>
      </div>

      <div className="hidden md:block">{!kit && <SizeChips choices={choices} grams={grams} onChange={setGrams} name={item.name} />}</div>

      <div className="hidden text-right md:block">
        <div className="text-[16px] font-medium tabular-nums">
          {kit && <span className="text-[12.5px] font-normal text-[#6F6F6B]">from </span>}
          {formatPrice(price)}
        </div>
        {perKilo > 0 && <div className="mt-0.5 text-[12px] tabular-nums text-[#6F6F6B]">{formatPrice(perKilo)} / kg</div>}
      </div>

      <AddControl item={item} grams={grams} />
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* A gallery tile                                                      */
/* ------------------------------------------------------------------ */

function Tile({ item, eager }: { item: MonoItem; eager: boolean }) {
  const { product } = item
  const kit = isKit(item)
  const choices = weightChoices(product)
  const [grams, setGrams] = useState(baseGrams(product))
  const price = kit ? listPrice(item) : priceAt(product, grams)

  return (
    <li className="group flex min-w-0 flex-col">
      <Thumb
        item={item}
        large
        eager={eager}
        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 270px"
        className="aspect-square w-full rounded-[10px]"
      />
      <div className="mt-3 min-w-0 flex-1">
        <Link href={productHref(product)} className={`line-clamp-2 text-[14.5px] font-medium leading-snug decoration-[#C9C6BE] underline-offset-4 hover:underline ${FOCUS}`}>
          {item.name}
        </Link>
        <div className="mt-0.5 truncate text-[12.5px] text-[#6F6F6B]">{item.local || item.hint || '\u00a0'}</div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="text-[15px] font-medium tabular-nums">
          {kit && <span className="text-[12px] font-normal text-[#6F6F6B]">from </span>}
          {formatPrice(price)}
        </span>
        {!kit && <SizeSelect choices={choices} grams={grams} onChange={setGrams} name={item.name} />}
      </div>
      <div className="mt-3">
        <AddControl item={item} grams={grams} wide />
      </div>
    </li>
  )
}

function Thumb({ item, sizes, className, large = false, eager = false }: { item: MonoItem; sizes: string; className: string; large?: boolean; eager?: boolean }) {
  const { product } = item
  const image = product.images?.[0]
  return (
    <Link href={productHref(product)} tabIndex={-1} aria-hidden="true" className={`relative block shrink-0 overflow-hidden bg-[#1D1A17] ${className}`}>
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          className={`${isKit(item) && large ? 'object-contain' : 'object-cover'} ${large ? 'motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]' : ''}`}
        />
      ) : (
        <span className={`absolute inset-0 flex items-center justify-center bg-[#F5F4F0] italic text-[#8A8A85] ${SERIF} ${large ? 'text-[64px]' : 'text-[26px]'}`}>
          {item.name.charAt(0)}
        </span>
      )}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

function SizeChips({ choices, grams, onChange, name }: { choices: number[]; grams: number; onChange: (grams: number) => void; name: string }) {
  if (choices.length < 2) return <span className="text-[13px] tabular-nums text-[#6F6F6B]">{gramsLabel(grams)}</span>
  return (
    <div role="radiogroup" aria-label={`Pack size for ${name}`} className="flex gap-1.5">
      {choices.map(choice => (
        <button
          key={choice}
          type="button"
          role="radio"
          aria-checked={grams === choice}
          onClick={() => onChange(choice)}
          className={`h-9 min-w-[3.9rem] rounded-full border px-3 text-[12.5px] tabular-nums transition ${
            grams === choice ? 'border-[#111111] text-[#111111]' : 'border-[#E6E4DE] text-[#6F6F6B] hover:border-[#B9B6AE] hover:text-[#111111]'
          } ${FOCUS}`}
        >
          {gramsLabel(choice)}
        </button>
      ))}
    </div>
  )
}

function SizeSelect({ choices, grams, onChange, name }: { choices: number[]; grams: number; onChange: (grams: number) => void; name: string }) {
  if (choices.length < 2) return <span className="text-[12.5px] tabular-nums text-[#6F6F6B]">{gramsLabel(grams)}</span>
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Pack size for {name}</span>
      <select
        value={grams}
        onChange={event => onChange(Number(event.target.value))}
        className={`h-9 appearance-none rounded-full border border-[#E6E4DE] bg-white pl-3 pr-8 text-[12.5px] tabular-nums text-[#111111] transition hover:border-[#B9B6AE] ${FOCUS}`}
      >
        {choices.map(choice => (
          <option key={choice} value={choice}>
            {gramsLabel(choice)}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6F6B]" />
    </label>
  )
}

function AddControl({ item, grams, wide = false }: { item: MonoItem; grams: number; wide?: boolean }) {
  const { product } = item
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()
  const setQuantity = useSetLineQuantity()
  const base = `inline-flex h-10 shrink-0 items-center justify-center rounded-full text-[13.5px] transition ${FOCUS}`
  const width = wide ? 'w-full' : 'w-[6.25rem]'

  if (isKit(item)) {
    return (
      <Link href={productHref(product)} className={`${base} ${width} border border-[#111111] px-4 font-medium hover:bg-[#111111] hover:text-white`}>
        Customise
      </Link>
    )
  }
  if (!canQuickAdd(product)) {
    return (
      <Link href={productHref(product)} className={`${base} ${width} border border-[#E6E4DE] px-4 text-[#6F6F6B] hover:border-[#111111] hover:text-[#111111]`}>
        Options
      </Link>
    )
  }
  if (quantity > 0) {
    return (
      <div className={`${base} ${width} justify-between bg-[#111111] text-white`}>
        <button
          type="button"
          onClick={() => setQuantity(product, grams, quantity - 1)}
          aria-label={`Remove one ${item.name}, ${gramsLabel(grams)}`}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15"
        >
          <Minus size={15} />
        </button>
        <span className="text-[14px] font-medium tabular-nums" aria-live="polite" aria-label={`${quantity} in bag`}>
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity(product, grams, quantity + 1)}
          disabled={quantity >= MAX_LINE_QUANTITY}
          aria-label={`Add one more ${item.name}, ${gramsLabel(grams)}`}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 disabled:opacity-40"
        >
          <Plus size={15} />
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => add(product, { grams, silent: true })}
      aria-label={`Add ${item.name}, ${gramsLabel(grams)}, to bag`}
      className={`${base} ${width} border border-[#111111] px-4 font-medium hover:bg-[#111111] hover:text-white`}
    >
      Add
    </button>
  )
}

function SortPicker({ sort, onChange }: { sort: Sort; onChange: (sort: Sort) => void }) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Sort products</span>
      <select
        value={sort}
        onChange={event => onChange(event.target.value as Sort)}
        className={`h-9 appearance-none rounded-full border border-[#E6E4DE] bg-white pl-3.5 pr-8 text-[13px] text-[#111111] transition hover:border-[#B9B6AE] ${FOCUS}`}
      >
        {SORTS.map(option => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6F6B]" />
    </label>
  )
}

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return (
    <div role="group" aria-label="View" className="flex h-9 items-center rounded-full border border-[#E6E4DE] p-0.5">
      {(
        [
          ['list', List, 'List view'],
          ['gallery', LayoutGrid, 'Gallery view'],
        ] as const
      ).map(([key, Icon, label]) => (
        <button
          key={key}
          type="button"
          aria-label={label}
          aria-pressed={view === key}
          onClick={() => onChange(key)}
          className={`flex h-8 w-9 items-center justify-center rounded-full transition ${
            view === key ? 'bg-[#111111] text-white' : 'text-[#6F6F6B] hover:text-[#111111]'
          } ${FOCUS}`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  )
}

function EmptyState({ query, elsewhere, onShowAll, onClear }: { query: string; elsewhere: number; onShowAll: () => void; onClear: () => void }) {
  return (
    <div className="py-20 text-center md:py-28">
      <p className={`${SERIF} mx-auto max-w-xl text-[34px] leading-[1.1] md:text-[46px]`}>
        {query ? <>Nothing on this shelf for “{query}”.</> : 'Nothing on this shelf yet.'}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-[14px]">
        {elsewhere > 0 && (
          <button type="button" onClick={onShowAll} className={`inline-flex h-11 items-center rounded-full border border-[#111111] px-5 font-medium transition hover:bg-[#111111] hover:text-white ${FOCUS}`}>
            See {elsewhere} result{elsewhere === 1 ? '' : 's'} in all products
          </button>
        )}
        {query && !elsewhere && (
          <button type="button" onClick={onClear} className={`inline-flex h-11 items-center rounded-full border border-[#111111] px-5 font-medium transition hover:bg-[#111111] hover:text-white ${FOCUS}`}>
            Clear search
          </button>
        )}
        <a
          href={whatsappUrl(query ? `Hi Mana! I'm looking for ${query}. Do you have it?` : 'Hi Mana! I have a question.')}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-11 items-center gap-1.5 rounded-full bg-[#111111] px-5 font-medium text-white transition hover:bg-[#2A2A2A] ${FOCUS}`}
        >
          Can’t find it? Ask us on WhatsApp <ArrowRight size={15} />
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bag                                                                 */
/* ------------------------------------------------------------------ */

export function MonoBagButton() {
  const { count } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open bag, ${count} item${count === 1 ? '' : 's'}`}
      className={`inline-flex h-11 items-center gap-1 rounded-full px-3 text-[14px] font-medium transition hover:bg-[#F5F4F0] ${FOCUS}`}
    >
      Bag <span className="font-normal tabular-nums text-[#6F6F6B]">({count})</span>
    </button>
  )
}

/** Desktop: the bag stays reachable inside the sticky search bar. */
function BagMini() {
  const { count, total } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open bag, ${count} item${count === 1 ? '' : 's'}`}
      className={`hidden h-14 shrink-0 items-center gap-3 rounded-full border border-[#E6E4DE] px-5 text-[14px] transition hover:border-[#111111] md:inline-flex ${FOCUS}`}
    >
      <span className="font-medium">Bag</span>
      <span className="tabular-nums text-[#6F6F6B]">{count ? `${count} · ${formatPrice(total)}` : 'empty'}</span>
    </button>
  )
}

/** Phones: a slim bag bar once something is in it, with the free-delivery nudge. */
export function MonoBagBar() {
  const { count, total } = useCartSummary()
  if (!count) return null
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  return (
    <>
      <div aria-hidden className="h-24 md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <button
          type="button"
          onClick={openCart}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl bg-[#111111] px-5 py-3 text-left text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] ${FOCUS}`}
        >
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-medium">
              Bag · {count} item{count === 1 ? '' : 's'} · <span className="tabular-nums">{formatPrice(total)}</span>
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-white/65">
              {remaining > 0 ? `${formatPrice(remaining)} more for free delivery` : 'Free delivery unlocked'}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium">
            View <ArrowRight size={16} />
          </span>
        </button>
      </div>
    </>
  )
}
