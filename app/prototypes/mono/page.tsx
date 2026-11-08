import type { Metadata } from 'next'
import Link from 'next/link'
import { Instrument_Sans, Instrument_Serif } from 'next/font/google'
import type { Product } from '@/lib/supabase'
import { whatsappUrl } from '@/lib/utils'
import { fromPrice, getCatalog, getPublicReviews, kitInsideLine, lean, productLabels, reviewerName } from '../_lib/catalog'
import { basePrice, displayName, localName } from '../_lib/shared'
import { FEATURED_ORDER, SEARCH_ALIASES, type MonoGroup, type MonoItem } from './data'
import { MonoBagBar, MonoBagButton, MonoCatalog } from './client'

/*
 * Prototype I — "Mono". The whole catalogue on one calm page: one sentence,
 * one search field, and every product as a line in a price list (or a
 * gallery). Real products, real prices, the real cart.
 */

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Mono · Mana prototype',
}

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--mono-serif' })
const sans = Instrument_Sans({ subsets: ['latin'], display: 'swap', variable: '--mono-sans' })

const SERIF = '[font-family:var(--mono-serif)]'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C7A2F]'

const CATEGORY_WORDS: Record<string, string> = {
  'dry-fruits': 'dry fruits dry fruit nuts mewa',
  herbs: 'herbs herb ayurveda ayurvedic jadi booti',
  spices: 'spices spice masala whole',
  kits: 'kit kits combo',
}

const STANDARDS = [
  { title: 'Packed fresh to order', text: 'Powders are ground after you order. Whole items ship the same day.' },
  { title: 'Lab tested, FSSAI licensed', text: 'Every batch is quality checked before it leaves us.' },
  { title: 'No preservatives', text: 'We pack fresh and move batches quickly, so nothing artificial is needed.' },
  { title: 'Graded by hand', text: 'Undersized or off-colour pieces never make it into a Mana pack.' },
]

/** "walnut kernels (Akhrot Giri)" → "Walnut kernels"; "Black Pepper/ Kali Mirch" → "Black pepper". */
function mainName(name: string) {
  const clean = displayName(name).replace(/\s*\([^)]*\)\s*/g, ' ').split(' / ')[0].replace(/\s+/g, ' ').trim()
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : displayName(name)
}

function secondName(name: string) {
  const local = localName(displayName(name)).replace(/\s+/g, ' ').trim()
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : ''
}

function groupOf(product: Product): MonoGroup {
  if (product.category === 'herbs') return 'herbs'
  if (product.category === 'spices') return 'spices'
  if (product.category === 'kits') return 'kits'
  if (product.category === 'dry-fruits') return /seed|mix|muesli|beans|booster/i.test(product.name) ? 'seeds' : 'nuts'
  return 'herbs'
}

/** One quiet line under the name: what's inside a kit, the options, or a real label. */
function hintFor(product: Product) {
  if (product.category === 'kits') {
    const inside = kitInsideLine(product, 2)
    return inside ? `Inside: ${inside}` : 'Choose your items'
  }
  const variants = ((product.variants || []) as { name?: string; in_stock?: boolean }[]).filter(variant => variant?.name)
  if (variants.length) {
    const first = variants.find(variant => variant.in_stock !== false) || variants[0]
    const label = String(first.name).trim()
    const more = variants.length - 1
    return `${label.charAt(0).toUpperCase()}${label.slice(1)}${more > 0 ? ` · ${more} more option${more === 1 ? '' : 's'}` : ''}`
  }
  return productLabels(product, 4)
    .filter(label => label !== 'Organic' && label !== 'Premium')
    .slice(0, 2)
    .join(' · ')
}

function rankOf(product: Product, index: number) {
  const haystack = `${product.name} ${product.slug}`.toLowerCase()
  const position = FEATURED_ORDER.findIndex(keyword => haystack.includes(keyword))
  return (position >= 0 ? position : 900) * 100000 + product.slug.length * 100 + index
}

function searchText(product: Product, parts: string[]) {
  const base = [
    product.name,
    product.slug.replace(/-/g, ' '),
    CATEGORY_WORDS[product.category] || product.category,
    ...(product.tags || []).filter(tag => !String(tag).startsWith('badge:')),
    ...((product.variants || []) as { name?: string }[]).map(variant => variant?.name || ''),
    ...parts,
  ]
    .join(' ')
    .toLowerCase()
  const extra = SEARCH_ALIASES.filter(([key]) => base.includes(key)).map(([, words]) => words)
  return `${base} ${extra.join(' ')}`.replace(/\s+/g, ' ')
}

function buildItems(products: Product[]): MonoItem[] {
  const ranked = products
    .map((product, index) => {
      const name = mainName(product.name)
      const local = secondName(product.name)
      const hint = hintFor(product)
      return {
        product: lean(product),
        group: groupOf(product),
        name,
        local,
        hint,
        search: searchText(product, [name, local, hint]),
        rank: rankOf(product, index),
        fromPrice: product.category === 'kits' ? fromPrice(product) : null,
      }
    })
    .sort((a, b) => a.rank - b.rank)

  // The catalogue lists one product twice (Gond Katira); show it once.
  const seen = new Set<string>()
  return ranked.filter(item => {
    const key = `${item.group}|${item.name}|${basePrice(item.product)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default async function MonoPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)
  const items = buildItems(catalog.all)

  return (
    <div className={`${serif.variable} ${sans.variable} min-h-screen bg-white text-[#111111] antialiased [font-family:var(--mono-sans)]`}>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:h-20">
        <Link href="/prototypes/mono" className={`${SERIF} text-[32px] leading-none tracking-[-0.01em] ${FOCUS}`}>
          Mana
        </Link>
        <nav aria-label="Main" className="flex items-center gap-0.5 text-[14px] sm:gap-2">
          <Link href="/products" className={`hidden h-11 items-center rounded-full px-3 transition hover:bg-[#F5F4F0] sm:inline-flex ${FOCUS}`}>
            Shop
          </Link>
          <Link href="/kits" className={`inline-flex h-11 items-center rounded-full px-3 transition hover:bg-[#F5F4F0] ${FOCUS}`}>
            Kits
          </Link>
          <Link href="/about" className={`inline-flex h-11 items-center rounded-full px-3 transition hover:bg-[#F5F4F0] ${FOCUS}`}>
            About
          </Link>
          <MonoBagButton />
        </nav>
      </header>

      <main>
        {/* One sentence, the few facts that matter, then straight to the list. */}
        <section className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-10 md:pb-12 md:pt-16">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#6F6F6B] sm:text-[11.5px] sm:tracking-[0.2em]">
            Family-run · Delhi-NCR · 20+ years<span className="hidden sm:inline"> in trade</span>
          </p>
          <h1 className={`${SERIF} mt-4 max-w-[16ch] text-[44px] leading-[0.98] tracking-[-0.015em] sm:max-w-[20ch] sm:text-[64px] md:max-w-[21ch] md:text-[88px]`}>
            Dry fruits, herbs &amp; spices{'\u00a0'}— <em className="italic">packed fresh to order.</em>
          </h1>
          <p className="mt-6 text-[13.5px] text-[#6F6F6B] md:text-[14.5px]">
            <span className="sm:hidden">Free delivery over ₹999 · COD · 5% cashback</span>
            <span className="hidden sm:inline">Free delivery over ₹999 &nbsp;·&nbsp; Cash on delivery &nbsp;·&nbsp; 5% cashback &nbsp;·&nbsp; Delivered across India</span>
          </p>
        </section>

        <MonoCatalog items={items} />

        <section aria-labelledby="mono-standards" className="border-t border-[#E6E4DE] bg-[#F5F4F0]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <h2 id="mono-standards" className="text-[11.5px] uppercase tracking-[0.2em] text-[#6F6F6B]">
              How we pack
            </h2>
            <div className="mt-8 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {STANDARDS.map((standard, index) => (
                <div key={standard.title}>
                  <div className="text-[12px] tabular-nums text-[#6F6F6B]">0{index + 1}</div>
                  <h3 className={`${SERIF} mt-2 text-[26px] leading-[1.1]`}>{standard.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#5F5F5B]">{standard.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-12 border-t border-[#E6E4DE] pt-6 text-[13.5px] leading-relaxed text-[#5F5F5B]">
              Delivery in 2–3 days across Delhi-NCR and 5–7 days across India. Your tracking link comes on WhatsApp.{' '}
              <Link href="/appointment" className="text-[#111111] underline decoration-[#C9C6BE] underline-offset-4 hover:decoration-[#111111]">
                Want to see a product first? Book a free video call.
              </Link>
            </p>
          </div>
        </section>

        {reviews.length > 0 && (
          <section aria-labelledby="mono-reviews" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
            <h2 id="mono-reviews" className="text-[11.5px] uppercase tracking-[0.2em] text-[#6F6F6B]">
              From our customers
            </h2>
            <div className={`mt-8 grid gap-12 ${reviews.length > 1 ? 'md:grid-cols-2' : 'max-w-3xl'}`}>
              {reviews.slice(0, 4).map(review => (
                <figure key={review.id}>
                  <blockquote className={`${SERIF} line-clamp-6 text-[26px] leading-[1.2] md:text-[32px]`}>“{review.body.trim()}”</blockquote>
                  <figcaption className="mt-4 flex flex-wrap items-center gap-x-2 text-[13px] text-[#6F6F6B]">
                    <span className="text-[#111111]">{reviewerName(review.customer_name)}</span>
                    {review.product_name && <span>on {review.product_name}</span>}
                    <span aria-label={`Rated ${review.rating} out of 5`} className="tracking-[0.15em] text-[#111111]">
                      {'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-12 text-[13.5px] text-[#5F5F5B]">
              Bought from us?{' '}
              <Link href="/products" className="text-[#111111] underline decoration-[#C9C6BE] underline-offset-4 hover:decoration-[#111111]">
                Leave a review on the product page
              </Link>
            </p>
          </section>
        )}
      </main>

      <footer className="border-t border-[#E6E4DE]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-20">
          <div className="col-span-2 md:col-span-1">
            <div className={`${SERIF} text-[44px] leading-none`}>Mana</div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#5F5F5B]">
              Dry fruits, Ayurvedic herbs and whole spices, packed fresh to order by MK and Sons, <span className="whitespace-nowrap">Delhi-NCR</span>.
            </p>
          </div>
          <FooterColumn
            title="Shop"
            links={[
              ['All products', '/products'],
              ['Dry fruits & seeds', '/products?category=dry-fruits'],
              ['Herbs', '/products?category=herbs'],
              ['Spices', '/products?category=spices'],
              ['Kits', '/kits'],
            ]}
          />
          <FooterColumn
            title="Help"
            links={[
              ['Track your order', '/track-order'],
              ['FAQs', '/faq'],
              ['Book a video call', '/appointment'],
              ['WhatsApp us', whatsappUrl('Hi Mana! I have a question.')],
            ]}
          />
          <FooterColumn
            title="Mana"
            links={[
              ['Our story', '/about'],
              ['Guides', '/blog'],
              ['My account', '/profile'],
              ['Privacy', '/privacy'],
              ['Terms', '/terms'],
            ]}
          />
        </div>
        <div className="border-t border-[#E6E4DE]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[12.5px] text-[#6F6F6B] sm:px-6 md:flex-row md:items-center md:justify-between">
            <span>Secure payments by Razorpay · UPI · Cards · Net banking · Cash on delivery</span>
            <span>© {new Date().getFullYear()} Mana · MK and Sons</span>
          </div>
        </div>
      </footer>

      <MonoBagBar />
    </div>
  )
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-[11.5px] uppercase tracking-[0.2em] text-[#6F6F6B]">{title}</h2>
      <ul className="mt-4 space-y-1">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith('http') ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-[36px] items-center text-[14.5px] transition hover:underline hover:underline-offset-4 ${FOCUS}`}>
                {label}
              </a>
            ) : (
              <Link href={href} className={`inline-flex min-h-[36px] items-center text-[14.5px] transition hover:underline hover:underline-offset-4 ${FOCUS}`}>
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
