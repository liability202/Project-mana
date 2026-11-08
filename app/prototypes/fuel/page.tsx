import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Anton, Archivo, JetBrains_Mono } from 'next/font/google'
import { ArrowRight, Banknote, Check, Dumbbell, MessageCircle, PackageCheck, Search, ShieldCheck, Star, Truck, User, Video, Wallet, Zap } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { formatPrice, whatsappUrl } from '@/lib/utils'
import { BRAND, fromPrice, getCatalog, getPublicReviews, kitBenefits, lean, reviewerName } from '../_lib/catalog'
import { baseGrams, displayName, gramsLabel, priceAt, productHref } from '../_lib/shared'
import { FUEL_IDEAS, NUTRITION, NUTRITION_SOURCE, STACK_PRESETS, per30 } from './data'
import { FuelCartBar, FuelCartButton, IdeaAddButton, KitPicker, Leaderboard, MobileSearch, ShelfCard, StackBuilder, type Food, type KitOption } from './client'

export const revalidate = 300

export const metadata: Metadata = { title: 'Fuel · Mana prototype' }

const displayFont = Anton({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--fuel-display' })
const bodyFont = Archivo({ subsets: ['latin'], display: 'swap', variable: '--fuel-body' })
const monoFont = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--fuel-mono' })

const display = '[font-family:var(--fuel-display)]'
const mono = '[font-family:var(--fuel-mono)]'

const ORDER_MESSAGE = 'Hi Mana! I would like help building a protein stack.'

type KitItem = { name?: string; grams?: number; image?: string; slug?: string }

export default async function FuelPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)

  const foods: Food[] = NUTRITION.flatMap(nutrient => {
    const product = catalog.pick([nutrient.keyword])[0]
    return product ? [{ ...nutrient, product: lean(product) }] : []
  })
  const nutrient = (key: string) => NUTRITION.find(item => item.key === key)
  const pumpkin = nutrient('pumpkin')
  const chia = nutrient('chia')
  const almonds = nutrient('almonds')

  const gymKit = catalog.kits.find(kit => /gym/i.test(`${kit.name} ${kit.slug}`))
  const seedsKit = catalog.kits.find(kit => /seed/i.test(`${kit.name} ${kit.slug}`))
  const kitVariants = (gymKit?.variants || []) as { id: string; name: string; price: number; in_stock?: boolean; items?: KitItem[] }[]
  const kitInside = (kitVariants[0]?.items || []).filter(item => item?.name)
  const kitOptions: KitOption[] = kitVariants.map(variant => ({
    id: variant.id,
    name: variant.name,
    price: Number(variant.price) || 0,
    grams: (variant.items || []).reduce((sum, item) => sum + (Number(item.grams) || 0), 0),
    inStock: variant.in_stock !== false,
  })).filter(option => option.price > 0)
  const kitLines = gymKit ? kitBenefits(gymKit) : []

  const shelf = [
    ...catalog.pick(['protien beans', 'seeds n nuts', 'makhana', 'muesli', 'dates']),
    ...(seedsKit?.images?.[0] ? [seedsKit] : []),
  ].slice(0, 6)

  const ideas = FUEL_IDEAS.map(idea => {
    const products = idea.keywords.map(keyword => catalog.pick([keyword])[0]).filter((product): product is Product => Boolean(product))
    const total = products.reduce((sum, product) => sum + priceAt(product, baseGrams(product)), 0)
    return { ...idea, products: products.map(lean), total }
  }).filter(idea => idea.products.length === idea.keywords.length)

  const reviewProduct = catalog.pick(['pumpkin'])[0]
  const heroImage = gymKit?.images?.[0] || BRAND.hero

  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[#0C0D0B] text-[#F2F2EE] antialiased [font-family:var(--fuel-body)] selection:bg-[#D6FF3D] selection:text-[#0C0D0B]`}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0C0D0B]">
        <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/prototypes/fuel" aria-label="Mana Fuel — home" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D6FF3D] text-[#0C0D0B]">
              <Zap size={18} fill="currentColor" strokeWidth={1.5} />
            </span>
            <span className={`${display} text-[1.55rem] leading-none tracking-[0.02em]`}>
              MANA <span className="text-[#D6FF3D]">FUEL</span>
            </span>
          </Link>

          <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 text-sm font-semibold text-[#A3A89A] lg:flex">
            {[
              ['#protein', 'Leaderboard'],
              ['#stack', 'Stack builder'],
              ['#gym-kit', 'Gym Kit'],
              ['/products', 'Shop all'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-[#F2F2EE]">
                {label}
              </a>
            ))}
          </nav>

          <form action="/products" method="get" role="search" className="ml-auto hidden md:block">
            <label htmlFor="fuel-search" className="sr-only">Search products</label>
            <div className="flex h-11 w-64 items-center gap-2 rounded-xl border border-white/10 bg-[#141612] px-3 transition focus-within:border-[#D6FF3D]/70 xl:w-72">
              <Search size={16} className="shrink-0 text-[#A3A89A]" />
              <input id="fuel-search" name="q" placeholder="Search almonds, chia, makhana…" className="h-full w-full bg-transparent text-sm text-[#F2F2EE] placeholder:text-[#A3A89A]/70 focus:outline-none" />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <MobileSearch />
            <a
              href={whatsappUrl(ORDER_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order on WhatsApp"
              className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-[#F2F2EE] transition hover:border-[#D6FF3D]/60 hover:text-[#D6FF3D] sm:inline-flex"
            >
              <MessageCircle size={19} />
            </a>
            <Link href="/profile" aria-label="My account" className="hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-[#F2F2EE] transition hover:border-[#D6FF3D]/60 hover:text-[#D6FF3D] sm:inline-flex">
              <User size={19} />
            </Link>
            <FuelCartButton />
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-white/[0.08]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_70%_at_25%_20%,black,transparent)]"
          />
          <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-[#D6FF3D]/[0.07] blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
            <div>
              <div className={`${mono} inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#A3A89A]`}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3D]" /> Nuts · seeds · dry fruits
              </div>
              <h1 className={`${display} mt-5 text-[3.55rem] uppercase leading-[0.9] sm:text-[5.6rem] lg:text-[6.4rem]`}>
                Real food.
                <br />
                <span className="text-[#D6FF3D]">Real protein.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#C9CEC0] sm:text-lg">
                Pumpkin seeds, almonds, chia and more — whole foods packed fresh to order, with no preservatives. See the protein in every handful, then stock a month in one tap.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#stack"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#D6FF3D] px-7 text-[15px] font-extrabold uppercase tracking-wide text-[#0C0D0B] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6FF3D]"
                >
                  Build your daily stack <ArrowRight size={18} />
                </a>
                {gymKit && (
                  <a
                    href="#gym-kit"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-7 text-[15px] font-bold uppercase tracking-wide text-[#F2F2EE] transition hover:border-white/50"
                  >
                    <Dumbbell size={18} /> Shop the Gym Kit
                  </a>
                )}
              </div>

              <dl className="mt-9 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
                {[
                  pumpkin && { value: per30(pumpkin.protein), unit: 'g protein', food: 'pumpkin seeds' },
                  chia && { value: per30(chia.fibre), unit: 'g fibre', food: 'chia seeds' },
                  almonds && { value: per30(almonds.protein), unit: 'g protein', food: 'almonds' },
                ]
                  .filter((stat): stat is { value: number; unit: string; food: string } => Boolean(stat))
                  .map(stat => (
                    <div key={stat.food} className="rounded-2xl border border-white/[0.08] bg-[#141612]/80 px-3 py-3 sm:px-4">
                      <dt className="sr-only">{stat.food}</dt>
                      <dd>
                        <span className={`${display} text-[2rem] leading-none text-[#F2F2EE] sm:text-[2.4rem]`}>{stat.value}</span>
                        <span className={`${mono} ml-1 text-[11px] text-[#D6FF3D]`}>{stat.unit}</span>
                        <span className={`${mono} mt-1 block text-[10.5px] leading-snug text-[#A3A89A]`}>in 30 g {stat.food}</span>
                      </dd>
                    </div>
                  ))}
              </dl>
              <p className={`${mono} mt-3 text-[10.5px] text-[#A3A89A]`}>{NUTRITION_SOURCE}</p>
            </div>

            {/* Kit visual with volt corner brackets */}
            <div className="relative mx-auto w-full max-w-[600px]">
              <span aria-hidden className="absolute -left-2.5 -top-2.5 z-10 h-10 w-10 rounded-tl-xl border-l-[3px] border-t-[3px] border-[#D6FF3D]" />
              <span aria-hidden className="absolute -right-2.5 -top-2.5 z-10 h-10 w-10 rounded-tr-xl border-r-[3px] border-t-[3px] border-[#D6FF3D]" />
              <span aria-hidden className="absolute -bottom-2.5 -left-2.5 z-10 h-10 w-10 rounded-bl-xl border-b-[3px] border-l-[3px] border-[#D6FF3D]" />
              <span aria-hidden className="absolute -bottom-2.5 -right-2.5 z-10 h-10 w-10 rounded-br-xl border-b-[3px] border-r-[3px] border-[#D6FF3D]" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-white/10 bg-[#141612]">
                <Image src={heroImage} alt={gymKit ? 'The Mana Gym Kit: six pouches of protein foods and herbs' : 'Mana pouches on a table'} fill priority sizes="(max-width: 1024px) 92vw, 600px" className="object-cover" />
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                {gymKit && (
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                    <div>
                      <div className={`${mono} text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#D6FF3D]`}>Bestseller kit</div>
                      <div className={`${display} mt-1 text-[1.9rem] uppercase leading-none sm:text-[2.3rem]`}>The Gym Kit</div>
                      <div className={`${mono} mt-1.5 text-[12px] text-[#C9CEC0]`}>
                        {kitInside.length} foods · from {formatPrice(fromPrice(gymKit))}
                      </div>
                    </div>
                    <a href="#gym-kit" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#F2F2EE] px-4 text-sm font-bold text-[#0C0D0B] transition hover:bg-white">
                      See inside <ArrowRight size={15} />
                    </a>
                  </div>
                )}
              </div>
              {pumpkin && (
                <div className={`${mono} absolute -right-2 -top-5 z-20 hidden rotate-[4deg] rounded-xl bg-[#D6FF3D] px-3 py-2 text-[11px] font-bold uppercase leading-tight text-[#0C0D0B] shadow-[0_12px_30px_rgba(0,0,0,0.45)] sm:block`}>
                  Top of the board
                  <span className="block text-[13px]">Pumpkin seeds · {per30(pumpkin.protein)} g</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Promise strip ── */}
        <div className="border-b border-white/[0.08] bg-[#111310]">
          <ul className={`${mono} mx-auto flex max-w-7xl gap-x-8 overflow-x-auto px-4 py-3.5 text-[11px] uppercase tracking-[0.12em] text-[#C9CEC0] [scrollbar-width:none] sm:px-6 lg:justify-between [&::-webkit-scrollbar]:hidden`}>
            {[
              { icon: Truck, text: 'Free delivery over ₹999' },
              { icon: Banknote, text: 'Cash on delivery' },
              { icon: Wallet, text: '5% cashback' },
              { icon: PackageCheck, text: 'Packed fresh to order' },
              { icon: ShieldCheck, text: 'FSSAI licensed · lab tested' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex shrink-0 items-center gap-2">
                <Icon size={14} className="text-[#D6FF3D]" /> {text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── 01 Leaderboard ── */}
        <section id="protein" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:gap-14">
            <div>
              <SectionHead index="01" eyebrow="Leaderboard" title={<>Protein per<br className="hidden lg:block" /> handful</>} />
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#C9CEC0]">
                The same 30 g handful, ranked. Switch to fibre and watch chia and flax take over. Tap <span className="font-bold text-[#D6FF3D]">+</span> to add a pack.
              </p>
              <div className="mt-6 hidden rounded-2xl border border-white/[0.08] bg-[#141612] p-5 lg:block">
                <div className={`${mono} text-[10.5px] uppercase tracking-[0.16em] text-[#A3A89A]`}>How to read it</div>
                <ul className="mt-3 space-y-2.5 text-sm text-[#C9CEC0]">
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#D6FF3D]" /> 30 g is roughly a small handful.</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#D6FF3D]" /> Values are for the plain ingredient, from USDA FoodData Central.</li>
                  <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#D6FF3D]" /> Prices are for one standard pack; choose bigger packs in the stack builder.</li>
                </ul>
              </div>
            </div>
            <div>
              <Leaderboard foods={foods} />
              <p className={`${mono} mt-3 text-[10.5px] leading-relaxed text-[#A3A89A]`}>{NUTRITION_SOURCE}</p>
            </div>
          </div>
        </section>

        {/* ── 02 Stack builder ── */}
        <section id="stack" className="scroll-mt-16 border-y border-white/[0.08] bg-[#0F110E]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <SectionHead
              index="02"
              eyebrow="Stack builder"
              title="Build your daily stack"
              line="Set the grams you eat each day. We add up the protein, fibre and calories — and work out exactly which packs cover a month."
            />
            <div className="mt-8">
              <StackBuilder foods={foods} presets={STACK_PRESETS} />
            </div>
          </div>
        </section>

        {/* ── 03 Gym Kit ── */}
        {gymKit && (
          <section id="gym-kit" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
              <div>
                <SectionHead index="03" eyebrow="The kit" title="The Gym Kit" />
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#C9CEC0]">
                  Six everyday foods for training days — protein, two traditional strength herbs and quick energy — packed fresh in one order.
                  Want different foods or amounts? Customise it.
                </p>

                {kitLines.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {kitLines.map(line => (
                      <li key={line} className="flex gap-3 text-[15px] text-[#F2F2EE]">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#D6FF3D] text-[#0C0D0B]">
                          <Check size={13} strokeWidth={3.5} />
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8">
                  <KitPicker kit={lean(gymKit)} options={kitOptions} />
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-[#A3A89A]">
                  Ashwagandha and safed musli are traditionally used in Ayurveda. A food guide, not medical advice.
                </p>
              </div>

              {/* What's inside, laid out like a flat-lay */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#141612] p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className={`${mono} text-[11px] font-bold uppercase tracking-[0.16em] text-[#A3A89A]`}>What&apos;s inside · {kitVariants[0]?.name || 'Essential'}</div>
                  <div className={`${mono} text-[11px] text-[#A3A89A]`}>{gramsLabel(kitOptions[0]?.grams || 0)} total</div>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {kitInside.map(item => (
                    <li key={`${item.name}-${item.grams}`} className="group">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#1C1F1A] ring-1 ring-white/10">
                        {item.image ? (
                          <Image src={item.image} alt={displayName(String(item.name))} fill sizes="(max-width: 640px) 44vw, 180px" className="object-cover transition duration-500 group-hover:scale-[1.05]" />
                        ) : null}
                        <span className={`${mono} absolute left-2 top-2 rounded-md bg-[#0C0D0B]/85 px-2 py-1 text-[11px] font-bold text-[#D6FF3D]`}>
                          {gramsLabel(Number(item.grams) || 0)}
                        </span>
                      </div>
                      <div className="mt-2 truncate text-sm font-semibold text-[#F2F2EE]">{displayName(String(item.name))}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ── 04 Gym bag shelf ── */}
        {shelf.length > 0 && (
          <section className="border-y border-white/[0.08] bg-[#0F110E]">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHead
                  index="04"
                  eyebrow="Gym bag"
                  title="More for the gym bag"
                  line="Mixes, makhana, protein beans and kits. No numbers on these — blends vary, so we won't guess."
                />
                <Link href="/products?category=dry-fruits" className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/15 px-4 text-sm font-semibold text-[#F2F2EE] transition hover:border-white/40">
                  All dry fruits & seeds <ArrowRight size={15} />
                </Link>
              </div>
              <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
                {shelf.map(product => (
                  <div key={product.id} className="w-[64%] shrink-0 snap-start sm:w-auto">
                    <ShelfCard product={lean(product)} note={product.category === 'kits' ? 'Kit' : undefined} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 05 Ideas ── */}
        {ideas.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <SectionHead index="05" eyebrow="Eat it like this" title="Simple pairings" line="Three easy ways to eat them through a training week. Food ideas, not a diet plan." />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {ideas.map(idea => (
                <article key={idea.key} className="flex flex-col rounded-3xl border border-white/[0.08] bg-[#141612] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className={`${mono} rounded-md bg-[#D6FF3D] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0C0D0B]`}>{idea.tag}</span>
                    <div className="flex -space-x-3">
                      {idea.products.map(product => (
                        <span key={product.id} className="relative h-14 w-14 overflow-hidden rounded-full bg-[#1C1F1A] ring-2 ring-[#141612]">
                          {product.images?.[0] && <Image src={product.images[0]} alt={displayName(product.name)} fill sizes="56px" className="object-cover" />}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className={`${display} mt-6 text-[1.9rem] uppercase leading-none md:min-h-[3.8rem]`}>{idea.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#C9CEC0]">{idea.line}</p>
                  <div className={`${mono} mt-4 text-[11px] text-[#A3A89A]`}>
                    {idea.products.map(product => `${displayName(product.name)} ${gramsLabel(baseGrams(product))}`).join(' + ')}
                  </div>
                  <div className="mt-4">
                    <IdeaAddButton products={idea.products} total={idea.total} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Reviews (real, approved only) ── */}
        {reviews.length > 0 && (
          <section className="border-t border-white/[0.08]">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
              <SectionHead index="★" eyebrow="Reviews" title="Straight from customers" />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {reviews.slice(0, 3).map(review => (
                  <figure key={review.id} className="flex flex-col rounded-3xl border border-white/[0.08] bg-[#141612] p-6">
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={16} className={index < review.rating ? 'fill-[#D6FF3D] text-[#D6FF3D]' : 'text-white/20'} />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-[16px] leading-relaxed text-[#F2F2EE]">
                      {review.title && <span className="font-bold">{review.title}. </span>}
                      {review.body}
                    </blockquote>
                    <figcaption className={`${mono} mt-5 text-[12px] text-[#A3A89A]`}>
                      {reviewerName(review.customer_name)}
                      {review.product_name && <> · on <span className="text-[#F2F2EE]">{review.product_name}</span></>}
                    </figcaption>
                  </figure>
                ))}
                {reviews.length < 3 && reviewProduct && (
                  <Link
                    href={productHref(reviewProduct)}
                    className="flex flex-col justify-between rounded-3xl border border-dashed border-white/15 p-6 transition hover:border-[#D6FF3D]/60"
                  >
                    <div className={`${display} text-[1.7rem] uppercase leading-none text-[#F2F2EE]`}>Bought from us?</div>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#C9CEC0]">Tell the next person how it went. Reviews go up on the product page.</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#D6FF3D]">
                      Leave a review <ArrowRight size={15} />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Help band ── */}
        <section className="bg-[#D6FF3D] text-[#0C0D0B]">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:py-14">
            <div>
              <h2 className={`${display} text-[2.4rem] uppercase leading-[0.95] sm:text-[3.2rem]`}>Not sure what to stock?</h2>
              <p className="mt-3 max-w-2xl text-[15px] font-medium leading-relaxed text-[#0C0D0B]/80 sm:text-base">
                Message us on WhatsApp and we&apos;ll help you pick, or book a free video call to see the products before you buy. You can order right in the chat.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <a
                href={whatsappUrl(ORDER_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0C0D0B] px-6 text-sm font-extrabold uppercase tracking-wide text-[#D6FF3D] transition hover:bg-black"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
              <Link href="/appointment" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#0C0D0B] px-6 text-sm font-extrabold uppercase tracking-wide text-[#0C0D0B] transition hover:bg-[#0C0D0B]/10">
                <Video size={18} /> Free video call
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0C0D0B]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D6FF3D] text-[#0C0D0B]">
                <Zap size={18} fill="currentColor" strokeWidth={1.5} />
              </span>
              <span className={`${display} text-[1.55rem] leading-none tracking-[0.02em]`}>
                MANA <span className="text-[#D6FF3D]">FUEL</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#A3A89A]">
              Dry fruits, seeds, herbs and spices from MK and Sons, a family business in Delhi-NCR — packed fresh to order and delivered across India.
            </p>
            <p className={`${mono} mt-4 text-[11px] leading-relaxed text-[#A3A89A]`}>FSSAI licensed · Lab tested · No preservatives</p>
          </div>
          {[
            {
              title: 'Shop',
              links: [
                ['All products', '/products'],
                ['Dry fruits & seeds', '/products?category=dry-fruits'],
                ['Herbs', '/products?category=herbs'],
                ['Spices', '/products?category=spices'],
                ['Health kits', '/kits'],
              ],
            },
            {
              title: 'Help',
              links: [
                ['Track your order', '/track-order'],
                ['FAQs', '/faq'],
                ['Book a video call', '/appointment'],
                ['My account', '/profile'],
              ],
            },
            {
              title: 'Mana',
              links: [
                ['Our story', '/about'],
                ['Blog', '/blog'],
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
              ],
            },
          ].map(column => (
            <div key={column.title}>
              <div className={`${mono} text-[11px] font-bold uppercase tracking-[0.18em] text-[#D6FF3D]`}>{column.title}</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-[#C9CEC0] transition hover:text-[#F2F2EE]">{label}</Link>
                  </li>
                ))}
                {column.title === 'Help' && (
                  <li>
                    <a href={whatsappUrl('Hi Mana! I have a question.')} target="_blank" rel="noopener noreferrer" className="text-[#C9CEC0] transition hover:text-[#F2F2EE]">
                      WhatsApp us
                    </a>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.08]">
          <div className={`${mono} mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-[11px] text-[#A3A89A] sm:flex-row sm:items-center sm:justify-between sm:px-6`}>
            <span>© {new Date().getFullYear()} Mana · MK and Sons · Delhi-NCR</span>
            <span>Secure payments by Razorpay · UPI · Cards · Net banking · Cash on delivery</span>
          </div>
        </div>
      </footer>

      <FuelCartBar />
    </div>
  )
}

function SectionHead({ index, eyebrow, title, line }: { index: string; eyebrow: string; title: React.ReactNode; line?: string }) {
  return (
    <div className="max-w-3xl">
      <div className={`${mono} flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A3A89A]`}>
        <span className="text-[#D6FF3D]">{index}</span>
        <span aria-hidden className="h-px w-8 bg-white/20" />
        {eyebrow}
      </div>
      <h2 className={`${display} mt-3 text-[2.7rem] uppercase leading-[0.92] sm:text-[3.6rem] lg:text-[4.2rem]`}>{title}</h2>
      {line && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#C9CEC0] sm:text-base">{line}</p>}
    </div>
  )
}
