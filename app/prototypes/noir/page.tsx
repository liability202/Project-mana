import Image from 'next/image'
import Link from 'next/link'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import { ArrowRight, Banknote, BadgePercent, Leaf, MessageCircle, PackageCheck, Search, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'
import { formatPrice, whatsappUrl } from '@/lib/utils'
import {
  BRAND,
  cardPrice,
  displayName,
  fromPrice,
  getCatalog,
  getPublicReviews,
  kitBenefits,
  kitInsideLine,
  productHref,
  productLabels,
  reviewerName,
  type CatalogProduct,
} from '../_lib/catalog'
import { NoirAddButton, NoirCartButton } from './client'

/*
 * Prototype A — "Noir & Gold".
 * Built around the packaging: black pouches, gold type, warm studio light.
 * Palette: bg #0C0A08 · card #1B1712 · text #F3ECDF · muted #B3A68D ·
 *          gold #D6B26C / #EBD29C · cream #F5EFE4 · ink #1C1712
 */

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'], variable: '--noir-display' })
const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--noir-body' })

export const revalidate = 300

const serif = '[font-family:var(--noir-display)]'

const NAV = [
  { label: 'Dry Fruits', href: '/products?category=dry-fruits' },
  { label: 'Herbs', href: '/products?category=herbs' },
  { label: 'Spices', href: '/products?category=spices' },
  { label: 'Health Kits', href: '/kits' },
  { label: 'Our Story', href: '/about' },
]

export default async function NoirPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 3)
  const featured = catalog.bestsellers[0]

  const categories = [
    { slug: 'dry-fruits', title: 'Dry Fruits', line: 'Cashews, kagzi walnuts, makhana, figs & dates', count: catalog.dryFruits.length },
    { slug: 'herbs', title: 'Ayurvedic Herbs', line: 'Moringa, triphala, neem, safed musli & more', count: catalog.herbs.length },
    { slug: 'spices', title: 'Whole Spices', line: '9mm cardamom, cloves, javitri, black pepper', count: catalog.spices.length },
  ]

  return (
    <div className={`${display.variable} ${body.variable} min-h-screen bg-[#0C0A08] text-[#F3ECDF] antialiased [font-family:var(--noir-body)]`}>
      {/* Announcement */}
      <div className="border-b border-[#D6B26C]/15 bg-[#0C0A08] px-4 py-2 text-center text-[11px] font-medium tracking-[0.12em] text-[#D6B26C] sm:text-xs">
        FREE DELIVERY ABOVE ₹999 <span className="mx-2 text-[#D6B26C]/40">·</span> CASH ON DELIVERY <span className="mx-2 hidden text-[#D6B26C]/40 sm:inline">·</span>
        <span className="hidden sm:inline">5% CASHBACK ON EVERY ORDER</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0C0A08]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/prototypes/noir" className="flex items-center">
            <span className="leading-none">
              <span className={`${serif} block text-2xl font-semibold tracking-[0.18em] text-[#F3ECDF]`}>MANA</span>
              <span className="block text-[8px] tracking-[0.32em] text-[#B3A68D]">THE ESSENCE OF NATURE</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map(item => (
              <Link key={item.label} href={item.href} className="text-sm text-[#B3A68D] transition hover:text-[#EBD29C]">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/products" aria-label="Search products" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#F3ECDF] transition hover:bg-white/5">
              <Search size={19} />
            </Link>
            <a href={whatsappUrl('Hi Mana! I would like some help choosing products.')} target="_blank" rel="noopener noreferrer" className="hidden h-9 items-center gap-2 rounded-full border border-[#D6B26C]/40 px-4 text-xs font-semibold text-[#EBD29C] transition hover:border-[#D6B26C] sm:inline-flex">
              <MessageCircle size={14} /> Chat to order
            </a>
            <NoirCartButton />
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm text-[#B3A68D] lg:hidden [scrollbar-width:none]">
          {NAV.map(item => (
            <Link key={item.label} href={item.href} className="shrink-0 transition hover:text-[#EBD29C]">{item.label}</Link>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image src={BRAND.hero} alt="Dry fruits, herbs and spices in brass bowls" fill priority sizes="100vw" className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A08] via-[#0C0A08]/85 to-[#0C0A08]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A08] via-transparent to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:pb-20 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D6B26C]/30 bg-black/30 px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-[#D6B26C] backdrop-blur">
              <Sparkles size={12} /> PURE · NATURAL · HANDPICKED
            </div>
            <h1 className={`${serif} text-[2.75rem] font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl`}>
              Nature&apos;s finest,
              <br />
              <em className="font-medium text-[#EBD29C]">packed fresh</em> for you.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#B3A68D] sm:text-lg">
              Handpicked cashews, kagzi walnuts, superfood seeds and Ayurvedic herbs — packed fresh in our signature pouch when you order.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#bestsellers" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#D6B26C] px-7 text-sm font-semibold text-[#0C0A08] transition hover:bg-[#EBD29C]">
                Shop bestsellers <ArrowRight size={16} />
              </Link>
              <Link href="/kits" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#F3ECDF]/25 px-7 text-sm font-semibold text-[#F3ECDF] transition hover:border-[#F3ECDF]/60">
                Explore health kits
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#B3A68D]">
              <span className="inline-flex items-center gap-1.5"><PackageCheck size={14} className="text-[#D6B26C]" /> Packed fresh to order</span>
              <span className="inline-flex items-center gap-1.5"><Banknote size={14} className="text-[#D6B26C]" /> Cash on delivery</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={14} className="text-[#D6B26C]" /> Free delivery above ₹999</span>
            </div>
          </div>

          {featured && (
            <div className="hidden lg:block">
              <div className="ml-auto max-w-sm rounded-3xl border border-[#D6B26C]/20 bg-[#14110D]/80 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-[#D6B26C]">TODAY&apos;S PICK</span>
                  <span className="text-[11px] text-[#B3A68D]">Bestseller</span>
                </div>
                <Link href={productHref(featured)} className="relative block aspect-square overflow-hidden rounded-2xl bg-black">
                  {featured.images?.[0] && <Image src={featured.images[0]} alt={featured.name} fill sizes="384px" className="object-cover" />}
                </Link>
                <div className="px-1 pt-4">
                  <div className={`${serif} text-2xl`}>{displayName(featured.name)}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-[#D6B26C]">{formatPrice(cardPrice(featured).price)}</span>
                    <span className="text-xs text-[#B3A68D]">/ {cardPrice(featured).unit}</span>
                  </div>
                  <div className="mt-4"><NoirAddButton product={featured} wide /></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-white/5 bg-[#14110D]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
          {[
            { icon: PackageCheck, title: 'Packed fresh', text: 'Sealed in our signature pouch when you order' },
            { icon: Truck, title: 'Free delivery', text: 'On every order above ₹999' },
            { icon: Banknote, title: 'Cash on delivery', text: 'Pay when it reaches you' },
            { icon: BadgePercent, title: '5% cashback', text: 'Back in your wallet after delivery' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 py-6 lg:justify-center">
              <Icon size={22} className="mt-0.5 shrink-0 text-[#D6B26C]" />
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-[#B3A68D]">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section id="bestsellers" className="scroll-mt-24 bg-[#F5EFE4] px-4 py-20 text-[#1C1712] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold tracking-[0.22em] text-[#9A7A3D]">MOST LOVED</div>
              <h2 className={`${serif} mt-2 text-4xl font-medium sm:text-5xl`}>Our bestsellers</h2>
            </div>
            <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C1712] underline-offset-4 hover:underline">
              Shop all {catalog.count} products <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {catalog.bestsellers.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold tracking-[0.22em] text-[#D6B26C]">SHOP BY CATEGORY</div>
            <h2 className={`${serif} mt-2 text-4xl font-medium sm:text-5xl`}>From farm to your kitchen</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {categories.map(category => (
              <Link key={category.slug} href={`/products?category=${category.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl md:aspect-[3/4]">
                {BRAND.categories[category.slug] && (
                  <Image src={BRAND.categories[category.slug]} alt={category.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="text-[11px] font-semibold tracking-[0.2em] text-[#D6B26C]">{category.count} PRODUCTS</div>
                  <div className={`${serif} mt-1 text-3xl font-medium`}>{category.title}</div>
                  <div className="mt-1 text-sm text-[#B3A68D]">{category.line}</div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#EBD29C]">
                    Explore <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Health kits */}
      {catalog.kits.length > 0 && (
        <section className="border-t border-white/5 bg-[#14110D] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <div className="text-[11px] font-bold tracking-[0.22em] text-[#D6B26C]">CURATED FOR A GOAL</div>
                <h2 className={`${serif} mt-2 text-4xl font-medium sm:text-5xl`}>Health kits, made your way</h2>
                <p className="mt-3 text-[#B3A68D]">Pick a kit, then choose every ingredient and quantity. A thoughtful gift for family, too.</p>
              </div>
              <Link href="/kits" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#EBD29C]">
                All kits <ArrowRight size={15} />
              </Link>
            </div>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {catalog.kits.slice(0, 3).map(kit => (
                <Link key={kit.id} href={productHref(kit)} className="group w-[80%] shrink-0 snap-start overflow-hidden rounded-3xl border border-[#D6B26C]/15 bg-[#1B1712] transition hover:border-[#D6B26C]/50 sm:w-auto">
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    {kit.images?.[0] && <Image src={kit.images[0]} alt={kit.name} fill sizes="(max-width: 640px) 80vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                  </div>
                  <div className="p-6">
                    <div className={`${serif} text-2xl`}>{displayName(kit.name)}</div>
                    <ul className="mt-3 space-y-1.5">
                      {(kitBenefits(kit, 2).length ? kitBenefits(kit, 2) : kitInsideLine(kit, 3) ? [`With ${kitInsideLine(kit, 3)}`] : []).map(benefit => (
                        <li key={benefit} className="flex gap-2 text-sm leading-snug text-[#B3A68D]">
                          <Leaf size={14} className="mt-0.5 shrink-0 text-[#D6B26C]" /> {benefit}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm text-[#B3A68D]">from <span className="text-lg font-semibold text-[#D6B26C]">{formatPrice(fromPrice(kit))}</span></span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#EBD29C]">Customise <ArrowRight size={14} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promise */}
      <section className="bg-[#F5EFE4] px-4 py-20 text-[#1C1712] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="text-[11px] font-bold tracking-[0.22em] text-[#9A7A3D]">THE MANA PROMISE</div>
            <h2 className={`${serif} mt-2 text-4xl font-medium sm:text-5xl`}>Quality you can taste</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { n: '01', icon: Leaf, title: 'Sourced at origin', text: 'Soft-shell kagzi walnuts, 9mm bold cardamom, handpicked cashews — sourced directly from growers we have known for decades.' },
              { n: '02', icon: PackageCheck, title: 'Packed fresh to order', text: 'We seal your order in our signature pouch when you buy, so it reaches you crisp and aromatic.' },
              { n: '03', icon: ShieldCheck, title: 'Checked for quality', text: 'Every batch is quality checked before it is dispatched to your door.' },
            ].map(({ n, icon: Icon, title, text }) => (
              <div key={n} className="rounded-3xl bg-white/60 p-8 ring-1 ring-[#1C1712]/5">
                <div className="flex items-center justify-between">
                  <Icon size={26} className="text-[#9A7A3D]" />
                  <span className={`${serif} text-3xl text-[#1C1712]/20`}>{n}</span>
                </div>
                <div className={`${serif} mt-6 text-2xl font-semibold`}>{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-[#6B5F4B]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews (real, approved reviews only) */}
      {reviews.length > 0 && (
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <div className="text-[11px] font-bold tracking-[0.22em] text-[#D6B26C]">VERIFIED BUYERS</div>
              <h2 className={`${serif} mt-2 text-4xl font-medium sm:text-5xl`}>Kind words</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.map(review => (
                <figure key={review.id} className="rounded-3xl border border-white/5 bg-[#14110D] p-7">
                  <div className="flex gap-0.5 text-[#D6B26C]">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  {review.title && <div className={`${serif} mt-4 text-xl`}>{review.title}</div>}
                  <blockquote className="mt-2 text-sm leading-relaxed text-[#B3A68D]">&ldquo;{review.body}&rdquo;</blockquote>
                  <figcaption className="mt-5 text-xs text-[#B3A68D]">
                    <span className="font-semibold text-[#F3ECDF]">{reviewerName(review.customer_name)}</span>
                    {review.product_name && <> · {review.product_name}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp help */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl border border-[#D6B26C]/25 bg-gradient-to-r from-[#1B1712] to-[#14110D] p-8 sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className={`${serif} text-3xl font-medium sm:text-4xl`}>Not sure what to pick?</h2>
            <p className="mt-2 text-[#B3A68D]">Message us on WhatsApp — we&apos;ll help you choose, and you can order right in the chat.</p>
          </div>
          <a href={whatsappUrl('Hi Mana! Can you help me choose?')} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#D6B26C] px-7 text-sm font-semibold text-[#0C0A08] transition hover:bg-[#EBD29C]">
            <MessageCircle size={17} /> Chat on WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { price, unit } = cardPrice(product)
  const [label] = productLabels(product, 1)
  return (
    <article className="group flex flex-col rounded-2xl bg-[#1C1712] p-2 shadow-[0_10px_30px_rgba(28,23,18,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,23,18,0.28)] sm:p-2.5">
      <Link href={productHref(product)} className="relative block aspect-square overflow-hidden rounded-xl bg-black">
        {product.images?.[0] && (
          <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
        )}
        {label && (
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#EBD29C] backdrop-blur sm:text-[10px]">
            {label}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3 text-[#F3ECDF]">
        <Link href={productHref(product)} className={`${serif} text-lg leading-tight transition hover:text-[#EBD29C] sm:text-xl`}>
          {displayName(product.name)}
        </Link>
        <div className="mt-1 text-xs text-[#B3A68D]">{unit}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-base font-semibold text-[#D6B26C]">{formatPrice(price)}</span>
          <NoirAddButton product={product} />
        </div>
      </div>
    </article>
  )
}

function Footer() {
  const columns = [
    { title: 'Shop', links: [['Dry Fruits', '/products?category=dry-fruits'], ['Herbs', '/products?category=herbs'], ['Spices', '/products?category=spices'], ['Health Kits', '/kits']] },
    { title: 'Help', links: [['Track your order', '/track-order'], ['FAQs', '/faq'], ['Returns & refunds', '/faq#returns-refunds'], ['Book a video call', '/appointment']] },
    { title: 'Mana', links: [['Our story', '/about'], ['Blog', '/blog'], ['My account', '/profile'], ['Become a creator', '/creator']] },
  ]
  return (
    <footer className="border-t border-white/5 bg-[#080706] px-4 pb-10 pt-16 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className={`${serif} text-3xl font-semibold tracking-[0.18em]`}>MANA</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#B3A68D]">
            Premium dry fruits, Ayurvedic herbs and whole spices — packed fresh to order and delivered across India.
          </p>
          <div className="mt-5 text-xs text-[#B3A68D]">Secure payments by Razorpay · UPI · Cards · Cash on delivery</div>
        </div>
        {columns.map(column => (
          <div key={column.title}>
            <div className="text-[11px] font-bold tracking-[0.22em] text-[#D6B26C]">{column.title.toUpperCase()}</div>
            <ul className="mt-4 space-y-2.5">
              {column.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-[#B3A68D] transition hover:text-[#F3ECDF]">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-7xl border-t border-white/5 pt-6 text-xs text-[#B3A68D]/70">
        © {new Date().getFullYear()} Mana — The Essence of Nature
      </div>
    </footer>
  )
}
