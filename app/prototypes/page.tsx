import { Plus_Jakarta_Sans } from 'next/font/google'
import { Check, ExternalLink, Lightbulb, Wrench } from 'lucide-react'
import { IndexGrid } from './_lib/IndexGrid'
import { PROTOTYPES } from './_lib/registry'

/* Index of the homepage design prototypes (not linked from the store, not indexed). */

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap', variable: '--idx-font' })

/** What the research says, with sources. Figures are quoted as published (several are industry or brand surveys). */
const FINDINGS = [
  {
    title: 'Gifting is a big slice of dry-fruit sales',
    text: 'India’s dry-fruit gifting segment is estimated at about USD 900 million in 2025. Wedding season runs from November to February.',
    source: 'Credence Research (industry estimate)',
    href: 'https://www.credenceresearch.com/report/india-dry-fruit-gifting-market',
    designs: 'D · A',
  },
  {
    title: 'Shoppers expect quick-commerce speed and layouts',
    text: 'Quick-commerce apps took about two-thirds of India’s online grocery orders in 2024, so their card and cart patterns feel familiar.',
    source: 'Bain & Company with Flipkart, via Inside Retail Asia',
    href: 'https://insideretail.asia/2025/03/27/quick-commerce-accounts-for-two-thirds-of-indias-online-grocery-orders',
    designs: 'B · I',
  },
  {
    title: 'People like to chat with shops',
    text: '86% of online adults in India message a business at least once a week, the highest of 11 countries surveyed.',
    source: 'Kantar study for Meta, via Best Media Info',
    href: 'https://bestmediainfo.com/2022/10/86-of-indian-adults-message-a-business-at-least-once-a-week-highest-in-the-world-kantar-survey',
    designs: 'J · E',
  },
  {
    title: 'Hindi is the biggest local shopping language',
    text: 'On Snapdeal, 30% of users preferred a local-language interface, Hindi most of all, with Hindi shoppers concentrated in UP, Rajasthan, Haryana and Delhi-NCR.',
    source: 'Snapdeal, via MediaNews4U',
    href: 'https://www.medianews4u.com/snapdeal-offers-expanded-vernacular-options-as-30-of-users-prefer-its-vernacular-interface/',
    designs: 'E',
  },
  {
    title: 'Healthy snacking is mainstream, and young',
    text: 'Makhana is the go-to healthy snack for 65% of respondents, and Gen Z and millennials order packaged snacks weekly at twice the rate of older buyers (43% vs 28%).',
    source: 'Farmley Healthy Snacking Report 2025 (a brand survey), via The Tribune',
    href: 'https://www.tribuneindia.com/news/business/makhana-emerges-as-top-superfood-as-65-consumers-choose-healthier-preservative-free-options-says-report',
    designs: 'F · H',
  },
  {
    title: 'Reviews move sales more than almost anything',
    text: 'A product with five reviews is 270% more likely to be bought than one with none. Mana has 2 approved reviews today, and every design shows them.',
    source: 'Spiegel Research Center, Northwestern University',
    href: 'https://spiegel.medill.northwestern.edu/How-Online-Reviews-Influence-Sales',
    designs: 'All',
  },
  {
    title: 'Most stores make finding products hard',
    text: 'Homepage and category navigation is “mediocre” or worse on 61% of desktop and 65% of mobile sites tested. Search and clear categories matter.',
    source: 'Baymard Institute, 2026 benchmark',
    href: 'https://baymard.com/blog/ecommerce-navigation-best-practice',
    designs: 'I · B',
  },
  {
    title: 'Cash on delivery still builds trust',
    text: 'Prepaid orders are rising (41% of orders in 2025), but many shoppers, especially first-timers and in smaller cities, still want COD. Every design says it clearly.',
    source: 'Social Samosa report coverage; Razorpay',
    href: 'https://www.socialsamosa.com/report/prepaid-e-commerce-orders-rise-10958917',
    designs: 'All',
  },
]

const COMPETITORS = 'Happilo, Farmley, Nutraj, The Whole Truth, Yoga Bar, Kapiva, Two Brothers Organic Farms, Bombay Sweet Shop, Vahdam, Forest Essentials, Diaspora Co, Burlap & Barrel, Graza and Fishwife'

export default function PrototypesIndex() {
  const newCount = PROTOTYPES.filter(prototype => prototype.isNew).length
  return (
    <div className={`${font.variable} min-h-screen bg-[#F4F2EE] px-4 py-12 text-[#1A1A1A] antialiased sm:px-6 sm:py-16 [font-family:var(--idx-font)]`}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#6B6B6B]">Mana · homepage prototypes</div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{PROTOTYPES.length} directions for the new homepage</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4A4A4A]">
            Each one is a working store on your live catalogue, with real products, real prices and the real cart, so checkout works from all of them.
            A–C are the first three. {newCount} new ones (D–J) came out of a round of research into competitors and Indian shoppers.
            Open a few on your phone, add something to the cart, and pick one to build out, or mix parts (e.g. “Market’s cards in Utsav’s colours”).
          </p>
        </div>

        <IndexGrid />

        <section className="mt-16" aria-labelledby="research-title">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6B6B6B]">
            <Lightbulb size={15} /> The research behind them
          </div>
          <h2 id="research-title" className="mt-2 text-3xl font-extrabold tracking-tight">What we looked at</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#4A4A4A]">
            We studied the homepages of {COMPETITORS}, on desktop and phone, alongside these findings about how India shops.
            Several figures come from industry or brand surveys, so treat them as direction, not gospel.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {FINDINGS.map(finding => (
              <article key={finding.title} className="flex flex-col rounded-3xl bg-white p-5 ring-1 ring-black/5">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A8A8A]">Designs {finding.designs}</div>
                <h3 className="mt-2 text-base font-extrabold leading-snug">{finding.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#4A4A4A]">{finding.text}</p>
                <a href={finding.href} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-start gap-1.5 pt-4 text-xs font-semibold text-[#0F7A47] hover:underline">
                  <ExternalLink size={13} className="mt-px shrink-0" /> {finding.source}
                </a>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 text-sm leading-relaxed text-[#4A4A4A] ring-1 ring-black/5 sm:p-8">
            <h2 className="font-extrabold text-[#1A1A1A]">The same in all ten</h2>
            <ul className="mt-3 space-y-2">
              {[
                'Only real data: products, prices and approved reviews come from your database',
                'Only true promises, taken from your own FAQ and About page: free delivery above ₹999, cash on delivery, 5% cashback, packed fresh to order, FSSAI licensed',
                'Add to cart uses the real cart and drawer, so checkout works everywhere',
                'No fake discounts, ratings or “India’s #1” claims; herbs say “traditionally used”, never “cures”',
                'Hidden from Google while you decide (noindex). The live homepage is untouched',
              ].map(line => (
                <li key={line} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#0F7A47]" /> {line}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl bg-white p-6 text-sm leading-relaxed text-[#4A4A4A] ring-1 ring-black/5 sm:p-8">
            <h2 className="flex items-center gap-2 font-extrabold text-[#1A1A1A]">
              <Wrench size={16} /> Quick fixes in the admin (help every design)
            </h2>
            <ul className="mt-3 space-y-2">
              {[
                'Add photos for Medjool Dates, Protien Booster and Black Current',
                'Fix spellings: Protien → Protein, Flex → Flax, Craneberry → Cranberry, Black Current → Currant, Star Anais → Anise, Managment → Management, Pepali → Pippali',
                'Gond Katira is listed twice; keep one',
                'Ask happy customers for reviews (WhatsApp after delivery). There are only 2 approved reviews today',
              ].map(line => (
                <li key={line} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#B45309]" /> {line}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
