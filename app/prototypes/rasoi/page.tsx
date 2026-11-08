import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Figtree, Young_Serif } from 'next/font/google'
import { ArrowRight, Banknote, FlaskConical, Leaf, MessageCircle, PackageCheck, Search, Star, Truck, Video } from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { BLOG_POSTS } from '@/lib/blog-data'
import { whatsappUrl } from '@/lib/utils'
import { BRAND, cardLabels, getCatalog, getPublicReviews, lean, reviewerName } from '../_lib/catalog'
import { productHref } from '../_lib/shared'
import { DishBowl, Flower, SpiceFill, TileBand, TILE_BACKGROUND } from './art'
import { CartButton, MasalaDabba, PantryCard, RecipeStudio, SearchToggle, type RecipeView, type SpiceView } from './client'
import { DABBA, INGREDIENTS, PANTRY, RECIPES, packSizes, type IngredientId } from './data'

export const revalidate = 300

export const metadata: Metadata = { title: 'Rasoi · Mana prototype' }

const display = Young_Serif({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--rasoi-display' })
const body = Figtree({ subsets: ['latin'], display: 'swap', variable: '--rasoi-body' })


/** Finds each ingredient in the live catalogue (photographed products only, never kits). */
function ingredientFinder(all: Product[]) {
  const pool = all.filter(product => product.images?.[0] && product.category !== 'kits')
  const found = new Map<IngredientId, Product | null>()
  return (id: IngredientId) => {
    if (!found.has(id)) {
      let match: Product | null = null
      for (const key of INGREDIENTS[id].keys) {
        match = pool.find(product => `${product.name} ${product.slug}`.toLowerCase().includes(key)) || null
        if (match) break
      }
      found.set(id, match)
    }
    return found.get(id) || null
  }
}

export default async function RasoiPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)
  const find = ingredientFinder(catalog.all)

  const recipes: RecipeView[] = RECIPES.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    local: recipe.local,
    line: recipe.line,
    serves: recipe.serves,
    time: recipe.time,
    tag: recipe.tag,
    kitchen: recipe.kitchen,
    steps: recipe.steps,
    items: recipe.items.flatMap(item => {
      const product = find(item.id)
      if (!product) return []
      const sizes = packSizes(product.category)
      return [{
        key: `${recipe.id}:${item.id}`,
        product: lean(product),
        grams: sizes.includes(item.grams) ? item.grams : sizes[0],
        note: item.note,
        alsoCalled: INGREDIENTS[item.id].alsoCalled,
        sizes,
      }]
    }),
  })).filter(recipe => recipe.items.length >= 2)

  const art: Record<string, ReactNode> = Object.fromEntries(
    RECIPES.map(recipe => [recipe.id, <DishBowl key={recipe.id} spec={recipe.bowl} seed={recipe.id} label={`Illustration of ${recipe.name.toLowerCase()}`} />])
  )

  const spices: SpiceView[] = DABBA.flatMap(entry => {
    const product = find(entry.id)
    return product ? [{ key: entry.id, product: lean(product), uses: entry.uses, alsoCalled: INGREDIENTS[entry.id].alsoCalled, sizes: packSizes(product.category) }] : []
  })
  const fills: Record<string, ReactNode> = Object.fromEntries(DABBA.map(entry => [entry.id, <SpiceFill key={entry.id} spec={entry.fill} seed={`dabba-${entry.id}`} />]))

  const pantry = PANTRY.flatMap(id => {
    const product = find(id)
    return product ? [{ id, product }] : []
  })

  const guides = BLOG_POSTS.slice(0, 4)

  return (
    <div className={`${display.variable} ${body.variable} min-h-screen bg-[#FBFAF6] font-normal text-[#1C1A17] antialiased [font-family:var(--rasoi-body)]`}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#1D3F9A]/10 bg-[#FBFAF6]">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link href="/prototypes/rasoi" className="flex shrink-0 items-center gap-2.5" aria-label="Mana Rasoi home">
            <span className="relative h-9 w-9 overflow-hidden rounded-full bg-white ring-1 ring-[#1D3F9A]/15">
              <Image src={BRAND.logo} alt="" fill sizes="36px" className="object-contain p-1" />
            </span>
            <span className="leading-none">
              <span className="block text-[1.45rem] text-[#1D3F9A] [font-family:var(--rasoi-display)]">Mana</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-[#C8361B]">Rasoi</span>
            </span>
          </Link>
          <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 text-[14px] font-semibold text-[#3D3933] lg:flex">
            {[
              ['#recipes', 'Recipes'],
              ['#masala-dabba', 'Spice box'],
              ['#pantry', 'Pantry'],
              ['/products', 'Shop all'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-3 py-2 transition hover:bg-[#DCE6FB] hover:text-[#1D3F9A]">
                {label}
              </a>
            ))}
          </nav>
          <form action="/products" className="ml-auto hidden md:block">
            <label className="flex h-11 w-[300px] items-center gap-2 rounded-full border border-[#1D3F9A]/15 bg-white px-4 transition focus-within:border-[#1D3F9A] lg:w-[320px]">
              <Search size={17} className="shrink-0 text-[#1D3F9A]" />
              <span className="sr-only">Search products</span>
              <input name="q" type="search" placeholder="Search almonds, elaichi, kaju…" className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-[#8A847A]" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <SearchToggle />
            <a
              href={whatsappUrl('Hi Mana! I would like to place an order.')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order on WhatsApp"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[#1D3F9A] transition hover:bg-[#DCE6FB] sm:inline-flex"
            >
              <MessageCircle size={20} />
            </a>
            <CartButton />
          </div>
        </div>
      </header>

      <main>
        {/* Hero + dish picker + recipe card */}
        <section id="recipes" className="relative scroll-mt-16 overflow-x-clip">
          <TileBand className="h-5 sm:h-6" />
          <div aria-hidden className="pointer-events-none absolute right-[-7rem] top-16 hidden h-[22rem] w-[22rem] rounded-full border-[14px] border-[#DCE6FB] lg:block" />
          <div aria-hidden className="pointer-events-none absolute right-[-3.5rem] top-[7.5rem] hidden h-56 w-56 rounded-full border-2 border-dashed border-[#1D3F9A]/25 lg:block" />
          <div aria-hidden className="pointer-events-none absolute right-6 top-[10.5rem] hidden h-40 w-40 lg:block xl:right-16">
            <Flower className="h-full w-full" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 sm:pt-10 lg:pb-20 lg:pt-14">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8361B]">
                <Flower className="h-5 w-5" /> Shop by dish
              </p>
              <h1 className="mt-3 text-[2.6rem] leading-[1.02] text-[#1D3F9A] [font-family:var(--rasoi-display)] sm:text-6xl lg:text-[4.25rem]">
                What&apos;s cooking today?
              </h1>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-[#4A453E] sm:text-[17px]">
                Pick a dish and we&apos;ll gather every Mana ingredient it needs. Untick what you already have, then add the rest in one tap.
              </p>
              <ol className="mt-6 hidden flex-wrap gap-2 text-[13px] font-semibold text-[#1D3F9A] sm:flex" aria-label="How it works">
                {['Pick a dish', 'Untick what you have', 'Add it all in one tap'].map((step, index) => (
                  <li key={step} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 ring-1 ring-[#1D3F9A]/12">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2A51A] text-[12px] font-extrabold text-[#1C1A17]">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-7 lg:mt-10">
              <RecipeStudio recipes={recipes} art={art} />
            </div>
          </div>
        </section>

        {/* Promises */}
        <section aria-label="Why cooks buy from Mana" className="border-y border-[#1D3F9A]/10 bg-white">
          <ul className="mx-auto grid max-w-7xl gap-x-6 gap-y-5 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-10">
            {[
              { icon: PackageCheck, title: 'Packed fresh to order', text: 'Powders are ground after you order' },
              { icon: FlaskConical, title: 'Lab tested', text: 'Every batch checked · FSSAI licensed' },
              { icon: Leaf, title: 'No preservatives', text: 'Graded by hand, nothing added' },
              { icon: Truck, title: 'Free delivery over ₹999', text: 'Cash on delivery available' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCE6FB] text-[#1D3F9A]">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-[14.5px] font-bold leading-snug">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[#6A645A]">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Masala dabba */}
        {spices.length > 0 && (
          <section id="masala-dabba" className="scroll-mt-16 bg-[#F1F5FE]">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
              <div className="max-w-2xl">
                <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8361B]">The masala dabba</p>
                <h2 className="mt-2 text-[2.1rem] leading-[1.05] text-[#1D3F9A] [font-family:var(--rasoi-display)] sm:text-5xl">Fill your spice box</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#4A453E]">
                  Six whole spices that every Indian kitchen reaches for. Tap a katori to see what it&apos;s for, or fill the whole tin at once.
                </p>
              </div>
              <div className="mt-10">
                <MasalaDabba spices={spices} fills={fills} />
              </div>
            </div>
          </section>
        )}

        {/* Pantry staples */}
        {pantry.length > 0 && (
          <section id="pantry" className="scroll-mt-16">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8361B]">Pantry staples</p>
                  <h2 className="mt-2 text-[2.1rem] leading-[1.05] text-[#1D3F9A] [font-family:var(--rasoi-display)] sm:text-5xl">The mewa shelf</h2>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-[#4A453E]">Nuts and dry fruits for kheer, laddoos, and the daily handful.</p>
                </div>
                <Link href="/products?category=dry-fruits" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[#1D3F9A]/25 px-5 text-[14px] font-bold text-[#1D3F9A] transition hover:bg-[#DCE6FB]">
                  All dry fruits <ArrowRight size={16} />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {pantry.map(({ id, product }) => (
                  <PantryCard key={product.id} product={lean(product)} alsoCalled={INGREDIENTS[id].alsoCalled} badge={cardLabels(product).badge} sizes={packSizes(product.category)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Guides */}
        {guides.length > 0 && (
          <section className="border-t border-[#1D3F9A]/10 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8361B]">Read before you cook</p>
                  <h2 className="mt-2 text-[2.1rem] leading-[1.05] text-[#1D3F9A] [font-family:var(--rasoi-display)] sm:text-5xl">Guides from our kitchen</h2>
                </div>
                <Link href="/blog" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1D3F9A] underline-offset-4 hover:underline">
                  All guides <ArrowRight size={16} />
                </Link>
              </div>
              <div className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {guides.map(post => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-[#FBFAF6] ring-1 ring-[#1D3F9A]/10 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(29,63,154,0.6)] motion-reduce:hover:translate-y-0 sm:w-auto">
                    <span className="relative block aspect-[16/10] overflow-hidden bg-[#EFE9DD]">
                      <Image src={post.coverImage} alt="" fill sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 300px" className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100" />
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#2F7D32]">{post.category.replace('-', ' ')} · {post.readingTime}</span>
                      <span className="mt-2 text-[1.05rem] leading-snug text-[#1C1A17] [font-family:var(--rasoi-display)] group-hover:text-[#1D3F9A]">{post.title}</span>
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-bold text-[#1D3F9A]">
                        Read guide <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="border-t border-[#1D3F9A]/10">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8361B]">From kitchens we deliver to</p>
              <h2 className="mt-2 text-[2.1rem] leading-[1.05] text-[#1D3F9A] [font-family:var(--rasoi-display)] sm:text-5xl">What our buyers say</h2>
              <div className={`mt-8 grid gap-4 ${reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'md:grid-cols-2' : 'max-w-xl'}`}>
                {reviews.map(review => (
                  <figure key={review.id} className="relative overflow-hidden rounded-[24px] bg-white p-6 ring-1 ring-[#1D3F9A]/10">
                    <Flower className="absolute -right-5 -top-5 h-20 w-20 opacity-25" />
                    <div className="flex gap-0.5 text-[#F2A51A]" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star key={index} size={16} fill={index < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    {review.title && <p className="mt-3 font-bold">{review.title}</p>}
                    <blockquote className="mt-2 text-[15px] leading-relaxed text-[#3D3933]">&ldquo;{review.body}&rdquo;</blockquote>
                    <figcaption className="mt-4 text-[13px] text-[#6A645A]">
                      <span className="font-bold text-[#1C1A17]">{reviewerName(review.customer_name)}</span>
                      {review.product_name && <> · bought <Link href={`/products/${review.product_slug}`} className="font-semibold text-[#1D3F9A] hover:underline">{review.product_name}</Link></>}
                    </figcaption>
                  </figure>
                ))}
              </div>
              {pantry[0] && (
                <p className="mt-6 text-[14px] text-[#6A645A]">
                  Cooked with Mana?{' '}
                  <Link href={productHref(pantry[0].product)} className="font-bold text-[#1D3F9A] underline-offset-4 hover:underline">
                    Leave a review on the product page
                  </Link>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Bulk and help */}
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:pb-20">
          <div className="relative overflow-hidden rounded-[28px] bg-[#1D3F9A] text-white">
            <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[34%] md:block" style={{ backgroundImage: TILE_BACKGROUND, backgroundSize: '58px 58px', backgroundPosition: 'center' }} />
            <div aria-hidden className="absolute inset-y-0 right-[34%] hidden w-1.5 bg-[#F2A51A] md:block" />
            <div className="relative px-6 py-10 sm:px-10 md:w-[66%] md:py-12">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#F2A51A]">Cooking for a crowd?</p>
              <h2 className="mt-2 text-[2rem] leading-[1.08] [font-family:var(--rasoi-display)] sm:text-[2.6rem]">Weddings, pujas and big family dinners</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
                We pack bulk quantities too. Message us for prices, or book a free video call and see the produce before you order.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappUrl('Hi Mana! I would like bulk prices for a function: ')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#F2A51A] px-6 text-[15px] font-bold text-[#1C1A17] transition hover:bg-[#E59A12]"
                >
                  <MessageCircle size={18} /> Ask for bulk prices
                </a>
                <Link href="/appointment" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-6 text-[15px] font-bold text-white transition hover:bg-white/10">
                  <Video size={18} /> Book a free video call
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#14306F] text-white">
        <TileBand className="h-5" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="text-[1.8rem] [font-family:var(--rasoi-display)]">Mana</div>
            <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-white/75">
              Dry fruits, whole spices and Ayurvedic herbs from MK and Sons, a family business in Delhi-NCR. Packed fresh to order and delivered across India.
            </p>
            <a
              href={whatsappUrl('Hi Mana! I have a question.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-bold text-[#14306F] transition hover:bg-[#DCE6FB]"
            >
              <MessageCircle size={17} /> Chat on WhatsApp
            </a>
          </div>
          {[
            {
              title: 'Shop',
              links: [
                ['/products?category=dry-fruits', 'Dry fruits & seeds'],
                ['/products?category=spices', 'Whole spices'],
                ['/products?category=herbs', 'Ayurvedic herbs'],
                ['/kits', 'Health kits'],
                ['/products', 'All products'],
              ],
            },
            {
              title: 'Help',
              links: [
                ['/track-order', 'Track your order'],
                ['/faq', 'FAQs'],
                ['/appointment', 'Book a video call'],
                ['/profile', 'My account'],
              ],
            },
            {
              title: 'Mana',
              links: [
                ['/about', 'Our story'],
                ['/blog', 'Guides & blog'],
                ['/privacy', 'Privacy'],
                ['/terms', 'Terms'],
              ],
            },
          ].map(column => (
            <div key={column.title}>
              <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#F2A51A]">{column.title}</div>
              <ul className="mt-3 space-y-2 text-[14px]">
                {column.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-white/80 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-[12.5px] text-white/65 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="inline-flex items-center gap-2">
              <Banknote size={15} /> UPI · Cards · Net banking via Razorpay · Cash on delivery
            </span>
            <span>© 2026 Mana · MK and Sons · Delhi-NCR</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

