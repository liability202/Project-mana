'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ChevronDown, Leaf, Menu, MessageCircle, Minus, Plus, Search, ShoppingBag, Truck, User, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { cartLineKey, MAX_LINE_QUANTITY } from '@/lib/pricing'
import { matchCatalogProducts } from '@/lib/product-search'
import { calcPrice, FREE_SHIPPING_THRESHOLD, formatPrice, whatsappUrl } from '@/lib/utils'
import { openCart, useCartSummary } from '../_lib/cart'
import { baseGrams, gramsLabel, productHref, weightChoices } from '../_lib/shared'
import { SHELVES, inStockVariants, kitGrams, typeLabel, type ShelfKey, type StoreProduct, type StoreVariant } from './data'

const SERIF = '[font-family:var(--store-serif)]'
const PAGE_SIZE = 8
const SHELF_EVENT = 'mana-store:shelf'

/* ── Cart helpers ─────────────────────────────────────────────────────────── */

function useHydrated() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready
}

/** How many of this exact product / type / pack size are in the cart (0 until the saved cart loads). */
function useLineQuantity(productId: string, variantId: string | undefined, grams: number) {
  const items = useCart(state => state.items)
  const ready = useHydrated()
  if (!ready) return 0
  const key = cartLineKey({ product_id: productId, variant_id: variantId, weight_grams: grams })
  return items.find(item => cartLineKey(item) === key)?.quantity || 0
}

/** One cart line: the chosen type and pack size of a product. The server re-prices it at checkout. */
function useCartLine(product: StoreProduct, variant: StoreVariant | null, grams: number, price: number) {
  const addItem = useCart(state => state.addItem)
  const updateQty = useCart(state => state.updateQty)
  const quantity = useLineQuantity(product.id, variant?.id, grams)
  return {
    quantity,
    add: () =>
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] || '',
        variant_id: variant?.id,
        variant_name: variant?.name,
        weight_grams: grams,
        price,
        quantity: 1,
      }),
    setQuantity: (next: number) => updateQty(product.id, variant?.id, Math.max(0, Math.min(MAX_LINE_QUANTITY, next)), grams),
  }
}

/** What a quick "Add" puts in the cart: the first type in stock, at the usual pack size. */
function quickLine(product: StoreProduct) {
  const variant = inStockVariants(product)[0] || null
  const soldOut = (product.variants || []).length > 0 && !variant
  if (product.shelf === 'kits') return { variant, soldOut, grams: kitGrams(variant), price: variant?.price || product.price, unit: 'kit' }
  const grams = baseGrams(product)
  return { variant, soldOut, grams, price: calcPrice(variant?.price || product.price, grams, grams), unit: gramsLabel(grams) }
}

/* ── Shelves: category links anywhere on the page open a shelf in the shop ── */

export function showShelf(shelf: ShelfKey) {
  window.dispatchEvent(new CustomEvent<ShelfKey>(SHELF_EVENT, { detail: shelf }))
  document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ShelfLink({ shelf, className, children, onNavigate }: { shelf: ShelfKey; className?: string; children: React.ReactNode; onNavigate?: () => void }) {
  return (
    <a
      href="#shop"
      className={className}
      onClick={event => {
        event.preventDefault()
        onNavigate?.()
        showShelf(shelf)
      }}
    >
      {children}
    </a>
  )
}

/* ── Header ───────────────────────────────────────────────────────────────── */

export function StoreHeader({ products, logo }: { products: StoreProduct[]; logo: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7DDCD] bg-[#FBF7F0]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-2 gap-y-2.5 px-4 py-2.5 sm:px-6 lg:flex-nowrap lg:gap-x-10 lg:py-3.5">
        <button
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          aria-expanded={menuOpen}
          aria-controls="store-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[#1D1813] transition hover:bg-[#F1E8DA] lg:hidden"
        >
          {menuOpen ? <X size={22} strokeWidth={1.7} /> : <Menu size={22} strokeWidth={1.7} />}
        </button>

        <Link href="/prototypes/store" className="flex shrink-0 items-center gap-2.5" aria-label="Mana, home">
          {/* The logo file has a white background; multiply lets the cream header show through it. */}
          <Image src={logo} alt="" width={36} height={36} className="h-8 w-8 object-contain mix-blend-multiply sm:h-9 sm:w-9" priority />
          <span className="leading-none">
            <span className={`${SERIF} block text-[23px] tracking-[0.16em] text-[#1D1813] sm:text-[25px]`}>MANA</span>
            <span className="mt-[3px] block text-[7.5px] font-semibold uppercase tracking-[0.3em] text-[#8C6A2B] sm:text-[8px]">The essence of nature</span>
          </span>
        </Link>

        <div className="order-last w-full lg:order-none lg:max-w-[560px] lg:flex-1">
          <SearchBox products={products} />
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Link href="/profile" aria-label="My account" className="hidden h-11 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-[#1D1813] transition hover:bg-[#F1E8DA] sm:inline-flex">
            <User size={21} strokeWidth={1.7} />
            <span className="hidden lg:inline">Account</span>
          </Link>
          <CartButton />
        </div>
      </div>

      {menuOpen && (
        <nav id="store-menu" aria-label="Menu" className="max-h-[calc(100vh-120px)] overflow-y-auto border-t border-[#E7DDCD] bg-[#FBF7F0] lg:hidden">
          <div className="mx-auto max-w-[1240px] px-4 pb-5 pt-3 sm:px-6">
            <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8C6A2B]">Shop</div>
            <ul className="mt-1">
              {SHELVES.map(shelf => (
                <li key={shelf.key} className="border-b border-[#E7DDCD]/70">
                  <ShelfLink shelf={shelf.key} onNavigate={close} className="flex items-center justify-between px-1 py-3.5 text-[16px] font-medium text-[#1D1813]">
                    <span>
                      {shelf.label}
                      <span className="block text-[12.5px] font-normal text-[#756A5C]">{shelf.blurb}</span>
                    </span>
                    <ArrowRight size={17} className="text-[#756A5C]" />
                  </ShelfLink>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[14px] font-medium text-[#1D1813]">
              {[
                { label: 'Gifting & bulk', href: '#gifting' },
                { label: 'Our story', href: '#story' },
                { label: 'Help & FAQ', href: '#faq' },
                { label: 'Track your order', href: '/track-order' },
                { label: 'My account', href: '/profile' },
              ].map(link => (
                <a key={link.label} href={link.href} onClick={close} className="rounded-xl bg-[#F4EDE2] px-3.5 py-3 transition hover:bg-[#EDE3D3]">
                  {link.label}
                </a>
              ))}
              <a href={whatsappUrl('Hi Mana! I need some help.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#191512] px-3.5 py-3 text-[#F6EFE3]">
                <MessageCircle size={16} /> WhatsApp us
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

function CartButton() {
  const { count, total } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative inline-flex h-11 items-center gap-2 rounded-full px-2.5 text-[#1D1813] transition hover:bg-[#F1E8DA] lg:px-3.5"
    >
      <ShoppingBag size={22} strokeWidth={1.7} />
      <span className="hidden text-[14px] font-medium tabular-nums lg:inline">{count > 0 ? formatPrice(total) : 'Cart'}</span>
      {count > 0 && (
        <span className="absolute left-[23px] top-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#191512] px-1 text-[10.5px] font-bold text-[#F6EFE3] ring-2 ring-[#FBF7F0] lg:left-[27px]">
          {count}
        </span>
      )}
    </button>
  )
}

/* ── Search: finds by English or everyday Hindi names, with Add right in the list ── */

const POPULAR = ['Almonds', 'Kaju', 'Makhana', 'Chia seeds', 'Ashwagandha', 'Elaichi']

function SearchBox({ products }: { products: StoreProduct[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const term = query.trim()

  const results = useMemo(
    () => (term.length >= 2 ? (matchCatalogProducts(products, term, 6).map(match => match.product) as StoreProduct[]) : []),
    [products, term]
  )

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [open])

  const seeAll = `/products?q=${encodeURIComponent(term)}`

  return (
    <div ref={box} className="relative">
      <form
        role="search"
        onSubmit={event => {
          event.preventDefault()
          if (term) router.push(seeAll)
        }}
      >
        <label htmlFor="store-search" className="sr-only">
          Search products
        </label>
        <Search size={18} strokeWidth={1.8} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#756A5C]" />
        <input
          ref={input}
          id="store-search"
          type="search"
          value={query}
          autoComplete="off"
          enterKeyHint="search"
          onChange={event => {
            setQuery(event.target.value)
            if (document.activeElement === event.target) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              // Chrome clears a search field on Escape; here Escape just closes the list.
              event.preventDefault()
              setOpen(false)
              input.current?.blur()
            }
          }}
          placeholder="Search almonds, kaju, chia seeds…"
          className="h-11 w-full rounded-full border border-[#E2D6C3] bg-[#FFFFFF] pl-11 pr-4 text-[15px] text-[#1D1813] placeholder:text-[#8F8373] transition focus:border-[#1D1813] focus:outline-none focus:ring-4 focus:ring-[#1D1813]/5"
        />
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#E7DDCD] bg-[#FFFFFF] shadow-[0_20px_50px_rgba(29,24,19,0.16)]">
          {term.length < 2 ? (
            <div className="p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C6A2B]">Popular searches</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR.map(word => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      setQuery(word)
                      input.current?.focus()
                    }}
                    className="rounded-full border border-[#E7DDCD] px-3.5 py-1.5 text-[13px] text-[#1D1813] transition hover:border-[#1D1813]"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length ? (
            <>
              <ul className="max-h-[min(420px,60vh)] divide-y divide-[#F1EADF] overflow-y-auto">
                {results.map(product => (
                  <SearchResult key={product.id} product={product} onPick={() => setOpen(false)} />
                ))}
              </ul>
              <Link href={seeAll} onClick={() => setOpen(false)} className="flex items-center justify-between border-t border-[#E7DDCD] bg-[#FBF7F0] px-4 py-3 text-[13.5px] font-semibold text-[#1D1813] hover:bg-[#F4EDE2]">
                See all results for “{term}” <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <div className="p-4 text-[14px] leading-relaxed text-[#4B4237]">
              Nothing found for “{term}”. Try “badam”, “chia” or “elaichi”, or{' '}
              <a href={whatsappUrl(`Hi Mana! Do you have ${term}?`)} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1D1813] underline underline-offset-2">
                ask us on WhatsApp
              </a>
              .
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SearchResult({ product, onPick }: { product: StoreProduct; onPick: () => void }) {
  const { variant, soldOut, grams, price, unit } = quickLine(product)
  const line = useCartLine(product, variant, grams, price)
  const image = product.images?.[0]

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <Link href={productHref(product)} onClick={onPick} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#EFE6D8]">
          {image ? <Image src={image} alt="" fill sizes="48px" className="object-cover" /> : <Leaf size={18} className="absolute inset-0 m-auto text-[#B8914A]" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-medium text-[#1D1813]">{product.title}</span>
          <span className="block truncate text-[12.5px] text-[#756A5C]">
            {product.sub && product.shelf !== 'kits' ? `${product.sub} · ` : ''}
            {formatPrice(price)} / {unit}
          </span>
        </span>
      </Link>
      {soldOut ? (
        <span className="shrink-0 text-[12px] text-[#756A5C]">Sold out</span>
      ) : line.quantity > 0 ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#2F6B45]">
          <Check size={15} /> In cart
        </span>
      ) : (
        <button type="button" onClick={line.add} aria-label={`Add ${product.title}, ${unit}`} className="h-9 shrink-0 rounded-full border border-[#1D1813] px-4 text-[13px] font-semibold text-[#1D1813] transition hover:bg-[#1D1813] hover:text-[#F6EFE3]">
          Add
        </button>
      )}
    </li>
  )
}

/* ── Shop: shelf tabs and the product grid ───────────────────────────────── */

export function ShopSection({ shelves }: { shelves: { key: ShelfKey; label: string; items: StoreProduct[] }[] }) {
  const [active, setActive] = useState<ShelfKey>(shelves[0]?.key || 'dry-fruits')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const onShelf = (event: Event) => {
      const key = (event as CustomEvent<ShelfKey>).detail
      if (shelves.some(shelf => shelf.key === key)) {
        setActive(key)
        setExpanded(false)
      }
    }
    window.addEventListener(SHELF_EVENT, onShelf)
    return () => window.removeEventListener(SHELF_EVENT, onShelf)
  }, [shelves])

  const shelf = shelves.find(entry => entry.key === active) || shelves[0]
  if (!shelf) return null
  const visible = expanded ? shelf.items : shelf.items.slice(0, PAGE_SIZE)

  return (
    <>
      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {shelves.map(entry => {
          const selected = entry.key === active
          return (
            <button
              key={entry.key}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setActive(entry.key)
                setExpanded(false)
              }}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition ${
                selected ? 'border-[#191512] bg-[#191512] text-[#F6EFE3]' : 'border-[#E2D6C3] bg-[#FFFFFF] text-[#1D1813] hover:border-[#1D1813]'
              }`}
            >
              {entry.label}
              <span className={`text-[12px] tabular-nums ${selected ? 'text-[#F6EFE3]/60' : 'text-[#8F8373]'}`}>{entry.items.length}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
        {visible.map(product =>
          product.shelf === 'kits' ? <KitCard key={product.id} product={product} /> : <ProductCard key={product.id} product={product} />
        )}
      </div>

      {shelf.items.length > PAGE_SIZE && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (expanded) document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              setExpanded(value => !value)
            }}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[#1D1813] px-7 text-[14.5px] font-semibold text-[#1D1813] transition hover:bg-[#1D1813] hover:text-[#F6EFE3]"
          >
            {expanded ? 'Show fewer' : `Show all ${shelf.items.length} ${shelf.label.toLowerCase()}`}
            <ChevronDown size={17} className={`transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </>
  )
}

function CardImage({ product }: { product: StoreProduct }) {
  const image = product.images?.[0]
  return (
    <Link href={productHref(product)} tabIndex={-1} aria-hidden className="relative block aspect-square overflow-hidden rounded-[18px] bg-[#EFE6D8]">
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 768px) 46vw, (max-width: 1024px) 31vw, 290px"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#EADCC6] p-4 text-center">
          <Leaf size={22} className="text-[#B8914A]" />
          <span className={`${SERIF} text-[19px] leading-tight text-[#1D1813]`}>{product.title}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#756A5C]">Photo coming soon</span>
        </span>
      )}
      {product.badge && (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-[#FBF7F0]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1D1813] shadow-sm">
          {product.badge}
        </span>
      )}
    </Link>
  )
}

function CardTitle({ product }: { product: StoreProduct }) {
  return (
    <>
      <Link href={productHref(product)} className="text-[15px] font-semibold leading-snug text-[#1D1813] decoration-[#1D1813]/30 underline-offset-[3px] hover:underline sm:text-[16px]">
        {product.title}
      </Link>
      <div className="mt-0.5 h-[18px] truncate text-[12.5px] text-[#756A5C]">{product.sub}</div>
    </>
  )
}

function BuyButton({ label, quantity, soldOut, href, onAdd, onSet }: { label: string; quantity: number; soldOut: boolean; href: string; onAdd: () => void; onSet: (next: number) => void }) {
  if (soldOut) {
    return (
      <Link href={href} className="flex h-11 w-full items-center justify-center rounded-full border border-[#E2D6C3] text-[13.5px] font-medium text-[#756A5C]">
        Sold out · see options
      </Link>
    )
  }
  if (quantity > 0) {
    return (
      <div className="flex h-11 items-center justify-between rounded-full border-[1.5px] border-[#1D1813] bg-[#FFFFFF] px-1">
        <button type="button" onClick={() => onSet(quantity - 1)} aria-label={`Remove one ${label}`} className="flex h-9 w-9 items-center justify-center rounded-full text-[#1D1813] transition hover:bg-[#F4EDE2]">
          <Minus size={16} strokeWidth={2.2} />
        </button>
        <span className="text-[13.5px] font-semibold tabular-nums text-[#1D1813]" aria-live="polite">
          {quantity} in cart
        </span>
        <button
          type="button"
          onClick={() => onSet(quantity + 1)}
          disabled={quantity >= MAX_LINE_QUANTITY}
          aria-label={`Add one more ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#1D1813] transition hover:bg-[#F4EDE2] disabled:opacity-30"
        >
          <Plus size={16} strokeWidth={2.2} />
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${label} to cart`}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#191512] text-[14px] font-semibold text-[#F6EFE3] transition hover:bg-[#3A3027] active:scale-[0.98]"
    >
      <ShoppingBag size={16} strokeWidth={2} /> Add to cart
    </button>
  )
}

function ProductCard({ product }: { product: StoreProduct }) {
  const types = inStockVariants(product)
  const soldOut = (product.variants || []).length > 0 && types.length === 0
  const base = baseGrams(product)
  const choices = weightChoices(product)
  const [typeId, setTypeId] = useState(types[0]?.id)
  const [grams, setGrams] = useState(base)
  const type = types.find(entry => entry.id === typeId) || types[0] || null
  const price = calcPrice(type?.price || product.price, base, grams)
  const line = useCartLine(product, type, grams, price)

  return (
    <article className="group flex flex-col">
      <CardImage product={product} />
      <div className="flex flex-1 flex-col pt-3.5">
        <CardTitle product={product} />

        {types.length > 1 && (
          <div className="relative mt-3">
            <select
              value={type?.id}
              onChange={event => setTypeId(event.target.value)}
              aria-label={`Type of ${product.title}`}
              className="h-9 w-full cursor-pointer appearance-none truncate rounded-full border border-[#E2D6C3] bg-[#FFFFFF] pl-3.5 pr-8 text-[13px] text-[#1D1813] transition hover:border-[#1D1813]/40 focus:border-[#1D1813] focus:outline-none"
            >
              {types.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {typeLabel(entry.name)} · {formatPrice(calcPrice(entry.price, base, grams))}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#756A5C]" />
          </div>
        )}

        {choices.length > 1 && (
          <div role="radiogroup" aria-label={`Pack size for ${product.title}`} className="mt-2.5 grid grid-cols-3 gap-1.5">
            {choices.map(choice => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={grams === choice}
                onClick={() => setGrams(choice)}
                className={`h-8 rounded-full border text-[12px] font-medium tabular-nums transition ${
                  grams === choice ? 'border-[#1D1813] bg-[#1D1813] text-[#F6EFE3]' : 'border-[#E2D6C3] bg-[#FFFFFF] text-[#4B4237] hover:border-[#1D1813]/40'
                }`}
              >
                {gramsLabel(choice)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-semibold tabular-nums text-[#1D1813]">{formatPrice(price)}</span>
            <span className="text-[12.5px] text-[#756A5C]">/ {gramsLabel(grams)}</span>
          </div>
          <div className="mt-2.5">
            <BuyButton
              label={`${product.title}, ${gramsLabel(grams)}`}
              quantity={line.quantity}
              soldOut={soldOut}
              href={productHref(product)}
              onAdd={line.add}
              onSet={line.setQuantity}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

/** Kits come in sizes (Essential, Signature…); each size is one fixed pack at its list price. */
function KitCard({ product }: { product: StoreProduct }) {
  const sizes = inStockVariants(product)
  const soldOut = (product.variants || []).length > 0 && sizes.length === 0
  const [sizeId, setSizeId] = useState(sizes[0]?.id)
  const size = sizes.find(entry => entry.id === sizeId) || sizes[0] || null
  const grams = kitGrams(size)
  const price = size?.price || product.price
  const line = useCartLine(product, size, grams, price)

  return (
    <article className="group flex flex-col">
      <CardImage product={product} />
      <div className="flex flex-1 flex-col pt-3.5">
        <CardTitle product={product} />

        {sizes.length > 1 && (
          <div role="radiogroup" aria-label={`Kit size for ${product.title}`} className={`mt-3 grid gap-1.5 ${sizes.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {sizes.map(entry => (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={size?.id === entry.id}
                onClick={() => setSizeId(entry.id)}
                className={`h-8 truncate rounded-full border px-1 text-[12px] font-medium transition ${
                  size?.id === entry.id ? 'border-[#1D1813] bg-[#1D1813] text-[#F6EFE3]' : 'border-[#E2D6C3] bg-[#FFFFFF] text-[#4B4237] hover:border-[#1D1813]/40'
                }`}
              >
                {typeLabel(entry.name)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-semibold tabular-nums text-[#1D1813]">{formatPrice(price)}</span>
              <span className="text-[12.5px] text-[#756A5C]">/ kit</span>
            </span>
            <Link href={productHref(product)} className="text-[12.5px] font-medium text-[#1D1813] underline decoration-[#1D1813]/30 underline-offset-[3px] hover:decoration-[#1D1813]">
              What’s inside
            </Link>
          </div>
          <div className="mt-2.5">
            <BuyButton
              label={`${product.title}, ${size ? typeLabel(size.name) : 'kit'}`}
              quantity={line.quantity}
              soldOut={soldOut}
              href={productHref(product)}
              onAdd={line.add}
              onSet={line.setQuantity}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

/* ── Phone basket bar with the free-delivery meter ────────────────────────── */

export function CartBar() {
  const { count, total } = useCartSummary()
  if (!count) return null
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <>
      <div aria-hidden className="h-24 bg-[#191512] lg:hidden" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl bg-[#191512] text-[#F6EFE3] shadow-[0_16px_40px_rgba(25,21,18,0.35)] ring-1 ring-[#F6EFE3]/10">
          <div className="px-4 pt-2.5">
            <div className="flex items-center gap-1.5 text-[12px]">
              <Truck size={14} className="text-[#D9B872]" />
              {remaining > 0 ? (
                <span>
                  Add <b className="font-semibold">{formatPrice(remaining)}</b> more for free delivery
                </span>
              ) : (
                <span>
                  <b className="font-semibold">Free delivery</b> unlocked
                </span>
              )}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#F6EFE3]/15">
              <div className="h-full rounded-full bg-[#D9B872] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button type="button" onClick={openCart} className="flex w-full items-center justify-between px-4 py-3">
            <span className="text-[14px]">
              <b className="font-semibold">{count}</b> item{count === 1 ? '' : 's'} · <b className="font-semibold tabular-nums">{formatPrice(total)}</b>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold">
              View cart <ArrowRight size={16} />
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
