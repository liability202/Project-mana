import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
import { ArrowDown, ArrowRight, ArrowUpRight, Leaf, MessageCircle, PackageCheck, Search, ShieldCheck, Star, Truck, User, Video, Wallet } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { formatPrice, whatsappUrl } from '@/lib/utils'
import { cardLabels, getCatalog, getPublicReviews, lean, reviewerName } from '../_lib/catalog'
import { baseGrams, displayName, gramsLabel, priceAt, productHref } from '../_lib/shared'
import { AddControl, CravingTabs, PackCard, PopCartBar, PopCartButton, type CravingData, type PackData } from './client'
import { CRAVING_ICONS } from './icons'
import { COLORS, CRAVINGS, EXPLORE, PACKS, type PopColor } from './data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Pop · Mana prototype',
}

const pop = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', variable: '--pop-font', axes: ['opsz'] })

/* Marquee + slowly spinning stamp; both stay still for people who prefer reduced motion. */
const POP_CSS = `
@keyframes pop-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes pop-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: no-preference) {
  .pop-marquee-track { animation: pop-marquee 32s linear infinite }
  .pop-spin { animation: pop-spin 22s linear infinite }
}
`

const TICKER = ['Packed fresh to order', 'Free delivery over ₹999', '5% cashback', 'Cash on delivery', 'No preservatives', 'Delivered across India']

const WHATSAPP_ORDER = whatsappUrl('Hi Mana! I want to order some snacks 🙂')

export default async function PopPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)
  const first = (keyword: string) => catalog.pick([keyword])[0] as Product | undefined

  const makhana = first('makhana')
  const cashew = first('cashew')
  const blueberry = first('blue berry')
  const pumpkin = first('pumpkin')

  const cravings: CravingData[] = CRAVINGS.map(craving => ({
    id: craving.id,
    label: craving.label,
    line: craving.line,
    icon: craving.icon,
    color: craving.color,
    products: catalog.pick(craving.keywords).map(product => ({ product: lean(product), badge: cardLabels(product).badge })),
  })).filter(craving => craving.products.length > 0)

  const packs: PackData[] = PACKS.map(pack => ({
    id: pack.id,
    name: pack.name,
    line: pack.line,
    color: pack.color,
    items: pack.items
      .map(item => ({ product: first(item.keyword), grams: item.grams }))
      .filter((item): item is { product: Product; grams: number } => Boolean(item.product))
      .map(item => ({ product: lean(item.product), grams: item.grams })),
  })).filter(pack => pack.items.length >= 2)

  const counts = { dryFruits: catalog.dryFruits.length, herbs: catalog.herbs.length, spices: catalog.spices.length, kits: catalog.kits.length }
  const bySlug = new Map(catalog.all.map(product => [product.slug, product]))

  return (
    <div className={`${pop.variable} min-h-screen bg-[#FFF4E2] text-[#151515] antialiased [font-family:var(--pop-font)]`}>
      <style dangerouslySetInnerHTML={{ __html: POP_CSS }} />

      {/* Ticker */}
      <div className="overflow-hidden border-b-2 border-[#151515] bg-[#151515] text-[#FFF4E2]">
        <div className="pop-marquee-track flex w-max">
          {[0, 1].map(copy => (
            <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {[...TICKER, ...TICKER].map((item, index) => (
                <span key={`${copy}-${index}`} className="flex items-center whitespace-nowrap py-2 text-[12px] font-extrabold uppercase tracking-[0.12em]">
                  <span className="px-4">{item}</span>
                  <span className="text-[#FFD84D]" aria-hidden>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-[#151515] bg-[#FFF4E2]">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/prototypes/pop" aria-label="Mana snack shop, home" className="relative mr-1 shrink-0 pr-5">
            <span className="block text-[34px] font-extrabold leading-none tracking-[-0.06em]">mana</span>
            <span className="absolute -right-3 -top-2.5 rotate-[8deg] rounded-full border-2 border-[#151515] bg-[#FF8FC4] px-1.5 py-px text-[9px] font-extrabold uppercase leading-tight tracking-wide">
              snack shop
            </span>
          </Link>

          <form action="/products" method="get" role="search" className="mx-auto hidden w-full max-w-md md:block">
            <label className="relative block">
              <span className="sr-only">Search snacks</span>
              <input
                name="q"
                type="search"
                placeholder="Search makhana, cashew, chia…"
                className="h-11 w-full rounded-full border-2 border-[#151515] bg-white pl-11 pr-4 text-[15px] font-semibold placeholder:font-medium placeholder:text-[#7A7A7A] focus:outline-none focus:ring-4 focus:ring-[#FFD84D]"
              />
              <Search size={18} strokeWidth={2.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            </label>
          </form>

          <nav aria-label="Main" className="ml-auto flex items-center gap-1.5 md:ml-0">
            <a href="#packs" className="hidden h-11 items-center rounded-full px-3 text-sm font-extrabold transition hover:bg-[#151515]/5 lg:inline-flex">
              Snack packs
            </a>
            <Link href="/kits" className="hidden h-11 items-center rounded-full px-3 text-sm font-extrabold transition hover:bg-[#151515]/5 lg:inline-flex">
              Kits
            </Link>
            <a
              href={WHATSAPP_ORDER}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order on WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#151515] bg-[#8EE3C0] transition hover:-translate-y-0.5"
            >
              <MessageCircle size={19} strokeWidth={2.5} />
            </a>
            <Link
              href="/profile"
              aria-label="My account"
              className="hidden h-11 w-11 items-center justify-center rounded-full border-2 border-[#151515] bg-white transition hover:-translate-y-0.5 sm:inline-flex"
            >
              <User size={19} strokeWidth={2.5} />
            </Link>
            <PopCartButton />
          </nav>
        </div>
      </header>

      {/* Phone search */}
      <form action="/products" method="get" role="search" className="px-4 pt-4 md:hidden">
        <label className="relative block">
          <span className="sr-only">Search snacks</span>
          <input
            name="q"
            type="search"
            placeholder="Search makhana, cashew, chia…"
            className="h-12 w-full rounded-full border-2 border-[#151515] bg-white pl-11 pr-4 text-[15px] font-semibold shadow-[3px_3px_0_#151515] placeholder:font-medium placeholder:text-[#7A7A7A] focus:outline-none focus:ring-4 focus:ring-[#FFD84D]"
          />
          <Search size={18} strokeWidth={2.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
        </label>
      </form>

      <main>
        {/* Bento hero */}
        <section aria-labelledby="pop-hero" className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:pt-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Big tile */}
            <div className="relative col-span-2 flex flex-col overflow-hidden rounded-[28px] border-2 border-[#151515] bg-[#FFD84D] p-5 shadow-[6px_6px_0_#151515] sm:p-8 lg:row-span-2 lg:min-h-[560px]">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(#151515_1.2px,transparent_1.3px)] [background-size:14px_14px]" />
              <Stamp className="absolute right-4 top-4 h-[84px] w-[84px] sm:right-6 sm:top-6 sm:h-28 sm:w-28" />

              <div className="relative">
                <span className="inline-flex items-center rounded-full border-2 border-[#151515] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]">
                  dry fruits · seeds · makhana
                </span>
                <h1 id="pop-hero" className="mt-4 max-w-[13ch] text-[40px] font-extrabold leading-[0.92] tracking-[-0.045em] sm:text-[60px] lg:text-[72px]">
                  Snacks that{' '}
                  <span className="relative inline-block -rotate-2 rounded-xl border-2 border-[#151515] bg-[#FF6B2C] px-2 pb-1 leading-[0.95] shadow-[3px_3px_0_#151515]">
                    actually
                  </span>{' '}
                  do something.
                </h1>
                <p className="mt-4 max-w-md text-[15px] font-semibold leading-snug sm:text-lg">
                  Makhana, nuts, seeds and berries — packed fresh when you order, with no preservatives.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
                  <a
                    href="#cravings"
                    className="inline-flex h-12 items-center gap-1.5 rounded-full border-2 border-[#151515] bg-[#151515] px-4 text-[14px] font-extrabold text-white shadow-[3px_3px_0_#FF6B2C] transition hover:-translate-y-0.5 sm:gap-2 sm:px-5 sm:text-[15px]"
                  >
                    Pick your craving <ArrowDown size={17} strokeWidth={2.75} />
                  </a>
                  <Link
                    href="/products?category=dry-fruits"
                    className="inline-flex h-12 items-center gap-1.5 rounded-full border-2 border-[#151515] bg-white px-4 text-[14px] font-extrabold transition hover:-translate-y-0.5 sm:px-5 sm:text-[15px]"
                  >
                    Shop all
                  </Link>
                </div>
              </div>

              {makhana && (
                <div className="relative mt-6 flex items-end justify-between gap-3 lg:mt-auto">
                  <div className="z-10 w-[56%] max-w-[260px] -rotate-2 rounded-[20px] border-2 border-[#151515] bg-white p-3 shadow-[4px_4px_0_#151515]">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#FF6B2C]">Snack of the week</div>
                    <Link href={productHref(makhana)} className="mt-0.5 block text-[16px] font-extrabold leading-tight hover:underline">
                      {displayName(makhana.name)}
                    </Link>
                    <div className="mt-0.5 text-[12px] font-semibold text-[#5A5A5A]">
                      {gramsLabel(baseGrams(makhana))} · <span className="text-[15px] font-extrabold text-[#151515]">{formatPrice(priceAt(makhana, baseGrams(makhana)))}</span>
                    </div>
                    <div className="mt-2.5">
                      <AddControl product={lean(makhana)} size="sm" />
                    </div>
                  </div>
                  <Link
                    href={productHref(makhana)}
                    className="relative -mb-1 aspect-square w-[44%] max-w-[300px] shrink-0 rotate-3 overflow-hidden rounded-[24px] border-2 border-[#151515] bg-[#151515] shadow-[5px_5px_0_#151515] transition hover:rotate-1"
                  >
                    {makhana.images?.[0] && (
                      <Image src={makhana.images[0]} alt={displayName(makhana.name)} fill priority sizes="(max-width: 1024px) 44vw, 300px" className="object-cover" />
                    )}
                  </Link>
                </div>
              )}
            </div>

            {cashew && <BentoProduct product={cashew} color="mint" note={cardLabels(cashew).badge || 'Crowd favourite'} tall />}
            {blueberry && <BentoProduct product={blueberry} color="bubblegum" note="Dried berries" />}

            {/* 5% back */}
            <div className="relative flex min-h-[188px] flex-col justify-between overflow-hidden rounded-[24px] border-2 border-[#151515] bg-[#FF8FC4] p-4 shadow-[4px_4px_0_#151515] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#151515] bg-white">
                  <Wallet size={18} strokeWidth={2.5} />
                </span>
                <span className="rotate-6 rounded-full border-2 border-[#151515] bg-[#FFD84D] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                  cashback
                </span>
              </div>
              <div>
                <div className="text-[56px] font-extrabold leading-[0.85] tracking-[-0.05em] sm:text-[64px] lg:text-[96px]">5%</div>
                <div className="mt-1 text-[15px] font-extrabold leading-tight">back on every order</div>
                <div className="mt-1 text-[12px] font-semibold leading-snug">As Mana wallet cash after delivery</div>
              </div>
            </div>

            {pumpkin && <BentoProduct product={pumpkin} color="tangerine" note={cardLabels(pumpkin).tag || 'Seeds'} />}

            {/* Pay your way */}
            <div className="col-span-2 flex flex-col justify-between gap-3 rounded-[24px] border-2 border-[#151515] bg-[#3D5AFE] p-4 text-white shadow-[4px_4px_0_#151515] sm:p-5 lg:col-span-1 lg:min-h-[188px]">
              <div className="text-[24px] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[26px] lg:text-[34px]">Pay your way</div>
              <ul className="flex flex-wrap gap-1.5">
                {['UPI', 'Cards', 'Cash on delivery'].map(method => (
                  <li key={method} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 border-[#151515] bg-white px-2.5 py-1 text-[12px] font-extrabold text-[#151515]">
                    {method} <span className="text-[#0E8A55]" aria-hidden>✓</span>
                  </li>
                ))}
              </ul>
              <div className="text-[12px] font-semibold text-white/90">Free delivery over ₹999 · secure payments by Razorpay</div>
            </div>

            {/* Craving shortcut */}
            <div className="col-span-2 flex flex-col justify-between gap-4 rounded-[24px] border-2 border-[#151515] bg-[#FF6B2C] p-4 shadow-[4px_4px_0_#151515] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[26px] font-extrabold leading-none tracking-[-0.03em] sm:text-[30px]">Pick your craving</div>
                  <div className="mt-1.5 text-[13px] font-semibold">Six moods, real snacks. Tap one.</div>
                </div>
                <a href="#cravings" aria-label="Jump to cravings" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#151515] bg-white transition hover:translate-y-0.5">
                  <ArrowDown size={20} strokeWidth={2.75} />
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {CRAVINGS.map(craving => {
                  const Icon = CRAVING_ICONS[craving.icon]
                  return (
                    <a
                      key={craving.id}
                      href={`#craving-${craving.id}`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-[#151515] bg-[#FFF4E2] px-3 text-[13px] font-extrabold transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      <Icon size={15} strokeWidth={2.5} /> {craving.label}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Cravings */}
        <section id="cravings" aria-labelledby="pop-cravings" className="scroll-mt-24 border-y-2 border-[#151515] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <SectionTitle id="pop-cravings" eyebrow="what are you in the mood for?" highlight="#FFD84D">
              Pick your <Marked color="#FFD84D">craving</Marked>
            </SectionTitle>
            <div className="mt-6">
              <CravingTabs cravings={cravings} />
            </div>
          </div>
        </section>

        {/* Snack packs */}
        {packs.length > 0 && (
          <section id="packs" aria-labelledby="pop-packs" className="scroll-mt-24">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionTitle id="pop-packs" eyebrow="lazy? same." highlight="#8EE3C0">
                  Snack <Marked color="#8EE3C0">packs</Marked>
                </SectionTitle>
                <p className="max-w-sm text-[15px] font-semibold text-[#3A3A3A]">
                  Three ready-made packs of real Mana snacks. One tap adds the lot — tweak quantities in your cart.
                </p>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packs.map(pack => (
                  <PackCard key={pack.id} pack={pack} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Explore the rest of the shop */}
        <section aria-labelledby="pop-explore" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
          <div className="rounded-[28px] border-2 border-[#151515] bg-white p-5 shadow-[6px_6px_0_#151515] sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="pop-explore" className="text-[26px] font-extrabold leading-none tracking-[-0.03em] sm:text-[32px]">
                Not snacking? There&apos;s more.
              </h2>
              <Link href="/products" className="inline-flex items-center gap-1 text-[14px] font-extrabold underline decoration-2 underline-offset-4">
                Everything we sell <ArrowRight size={15} strokeWidth={2.75} />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {EXPLORE.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex min-h-[112px] flex-col justify-between rounded-[22px] border-2 border-[#151515] p-4 transition hover:-translate-y-1 hover:shadow-[4px_4px_0_#151515]"
                  style={{ backgroundColor: COLORS[item.color].bg, color: COLORS[item.color].text }}
                >
                  <span className="text-[17px] font-extrabold leading-tight sm:text-[19px]">{item.label}</span>
                  <span className="flex items-center justify-between text-[12px] font-bold">
                    {counts[item.countKey]} products
                    <ArrowUpRight size={18} strokeWidth={2.75} className="transition motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section aria-labelledby="pop-why" className="border-y-2 border-[#151515] bg-[#151515] text-[#FFF4E2]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 id="pop-why" className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
              Why it hits <span className="text-[#FFD84D]">different</span>
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { icon: PackageCheck, color: 'butter' as PopColor, tilt: 'md:-rotate-2', title: 'Packed fresh to order', text: 'We pack your snacks after you order. Powders are even ground fresh for you.' },
                { icon: ShieldCheck, color: 'mint' as PopColor, tilt: 'md:rotate-1', title: 'No preservatives', text: 'We pack fresh and move batches quickly, so we never need them. Every batch is quality checked.' },
                { icon: Wallet, color: 'bubblegum' as PopColor, tilt: 'md:-rotate-1', title: '5% back, every order', text: 'Cashback lands in your Mana wallet after delivery. Spend it on your next order.' },
              ].map(card => (
                <div
                  key={card.title}
                  className={`rounded-[24px] border-2 border-[#FFF4E2] p-6 text-[#151515] shadow-[5px_5px_0_#FFF4E2] ${card.tilt}`}
                  style={{ backgroundColor: COLORS[card.color].bg }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#151515] bg-white">
                    <card.icon size={22} strokeWidth={2.5} />
                  </span>
                  <h3 className="mt-5 text-[24px] font-extrabold leading-[1.02] tracking-[-0.02em]">{card.title}</h3>
                  <p className="mt-2 text-[15px] font-semibold leading-snug">{card.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 flex items-start gap-2 text-[14px] font-semibold text-[#FFF4E2]/80">
              <Truck size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#FFD84D]" />
              Delivered across India: 2–3 days in Delhi-NCR, 5–7 days everywhere else. Free delivery over ₹999.
            </p>
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section aria-labelledby="pop-reviews" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <SectionTitle id="pop-reviews" eyebrow="from our review box" highlight="#FF8FC4">
              Real people, <Marked color="#FF8FC4">real words</Marked>
            </SectionTitle>
            <div className={`mt-8 grid gap-6 ${reviews.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {reviews.slice(0, 3).map((review, index) => {
                const product = bySlug.get(review.product_slug)
                const tone = COLORS[(['butter', 'mint', 'bubblegum'] as PopColor[])[index % 3]]
                return (
                  <figure key={review.id} className="flex flex-col">
                    <div className="relative flex-1 rounded-[24px] border-2 border-[#151515] bg-white p-5 shadow-[5px_5px_0_#151515] sm:p-6">
                      <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, star) => (
                          <Star key={star} size={17} strokeWidth={2} className={star < review.rating ? 'fill-[#FFD84D] text-[#151515]' : 'text-[#151515]/25'} />
                        ))}
                      </div>
                      {review.title && <div className="mt-3 text-[17px] font-extrabold leading-tight">{review.title}</div>}
                      <blockquote className="mt-2 text-[16px] font-semibold leading-snug">“{review.body}”</blockquote>
                      <span aria-hidden className="absolute -bottom-[11px] left-9 h-5 w-5 rotate-45 border-b-2 border-r-2 border-[#151515] bg-white" />
                    </div>
                    <figcaption className="mt-5 flex items-center gap-3 pl-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#151515] text-[17px] font-extrabold" style={{ backgroundColor: tone.bg }}>
                        {reviewerName(review.customer_name).charAt(0)}
                      </span>
                      <span className="text-[14px] leading-tight">
                        <span className="block font-extrabold">{reviewerName(review.customer_name)}</span>
                        {product ? (
                          <Link href={productHref(product)} className="font-semibold text-[#5A5A5A] underline decoration-[#151515]/30 underline-offset-2 hover:text-[#151515]">
                            on {review.product_name || displayName(product.name)}
                          </Link>
                        ) : review.product_name ? (
                          <span className="font-semibold text-[#5A5A5A]">on {review.product_name}</span>
                        ) : null}
                      </span>
                    </figcaption>
                  </figure>
                )
              })}
            </div>
            <p className="mt-8 text-[14px] font-semibold text-[#3A3A3A]">
              Bought from us?{' '}
              <Link href="/products" className="font-extrabold text-[#151515] underline decoration-2 underline-offset-4">
                Leave a review on the product page
              </Link>{' '}
              — it really helps a small family business.
            </p>
          </section>
        )}

        {/* WhatsApp band */}
        <section aria-labelledby="pop-chat" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <div className="relative overflow-hidden rounded-[32px] border-2 border-[#151515] bg-[#8EE3C0] p-6 shadow-[6px_6px_0_#151515] sm:p-10 lg:p-12">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 hidden h-64 w-64 rounded-full border-2 border-[#151515] bg-[#FFD84D] md:block" />
            <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full border-2 border-[#151515] bg-[#FFD84D] md:hidden" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 right-24 hidden h-40 w-40 rounded-full border-2 border-[#151515] bg-[#FF8FC4] md:block" />
            <div className="relative max-w-2xl">
              <h2 id="pop-chat" className="text-[36px] font-extrabold leading-[0.92] tracking-[-0.045em] sm:text-[56px]">
                Slide into our WhatsApp.
              </h2>
              <p className="mt-4 max-w-lg text-[16px] font-semibold leading-snug sm:text-lg">
                Send us your snack list and order right in the chat. Not sure what to pick? Just ask. Your tracking link comes on WhatsApp too.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={WHATSAPP_ORDER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-[#151515] bg-[#151515] px-6 text-[15px] font-extrabold text-white shadow-[3px_3px_0_#FFF4E2] transition hover:-translate-y-0.5"
                >
                  <MessageCircle size={18} strokeWidth={2.5} /> Chat on WhatsApp
                </a>
                <Link
                  href="/appointment"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-[#151515] bg-white px-6 text-[15px] font-extrabold transition hover:-translate-y-0.5"
                >
                  <Video size={18} strokeWidth={2.5} /> Free video call
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#151515] bg-[#FFF4E2]">
        <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 lg:col-span-1">
              <div className="text-[15px] font-semibold leading-relaxed text-[#3A3A3A]">
                Dry fruits, seeds, herbs and spices from MK and Sons, a family business in Delhi-NCR. Packed fresh to order, delivered across India.
              </div>
              <a
                href={WHATSAPP_ORDER}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#151515] bg-white px-4 text-sm font-extrabold transition hover:-translate-y-0.5"
              >
                <MessageCircle size={17} strokeWidth={2.5} /> WhatsApp us
              </a>
            </div>
            <FooterColumn
              title="Shop"
              links={[
                ['All products', '/products'],
                ['Dry fruits & seeds', '/products?category=dry-fruits'],
                ['Herbs & powders', '/products?category=herbs'],
                ['Whole spices', '/products?category=spices'],
                ['Health kits', '/kits'],
              ]}
            />
            <FooterColumn
              title="Help"
              links={[
                ['Track your order', '/track-order'],
                ['FAQs', '/faq'],
                ['Book a video call', '/appointment'],
                ['My account', '/profile'],
              ]}
            />
            <FooterColumn
              title="Mana"
              links={[
                ['Our story', '/about'],
                ['Blog', '/blog'],
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
              ]}
            />
          </div>

          <div aria-hidden className="mt-10 select-none overflow-hidden pb-3 text-center text-[30vw] font-extrabold leading-[0.8] tracking-[-0.07em] text-[#FF6B2C] [text-shadow:5px_5px_0_#151515] lg:text-[300px] lg:[text-shadow:8px_8px_0_#151515]">
            mana
          </div>

          <div className="flex flex-col gap-2 border-t-2 border-[#151515] py-5 text-[12px] font-semibold text-[#3A3A3A] sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-1.5">
              <Leaf size={14} strokeWidth={2.5} /> © {new Date().getFullYear()} Mana · MK and Sons · Delhi-NCR
            </span>
            <span>UPI · Cards · Net banking · Cash on delivery — secure payments by Razorpay</span>
          </div>
        </div>
      </footer>

      <PopCartBar />
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function BentoProduct({ product, color, note, tall = false }: { product: Product; color: PopColor; note: string; tall?: boolean }) {
  const tone = COLORS[color]
  const name = displayName(product.name)
  const grams = baseGrams(product)
  return (
    <div
      className={`group flex flex-col rounded-[24px] border-2 border-[#151515] p-2.5 shadow-[4px_4px_0_#151515] sm:p-3 ${tall ? 'lg:row-span-2' : ''}`}
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      <Link
        href={productHref(product)}
        className={`relative block overflow-hidden rounded-[18px] border-2 border-[#151515] bg-[#151515] ${tall ? 'aspect-[4/3] lg:aspect-auto lg:min-h-[240px] lg:flex-1' : 'aspect-[4/3] lg:aspect-auto lg:min-h-[150px] lg:flex-1'}`}
      >
        {product.images?.[0] && (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 1024px) 46vw, 300px"
            className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
          />
        )}
        <span className="absolute left-2 top-2 rounded-full border-2 border-[#151515] bg-white px-2 py-px text-[10px] font-extrabold uppercase tracking-wide text-[#151515]">
          {note}
        </span>
      </Link>
      <div className="px-1 pb-0.5 pt-2.5">
        <Link href={productHref(product)} className="line-clamp-2 min-h-[2.5em] text-[15px] font-extrabold leading-tight hover:underline sm:line-clamp-1 sm:min-h-0 sm:text-[16px]">
          {name}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="leading-none">
            <div className="text-[18px] font-extrabold tracking-tight">{formatPrice(priceAt(product, grams))}</div>
            <div className="mt-1 text-[11px] font-bold opacity-80">{gramsLabel(grams)}</div>
          </div>
          <AddControl product={lean(product)} size="sm" />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ id, eyebrow, highlight, children }: { id: string; eyebrow: string; highlight: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="inline-flex -rotate-1 items-center rounded-full border-2 border-[#151515] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em]" style={{ backgroundColor: highlight }}>
        {eyebrow}
      </div>
      <h2 id={id} className="mt-3 text-[38px] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[56px]">
        {children}
      </h2>
    </div>
  )
}

function Marked({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-block rotate-[-1.5deg] rounded-2xl border-2 border-[#151515] px-2.5 pb-1.5 leading-[0.95] shadow-[3px_3px_0_#151515]" style={{ backgroundColor: color }}>
      {children}
    </span>
  )
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[12px] font-extrabold uppercase tracking-[0.12em]">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-[15px] font-semibold text-[#3A3A3A] underline-offset-4 hover:text-[#151515] hover:underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Round "packed fresh" stamp with text running around the edge. */
function Stamp({ className = '' }: { className?: string }) {
  return (
    <span className={`block ${className}`} aria-hidden>
      <span className="relative block h-full w-full">
        <svg viewBox="0 0 120 120" className="pop-spin absolute inset-0 h-full w-full">
          <defs>
            <path id="pop-stamp-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
          </defs>
          <circle cx="60" cy="60" r="59" fill="#151515" />
          <text fill="#FFF4E2" fontSize="11" fontWeight="800" letterSpacing="1.5">
            <textPath href="#pop-stamp-ring" textLength="280" lengthAdjust="spacing">
              PACKED FRESH ✦ NO PRESERVATIVES ✦
            </textPath>
          </text>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-[42%] w-[42%] items-center justify-center rounded-full bg-[#FFD84D] text-[#151515]">
            <Leaf className="h-1/2 w-1/2" strokeWidth={2.5} />
          </span>
        </span>
      </span>
    </span>
  )
}
