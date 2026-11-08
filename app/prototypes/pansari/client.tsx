'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Leaf, Minus, Plus, Search, ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toaster'
import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@/lib/utils'
import { openCart, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { baseGrams, canQuickAdd, cashbackOn, gramsLabel, priceAt, productHref, weightChoices } from '../_lib/shared'
import { gramsHi, searchHref } from './data'

/* ───────────────────────── Language ───────────────────────── */

export type Lang = 'en' | 'hi'
const STORAGE_KEY = 'mana-pansari-lang'

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: 'en', setLang: () => {} })
export const useLang = () => useContext(LangContext)

/**
 * Page root: holds the language, remembers it, and hides the other language's
 * text (every <T> renders both; `.t-en` / `.t-hi` are shown by data-lang).
 */
export function PansariRoot({ className = '', children }: { className?: string; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'hi') setLangState(stored)
    } catch {
      // Storage can be blocked (private mode); English is a fine default.
    }
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not remembered, still switched.
    }
  }, [])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])

  return (
    <LangContext.Provider value={value}>
      <div data-lang={lang} lang={lang} className={`${className} [&[data-lang=en]_.t-hi]:hidden [&[data-lang=hi]_.t-en]:hidden [&_[lang=hi]]:tracking-normal`}>
        {children}
      </div>
    </LangContext.Provider>
  )
}

export function LangToggle() {
  const { lang, setLang } = useLang()
  const base = 'inline-flex h-9 items-center rounded-full px-3 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A50E]'
  return (
    <div role="group" aria-label="Language / भाषा" className="inline-flex shrink-0 items-center rounded-full border-2 border-[#1E1A16] bg-[#FBF5EA] p-0.5">
      <button
        type="button"
        aria-pressed={lang === 'en'}
        aria-label="English"
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? 'bg-[#1E1A16] text-[#FBF5EA]' : 'text-[#1E1A16] hover:bg-[#1E1A16]/5'}`}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={lang === 'hi'}
        aria-label="हिंदी (Hindi)"
        onClick={() => setLang('hi')}
        className={`${base} pt-0.5 ${lang === 'hi' ? 'bg-[#A8261C] text-white' : 'text-[#1E1A16] hover:bg-[#1E1A16]/5'}`}
      >
        हिंदी
      </button>
    </div>
  )
}

/** A friendly nudge in the hero, so people discover the Hindi page. */
export function LangInvite() {
  const { lang, setLang } = useLang()
  const next: Lang = lang === 'en' ? 'hi' : 'en'
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className="group inline-flex items-center gap-2.5 rounded-full border border-dashed border-[#1E1A16]/40 bg-[#FBF5EA]/70 py-1.5 pl-1.5 pr-4 text-[14px] font-semibold text-[#1E1A16] transition hover:border-[#A8261C] hover:text-[#A8261C]"
    >
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E1A16] text-[15px] font-bold text-[#F3E7D3] [font-family:var(--pansari-sign)]">
        {lang === 'en' ? 'अ' : 'A'}
      </span>
      {lang === 'en' ? <span lang="hi">यह पेज हिंदी में पढ़ें</span> : <span lang="en">Read this page in English</span>}
      <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
    </button>
  )
}

/* ───────────────────────── Header bits ───────────────────────── */

export function SearchBox({ className = '' }: { className?: string }) {
  const { lang } = useLang()
  const router = useRouter()
  const [query, setQuery] = useState('')
  return (
    <form
      role="search"
      action="/products"
      method="get"
      onSubmit={event => {
        event.preventDefault()
        router.push(searchHref(query))
      }}
      className={`relative ${className}`}
    >
      <Search size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5B4B]" />
      <input
        name="q"
        value={query}
        onChange={event => setQuery(event.target.value)}
        aria-label={lang === 'hi' ? 'सामान खोजें' : 'Search products'}
        placeholder={lang === 'hi' ? 'बादाम, इलायची, अश्वगंधा… खोजें' : 'Search badam, elaichi, ashwagandha…'}
        className="h-11 w-full rounded-full border-2 border-[#1E1A16]/15 bg-[#FBF5EA] pl-10 pr-4 text-[15px] text-[#1E1A16] placeholder:text-[#7A6A59] focus:border-[#A8261C] focus:outline-none"
      />
    </form>
  )
}

export function HeaderCart() {
  const { lang } = useLang()
  const { count } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={lang === 'hi' ? `थैला खोलें, ${count} सामान` : `Open bag, ${count} item${count === 1 ? '' : 's'}`}
      className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#1E1A16] px-3.5 text-[#FBF5EA] transition hover:bg-[#3A3129]"
    >
      <ShoppingBag size={18} />
      <span className="hidden text-[14px] font-semibold sm:inline">{lang === 'hi' ? 'थैला' : 'Bag'}</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E2A50E] px-1 text-[11px] font-bold text-[#1E1A16] ring-2 ring-[#F3E7D3]">
          {count}
        </span>
      )}
    </button>
  )
}

/* ───────────────────────── Chalkboard ───────────────────────── */

/** The "+" on the chalkboard: adds the product's standard pack in one tap. */
export function ChalkAdd({ product, en, hi }: { product: Product; en: string; hi: string }) {
  const { lang } = useLang()
  const grams = baseGrams(product)
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()

  if (!canQuickAdd(product)) {
    return (
      <Link href={productHref(product)} aria-label={lang === 'hi' ? `${hi} देखें` : `See ${en}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#F4F1E8]/50 text-[#F4F1E8]">
        <ArrowRight size={18} />
      </Link>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {quantity > 0 && (
        <span className="min-w-[2.2rem] text-right text-[17px] font-bold text-[#F2D27B]" aria-live="polite">
          ×{quantity}
        </span>
      )}
      <button
        type="button"
        aria-label={lang === 'hi' ? `${hi} ${gramsHi(grams)} थैले में जोड़ें` : `Add ${en}, ${gramsLabel(grams)}`}
        onClick={() => {
          add(product, { silent: true })
          showToast(lang === 'hi' ? `${hi} (${gramsHi(grams)}) थैले में डाल दिया` : `Added ${en} (${gramsLabel(grams)})`)
        }}
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#F4F1E8]/75 text-[#F4F1E8] transition hover:border-[#F2D27B] hover:bg-white/10 hover:text-[#F2D27B] active:scale-95"
      >
        <Plus size={20} strokeWidth={2.75} />
      </button>
    </div>
  )
}

/* ───────────────────────── Shelves ───────────────────────── */

export type ShelfItem = {
  product: Product
  en: string
  hi: string
  badge?: string
  badgeHi?: string
  /** Kits: lowest price across sizes and a short "what's inside". */
  from?: number
  insideEn?: string
  insideHi?: string
}

export type Shelf = {
  key: string
  en: string
  hi: string
  count: number
  href: string
  allEn: string
  allHi: string
  items: ShelfItem[]
}

export function Shelves({ shelves }: { shelves: Shelf[] }) {
  const { lang } = useLang()
  const [active, setActive] = useState(shelves[0]?.key)
  const shelf = shelves.find(item => item.key === active) || shelves[0]
  if (!shelf) return null

  return (
    <div className="mt-8">
      <div role="tablist" aria-label={lang === 'hi' ? 'दुकान की अलमारियाँ' : 'Shop shelves'} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {shelves.map(item => {
          const selected = item.key === shelf.key
          return (
            <button
              key={item.key}
              id={`tab-${item.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`shelf-${item.key}`}
              onClick={() => setActive(item.key)}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border-2 px-4 text-[15px] font-semibold transition ${
                selected
                  ? 'border-[#1E1A16] bg-[#1E1A16] text-[#F8EEDC] shadow-[0_3px_0_#A8261C]'
                  : 'border-[#1E1A16]/25 bg-[#FBF5EA] text-[#1E1A16] hover:border-[#1E1A16]/60'
              }`}
            >
              {lang === 'hi' ? item.hi : item.en}
              <span className={`rounded-md px-1.5 text-[12px] font-bold ${selected ? 'bg-[#E2A50E] text-[#1E1A16]' : 'bg-[#1E1A16]/10 text-[#4E4237]'}`}>{item.count}</span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`shelf-${shelf.key}`} aria-labelledby={`tab-${shelf.key}`} className="mt-6">
        <ul key={shelf.key} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-6 pt-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-7 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6">
          {shelf.items.map((item, index) => (
            <TagCard key={item.product.id} item={item} index={index} kit={shelf.key === 'kits'} />
          ))}
        </ul>
        <Link
          href={shelf.href}
          className="mt-1 inline-flex h-11 items-center gap-2 rounded-lg px-1 text-[15px] font-bold text-[#A8261C] underline decoration-[#A8261C]/30 decoration-2 underline-offset-4 transition hover:decoration-[#A8261C]"
        >
          {lang === 'hi' ? shelf.allHi : shelf.allEn} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

/** A paper price tag hanging from a nail: photo, both names, pack size, add. */
function TagCard({ item, index, kit }: { item: ShelfItem; index: number; kit: boolean }) {
  const { lang } = useLang()
  const { product } = item
  const choices = kit ? [] : weightChoices(product)
  const [grams, setGrams] = useState(baseGrams(product))
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()
  const setQuantity = useSetLineQuantity()
  const primary = lang === 'hi' ? item.hi : item.en
  const secondary = lang === 'hi' ? item.en : item.hi
  const unit = lang === 'hi' ? gramsHi(grams) : gramsLabel(grams)
  const tilt = index % 2 ? 'sm:rotate-[0.6deg]' : 'sm:-rotate-[0.6deg]'

  return (
    <li className={`relative w-[44vw] max-w-[13.5rem] shrink-0 snap-start pt-5 sm:w-auto sm:max-w-none ${tilt}`}>
      {/* Nail and string */}
      <svg aria-hidden viewBox="0 0 40 24" className="absolute left-1/2 top-0 h-6 w-10 -translate-x-1/2">
        <path d="M13 22 L20 5 L27 22" fill="none" stroke="#6B4F2E" strokeWidth="1.3" />
        <circle cx="20" cy="5" r="3.6" fill="#A88444" stroke="#5C4520" strokeWidth="0.8" />
        <circle cx="19" cy="4" r="1.1" fill="#F1D9A0" />
      </svg>
      <article className="relative flex h-full flex-col rounded-xl bg-[#FFFBF3] p-2.5 pt-5 shadow-[0_1px_0_rgba(30,26,22,0.06),0_14px_26px_-16px_rgba(30,26,22,0.55)] ring-1 ring-[#1E1A16]/10">
        <span aria-hidden className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#E7D3B3] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ring-1 ring-[#A88444]/70" />
        <Link href={productHref(product)} className={`group relative block overflow-hidden rounded-lg bg-[#2B211A] ${kit ? 'aspect-[4/3]' : 'aspect-square'}`}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={`${item.en}${item.hi && item.hi !== item.en ? ` (${item.hi})` : ''}`}
              fill
              sizes="(max-width: 640px) 44vw, (max-width: 1024px) 24vw, 180px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[#E7D3B3]">
              <Leaf size={28} />
            </span>
          )}
          {item.badge && (
            <span className="absolute left-1.5 top-1.5 rounded bg-[#E2A50E] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1E1A16]">
              {lang === 'hi' && item.badgeHi ? item.badgeHi : item.badge}
            </span>
          )}
        </Link>

        <div className="mt-2.5 flex flex-1 flex-col px-0.5">
          <Link href={productHref(product)} className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-[#1E1A16] hover:text-[#A8261C]" lang={lang}>
            {primary}
          </Link>
          <div className="line-clamp-1 text-[12.5px] leading-snug text-[#6B5B4B]" lang={lang === 'hi' ? 'en' : 'hi'}>
            {secondary}
          </div>

          {kit ? (
            <>
              {(item.insideEn || item.insideHi) && (
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[#4E4237]">
                  {lang === 'hi' ? `अंदर: ${item.insideHi}` : `Inside: ${item.insideEn}`}
                </p>
              )}
              <div className="mt-1.5 text-[13px] text-[#4E4237]">
                {lang === 'hi' ? (
                  <>
                    <b className="text-[17px] text-[#1E1A16]">{formatPrice(item.from || priceAt(product, grams))}</b> से शुरू
                  </>
                ) : (
                  <>
                    from <b className="text-[17px] text-[#1E1A16]">{formatPrice(item.from || priceAt(product, grams))}</b>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-[17px] font-bold text-[#1E1A16]">{formatPrice(priceAt(product, grams))}</span>
              <span className="text-[12.5px] text-[#6B5B4B]">/ {unit}</span>
            </div>
          )}

          {choices.length > 1 && (
            <div className="mt-2 grid grid-cols-3 gap-1" role="radiogroup" aria-label={lang === 'hi' ? `${item.hi} का पैक` : `Pack size for ${item.en}`}>
              {choices.map(choice => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={grams === choice}
                  onClick={() => setGrams(choice)}
                  className={`h-8 rounded-md border text-[12px] font-semibold transition ${
                    grams === choice ? 'border-[#1E1A16] bg-[#1E1A16] text-[#F8EEDC]' : 'border-[#1E1A16]/20 text-[#4E4237] hover:border-[#1E1A16]/50'
                  }`}
                >
                  {lang === 'hi' ? (choice >= 1000 ? `${choice / 1000} किलो` : `${choice} ग्रा.`) : gramsLabel(choice)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto pt-2.5">
            {!canQuickAdd(product) ? (
              <Link href={productHref(product)} className="flex h-10 items-center justify-center rounded-lg border-2 border-[#1E1A16]/20 text-[14px] font-semibold text-[#4E4237]">
                {lang === 'hi' ? 'विकल्प देखें' : 'See options'}
              </Link>
            ) : quantity > 0 ? (
              <div className="flex h-10 items-center justify-between rounded-lg bg-[#A8261C] text-white">
                <button
                  type="button"
                  aria-label={lang === 'hi' ? `एक ${item.hi} कम करें` : `Remove one ${item.en}`}
                  onClick={() => setQuantity(product, grams, quantity - 1)}
                  className="flex h-full w-10 items-center justify-center rounded-l-lg hover:bg-[#8C1F16]"
                >
                  <Minus size={16} strokeWidth={2.75} />
                </button>
                <span className="text-[15px] font-bold tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label={lang === 'hi' ? `एक और ${item.hi} जोड़ें` : `Add one more ${item.en}`}
                  onClick={() => setQuantity(product, grams, quantity + 1)}
                  className="flex h-full w-10 items-center justify-center rounded-r-lg hover:bg-[#8C1F16]"
                >
                  <Plus size={16} strokeWidth={2.75} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  add(product, { grams, silent: true })
                  showToast(lang === 'hi' ? `${item.hi} (${kit ? 'किट' : gramsHi(grams)}) थैले में डाल दिया` : `Added ${item.en}${kit ? '' : ` (${gramsLabel(grams)})`}`)
                }}
                aria-label={lang === 'hi' ? `${item.hi}${kit ? '' : ` ${gramsHi(grams)}`} थैले में जोड़ें` : `Add ${item.en}${kit ? '' : `, ${gramsLabel(grams)}`}`}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#A8261C] text-[14.5px] font-bold text-[#A8261C] transition hover:bg-[#A8261C] hover:text-white"
              >
                <Plus size={16} strokeWidth={2.75} />
                {lang === 'hi' ? 'जोड़ें' : 'Add'}
              </button>
            )}
            {kit && (
              <Link href={productHref(product)} className="mt-1.5 flex h-8 items-center justify-center text-[12.5px] font-semibold text-[#4E4237] underline decoration-[#4E4237]/30 underline-offset-2 hover:text-[#A8261C]">
                {lang === 'hi' ? 'अपनी पसंद से बनाएँ' : 'Customise this kit'}
              </Link>
            )}
          </div>
        </div>
      </article>
    </li>
  )
}

/* ───────────────────────── Bill bar ───────────────────────── */

/** A paper "parchi" that appears once something is in the bag. */
export function BillBar() {
  const { lang } = useLang()
  const { count, total } = useCartSummary()
  if (!count) return null
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <>
      <div aria-hidden className="h-28 bg-[#1E1A16]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:pb-5">
        <div className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl bg-[#FFFBF3] shadow-[0_18px_44px_-14px_rgba(30,26,22,0.6)] ring-1 ring-[#1E1A16]/15">
          <div className="h-1 bg-[#E7D3B3]">
            <div className="h-full bg-[#2F5D3A] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-3 p-2.5 pl-4">
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[12.5px] text-[#6B5B4B]">
                {lang === 'hi' ? `आपका थैला · ${count} सामान` : `Your bag · ${count} item${count === 1 ? '' : 's'}`}
              </div>
              <div className="text-[18px] font-bold text-[#1E1A16]">
                {formatPrice(total)}
                <span className="ml-1.5 text-[12px] font-semibold text-[#2F5D3A]">
                  {lang === 'hi' ? `+ ${formatPrice(cashbackOn(total))} कैशबैक` : `+ ${formatPrice(cashbackOn(total))} cashback`}
                </span>
              </div>
              <div className="truncate text-[12px] text-[#4E4237]">
                {remaining > 0
                  ? lang === 'hi'
                    ? `${formatPrice(remaining)} और, फिर डिलीवरी फ्री`
                    : `${formatPrice(remaining)} more for free delivery`
                  : lang === 'hi'
                    ? 'इस ऑर्डर पर डिलीवरी फ्री ✓'
                    : 'Free delivery on this order ✓'}
              </div>
            </div>
            <button
              type="button"
              onClick={openCart}
              className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-[#A8261C] px-4 text-[15px] font-bold text-white transition hover:bg-[#8C1F16]"
            >
              {lang === 'hi' ? 'थैला देखें' : 'View bag'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
