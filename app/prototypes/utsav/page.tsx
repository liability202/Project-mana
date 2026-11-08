import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Mukta, Rozha_One } from 'next/font/google'
import { BadgePercent, Banknote, Check, Eye, FlaskConical, MessageCircle, PackageCheck, Star, Truck, Video } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { FREE_SHIPPING_THRESHOLD, formatPrice, whatsappUrl } from '@/lib/utils'
import { getCatalog, getPublicReviews, lean, reviewerName } from '../_lib/catalog'
import { priceAt } from '../_lib/shared'
import { CorporateEnquiry, GiftBoxBuilder, GiftSets, UtsavCartButton, UtsavSearch, type GiftSetView } from './client'
import { BOX_PICKS, BOX_STARTERS, GIFT_SETS, HERO_PICKS, OCCASIONS } from './data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Utsav · Mana prototype',
}

const displayFont = Rozha_One({ subsets: ['latin', 'devanagari'], weight: '400', display: 'swap', variable: '--utsav-display' })
const bodyFont = Mukta({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--utsav-body' })

const display = '[font-family:var(--utsav-display)]'

export default async function UtsavPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)

  const sets: GiftSetView[] = GIFT_SETS.map(recipe => {
    const items = recipe.items
      .map(item => ({ product: catalog.pick([item.keyword])[0], grams: item.grams }))
      .filter((item): item is { product: Product; grams: number } => Boolean(item.product))
      .map(item => ({ product: lean(item.product), grams: item.grams }))
    return { id: recipe.id, name: recipe.name, label: recipe.label, line: recipe.line, occasions: recipe.occasions, items }
  }).filter(set => set.items.length >= 2)

  const boxPicks = catalog.pick(BOX_PICKS).map(lean)
  const starters = catalog.pick(BOX_STARTERS).map(product => product.id)
  const [heroLeft, heroCentre, heroRight] = catalog.pick(HERO_PICKS)
  const classic = sets.find(set => set.id === 'classic-four')
  const classicTotal = classic ? classic.items.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0) : 0
  const cheapestSet = sets.length ? Math.min(...sets.map(set => set.items.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0))) : 0

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#FFF6E6] text-[#2B0F14] antialiased [font-family:var(--utsav-body)]`}>
      {/* Thin festive strip */}
      <div className="bg-[#470817] px-4 py-2 text-center text-[12px] font-medium tracking-wide text-[#F3DDB0] sm:text-[13px]">
        <span className="text-[#F2A007]">✦</span> Festive &amp; wedding gifting <span className="mx-1.5 text-[#F2A007]">·</span> Free delivery above {formatPrice(FREE_SHIPPING_THRESHOLD)}
        <span className="hidden sm:inline">
          {' '}
          <span className="mx-1.5 text-[#F2A007]">·</span> Cash on delivery available
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E9D3A6] bg-[#FFF6E6]/95 backdrop-blur-sm">
        <div className="relative mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/prototypes/utsav" className="flex shrink-0 flex-col leading-none" aria-label="Mana home">
            <span className={`${display} text-[30px] leading-none text-[#5E0B1E]`}>Mana</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A6326]">by MK and Sons</span>
          </Link>
          <nav aria-label="Gifting" className="ml-8 hidden items-center gap-1 text-[15px] font-semibold text-[#4A2A22] lg:flex">
            {[
              ['Gift sets', '#sets'],
              ['Build a box', '#box'],
              ['Corporate', '#corporate'],
              ['Shop all', '/products'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="rounded-full px-3.5 py-2 transition hover:bg-[#F6E3C2] hover:text-[#5E0B1E]">
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <UtsavSearch />
            <a
              href={whatsappUrl('Hi Mana! I would like help choosing a gift.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[#5E0B1E] transition hover:bg-[#F6E3C2] sm:inline-flex"
            >
              <MessageCircle size={20} />
            </a>
            <UtsavCartButton />
          </div>
        </div>
      </header>
      {/* Phone shortcuts (scroll away; only the header row sticks) */}
      <nav aria-label="Gifting shortcuts" className="border-b border-[#F0DFBC] bg-[#FFF6E6] lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1.5 text-[14px] font-semibold text-[#4A2A22] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            ['Gift sets', '#sets'],
            ['Build a box', '#box'],
            ['Corporate', '#corporate'],
            ['Shop all', '/products'],
            ['Health kits', '/kits'],
          ].map(([label, href]) => (
            <a key={label} href={href} className="shrink-0 rounded-full px-3 py-1.5 transition hover:bg-[#F6E3C2]">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#7A1430_0%,#5E0B1E_48%,#470817_100%)] text-[#FFF6E6]">
          <Jaali id="hero" className="absolute inset-0 h-full w-full opacity-[0.11]" />
          <Toran className="absolute inset-x-0 top-0 h-[60px] w-full sm:h-[72px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-20 lg:pt-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C99A3C]/50 bg-[#470817]/60 px-3.5 py-1.5 text-[13px] font-medium text-[#F3DDB0]">
                <span className={`${display} text-[15px] text-[#F2A007]`}>उत्सव</span>
                <span className="h-3 w-px bg-[#C99A3C]/60" />
                Festive &amp; wedding gifting
              </div>
              <h1 className={`${display} mt-5 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem]`}>
                Gift mewa that <span className="text-[#F2A007]">says it for you.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#F3DDB0] sm:text-lg">
                Handpicked dry fruits in our signature black-and-gold pouches. Pick a ready-made gift set, or build your own box in a minute.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#sets"
                  className="inline-flex h-[52px] items-center justify-center rounded-full bg-[#F2A007] px-7 text-[16px] font-bold text-[#2B0F14] shadow-[0_14px_30px_-12px_rgba(242,160,7,0.7)] transition hover:bg-[#FFB21F]"
                >
                  Shop gift sets{cheapestSet ? ` · from ${formatPrice(cheapestSet)}` : ''}
                </a>
                <a
                  href="#box"
                  className="inline-flex h-[52px] items-center justify-center rounded-full border border-[#C99A3C] px-7 text-[16px] font-bold text-[#FFF6E6] transition hover:bg-white/10"
                >
                  Build your own box
                </a>
              </div>
              <ul className="mt-7 grid max-w-xl grid-cols-3 gap-2 text-[12px] leading-tight text-[#F3DDB0] sm:text-[13px]">
                <li className="flex items-center gap-2">
                  <Truck size={18} className="shrink-0 text-[#F2A007]" /> Free delivery above {formatPrice(FREE_SHIPPING_THRESHOLD)}
                </li>
                <li className="flex items-center gap-2">
                  <Banknote size={18} className="shrink-0 text-[#F2A007]" /> Cash on delivery
                </li>
                <li className="flex items-center gap-2">
                  <BadgePercent size={18} className="shrink-0 text-[#F2A007]" /> 5% cashback
                </li>
              </ul>
            </div>

            {/* Fanned arches */}
            <div className="relative mx-auto h-[330px] w-full max-w-[420px] sm:h-[420px] lg:h-[500px] lg:max-w-[520px]">
              <Sparkle className="absolute left-[4%] top-[4%] h-6 w-6 text-[#F2A007]" />
              <Sparkle className="absolute right-[6%] top-[0%] h-4 w-4 text-[#E9C77F]" />
              <Sparkle className="absolute bottom-[10%] right-[2%] h-5 w-5 text-[#F2A007]" />
              {heroLeft && <Arch product={heroLeft} className="left-[3%] top-[16%] h-[66%] w-[34%] -rotate-[9deg]" sizes="(max-width: 1024px) 34vw, 180px" />}
              {heroRight && <Arch product={heroRight} className="right-[3%] top-[16%] h-[66%] w-[34%] rotate-[9deg]" sizes="(max-width: 1024px) 34vw, 180px" />}
              {heroCentre && (
                <Arch product={heroCentre} priority className="left-1/2 top-[2%] z-10 h-[82%] w-[42%] -translate-x-1/2" sizes="(max-width: 1024px) 42vw, 230px" />
              )}
              {classic && classicTotal > 0 && (
                <a
                  href="#sets"
                  className="absolute bottom-[1%] left-1/2 z-20 flex -translate-x-1/2 rotate-[-3deg] items-center gap-3 rounded-2xl bg-[#FFF6E6] py-2.5 pl-3 pr-4 text-[#2B0F14] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.7)] ring-1 ring-[#C99A3C] transition hover:rotate-0"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[#C99A3C] bg-[#5E0B1E]" aria-hidden />
                  <span className="leading-tight">
                    <span className="block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6326]">{classic.name}</span>
                    <span className="block whitespace-nowrap text-[15px] font-bold">
                      {classic.items.length} × 250 g · {formatPrice(classicTotal)}
                    </span>
                  </span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Ready-made gift sets */}
        <section id="sets" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Ready-made gift sets"
              title="Hand-matched sets, priced live"
              sub="Pick the occasion, then add the whole set in one tap. Every price comes straight from today’s catalogue."
            />
            <div className="mt-8">
              <GiftSets sets={sets} occasions={OCCASIONS} />
            </div>
          </div>
        </section>

        {/* Build your own box */}
        <section id="box" className="relative scroll-mt-28 overflow-hidden bg-[#F8EBD3] px-4 py-16 sm:px-6 sm:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F2A007]/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Build your own gift box"
              title="Their favourites, your box"
              sub="Choose 4 or 6 dry fruits and a pack size. The price updates as you go, and the whole box goes into your cart in one tap."
            />
            <div className="mt-10">
              <GiftBoxBuilder picks={boxPicks} starters={starters} />
            </div>
          </div>
        </section>

        {/* Corporate & bulk gifting */}
        <section id="corporate" className="relative scroll-mt-28 overflow-hidden bg-[#5E0B1E] px-4 py-16 text-[#FFF6E6] sm:px-6 sm:py-20">
          <Jaali id="corporate" className="absolute inset-0 h-full w-full opacity-[0.09]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#F2A007]">Corporate &amp; bulk gifting</div>
              <h2 className={`${display} mt-3 text-balance text-[2.4rem] leading-[1.05] sm:text-5xl`}>Gifting for your team or clients?</h2>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#F3DDB0]">
                Tell us the headcount and budget, and we put together custom hampers for Diwali, events and teams. Bulk orders are welcome too.
              </p>
              <ul className="mt-6 space-y-3 text-[15px] text-[#FFF6E6]">
                {[
                  'Hampers built around your budget per gift',
                  'Pricing and dispatch timelines planned with you on WhatsApp',
                  'Delivered across India, with tracking sent on WhatsApp',
                ].map(line => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F2A007] text-[#2B0F14]">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href="/appointment"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#C99A3C] px-6 text-[15px] font-bold text-[#FFF6E6] transition hover:bg-white/10"
              >
                <Video size={18} /> See products on a free video call
              </Link>
            </div>
            <CorporateEnquiry />
          </div>
        </section>

        {/* Why Mana gifts well */}
        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Why Mana makes a good gift" title="Chosen with care, packed when you order" />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Eye, title: 'Handpicked & graded by hand', text: 'Every batch is visually graded. Undersized or off-colour pieces never make it into a Mana pack.' },
                { icon: FlaskConical, title: 'Lab tested, FSSAI licensed', text: 'Batches are quality checked before dispatch by MK and Sons, an FSSAI licensed family business.' },
                { icon: PackageCheck, title: 'Packed fresh to order', text: 'Sealed in our black-and-gold pouch when you order. No preservatives, ever.' },
                { icon: Truck, title: 'Delivered across India', text: '2–3 days in Delhi-NCR, 5–7 days elsewhere, with tracking on WhatsApp. Order a few days early.' },
              ].map(card => (
                <div key={card.title} className="flex gap-4 rounded-[24px] border border-[#EAD5AA] bg-[#FFFDF8] p-5 sm:block sm:p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5E0B1E] text-[#F2A007]">
                    <card.icon size={22} />
                  </span>
                  <div>
                    <h3 className={`${display} text-[1.25rem] leading-tight text-[#5E0B1E] sm:mt-4 sm:text-[1.35rem]`}>{card.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#5A3A30] sm:mt-2">{card.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[14px] text-[#6B4A3F]">
              Pay by UPI, card, net banking or cash on delivery · 5% of every order comes back as cashback after delivery
            </p>
          </div>
        </section>

        {/* Reviews (real, approved reviews only) */}
        {reviews.length > 0 && (
          <section className="bg-[#F8EBD3] px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-5xl">
              <SectionHeading eyebrow="Reviews" title="Kind words from customers" />
              <div className={`mx-auto mt-10 grid gap-5 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'max-w-4xl md:grid-cols-2' : 'max-w-xl'}`}>
                {reviews.map(review => (
                  <figure key={review.id} className="relative flex flex-col overflow-hidden rounded-[24px] border border-[#EAD5AA] bg-[#FFFDF8] p-6">
                    <span aria-hidden className={`${display} absolute right-5 top-2 text-7xl leading-none text-[#C99A3C]/35`}>“</span>
                    <div className="flex gap-0.5 text-[#F2A007]" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={16} fill={index < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    {review.title && <div className="mt-3 font-bold text-[#2B0F14]">{review.title}</div>}
                    <blockquote className="mt-2 flex-1 text-[16px] leading-relaxed text-[#4A2A22]">{review.body}</blockquote>
                    <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-[#E2C994] pt-4 text-[14px]">
                      <span className="font-bold text-[#2B0F14]">{reviewerName(review.customer_name)}</span>
                      {review.product_name && (
                        <Link href={`/products/${review.product_slug}`} className="truncate text-[#8A6326] hover:underline">
                          on {review.product_name}
                        </Link>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-6 text-center text-[14px] text-[#6B4A3F]">
                Bought from us?{' '}
                <Link href="/products" className="font-semibold text-[#5E0B1E] underline underline-offset-2">
                  Share a review on the product page
                </Link>
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-[#470817] px-4 pb-10 pt-14 text-[#F3DDB0] sm:px-6">
        <Jaali id="footer" className="absolute inset-0 h-full w-full opacity-[0.06]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
            <div>
              <div className={`${display} text-[2.2rem] leading-none text-[#FFF6E6]`}>Mana</div>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#F3DDB0]/85">
                Handpicked dry fruits, herbs and spices from MK and Sons, a family business in Delhi-NCR. Packed fresh to order and delivered across India.
              </p>
              <a
                href={whatsappUrl('Hi Mana! I would like help with a gift order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-[14px] font-bold text-[#0B3B22] transition hover:brightness-95"
              >
                <MessageCircle size={17} /> WhatsApp us
              </a>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <FooterColumn
                title="Gifting"
                links={[
                  ['Gift sets', '#sets'],
                  ['Build a box', '#box'],
                  ['Corporate gifting', '#corporate'],
                  ['Health kits', '/kits'],
                ]}
              />
              <FooterColumn
                title="Shop"
                links={[
                  ['Dry fruits', '/products?category=dry-fruits'],
                  ['Herbs', '/products?category=herbs'],
                  ['Spices', '/products?category=spices'],
                  ['All products', '/products'],
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
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-[#C99A3C]/30 pt-6 text-[13px] text-[#F3DDB0]/75 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Mana · MK and Sons, Delhi-NCR</span>
            <span>Secure payments by Razorpay · UPI · Cards · Net banking · Cash on delivery</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="flex items-center justify-center gap-3 text-[12px] font-bold uppercase tracking-[0.2em] text-[#8A6326]">
        <span className="h-px w-8 bg-[#C99A3C]" aria-hidden />
        {eyebrow}
        <span className="h-px w-8 bg-[#C99A3C]" aria-hidden />
      </div>
      <h2 className={`${display} mt-3 text-balance text-[2.2rem] leading-[1.08] text-[#5E0B1E] sm:text-[2.9rem]`}>{title}</h2>
      {sub && <p className="mt-3 text-[16px] leading-relaxed text-[#6B4A3F] sm:text-[17px]">{sub}</p>}
    </div>
  )
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#F2A007]">{title}</div>
      <ul className="mt-3 space-y-2 text-[15px]">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-[#F3DDB0]/85 transition hover:text-[#FFF6E6]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Arch({ product, className, sizes, priority = false }: { product: Product; className: string; sizes: string; priority?: boolean }) {
  return (
    <div className={`absolute rounded-t-full border-2 border-[#C99A3C] bg-[#2A0710] p-1.5 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.75)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-t-full">
        {product.images?.[0] && <Image src={product.images[0]} alt={product.name} fill priority={priority} sizes={sizes} className="object-cover" />}
      </div>
    </div>
  )
}

/** A marigold-and-mango-leaf toran hanging along the top edge. */
function Toran({ className = '' }: { className?: string }) {
  return (
    <svg className={className} aria-hidden>
      <defs>
        <pattern id="utsav-toran" width="96" height="72" patternUnits="userSpaceOnUse">
          <path d="M0 5 Q48 30 96 5" fill="none" stroke="#C99A3C" strokeWidth="1.6" />
          {/* swag flowers */}
          {[
            [0, 5],
            [96, 5],
            [24, 15],
            [72, 15],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="6.5" fill="#F2A007" />
              <circle cx={x} cy={y} r="5" fill="none" stroke="#D97706" strokeWidth="2.4" strokeDasharray="1.6 1.4" />
              <circle cx={x} cy={y} r="1.8" fill="#9A4A00" />
            </g>
          ))}
          {/* hanging strand */}
          <line x1="48" y1="17" x2="48" y2="56" stroke="#C99A3C" strokeWidth="1.2" />
          {[29, 39, 49].map(y => (
            <g key={y}>
              <circle cx="48" cy={y} r="4.8" fill={y === 39 ? '#E85D04' : '#F2A007'} />
              <circle cx="48" cy={y} r="3.4" fill="none" stroke="#B45309" strokeWidth="1.6" strokeDasharray="1.2 1.1" />
            </g>
          ))}
          <path d="M48 55 C55 61 54 67 48 71 C42 67 41 61 48 55Z" fill="#2F7D32" />
          <path d="M48 56 L48 70" stroke="#A7D3A0" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#utsav-toran)" />
    </svg>
  )
}

/** A soft jaali (lattice) of interlocking circles for the maroon sections. */
function Jaali({ id, className = '' }: { id: string; className?: string }) {
  return (
    <svg className={className} aria-hidden>
      <defs>
        <pattern id={`utsav-jaali-${id}`} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="22" fill="none" stroke="#E9C77F" strokeWidth="1" />
          <circle cx="44" cy="0" r="22" fill="none" stroke="#E9C77F" strokeWidth="1" />
          <circle cx="0" cy="44" r="22" fill="none" stroke="#E9C77F" strokeWidth="1" />
          <circle cx="44" cy="44" r="22" fill="none" stroke="#E9C77F" strokeWidth="1" />
          <circle cx="22" cy="22" r="22" fill="none" stroke="#E9C77F" strokeWidth="1" />
          <circle cx="22" cy="22" r="2" fill="#E9C77F" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#utsav-jaali-${id})`} />
    </svg>
  )
}

function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" />
    </svg>
  )
}
