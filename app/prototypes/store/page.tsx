import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import { ArrowRight, Banknote, Eye, MessageCircle, PackageCheck, Plus, ShieldCheck, Sprout, Star, Timer, Truck } from 'lucide-react'
import { whatsappUrl } from '@/lib/utils'
import { BRAND, getCatalog, getPublicReviews, kitInsideLine, lean, reviewerName } from '../_lib/catalog'
import { CartBar, ShelfLink, ShopSection, StoreHeader } from './client'
import { FAQS, SHELVES, badgeFor, shelfOf, sortShelf, storeName, subLine, type ShelfKey, type StoreProduct } from './data'

/*
 * The simple store: one calm, premium shop page. Real catalogue, real prices,
 * the real cart. Every promise on it comes from the store's own FAQ and About
 * page, or from how checkout actually charges.
 */

export const revalidate = 300

export const metadata: Metadata = { title: 'Simple store' }

const serif = DM_Serif_Display({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--store-serif' })
const sans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--store-sans' })

const SERIF = '[font-family:var(--store-serif)]'
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8C6A2B]'

const ORDER_MESSAGE = 'Hi Mana! I would like to place an order.'
const GIFT_MESSAGE = 'Hi Mana! I need help with a gifting / bulk order.'
const HELP_MESSAGE = 'Hi Mana! I need some help.'

const PROMISES = [
  { icon: PackageCheck, title: 'Packed fresh to order', text: 'Powders are ground after you order' },
  { icon: Truck, title: 'Free delivery above ₹999', text: '2–3 days in Delhi-NCR, 5–7 across India' },
  { icon: Banknote, title: 'Cash on delivery', text: 'Or pay by UPI, card or net banking' },
  { icon: ShieldCheck, title: 'FSSAI licensed', text: 'Every batch checked before dispatch' },
]

const STORY_POINTS = [
  { icon: Sprout, title: 'Sourced directly', text: 'From farmers and orchards, without wholesale middlemen.' },
  { icon: Eye, title: 'Graded by hand', text: 'Every batch is sorted by our team; off-colour pieces never make it in.' },
  { icon: Timer, title: 'Packed after you order', text: 'Powders are ground fresh, and we never add preservatives.' },
]

export default async function StorePage() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)

  // Dress each product for a store card; skip repeats (Gond Katira is listed twice).
  const seen = new Set<string>()
  const products: StoreProduct[] = []
  for (const product of catalog.all) {
    const { title, local } = storeName(product.name)
    const key = `${product.category}:${title.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    const shelf = shelfOf(product)
    products.push({
      ...lean(product),
      title,
      sub: shelf === 'kits' ? kitInsideLine(product, 2) : subLine(product, local),
      shelf,
      badge: badgeFor(product),
    })
  }

  const shelves = SHELVES.map(shelf => ({ ...shelf, items: sortShelf(products.filter(product => product.shelf === shelf.key)) })).filter(
    shelf => shelf.items.length > 0
  )
  const everyday = products.filter(product => product.shelf !== 'kits').length
  const more = Math.max(0, Math.floor((everyday - 4) / 5) * 5)

  const kitImage = catalog.pick(['super seeds'])[0]?.images?.[0] || catalog.kits.find(kit => kit.images?.[0])?.images[0] || BRAND.hero
  // Tile photos are cropped to the part that shows the shelf; `sizes` covers the zoomed width.
  const tiles: Record<ShelfKey, { src: string; position: string; sizes: string }> = {
    'dry-fruits': { src: BRAND.hero, position: '24% 50%', sizes: '(max-width: 768px) 90vw, 640px' },
    seeds: { src: BRAND.categories['dry-fruits'], position: '50% 60%', sizes: '(max-width: 768px) 45vw, 260px' },
    herbs: { src: BRAND.categories.herbs, position: '50% 55%', sizes: '(max-width: 768px) 45vw, 260px' },
    spices: { src: BRAND.categories.spices, position: '50% 55%', sizes: '(max-width: 768px) 45vw, 260px' },
    kits: { src: kitImage, position: '50% 50%', sizes: '(max-width: 768px) 70vw, 420px' },
  }
  const giftPicks = catalog.pick(['dates', 'cashew', 'anjeer'])

  return (
    <div className={`${serif.variable} ${sans.variable} min-h-screen bg-[#FBF7F0] font-normal text-[#1D1813] antialiased [font-family:var(--store-sans)]`}>
      {/* Announcement */}
      <div className="bg-[#191512] text-[#F6EFE3]">
        <div className="mx-auto flex h-9 max-w-[1240px] items-center justify-center gap-3 px-4 text-[12px] sm:gap-5 sm:text-[12.5px]">
          <span>Free delivery above ₹999</span>
          <span aria-hidden className="text-[#D9B872]">✦</span>
          <span>Cash on delivery</span>
          <span aria-hidden className="hidden text-[#D9B872] sm:inline">✦</span>
          <span className="hidden sm:inline">5% cashback on every order</span>
        </div>
      </div>

      <StoreHeader products={products} logo={BRAND.logo} />

      <nav aria-label="Shop by category" className="hidden border-b border-[#E7DDCD] lg:block">
        <div className="mx-auto flex h-12 max-w-[1240px] items-center justify-center gap-9 px-6 text-[14px] font-medium text-[#4B4237]">
          {SHELVES.map(shelf => (
            <ShelfLink key={shelf.key} shelf={shelf.key} className="transition hover:text-[#1D1813]">
              {shelf.label}
            </ShelfLink>
          ))}
          <span aria-hidden className="h-4 w-px bg-[#E2D6C3]" />
          <a href="#gifting" className="transition hover:text-[#1D1813]">
            Gifting
          </a>
          <a href="#story" className="transition hover:text-[#1D1813]">
            Our story
          </a>
          <a href="#faq" className="transition hover:text-[#1D1813]">
            Help
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-[1240px] px-4 pb-10 pt-4 sm:px-6 lg:grid lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-16 lg:pt-12">
        <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#E2C49B] sm:aspect-[16/9] lg:aspect-[6/5] lg:rounded-[28px]">
            <Image
              src={BRAND.hero}
              alt="Mana pouches of cashews and seeds beside brass bowls of nuts and whole spices"
              fill
              priority
              sizes="(max-width: 1024px) 160vw, 1200px"
              className="object-cover"
              style={{ objectPosition: '30% 55%' }}
            />
          </div>
        </div>
        <div className="pt-7 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-0">
          <div className={EYEBROW}>Dry fruits · Seeds · Herbs · Spices</div>
          <h1 className={`${SERIF} mt-3 text-[40px] leading-[1.03] tracking-[-0.01em] text-[#1D1813] sm:text-[52px] xl:text-[62px]`}>
            Premium dry fruits, <em className="text-[#8C6A2B]">packed fresh</em> to order.
          </h1>
          <p className="mt-4 max-w-[31rem] text-[16px] leading-relaxed text-[#4B4237] sm:text-[17px]">
            Almonds, cashews, pistachios, dates and {more}+ more, graded by hand by our family business in Delhi-NCR and packed when you order.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:flex">
            <ShelfLink
              shelf="dry-fruits"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#191512] px-6 text-[15px] font-semibold text-[#F6EFE3] transition hover:bg-[#3A3027] sm:px-7"
            >
              Shop now <ArrowRight size={17} />
            </ShelfLink>
            <a
              href={whatsappUrl(ORDER_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#1D1813]/25 px-5 text-[15px] font-semibold text-[#1D1813] transition hover:border-[#1D1813] sm:px-7"
            >
              <MessageCircle size={17} /> <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section aria-label="Why shop with us" className="border-y border-[#E7DDCD] bg-[#F4EDE2]">
        <ul className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:py-7">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <Icon size={21} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[#8C6A2B]" />
              <span>
                <span className="block text-[14px] font-semibold leading-snug text-[#1D1813]">{title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-[#756A5C]">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-title" className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6 lg:pt-20">
        <SectionHead id="categories-title" eyebrow="Shop by category" title="What are you shopping for?" />
        <div className="-mx-4 mt-7 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:gap-5 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {shelves.map(shelf => (
            <ShelfLink key={shelf.key} shelf={shelf.key} className="group w-[42%] shrink-0 snap-start sm:w-[30%] md:w-auto">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-[#EADCC6]">
                <Image
                  src={tiles[shelf.key].src}
                  alt=""
                  fill
                  sizes={tiles[shelf.key].sizes}
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
                  style={{ objectPosition: tiles[shelf.key].position }}
                />
              </span>
              <span className={`${SERIF} mt-3 block text-[19px] leading-tight text-[#1D1813] sm:text-[21px]`}>{shelf.label}</span>
              <span className="mt-0.5 block text-[12.5px] text-[#756A5C]">
                {shelf.items.length} product{shelf.items.length === 1 ? '' : 's'}
              </span>
            </ShelfLink>
          ))}
        </div>
      </section>

      {/* Shop */}
      <section id="shop" aria-labelledby="shop-title" className="mx-auto max-w-[1240px] scroll-mt-32 px-4 pt-14 sm:px-6 lg:scroll-mt-[88px] lg:pt-20">
        <div className="flex items-end justify-between gap-4">
          <SectionHead id="shop-title" eyebrow="Shop" title="Our products" intro="Choose a pack size and add to cart. Prices update as you pick." />
          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-1.5 pb-1 text-[14px] font-semibold text-[#1D1813] underline decoration-[#1D1813]/30 underline-offset-4 transition hover:decoration-[#1D1813] sm:inline-flex"
          >
            View all {products.length} <ArrowRight size={16} />
          </Link>
        </div>
        <ShopSection shelves={shelves} />
      </section>

      {/* Gifting */}
      <section id="gifting" aria-labelledby="gifting-title" className="mt-20 scroll-mt-24 overflow-hidden bg-[#191512] text-[#F6EFE3] lg:mt-28">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D9B872]">Gifting & bulk orders</div>
            <h2 id="gifting-title" className={`${SERIF} mt-3 text-[36px] leading-[1.05] sm:text-[48px]`}>
              Wedding and festive gifting, <em className="text-[#D9B872]">sorted.</em>
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#F6EFE3]/75">
              Custom dry fruit hampers for weddings, Diwali, teams and events. Tell us your budget and how many you need, and we will put them together.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl(GIFT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#F6EFE3] px-7 text-[15px] font-semibold text-[#191512] transition hover:bg-[#FFFFFF]"
              >
                <MessageCircle size={17} /> Plan a gift on WhatsApp
              </a>
              <ShelfLink
                shelf="kits"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#F6EFE3]/30 px-7 text-[15px] font-semibold text-[#F6EFE3] transition hover:border-[#F6EFE3]"
              >
                Shop kits & combos
              </ShelfLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pb-6 sm:gap-4">
            {giftPicks.map((product, index) => (
              <div key={product.id} className={`relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#2A231D] ${index === 1 ? 'translate-y-6' : ''}`}>
                <Image src={product.images[0]} alt={storeName(product.name).title} fill sizes="(max-width: 1024px) 60vw, 360px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" aria-labelledby="story-title" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#E2C49B] lg:aspect-[5/6]">
            <Image
              src={BRAND.categories.pansari}
              alt="Almonds, cashews and walnuts in a brass bowl with gond katira, misri and rose petals"
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
              style={{ objectPosition: '30% 62%' }}
            />
          </div>
          <div>
            <div className={EYEBROW}>Our story</div>
            <h2 id="story-title" className={`${SERIF} mt-3 text-[34px] leading-[1.06] sm:text-[44px]`}>
              A family business from Delhi-NCR.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#4B4237]">
              MK and Sons has been in the dry fruit and spice trade for decades, buying directly from farmers, orchards and growers across Kashmir, Kerala,
              Madhya Pradesh and beyond. Mana brings that same handpicked quality to homes across India.
            </p>
            <ul className="mt-8 space-y-5">
              {STORY_POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F1E8DA] text-[#8C6A2B]">
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <span>
                    <span className="block text-[15.5px] font-semibold text-[#1D1813]">{title}</span>
                    <span className="mt-0.5 block text-[14.5px] leading-relaxed text-[#4B4237]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-[#1D1813] underline decoration-[#1D1813]/30 underline-offset-4 transition hover:decoration-[#1D1813]"
            >
              Read our story <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews (approved reviews from the database only) */}
      {reviews.length > 0 && (
        <section aria-labelledby="reviews-title" className="bg-[#F4EDE2]">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:py-20">
            <SectionHead id="reviews-title" eyebrow="Reviews" title="What customers say" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 3).map(review => (
                <figure key={review.id} className="flex flex-col rounded-[20px] bg-[#FFFFFF] p-6 ring-1 ring-[#E7DDCD] sm:p-7">
                  <div className="flex gap-0.5 text-[#B8914A]" role="img" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={16} strokeWidth={1.5} fill={star <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  {review.title && <div className={`${SERIF} mt-4 text-[21px] leading-snug text-[#1D1813]`}>{review.title}</div>}
                  <blockquote className="mt-2 text-[15px] leading-relaxed text-[#4B4237]">“{review.body}”</blockquote>
                  <figcaption className="mt-auto pt-5 text-[13px] text-[#756A5C]">
                    <b className="font-semibold text-[#1D1813]">{reviewerName(review.customer_name)}</b>
                    {review.product_name ? ` · ${review.product_name}` : ''}
                  </figcaption>
                </figure>
              ))}
              {reviews.length < 3 && (
                <div className="flex flex-col rounded-[20px] bg-[#191512] p-6 text-[#F6EFE3] sm:p-7">
                  <div className={`${SERIF} text-[24px] leading-snug`}>Ordered from us?</div>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#F6EFE3]/75">
                    A few honest words help other families choose. Leave a review on the page of the product you bought.
                  </p>
                  <Link href="/products" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14.5px] font-semibold text-[#D9B872] transition hover:text-[#F6EFE3]">
                    Write a review <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
          <div>
            <SectionHead id="faq-title" eyebrow="Help" title="Good to know before you order" />
            <p className="mt-4 text-[15px] leading-relaxed text-[#4B4237]">Can’t find your answer? Message us on WhatsApp.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={whatsappUrl(HELP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#191512] px-6 text-[14.5px] font-semibold text-[#F6EFE3] transition hover:bg-[#3A3027]"
              >
                <MessageCircle size={17} /> Chat with us
              </a>
              <Link href="/faq" className="text-[14.5px] font-semibold text-[#1D1813] underline decoration-[#1D1813]/30 underline-offset-4 transition hover:decoration-[#1D1813]">
                All FAQs
              </Link>
            </div>
          </div>
          <div className="divide-y divide-[#E7DDCD] border-y border-[#E7DDCD]">
            {FAQS.map(item => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-semibold text-[#1D1813] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus size={19} strokeWidth={1.8} className="shrink-0 text-[#8C6A2B] transition duration-200 group-open:rotate-45" />
                </summary>
                <p className="-mt-1 pb-5 pr-8 text-[15px] leading-relaxed text-[#4B4237]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <StoreFooter logo={BRAND.logo} />
      <CartBar />
    </div>
  )
}

function SectionHead({ id, eyebrow, title, intro }: { id?: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <div className={EYEBROW}>{eyebrow}</div>
      <h2 id={id} className={`${SERIF} mt-2 text-[32px] leading-[1.08] text-[#1D1813] sm:text-[40px]`}>
        {title}
      </h2>
      {intro && <p className="mt-2.5 text-[15px] leading-relaxed text-[#4B4237]">{intro}</p>}
    </div>
  )
}

const FOOTER_LINKS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Dry fruits & seeds', href: '/products?category=dry-fruits' },
      { label: 'Herbs & powders', href: '/products?category=herbs' },
      { label: 'Whole spices', href: '/products?category=spices' },
      { label: 'Kits & combos', href: '/kits' },
      { label: 'All products', href: '/products' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track your order', href: '/track-order' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Returns & refunds', href: '/faq#returns-refunds' },
      { label: 'Book a video call', href: '/appointment' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'WhatsApp us', href: whatsappUrl(HELP_MESSAGE), external: true },
      { label: 'support@manadryfruits.com', href: 'mailto:support@manadryfruits.com' },
      { label: 'Instagram', href: 'https://www.instagram.com/manadryfruits', external: true },
    ],
  },
]

function StoreFooter({ logo }: { logo: string }) {
  return (
    <footer className="bg-[#191512] text-[#F6EFE3]/70">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 gap-y-10 px-4 pb-12 pt-16 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF7F0]">
              <Image src={logo} alt="" width={40} height={40} className="h-8 w-8 object-contain mix-blend-multiply" />
            </span>
            <span className={`${SERIF} text-[26px] tracking-[0.16em] text-[#F6EFE3]`}>MANA</span>
          </div>
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed">
            Premium dry fruits, herbs and spices from MK and Sons, a family business in Ghaziabad, Delhi-NCR. FSSAI licensed.
          </p>
        </div>
        {FOOTER_LINKS.map(column => (
          <div key={column.title} className={column.title === 'Contact' ? 'col-span-2 sm:col-span-1' : ''}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D9B872]">{column.title}</div>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {column.links.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="break-words transition hover:text-[#F6EFE3]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#F6EFE3]/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-6 text-[12.5px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} MK and Sons · Mana</span>
          <span>UPI · Cards · Net banking · Cash on delivery</span>
          <span className="flex gap-5">
            <Link href="/terms" className="transition hover:text-[#F6EFE3]">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-[#F6EFE3]">
              Privacy
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
