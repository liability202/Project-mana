import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Nunito } from 'next/font/google'
import { ArrowRight, BadgePercent, Banknote, FlaskConical, MessageCircle, MessagesSquare, PackageCheck, Search, ShoppingBasket, Star, Truck, User, Video } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { whatsappUrl } from '@/lib/utils'
import { BRAND, getCatalog, getPublicReviews, lean, reviewerName } from '../_lib/catalog'
import { productHref } from '../_lib/shared'
import { AskBasket, AskCartButton, AskChat, AskMobileBar, AskProductCard } from './client'
import { ALL_KEYWORDS, type GuideData } from './data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Ask Mana · Mana prototype' }

const font = Nunito({ subsets: ['latin'], display: 'swap', variable: '--ask-font' })

const MOTION_CSS = `
@keyframes ask-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
.ask-in { animation: ask-in .32s ease-out both }
@media (prefers-reduced-motion: reduce) { .ask-in { animation: none } }
`

const HELLO = 'Hi Mana! I need some help choosing.'

export default async function AskManaPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)

  // Resolve every keyword the script uses to a real, photographed product.
  const ids: Record<string, string> = {}
  for (const keyword of ALL_KEYWORDS) {
    const found = catalog.pick([keyword])[0]
    if (found) ids[keyword] = found.id
  }
  const products: Record<string, Product> = {}
  for (const product of catalog.all) products[product.id] = lean(product)
  const guide: GuideData = { products, ids, bestsellers: catalog.bestsellers.map(product => product.id) }

  const bySlug = new Map(catalog.all.map(product => [product.slug, product]))
  const reviewedHref = (slug: string) => {
    const product = bySlug.get(slug)
    return product ? productHref(product) : `/products/${slug}`
  }

  const kitImage = catalog.kits.find(kit => kit.images?.[0])?.images[0]
  const categories = [
    { title: 'Dry fruits & seeds', line: 'Cashews, almonds, makhana, chia', href: '/products?category=dry-fruits', image: BRAND.categories['dry-fruits'], count: catalog.dryFruits.length },
    { title: 'Ayurvedic herbs', line: 'Moringa, triphala, ashwagandha', href: '/products?category=herbs', image: BRAND.categories.herbs, count: catalog.herbs.length },
    { title: 'Whole spices', line: 'Cardamom, cloves, javitri', href: '/products?category=spices', image: BRAND.categories.spices, count: catalog.spices.length },
    { title: 'Health kits', line: 'Pick powder or whole, set quantities', href: '/kits', image: kitImage || BRAND.categories.pansari, count: catalog.kits.length },
  ]

  return (
    <div className={`${font.variable} min-h-screen bg-[#FAF6EF] text-[#1F2A2B] antialiased [font-family:var(--ask-font)]`}>
      <style dangerouslySetInnerHTML={{ __html: MOTION_CSS }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#0F5257]/10 bg-[#FAF6EF]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:px-6">
          <Link href="/prototypes/ask" className="flex shrink-0 items-center gap-2.5" aria-label="Mana home">
            <span className="relative h-10 w-10 overflow-hidden rounded-full bg-white ring-1 ring-[#0F5257]/15">
              <Image src={BRAND.logo} alt="" fill sizes="40px" className="object-contain p-1" priority />
            </span>
            <span className="leading-none">
              <span className="block text-[22px] font-black tracking-tight text-[#0F5257]">Mana</span>
              <span className="mt-0.5 block text-[11px] font-bold text-[#5B6667]">by MK and Sons</span>
            </span>
          </Link>
          <form action="/products" className="ml-4 hidden flex-1 md:block" role="search">
            <label className="relative block max-w-md">
              <span className="sr-only">Search products</span>
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5B6667]" aria-hidden />
              <input
                name="q"
                placeholder="Search almonds, ashwagandha, chia…"
                className="h-11 w-full rounded-full border border-[#0F5257]/15 bg-white pl-11 pr-4 text-[14.5px] font-semibold outline-none placeholder:font-medium placeholder:text-[#77817F] focus-visible:border-[#0F5257] focus-visible:ring-2 focus-visible:ring-[#0F5257]/20"
              />
            </label>
          </form>
          <nav className="ml-auto flex items-center gap-1" aria-label="Shortcuts">
            <Link href="/products" aria-label="Search products" className="flex h-11 w-11 items-center justify-center rounded-full text-[#1F2A2B] transition hover:bg-white md:hidden">
              <Search size={20} />
            </Link>
            <a
              href={whatsappUrl(HELLO)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="flex h-11 items-center gap-2 rounded-full px-3 text-[14px] font-extrabold text-[#1F2A2B] transition hover:bg-white"
            >
              <MessageCircle size={20} className="text-[#128C4B]" aria-hidden />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
            <Link href="/profile" aria-label="My account" className="hidden h-11 w-11 items-center justify-center rounded-full text-[#1F2A2B] transition hover:bg-white sm:flex">
              <User size={20} />
            </Link>
            <AskCartButton />
          </nav>
        </div>
      </header>

      <main>
        {/* Intro + guide */}
        <section className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-7" aria-labelledby="ask-title">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-1">
            <div className="max-w-2xl">
              <p className="text-[11.5px] font-black uppercase tracking-[0.18em] text-[#9A4A0B]">Ask Mana · quick guide</p>
              <h1 id="ask-title" className="mt-1 text-[27px] font-black leading-[1.08] tracking-tight sm:text-[40px]">
                Not sure what to buy? <span className="text-[#0F5257]">Just ask.</span>
              </h1>
              <p className="mt-1.5 text-[14.5px] leading-snug text-[#4A5556] sm:mt-2 sm:text-[16.5px]">
                Two quick questions, real picks from our shop. Add them right in the chat.
              </p>
            </div>
            <ul className="hidden flex-wrap gap-2 text-[13px] font-bold text-[#3B4748] md:flex" aria-label="Why shop with us">
              {[
                { icon: Truck, text: 'Free delivery above ₹999' },
                { icon: Banknote, text: 'Cash on delivery' },
                { icon: BadgePercent, text: '5% cashback' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#0F5257]/10">
                  <Icon size={15} className="text-[#0F5257]" aria-hidden /> {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 grid gap-5 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <AskChat data={guide} logo={BRAND.logo} />
            <aside className="hidden flex-col gap-3 lg:flex lg:h-[660px]" aria-label="Your basket">
              <div className="min-h-0 flex-1">
                <AskBasket />
              </div>
              <div className="rounded-[24px] bg-[#0F5257] p-5 text-white">
                <div className="text-[16px] font-black">Prefer a real person?</div>
                <p className="mt-1 text-[13px] leading-relaxed text-white/80">Message our team, or see the products live on a free video call. No obligation.</p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={whatsappUrl(HELLO)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] text-[13px] font-extrabold text-[#0B3B22] transition hover:brightness-95"
                  >
                    <MessageCircle size={15} aria-hidden /> WhatsApp
                  </a>
                  <Link href="/appointment" className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-extrabold text-[#0F5257] transition hover:bg-[#DDF0EC]">
                    <Video size={15} aria-hidden /> Video call
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-3 pt-10 sm:px-6 sm:pt-14" aria-labelledby="how-title">
          <h2 id="how-title" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {[
              { icon: MessagesSquare, title: 'Answer two quick questions', text: 'A gift, your health, snacks or a dish. Tell the guide and it narrows down our shop for you.' },
              { icon: ShoppingBasket, title: 'Add picks right in the chat', text: 'Real products and live prices. Change the pack size, add a whole set in one tap.' },
              { icon: Banknote, title: 'Pay your way', text: 'UPI, cards, net banking or cash on delivery. 2–3 days in Delhi-NCR, 5–7 days across India.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-4 rounded-[24px] bg-white p-5 ring-1 ring-black/5">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DDF0EC] text-[#0F5257]">
                  <Icon size={22} aria-hidden />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E4C] text-[12px] font-black text-[#1F2A2B]">{index + 1}</span>
                </span>
                <span>
                  <span className="block text-[16px] font-black leading-tight">{title}</span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-[#4A5556]">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] font-bold text-[#3B4748] sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6">
            {[
              { icon: PackageCheck, text: 'Packed fresh to order' },
              { icon: FlaskConical, text: 'Lab tested · FSSAI licensed' },
              { icon: Truck, text: 'Free delivery above ₹999' },
              { icon: BadgePercent, text: '5% back as wallet cashback' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5 rounded-xl bg-[#F1ECE3] px-3 py-2 sm:bg-transparent sm:p-0">
                <Icon size={15} className="shrink-0 text-[#0F5257]" aria-hidden /> {text}
              </li>
            ))}
          </ul>
        </section>

        {/* Browse */}
        <section className="mx-auto max-w-6xl px-3 pt-12 sm:px-6 sm:pt-16" aria-labelledby="browse-title">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2 id="browse-title" className="text-[24px] font-black leading-tight sm:text-[30px]">
                Or browse yourself
              </h2>
              <p className="mt-1 text-[14px] text-[#4A5556]">Everything is packed fresh when you order.</p>
            </div>
            <Link href="/products" className="hidden shrink-0 items-center gap-1 text-[14px] font-extrabold text-[#0F5257] hover:underline sm:inline-flex">
              All products <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map(category => (
              <Link key={category.title} href={category.href} className="group overflow-hidden rounded-[22px] bg-white ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,82,87,0.5)]">
                <span className="relative block aspect-[4/3] overflow-hidden bg-[#EFE7DA]">
                  {category.image && <Image src={category.image} alt="" fill sizes="(max-width: 1024px) 46vw, 270px" className="object-cover transition duration-500 group-hover:scale-105" />}
                </span>
                <span className="block p-3 sm:p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-black leading-tight sm:text-[16px]">{category.title}</span>
                    <ArrowRight size={16} className="shrink-0 text-[#0F5257] transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-[#5B6667]">{category.line}</span>
                  <span className="mt-1.5 inline-block rounded-full bg-[#DDF0EC] px-2 py-0.5 text-[11px] font-extrabold text-[#0F5257]">{category.count} products</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex items-end justify-between gap-3 px-1">
            <div>
              <h3 className="text-[20px] font-black leading-tight sm:text-[24px]">Bestsellers</h3>
              <p className="mt-0.5 text-[13.5px] text-[#4A5556]">What our customers re-order most</p>
            </div>
            <Link href="/products" className="inline-flex shrink-0 items-center gap-1 text-[14px] font-extrabold text-[#0F5257] hover:underline">
              See all <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="-mx-3 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {catalog.bestsellers.map(product => (
              <AskProductCard key={product.id} product={lean(product)} className="w-[170px] shrink-0 snap-start sm:w-[200px] lg:w-auto" />
            ))}
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mx-auto max-w-6xl px-3 pt-12 sm:px-6 sm:pt-16" aria-labelledby="reviews-title">
            <h2 id="reviews-title" className="px-1 text-[24px] font-black leading-tight sm:text-[30px]">
              Kind words from customers
            </h2>
            <div className={`mt-4 grid gap-4 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2' : 'max-w-xl'}`}>
              {reviews.slice(0, 3).map(review => (
                <figure key={review.id} className="flex flex-col">
                  <blockquote className="relative rounded-[22px] rounded-bl-md bg-[#DDF0EC] px-5 py-4 text-[15px] leading-relaxed text-[#1F2A2B]">
                    <div className="mb-1.5 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star key={index} size={14} className={index < review.rating ? 'fill-[#F59E4C] text-[#F59E4C]' : 'text-[#0F5257]/25'} aria-hidden />
                      ))}
                    </div>
                    {review.title && <p className="font-extrabold">{review.title}</p>}
                    <p>{review.body}</p>
                  </blockquote>
                  <figcaption className="mt-2 flex items-center gap-2 pl-2 text-[13px]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5257] text-[13px] font-black text-white">
                      {reviewerName(review.customer_name).charAt(0)}
                    </span>
                    <span>
                      <b className="font-extrabold">{reviewerName(review.customer_name)}</b>
                      {review.product_name && (
                        <>
                          <span className="text-[#5B6667]"> on </span>
                          <Link href={reviewedHref(review.product_slug)} className="font-bold text-[#0F5257] hover:underline">
                            {review.product_name}
                          </Link>
                        </>
                      )}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Closing help band */}
        <section className="mx-auto max-w-6xl px-3 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
          <div className="flex flex-col items-start gap-5 overflow-hidden rounded-[28px] bg-[#0F5257] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="max-w-xl">
              <h2 className="text-[24px] font-black leading-tight sm:text-[30px]">Still deciding? Talk to the family behind Mana.</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-white/80">
                MK and Sons has spent 20+ years in the dry fruits, herbs and spices trade in Delhi-NCR. Ask us anything, or let us show you the products live on a free video call.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <a
                href={whatsappUrl(HELLO)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-[15px] font-extrabold text-[#0B3B22] transition hover:brightness-95"
              >
                <MessageCircle size={18} aria-hidden /> Chat on WhatsApp
              </a>
              <Link href="/appointment" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0F5257] transition hover:bg-[#DDF0EC]">
                <Video size={18} aria-hidden /> Book a free video call
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B3F43] text-[#E7EFEC]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                <Image src={BRAND.logo} alt="" fill sizes="40px" className="object-contain p-1" />
              </span>
              <span className="text-[22px] font-black text-white">Mana</span>
            </div>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-white/70">
              Dry fruits, Ayurvedic herbs and whole spices from MK and Sons, a family business in Delhi-NCR. Packed fresh to order and delivered across India.
            </p>
          </div>
          {[
            {
              title: 'Shop',
              links: [
                { label: 'Dry fruits & seeds', href: '/products?category=dry-fruits' },
                { label: 'Ayurvedic herbs', href: '/products?category=herbs' },
                { label: 'Whole spices', href: '/products?category=spices' },
                { label: 'Health kits', href: '/kits' },
                { label: 'All products', href: '/products' },
              ],
            },
            {
              title: 'Help',
              links: [
                { label: 'Track your order', href: '/track-order' },
                { label: 'FAQs', href: '/faq' },
                { label: 'Book a video call', href: '/appointment' },
                { label: 'Chat on WhatsApp', href: whatsappUrl(HELLO), external: true },
              ],
            },
            {
              title: 'Mana',
              links: [
                { label: 'Our story', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'My account', href: '/profile' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ],
            },
          ].map(column => (
            <div key={column.title}>
              <div className="text-[12px] font-black uppercase tracking-[0.16em] text-[#F59E4C]">{column.title}</div>
              <ul className="mt-3 space-y-2 text-[14px]">
                {column.links.map(link => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-white/80 transition hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-white/80 transition hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-5 py-5 text-[12.5px] text-white/60 sm:px-6 md:flex-row md:items-center md:justify-between">
            <span>MK and Sons · Delhi-NCR · FSSAI licensed</span>
            <span>Secure payments by Razorpay · UPI · Cards · Net banking · Cash on delivery</span>
          </div>
        </div>
      </footer>

      <AskMobileBar />
    </div>
  )
}
