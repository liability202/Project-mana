import Link from 'next/link'
import { Cormorant_Garamond, Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { ArrowRight, Check } from 'lucide-react'

/* Index of the homepage design prototypes (not linked from the store, not indexed). */

const noirFont = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600'], style: ['normal', 'italic'], display: 'swap', variable: '--idx-noir' })
const marketFont = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--idx-market' })
const wellnessFont = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--idx-wellness' })

const PROTOTYPES = [
  {
    key: 'A',
    href: '/prototypes/noir',
    name: 'Noir & Gold',
    tag: 'Premium · gift-worthy',
    text: 'Built around your black-and-gold pouches: moody photography, elegant serif type and a luxury feel. Best for gifting and bigger baskets.',
    points: ['Hero with a featured bestseller', 'Bestseller grid with one-tap add', 'Category tiles and health kits'],
    swatches: ['#0C0A08', '#1B1712', '#D6B26C', '#F5EFE4'],
    fonts: 'Cormorant Garamond + Manrope',
  },
  {
    key: 'B',
    href: '/prototypes/market',
    name: 'Market',
    tag: 'Fast · practical',
    text: 'Quick-commerce style for repeat buyers on their phones: search first, pick a pack size, tap ADD, and watch the free-delivery meter fill up.',
    points: ['250 g / 500 g / 1 kg chips on every card', 'ADD turns into a quantity stepper', 'Sticky cart bar with free-delivery progress'],
    swatches: ['#0F7A47', '#E7F6EC', '#F59E0B', '#FFFFFF'],
    fonts: 'Plus Jakarta Sans',
  },
  {
    key: 'C',
    href: '/prototypes/wellness',
    name: 'Wellness',
    tag: 'Ayurveda-forward · calm',
    text: 'Leans into the herbs and kits: shop by health goal, a build-your-own kit spotlight with real ingredients, and an apothecary shelf.',
    points: ['8 “shop by goal” cards linked to real products', 'Kit spotlight shows what is inside', 'Family-business story from your About page'],
    swatches: ['#F7F2E8', '#DCE5D2', '#1E3A2B', '#E0A43A'],
    fonts: 'Fraunces + DM Sans',
  },
]

export default function PrototypesIndex() {
  return (
    <div className={`${noirFont.variable} ${marketFont.variable} ${wellnessFont.variable} min-h-screen bg-[#F4F2EE] px-4 py-14 text-[#1A1A1A] antialiased sm:px-6 sm:py-20 [font-family:var(--idx-market)]`}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B6B6B]">Mana · homepage prototypes</div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Three directions for the new homepage</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#6B6B6B]">
            Each one runs on the live catalogue — real products, real prices and the working cart. Open them, add something to the cart, and try them on your phone too.
            Then pick the one to build out (or mix: “B’s cards with A’s look”).
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PROTOTYPES.map(prototype => (
            <Link key={prototype.key} href={prototype.href} className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.35)]">
              <Preview kind={prototype.key} />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold">
                    <span className="mr-2 text-[#6B6B6B]">{prototype.key}.</span>
                    {prototype.name}
                  </h2>
                  <div className="flex -space-x-1.5">
                    {prototype.swatches.map(color => (
                      <span key={color} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
                    ))}
                  </div>
                </div>
                <div className="mt-1 text-xs font-semibold text-[#6B6B6B]">{prototype.tag}</div>
                <p className="mt-3 text-sm leading-relaxed text-[#4A4A4A]">{prototype.text}</p>
                <ul className="mt-4 space-y-1.5">
                  {prototype.points.map(point => (
                    <li key={point} className="flex gap-2 text-sm text-[#4A4A4A]">
                      <Check size={16} className="mt-0.5 shrink-0 text-[#0F7A47]" /> {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="text-xs text-[#6B6B6B]">{prototype.fonts}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold">
                    Open <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 text-sm leading-relaxed text-[#4A4A4A] ring-1 ring-black/5 sm:p-8">
          <div className="font-extrabold text-[#1A1A1A]">The same in all three</div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              'Only real data: products, prices, counts and approved reviews come from your database',
              'Only true promises: free delivery above ₹999, cash on delivery, 5% cashback, packed fresh',
              'Add to cart uses the real cart, so checkout works from every prototype',
              'Products without a photo are kept out of the curated rows',
              'Hidden from Google while we decide (noindex)',
              'The live homepage is untouched until you choose',
            ].map(line => (
              <li key={line} className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-[#0F7A47]" /> {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** A tiny, hand-drawn impression of each design (no screenshots needed). */
function Preview({ kind }: { kind: string }) {
  if (kind === 'A') {
    return (
      <div className="relative h-52 overflow-hidden bg-[#0C0A08] p-6 text-[#F3ECDF]">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#D6B26C]/15 blur-2xl" />
        <div className="text-[10px] font-semibold tracking-[0.3em] text-[#D6B26C]">MANA</div>
        <div className="mt-5 text-[2rem] leading-[1.02] [font-family:var(--idx-noir)]">
          Nature&apos;s finest,<br />
          <em className="text-[#EBD29C]">packed fresh</em>
        </div>
        <div className="mt-5 inline-flex h-8 items-center rounded-full bg-[#D6B26C] px-4 text-[11px] font-bold text-[#0C0A08]">Shop bestsellers</div>
      </div>
    )
  }
  if (kind === 'B') {
    return (
      <div className="relative h-52 overflow-hidden bg-white p-5">
        <div className="h-8 rounded-lg bg-[#F6F5F1] px-3 text-[11px] leading-8 text-[#6B6B6B]">Search &ldquo;cashew&rdquo;…</div>
        <div className="mt-3 rounded-2xl bg-[#0B5E37] p-4 text-white">
          <div className="text-lg font-extrabold leading-tight">Dry fruits &amp; superfoods, <span className="text-[#FCD34D]">delivered fresh</span></div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {['250 g', '500 g', '1 kg'].map((size, index) => (
            <span key={size} className={`rounded-md border px-2 py-1 text-[10px] font-bold ${index === 0 ? 'border-[#0F7A47] bg-[#E7F6EC] text-[#0B5E37]' : 'border-[#ECEAE4] text-[#6B6B6B]'}`}>{size}</span>
          ))}
          <span className="ml-auto rounded-md bg-[#0F7A47] px-3 py-1 text-[10px] font-extrabold text-white">− 1 +</span>
        </div>
      </div>
    )
  }
  return (
    <div className="relative h-52 overflow-hidden bg-[#F7F2E8] p-6">
      <div className="absolute -bottom-6 right-6 h-40 w-28 rounded-t-full bg-[#DCE5D2]" />
      <div className="absolute right-8 top-7 h-11 w-11 rounded-full bg-[#E0A43A]" />
      <div className="relative text-[10px] font-semibold tracking-[0.2em] text-[#B4532A]">ROOTED IN AYURVEDA</div>
      <div className="relative mt-4 text-[1.9rem] leading-[1.02] text-[#1E3A2B] [font-family:var(--idx-wellness)]">
        Everyday<br />wellness, <em className="text-[#B4532A]">from<br />nature&apos;s pantry</em>
      </div>
    </div>
  )
}
