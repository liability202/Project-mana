import Image from 'next/image'
import Link from 'next/link'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ArrowRight, BadgePercent, Banknote, ChevronRight, MessageCircle, PackageCheck, Search, Star, Truck, User } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { formatPrice, whatsappUrl } from '@/lib/utils'
import {
  BRAND,
  cardLabels,
  cardPrice,
  displayName,
  fromPrice,
  getCatalog,
  getPublicReviews,
  kitBenefits,
  kitInsideLine,
  lean,
  productHref,
  reviewerName,
} from '../_lib/catalog'
import { MarketCard, MarketCartBar, MarketCartPill } from './client'

/*
 * Prototype B — "Market".
 * Bright, fast, quick-commerce feel: search first, pack-size chips,
 * ADD → quantity stepper, and a live free-delivery meter.
 * Palette: white · soft #F6F5F1 · green #0F7A47 / #0B5E37 · mint #E7F6EC ·
 *          saffron #F59E0B / #FEF3C7 · ink #1A1A1A · muted #6B6B6B · line #ECEAE4
 */

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--market-font' })

export const revalidate = 300

export default async function MarketPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 3)

  const bestsellers = catalog.pick(['almond', 'cashew', 'pista', 'walnut kernel', 'makhana', 'anjeer', 'munnaka', 'blue berry', 'dates', 'kagzi']).slice(0, 10)
  const seeds = catalog.pick(['chia', 'flex', 'pumpkin', 'sunflower', 'sabja', 'muskmelon', 'seeds n nuts', 'protien beans', 'muesli', 'craneberry']).slice(0, 10)
  const herbs = catalog
    .pick(['moringa', 'ashwagandha', 'triphala', 'kasturi', 'arjun', 'mulethi', 'amla', 'black pepper', 'hibiscus', 'shikakai', 'neem', 'bhrami'])
    .filter(product => cardPrice(product).price < 20000)
    .slice(0, 10)

  const lowestKit = Math.min(...catalog.kits.map(fromPrice))
  const lowestHerb = Math.min(...catalog.herbs.map(product => cardPrice(product).price))
  const moreCount = Math.floor((catalog.count - catalog.kits.length - 3) / 10) * 10
  const image = (keyword: string) => catalog.pick([keyword])[0]?.images?.[0]

  const chips = [
    { label: 'Dry Fruits', href: '/products?category=dry-fruits', image: BRAND.categories['dry-fruits'] },
    { label: 'Seeds', href: '/products?q=seeds', image: image('chia') },
    { label: 'Herbs', href: '/products?category=herbs', image: BRAND.categories.herbs },
    { label: 'Spices', href: '/products?category=spices', image: BRAND.categories.spices },
    { label: 'Health Kits', href: '/kits', image: catalog.kits[0]?.images?.[0] },
    { label: 'Hair Care', href: '/products?tag=hair%20care', image: image('hair care kit') || image('hibiscus') },
    { label: 'Bestsellers', href: '/products?tag=bestseller', image: image('cashew') },
    { label: 'Dates', href: '/products?q=dates', image: image('dates') },
  ]

  return (
    <div className={`${font.variable} min-h-screen bg-white text-[#1A1A1A] antialiased [font-family:var(--market-font)]`}>
      {/* Offer strip */}
      <div className="bg-[#0F7A47] px-4 py-2 text-center text-[11px] font-semibold text-white sm:text-xs">
        Free delivery above ₹999 <span className="mx-1.5 opacity-50">•</span> Cash on delivery <span className="mx-1.5 hidden opacity-50 sm:inline">•</span>
        <span className="hidden sm:inline">5% cashback on every order</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#ECEAE4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <Link href="/prototypes/market" className="flex shrink-0 items-center gap-2">
            <Image src={BRAND.logo} alt="" width={40} height={40} className="h-9 w-9 object-contain" />
            <span className="leading-none">
              <span className="block text-xl font-extrabold tracking-tight text-[#0F7A47]">mana</span>
              <span className="hidden text-[10px] font-semibold text-[#6B6B6B] sm:block">dry fruits · herbs · spices</span>
            </span>
          </Link>
          <form action="/products" className="relative hidden flex-1 md:block">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="search"
              name="q"
              placeholder='Search "cashew", "chia seeds", "moringa"…'
              aria-label="Search products"
              className="h-11 w-full rounded-xl border border-[#ECEAE4] bg-[#F6F5F1] pl-11 pr-4 text-sm outline-none transition placeholder:text-[#6B6B6B]/80 focus:border-[#0F7A47] focus:bg-white"
            />
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-2 md:ml-0">
            <a href={whatsappUrl('Hi Mana! I would like to place an order.')} target="_blank" rel="noopener noreferrer" aria-label="Order on WhatsApp" className="inline-flex h-11 items-center gap-2 rounded-xl px-2.5 text-sm font-bold text-[#0F7A47] transition hover:bg-[#E7F6EC] lg:px-3.5">
              <MessageCircle size={19} /> <span className="hidden lg:inline">WhatsApp</span>
            </a>
            <Link href="/profile" aria-label="My account" className="hidden h-11 items-center gap-2 rounded-xl px-2.5 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#F6F5F1] sm:inline-flex lg:px-3.5">
              <User size={19} /> <span className="hidden lg:inline">Account</span>
            </Link>
            <MarketCartPill />
          </div>
        </div>
        <form action="/products" className="relative px-4 pb-3 md:hidden">
          <Search size={17} className="pointer-events-none absolute left-7 top-[1.35rem] -translate-y-1/2 text-[#6B6B6B]" />
          <input
            type="search"
            name="q"
            placeholder='Search "almonds", "makhana"…'
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-[#ECEAE4] bg-[#F6F5F1] pl-10 pr-4 text-sm outline-none focus:border-[#0F7A47] focus:bg-white"
          />
        </form>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero banners */}
        <section className="grid gap-3 pt-4 sm:gap-4 sm:pt-6 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl bg-[#0B5E37] lg:col-span-2">
            <Image src={BRAND.hero} alt="Dry fruits, herbs and spices in brass bowls" fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover object-right opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B5E37] via-[#0B5E37]/90 to-[#0B5E37]/10" />
            <div className="relative max-w-lg px-6 py-9 text-white sm:px-10 sm:py-14">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                <PackageCheck size={13} /> Packed fresh, the day you order
              </span>
              <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
                Dry fruits &amp; superfoods, <span className="text-[#FCD34D]">delivered fresh</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Handpicked cashews, kagzi walnuts, makhana and {moreCount}+ more — plus Ayurvedic herbs and build-your-own health kits.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="#bestsellers" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-extrabold text-[#0B5E37] transition hover:bg-[#FEF3C7]">
                  Shop bestsellers <ArrowRight size={16} />
                </Link>
                <a href={whatsappUrl('Hi Mana! I would like to place an order.')} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/30 px-5 text-sm font-bold text-white transition hover:bg-white/10">
                  <MessageCircle size={16} /> Order on WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
            <Link href="/kits" className="group relative flex min-h-[170px] overflow-hidden rounded-3xl bg-[#FEF3C7] p-5 sm:p-6">
              <div className="relative z-10 max-w-[62%] sm:max-w-[52%]">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#B45309]">Health kits</div>
                <div className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">from {formatPrice(lowestKit)}</div>
                <div className="mt-1 hidden text-xs text-[#6B6B6B] sm:block">Seeds, sugar care, hair care & more — you pick the mix.</div>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#B45309]">
                  Build a kit <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
              {catalog.kits[0]?.images?.[0] && (
                <div className="absolute -bottom-3 -right-3 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl shadow-lg sm:h-[75%] sm:w-[42%]">
                  <Image src={catalog.kits[0].images[0]} alt="" fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
              )}
            </Link>
            <Link href="/products?category=herbs" className="group relative flex min-h-[170px] overflow-hidden rounded-3xl bg-[#E7F6EC] p-5 sm:p-6">
              <div className="relative z-10 max-w-[62%] sm:max-w-[52%]">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#0B5E37]">Ayurvedic herbs</div>
                <div className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">from {formatPrice(lowestHerb)}</div>
                <div className="mt-1 hidden text-xs text-[#6B6B6B] sm:block">{catalog.herbs.length} herbs &amp; powders — moringa, triphala, ashwagandha…</div>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#0B5E37]">
                  Shop herbs <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="absolute -bottom-3 -right-3 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl shadow-lg sm:h-[75%] sm:w-[42%]">
                <Image src={BRAND.categories.herbs} alt="" fill sizes="200px" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
            </Link>
          </div>
        </section>

        {/* Category chips */}
        <section className="pt-8" aria-label="Shop by category">
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:gap-6 lg:mx-0 lg:justify-between lg:px-0">
            {chips.map(chip => (
              <Link key={chip.label} href={chip.href} className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center sm:w-[84px]">
                <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-2xl bg-[#F6F5F1] ring-1 ring-[#ECEAE4] transition group-hover:ring-2 group-hover:ring-[#0F7A47] sm:h-20 sm:w-20">
                  {chip.image && <Image src={chip.image} alt="" fill sizes="80px" className="object-cover" />}
                </span>
                <span className="text-xs font-bold leading-tight">{chip.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bestsellers */}
        <section id="bestsellers" className="scroll-mt-28 pt-10">
          <RowHeader title="Bestsellers" sub="Our most re-ordered dry fruits" href="/products?category=dry-fruits" />
          <ProductRow products={bestsellers} priority />
        </section>

        {/* Delivery promise */}
        <section className="pt-10">
          <div className="grid gap-3 rounded-3xl bg-[#F6F5F1] p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            {[
              { icon: Truck, title: 'Free delivery above ₹999', text: 'Below that: ₹39 in Delhi NCR, ₹59 elsewhere' },
              { icon: Banknote, title: 'Cash on delivery', text: 'Or pay by UPI & cards via Razorpay' },
              { icon: BadgePercent, title: '5% cashback', text: 'Credited to your wallet after delivery' },
              { icon: PackageCheck, title: 'Packed fresh to order', text: 'Sealed in our signature pouch when you order' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F6EC] text-[#0F7A47]">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-sm font-extrabold">{title}</span>
                  <span className="block text-xs text-[#6B6B6B]">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Seeds */}
        <section className="pt-10">
          <RowHeader title="Seeds & superfoods" sub="Chia, flax, pumpkin, mixes & more" href="/products?q=seeds" />
          <ProductRow products={seeds} />
        </section>

        {/* Kits */}
        {catalog.kits.length > 0 && (
          <section className="pt-10">
            <RowHeader title="Health kits" sub="Choose the ingredients and quantities — we pack it fresh" href="/kits" cta="All kits" />
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
              {catalog.kits.map(kit => {
                const sizes = (kit.variants || []).filter((variant: { price?: number }) => Number(variant?.price) > 0)
                return (
                  <Link key={kit.id} href={productHref(kit)} className="group flex w-[70%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#ECEAE4] bg-white transition hover:border-[#0F7A47]/30 hover:shadow-[0_10px_28px_rgba(15,122,71,0.10)] sm:w-[42%] md:w-[30%] lg:w-auto">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F5F1]">
                      {kit.images?.[0] && <Image src={kit.images[0]} alt={displayName(kit.name)} fill sizes="(max-width: 1024px) 70vw, 20vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="flex flex-1 flex-col p-3.5">
                      <div className="text-sm font-extrabold leading-snug">{displayName(kit.name)}</div>
                      {(kitInsideLine(kit) || kitBenefits(kit, 1)[0]) && (
                        <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#6B6B6B]">
                          {kitInsideLine(kit) ? `Inside: ${kitInsideLine(kit)}` : kitBenefits(kit, 1)[0]}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {sizes.map((variant: { id: string; name: string; price: number }) => (
                          <span key={variant.id} className="rounded-md bg-[#F6F5F1] px-1.5 py-0.5 text-[10px] font-bold text-[#1A1A1A]">
                            {variant.name} {formatPrice(variant.price)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="text-xs text-[#6B6B6B]">from <span className="text-[15px] font-extrabold text-[#1A1A1A]">{formatPrice(fromPrice(kit))}</span></span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-[#0F7A47]">Build <ChevronRight size={14} /></span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Herbs under ₹200 */}
        {herbs.length > 0 && (
          <section className="pt-10">
            <RowHeader title="Herbs & spices under ₹200" sub="Ayurvedic staples for your daily routine" href="/products?category=herbs" />
            <ProductRow products={herbs} />
          </section>
        )}

        {/* Reviews (real, approved reviews only) */}
        {reviews.length > 0 && (
          <section className="pt-12">
            <RowHeader title="What customers say" sub="Verified reviews from Mana buyers" />
            <div className={`grid gap-3 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2' : 'max-w-xl'}`}>
              {reviews.map(review => (
                <figure key={review.id} className="rounded-2xl border border-[#ECEAE4] p-5">
                  <div className="flex gap-0.5 text-[#F59E0B]">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  {review.title && <div className="mt-3 text-sm font-extrabold">{review.title}</div>}
                  <blockquote className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">&ldquo;{review.body}&rdquo;</blockquote>
                  <figcaption className="mt-3 text-xs text-[#6B6B6B]">
                    <span className="font-bold text-[#1A1A1A]">{reviewerName(review.customer_name)}</span>
                    {review.product_name && <> · {review.product_name}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* WhatsApp band */}
        <section className="py-12">
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-[#1A1A1A] p-6 text-white sm:p-8 md:flex-row md:items-center">
            <div>
              <div className="text-xl font-extrabold sm:text-2xl">Prefer to order on WhatsApp?</div>
              <p className="mt-1 text-sm text-white/70">Send us your list — we&apos;ll confirm prices, pack it fresh and deliver. Cash on delivery available.</p>
            </div>
            <a href={whatsappUrl('Hi Mana! I would like to place an order.')} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#25D366] px-6 text-sm font-extrabold text-[#0B3B22] transition hover:brightness-95">
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
      <MarketCartBar />
    </div>
  )
}

function RowHeader({ title, sub, href, cta = 'See all' }: { title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-[#6B6B6B] sm:text-sm">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-extrabold text-[#0F7A47] hover:underline">
          {cta} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

/** Horizontal swipe row on phones; a tidy grid (complete rows only) from tablet up. */
function ProductRow({ products, priority = false }: { products: Product[]; priority?: boolean }) {
  const fullRowsAtFour = Math.floor(products.length / 4) * 4
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5">
      {products.map((product, index) => {
        const { badge, tag } = cardLabels(product)
        return (
          <div key={product.id} className={`w-[46%] shrink-0 snap-start sm:w-[31%] md:w-auto ${index >= fullRowsAtFour ? 'md:max-lg:hidden' : ''}`}>
            <MarketCard product={lean(product)} badge={badge} tag={tag} priority={priority && index < 4} />
          </div>
        )
      })}
    </div>
  )
}

function Footer() {
  const columns = [
    { title: 'Shop', links: [['Dry Fruits', '/products?category=dry-fruits'], ['Herbs', '/products?category=herbs'], ['Spices', '/products?category=spices'], ['Health Kits', '/kits']] },
    { title: 'Help', links: [['Track your order', '/track-order'], ['FAQs', '/faq'], ['Returns & refunds', '/faq#returns-refunds'], ['Book a video call', '/appointment']] },
    { title: 'Mana', links: [['Our story', '/about'], ['Blog', '/blog'], ['My account', '/profile'], ['Become a creator', '/creator']] },
  ]
  return (
    <footer className="border-t border-[#ECEAE4] bg-[#F6F5F1] px-4 pb-10 pt-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="" width={36} height={36} className="h-9 w-9 object-contain mix-blend-multiply" />
            <span className="text-xl font-extrabold text-[#0F7A47]">mana</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6B6B6B]">
            Premium dry fruits, Ayurvedic herbs and whole spices — packed fresh to order and delivered across India.
          </p>
          <div className="mt-4 text-xs text-[#6B6B6B]">Secure payments by Razorpay · UPI · Cards · Cash on delivery</div>
        </div>
        {columns.map(column => (
          <div key={column.title}>
            <div className="text-sm font-extrabold">{column.title}</div>
            <ul className="mt-3 space-y-2">
              {column.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-[#6B6B6B] transition hover:text-[#0F7A47]">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-[#ECEAE4] pt-5 text-xs text-[#6B6B6B]">
        © {new Date().getFullYear()} Mana — The Essence of Nature
      </div>
    </footer>
  )
}
