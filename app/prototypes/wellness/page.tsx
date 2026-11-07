import Image from 'next/image'
import Link from 'next/link'
import { DM_Sans, Fraunces } from 'next/font/google'
import {
  ArrowRight,
  ArrowUpRight,
  Droplet,
  Dumbbell,
  Flower2,
  HeartPulse,
  Leaf,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Sprout,
  Star,
  Sun,
  Truck,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { formatPrice, whatsappUrl } from '@/lib/utils'
import {
  BRAND,
  cardPrice,
  displayName,
  fromPrice,
  getCatalog,
  getPublicReviews,
  kitBenefits,
  kitContents,
  lean,
  productHref,
  productLabels,
  reviewerName,
} from '../_lib/catalog'
import { WellnessAddButton, WellnessCartButton } from './client'

/*
 * Prototype C — "Wellness".
 * Calm, editorial, Ayurveda-forward: shop by goal, build-your-own kits,
 * an apothecary shelf of herbs. Typeset in Fraunces + DM Sans.
 * Palette: cream #F7F2E8 · sand #EFE6D5 · sage #DCE5D2 · forest #1E3A2B / #2E5641 ·
 *          turmeric #E0A43A · clay #B4532A · ink #24231F · muted #6E6A60
 */

const display = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--well-display' })
const body = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--well-body' })

export const revalidate = 300

const serif = '[font-family:var(--well-display)]'

const NAV = [
  { label: 'Shop by goal', href: '#goals' },
  { label: 'Herbs', href: '/products?category=herbs' },
  { label: 'Health kits', href: '/kits' },
  { label: 'Dry fruits', href: '/products?category=dry-fruits' },
  { label: 'Our story', href: '/about' },
]

type Goal = { title: string; line: string; icon: LucideIcon; tint: string; ink: string; kit?: string; items: string[] }

/* Traditional uses only — no cure or treatment claims. */
const GOALS: Goal[] = [
  { title: 'Strength & stamina', line: 'Protein-rich seeds and classic Ayurvedic tonics.', icon: Dumbbell, tint: '#F3E3C3', ink: '#9A6512', kit: 'gym kit', items: ['safed musli', 'ashwagandha', 'pumpkin'] },
  { title: 'Hair care', line: 'Hibiscus, reetha and shikakai — the traditional hair wash.', icon: Flower2, tint: '#F4DCD2', ink: '#B4532A', kit: 'hair care kit', items: ['hibiscus', 'reetha', 'shikakai'] },
  { title: 'Sugar care', line: 'Jamun guthli, karela seeds and chirata, as used in Ayurveda.', icon: Droplet, tint: '#E4E1EF', ink: '#5D4F8A', kit: 'sugar', items: ['jamun', 'karela', 'chirata'] },
  { title: 'Daily energy', line: 'A spoonful of seeds a day — chia, flax and sunflower.', icon: Zap, tint: '#FBE9C0', ink: '#A87308', kit: 'super seeds', items: ['chia', 'flex', 'sunflower'] },
  { title: 'Digestion', line: 'Triphala and mulethi — Ayurvedic staples for every day.', icon: Leaf, tint: '#DCE5D2', ink: '#2E5641', items: ['triphala', 'mulethi', 'star anais'] },
  { title: 'Heart care', line: 'Arjun chhal and walnuts, long valued in Indian kitchens.', icon: HeartPulse, tint: '#F3D6D3', ink: '#A43D35', items: ['arjun', 'walnut kernel', 'flex'] },
  { title: 'Summer cooling', line: 'Gond katira, sabja and rose petals for hot days.', icon: Sun, tint: '#D6E7EA', ink: '#2B6E7C', kit: 'cool summer', items: ['gond katira', 'sabja', 'rose petals'] },
  { title: 'Immunity', line: 'Moringa, amla and kasturi haldi in your daily routine.', icon: ShieldCheck, tint: '#E2E9CF', ink: '#56701C', items: ['moringa', 'amla', 'kasturi'] },
]

/** "Hibiscus (Gudhal) Flower" → "Hibiscus Flower"; "Black Pepper / Kali Mirch" → "Black Pepper". */
function shortName(name: string) {
  return displayName(name).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\/.*$/, '').replace(/\s+/g, ' ').trim()
}

/** The Hindi name in brackets or after a slash, if there is one. */
function localName(name: string) {
  const clean = displayName(name)
  return clean.match(/\(([^)]+)\)/)?.[1] || clean.split(' / ')[1] || ''
}

export default async function WellnessPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 3)

  const goals = GOALS.map(goal => ({
    ...goal,
    kitProduct: goal.kit ? catalog.pick([goal.kit], catalog.kits)[0] : undefined,
    products: catalog.pick(goal.items),
  }))
  const spotlight = catalog.pick(['hair care kit'], catalog.kits)[0] || catalog.kits[0]
  const otherKits = catalog.kits.filter(kit => kit.id !== spotlight?.id).slice(0, 4)
  const apothecary = catalog.pick(['moringa', 'ashwagandha', 'triphala', 'satavari', 'arjun', 'bhrami', 'kasturi', 'amla'])
  const pantry = catalog.pick(['almond', 'walnut kernel', 'makhana', 'anjeer', 'chia', 'pista'])
  const heroPick = catalog.pick(['moringa'])[0]

  return (
    <div className={`${display.variable} ${body.variable} min-h-screen bg-[#F7F2E8] text-[#24231F] antialiased [font-family:var(--well-body)]`}>
      {/* Announcement */}
      <div className="bg-[#1E3A2B] px-4 py-2 text-center text-[11px] tracking-wide text-[#F7F2E8]/90 sm:text-xs">
        Free delivery above ₹999 <span className="mx-2 text-[#E0A43A]">✦</span> Cash on delivery
        <span className="hidden sm:inline"> <span className="mx-2 text-[#E0A43A]">✦</span> 5% cashback on every order</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#24231F]/10 bg-[#F7F2E8]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/prototypes/wellness" className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="" width={36} height={36} className="h-9 w-9 object-contain mix-blend-multiply" />
            <span className="leading-none">
              <span className={`${serif} block text-2xl font-semibold text-[#1E3A2B]`}>Mana</span>
              <span className="block text-[10px] tracking-[0.14em] text-[#6E6A60]">AYURVEDA · DRY FRUITS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map(item => (
              <Link key={item.label} href={item.href} className="text-sm text-[#24231F]/75 transition hover:text-[#1E3A2B]">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/products" aria-label="Search products" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1E3A2B] transition hover:bg-[#1E3A2B]/5">
              <Search size={19} />
            </Link>
            <a href={whatsappUrl('Hi Mana! I would like some help choosing products.')} target="_blank" rel="noopener noreferrer" className="hidden h-9 items-center gap-2 rounded-full border border-[#1E3A2B]/25 px-4 text-xs font-semibold text-[#1E3A2B] transition hover:border-[#1E3A2B] sm:inline-flex">
              <MessageCircle size={14} /> Ask us on WhatsApp
            </a>
            <WellnessCartButton />
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm text-[#24231F]/75 lg:hidden [scrollbar-width:none]">
          {NAV.map(item => (
            <Link key={item.label} href={item.href} className="shrink-0">{item.label}</Link>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#B4532A]">
            <Sprout size={15} /> ROOTED IN AYURVEDA
          </div>
          <h1 className={`${serif} mt-5 text-[2.9rem] font-medium leading-[1.02] tracking-[-0.02em] text-[#1E3A2B] sm:text-6xl lg:text-[4.6rem]`}>
            Everyday wellness, <em className="font-normal text-[#B4532A]">from nature&apos;s pantry.</em>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6E6A60] sm:text-lg">
            Ayurvedic herbs, superfood seeds and premium dry fruits — handpicked, sourced directly from growers and packed fresh to order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#goals" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1E3A2B] px-7 text-sm font-semibold text-[#F7F2E8] transition hover:bg-[#2E5641]">
              Shop by goal <ArrowRight size={16} />
            </Link>
            <Link href="/kits" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#1E3A2B]/30 px-7 text-sm font-semibold text-[#1E3A2B] transition hover:border-[#1E3A2B]">
              Build a health kit
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-[#24231F]/10 pt-6">
            {[
              [catalog.herbs.length, 'Ayurvedic herbs'],
              [catalog.kits.length, 'Health kits'],
              [catalog.dryFruits.length, 'Dry fruits & seeds'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className={`${serif} text-3xl font-medium text-[#1E3A2B]`}>{value}</dd>
                <dd className="mt-0.5 text-xs text-[#6E6A60]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-[86%] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] bg-[#EFE6D5] shadow-[0_40px_80px_-30px_rgba(30,58,43,0.45)]">
            <Image src={BRAND.categories.herbs} alt="Ayurvedic herbs in a brass mortar" fill priority sizes="(max-width: 1024px) 80vw, 40vw" className="object-cover" />
          </div>
          <div className="absolute -left-1 top-10 flex h-24 w-24 rotate-[-8deg] flex-col items-center justify-center rounded-full bg-[#E0A43A] text-center text-[#24231F] shadow-lg sm:h-28 sm:w-28">
            <PackageCheck size={20} />
            <span className="mt-1 text-[10px] font-bold leading-tight tracking-wide sm:text-[11px]">PACKED FRESH<br />TO ORDER</span>
          </div>
          {heroPick && (
            <div className="absolute -bottom-6 right-0 flex w-[88%] items-center gap-3 rounded-3xl bg-[#FFFDF8] p-3 shadow-[0_20px_50px_-20px_rgba(36,35,31,0.35)] sm:right-2 sm:w-[21rem]">
              <Link href={productHref(heroPick)} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#EFE6D5]">
                <Image src={heroPick.images[0]} alt={displayName(heroPick.name)} fill sizes="64px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold tracking-[0.14em] text-[#B4532A]">DAILY RITUAL</div>
                <div className={`${serif} line-clamp-2 text-base leading-tight sm:text-lg`}>{displayName(heroPick.name)}</div>
                <div className="text-xs text-[#6E6A60]">{formatPrice(cardPrice(heroPick).price)} · {cardPrice(heroPick).unit}</div>
              </div>
              <WellnessAddButton product={lean(heroPick)} size="sm" />
            </div>
          )}
        </div>
      </section>

      {/* Shop by goal */}
      <section id="goals" className="scroll-mt-24 bg-[#EFE6D5] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="text-xs font-semibold tracking-[0.18em] text-[#B4532A]">SHOP BY GOAL</div>
            <h2 className={`${serif} mt-3 text-4xl font-medium text-[#1E3A2B] sm:text-5xl`}>What are you looking after?</h2>
            <p className="mt-3 text-[#6E6A60]">Pick a goal to see the traditional ingredients — and the kit that brings them together.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map(({ title, line, icon: Icon, tint, ink, kitProduct, products }) => {
              const cta = kitProduct || products[0]
              return (
                <div key={title} className="flex flex-col rounded-[1.75rem] bg-[#FFFDF8] p-6 ring-1 ring-[#24231F]/5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(36,35,31,0.35)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: tint, color: ink }}>
                    <Icon size={22} />
                  </span>
                  <h3 className={`${serif} mt-5 text-2xl font-medium leading-tight`}>{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6E6A60]">{line}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {products.map(product => (
                      <Link key={product.id} href={productHref(product)} className="rounded-full border border-[#24231F]/10 px-2.5 py-1 text-xs text-[#24231F]/80 transition hover:border-[#1E3A2B] hover:text-[#1E3A2B]">
                        {shortName(product.name)}
                      </Link>
                    ))}
                  </div>
                  {cta && (
                    <Link href={productHref(cta)} className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold" style={{ color: ink }}>
                      {kitProduct ? `Shop the ${shortName(kitProduct.name).toLowerCase().replace(/ pack$/, '')}` : `Shop ${shortName(cta.name).toLowerCase()}`}
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-[#6E6A60]">
            These are traditional Ayurvedic ingredients, not medicines. Please check with your doctor if you are pregnant, take regular medication or are managing a health condition.
          </p>
        </div>
      </section>

      {/* Kit spotlight */}
      {spotlight && (
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid overflow-hidden rounded-[2rem] bg-[#1E3A2B] text-[#F7F2E8] lg:grid-cols-2">
              <Link href={productHref(spotlight)} className="relative block aspect-[4/3] lg:aspect-auto lg:min-h-[480px]">
                {spotlight.images?.[0] && <Image src={spotlight.images[0]} alt={displayName(spotlight.name)} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />}
              </Link>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <div className="text-xs font-semibold tracking-[0.18em] text-[#E0A43A]">BUILD-YOUR-OWN KIT</div>
                <h2 className={`${serif} mt-3 text-4xl font-medium sm:text-5xl`}>{displayName(spotlight.name)}</h2>
                {kitBenefits(spotlight, 3).length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {kitBenefits(spotlight, 3).map(benefit => (
                      <li key={benefit} className="flex gap-3 text-[15px] leading-relaxed text-[#F7F2E8]/80">
                        <Leaf size={17} className="mt-1 shrink-0 text-[#E0A43A]" /> {benefit}
                      </li>
                    ))}
                  </ul>
                )}
                {kitContents(spotlight).length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs font-semibold tracking-[0.14em] text-[#F7F2E8]/60">WHAT&apos;S INSIDE</div>
                    <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                      {kitContents(spotlight).map(item => (
                        <li key={item.name} className="flex items-baseline gap-2 text-[15px]">
                          <Leaf size={14} className="shrink-0 translate-y-0.5 text-[#E0A43A]" />
                          <span>{shortName(item.name)}{item.grams > 0 && <span className="ml-1 text-xs text-[#F7F2E8]/55">{item.grams} g</span>}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-7 flex flex-wrap gap-2">
                  {(spotlight.variants || []).filter((variant: { price?: number }) => Number(variant?.price) > 0).map((variant: { id: string; name: string; price: number }) => (
                    <span key={variant.id} className="rounded-full border border-[#F7F2E8]/20 px-4 py-2 text-sm">
                      {variant.name} <span className="ml-1 font-semibold text-[#E0A43A]">{formatPrice(variant.price)}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#F7F2E8]/60">Pick powder or whole, keep what you like and set each quantity — packed fresh for you.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={productHref(spotlight)} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#E0A43A] px-7 text-sm font-semibold text-[#24231F] transition hover:bg-[#EDB858]">
                    Customise this kit <ArrowRight size={16} />
                  </Link>
                  <Link href="/kits" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#F7F2E8]/25 px-7 text-sm font-semibold transition hover:border-[#F7F2E8]/60">
                    All {catalog.kits.length} kits
                  </Link>
                </div>
              </div>
            </div>

            {otherKits.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {otherKits.map(kit => (
                  <Link key={kit.id} href={productHref(kit)} className="group flex items-center gap-3 rounded-3xl bg-[#FFFDF8] p-3 ring-1 ring-[#24231F]/5 transition hover:ring-[#1E3A2B]/30">
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#EFE6D5] sm:h-20 sm:w-20">
                      {kit.images?.[0] && <Image src={kit.images[0]} alt="" fill sizes="80px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`${serif} block text-base leading-tight sm:text-lg`}>{displayName(kit.name)}</span>
                      <span className="mt-1 block text-xs text-[#6E6A60]">from <span className="font-semibold text-[#1E3A2B]">{formatPrice(fromPrice(kit))}</span></span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Apothecary */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-[#B4532A]">THE APOTHECARY</div>
              <h2 className={`${serif} mt-3 text-4xl font-medium text-[#1E3A2B] sm:text-5xl`}>Herbs &amp; powders</h2>
            </div>
            <Link href="/products?category=herbs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E3A2B]">
              All {catalog.herbs.length} herbs <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {apothecary.map(product => <ApothecaryCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      {/* Pantry */}
      <section className="bg-[#DCE5D2] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-[#2E5641]">DAILY NOURISHMENT</div>
              <h2 className={`${serif} mt-3 text-4xl font-medium text-[#1E3A2B] sm:text-5xl`}>Dry fruits &amp; seeds</h2>
            </div>
            <Link href="/products?category=dry-fruits" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E3A2B]">
              Shop all <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pantry.map(product => {
              const { price, unit } = cardPrice(product)
              const [label] = productLabels(product, 1)
              return (
                <div key={product.id} className="flex items-center gap-4 rounded-[1.75rem] bg-[#FFFDF8] p-3 pr-4">
                  <Link href={productHref(product)} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-[#EFE6D5] sm:h-28 sm:w-28">
                    <Image src={product.images[0]} alt={displayName(product.name)} fill sizes="112px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    {label && <div className="text-[10px] font-semibold tracking-[0.14em] text-[#B4532A]">{label.toUpperCase()}</div>}
                    <Link href={productHref(product)} className={`${serif} mt-0.5 block text-xl leading-tight hover:text-[#2E5641]`}>{shortName(product.name)}</Link>
                    <div className="mt-1 text-xs text-[#6E6A60]">{formatPrice(price)} · {unit}</div>
                    <div className="mt-3"><WellnessAddButton product={lean(product)} size="sm" /></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our way */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-[#B4532A]">OUR WAY</div>
              <h2 className={`${serif} mt-3 text-4xl font-medium leading-tight text-[#1E3A2B] sm:text-5xl`}>A family pansari, <em className="font-normal">now at your door.</em></h2>
              <p className="mt-5 max-w-md leading-relaxed text-[#6E6A60]">
                Mana is the online home of MK and Sons — a family-run dry fruits, herbs and spices business in Delhi-NCR, with decades of direct relationships with growers in Kashmir, Kerala, Madhya Pradesh and beyond.
              </p>
              <Link href="/about" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E3A2B] underline-offset-4 hover:underline">
                Read our story <ArrowRight size={15} />
              </Link>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Sprout, title: 'Sourced directly', text: 'Straight from farmers and orchards we have worked with for decades.' },
                { icon: ShieldCheck, title: 'Handpicked & checked', text: 'Every batch is quality checked before it is dispatched.' },
                { icon: PackageCheck, title: 'Packed fresh to order', text: 'Sealed in our signature pouch when you order, so it reaches you fresh.' },
                { icon: Truck, title: 'Delivered to you', text: 'Free delivery above ₹999 across India. Cash on delivery available.' },
              ].map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="rounded-[1.75rem] bg-[#FFFDF8] p-6 ring-1 ring-[#24231F]/5">
                  <div className="flex items-center justify-between">
                    <Icon size={22} className="text-[#2E5641]" />
                    <span className={`${serif} text-2xl text-[#24231F]/15`}>0{index + 1}</span>
                  </div>
                  <div className={`${serif} mt-4 text-xl font-medium`}>{title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6E6A60]">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Reviews (real, approved reviews only) */}
      {reviews.length > 0 && (
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <div className="text-xs font-semibold tracking-[0.18em] text-[#B4532A]">FROM OUR CUSTOMERS</div>
              <h2 className={`${serif} mt-3 text-4xl font-medium text-[#1E3A2B] sm:text-5xl`}>Kind words</h2>
            </div>
            <div className={`mx-auto grid gap-4 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'max-w-4xl md:grid-cols-2' : 'max-w-xl'}`}>
              {reviews.map(review => (
                <figure key={review.id} className="rounded-[1.75rem] bg-[#FFFDF8] p-7 ring-1 ring-[#24231F]/5">
                  <div className="flex gap-0.5 text-[#E0A43A]">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  <blockquote className={`${serif} mt-4 text-xl leading-snug`}>&ldquo;{review.title || review.body}&rdquo;</blockquote>
                  {review.title && <p className="mt-2 text-sm leading-relaxed text-[#6E6A60]">{review.body}</p>}
                  <figcaption className="mt-5 text-xs text-[#6E6A60]">
                    <span className="font-semibold text-[#24231F]">{reviewerName(review.customer_name)}</span>
                    {review.product_name && <> · {review.product_name}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Help */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[2rem] bg-[#B4532A] p-8 text-[#F7F2E8] sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className={`${serif} text-4xl font-medium leading-tight sm:text-5xl`}>Not sure where to start?</h2>
            <p className="mt-3 max-w-lg text-[#F7F2E8]/85">
              Book a short video call and we&apos;ll show you the products live, or just message us on WhatsApp — we&apos;ll help you choose and you can order right in the chat.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link href="/appointment" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#F7F2E8] px-6 text-sm font-semibold text-[#24231F] transition hover:bg-white sm:flex-1 lg:flex-none xl:flex-1">
              <Video size={17} /> Book a video call
            </Link>
            <a href={whatsappUrl('Hi Mana! Can you help me choose?')} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#F7F2E8]/40 px-6 text-sm font-semibold transition hover:border-[#F7F2E8] sm:flex-1 lg:flex-none xl:flex-1">
              <MessageCircle size={17} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ApothecaryCard({ product }: { product: Product }) {
  const { price, unit } = cardPrice(product)
  const local = localName(product.name)
  return (
    <article className="group flex flex-col">
      <Link href={productHref(product)} className="relative block aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[1.5rem] bg-[#EFE6D5]">
        <Image src={product.images[0]} alt={displayName(product.name)} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <Link href={productHref(product)} className={`${serif} text-xl leading-tight hover:text-[#2E5641] sm:text-2xl`}>{shortName(product.name)}</Link>
        {local && <div className="mt-0.5 text-xs italic text-[#6E6A60]">{local}</div>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-sm">
            <span className="font-semibold">{formatPrice(price)}</span> <span className="text-xs text-[#6E6A60]">/ {unit}</span>
          </span>
          <WellnessAddButton product={lean(product)} size="sm" />
        </div>
      </div>
    </article>
  )
}

function Footer() {
  const columns = [
    { title: 'Shop', links: [['Herbs', '/products?category=herbs'], ['Health kits', '/kits'], ['Dry fruits', '/products?category=dry-fruits'], ['Spices', '/products?category=spices']] },
    { title: 'Help', links: [['Track your order', '/track-order'], ['FAQs', '/faq'], ['Returns & refunds', '/faq#returns-refunds'], ['Book a video call', '/appointment']] },
    { title: 'Mana', links: [['Our story', '/about'], ['Blog', '/blog'], ['My account', '/profile'], ['Become a creator', '/creator']] },
  ]
  return (
    <footer className="bg-[#1E3A2B] px-4 pb-10 pt-16 text-[#F7F2E8] sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className={`${serif} text-4xl font-medium`}>Mana</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#F7F2E8]/70">
            Ayurvedic herbs, dry fruits and whole spices from a family business in Delhi-NCR — packed fresh to order and delivered across India.
          </p>
          <div className="mt-5 text-xs text-[#F7F2E8]/60">Secure payments by Razorpay · UPI · Cards · Cash on delivery</div>
        </div>
        {columns.map(column => (
          <div key={column.title}>
            <div className="text-xs font-semibold tracking-[0.18em] text-[#E0A43A]">{column.title.toUpperCase()}</div>
            <ul className="mt-4 space-y-2.5">
              {column.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-[#F7F2E8]/75 transition hover:text-[#F7F2E8]">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 max-w-7xl border-t border-[#F7F2E8]/10 pt-6 text-xs text-[#F7F2E8]/50">
        © {new Date().getFullYear()} Mana — The Essence of Nature
      </div>
    </footer>
  )
}
