import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Hind, Kalam, Tiro_Devanagari_Hindi, Yatra_One } from 'next/font/google'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Camera,
  FlaskConical,
  MessageCircle,
  Mic,
  PackageCheck,
  PhoneOff,
  Scale,
  ShoppingBag,
  Star,
  Video,
} from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { BRAND, cardLabels, fromPrice, getCatalog, getPublicReviews, kitContents, lean, reviewerName } from '../_lib/catalog'
import { basePrice, baseGrams, gramsLabel } from '../_lib/shared'
import { BADGE_HI, CHALKBOARD, SHELVES, bilingual, gramsHi, hindiName } from './data'
import { BillBar, ChalkAdd, HeaderCart, LangInvite, LangToggle, PansariRoot, SearchBox, Shelves, type Shelf, type ShelfItem } from './client'
import { SectionTitle, T, WhatsAppLink } from './ui'

export const revalidate = 300
export const metadata: Metadata = { title: 'Pansari · Mana prototype' }

const sign = Yatra_One({ subsets: ['latin', 'devanagari'], weight: '400', display: 'swap', variable: '--pansari-sign' })
const serif = Tiro_Devanagari_Hindi({ subsets: ['latin', 'devanagari'], weight: '400', style: ['normal', 'italic'], display: 'swap', variable: '--pansari-serif' })
const body = Hind({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--pansari-body' })
const chalk = Kalam({ subsets: ['latin', 'devanagari'], weight: ['400', '700'], display: 'swap', variable: '--pansari-chalk' })

/** Fine paper grain (inline SVG noise, tiled). */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.24 0 0 0 0 0.12 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Wooden wall planks behind the shelves. */
const PLANKS = `${GRAIN}, repeating-linear-gradient(90deg, rgba(107,67,36,0.07) 0 2px, transparent 2px 168px)`

/** Chalk dust on the board. */
const CHALK_DUST =
  'radial-gradient(ellipse at 18% 12%, rgba(255,255,255,0.08), transparent 42%), radial-gradient(ellipse at 85% 88%, rgba(255,255,255,0.06), transparent 46%), radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.03), transparent 60%)'

const SHOP_LINKS = [
  { href: '/products?category=dry-fruits', en: 'Dry fruits', hi: 'मेवा' },
  { href: '/products?category=herbs', en: 'Herbs', hi: 'जड़ी-बूटी' },
  { href: '/products?category=spices', en: 'Spices', hi: 'मसाले' },
  { href: '/kits', en: 'Kits', hi: 'किट' },
]

export default async function PansariPrototype() {
  const catalog = await getCatalog()
  const reviews = await getPublicReviews(catalog.all, 6)

  const toItem = (product: Product): ShelfItem => {
    const names = bilingual(product)
    const { badge } = cardLabels(product)
    return { product: lean(product), en: names.en, hi: names.hi, badge, badgeHi: badge ? BADGE_HI[badge] : undefined }
  }

  const board = catalog.pick(CHALKBOARD).map(product => ({ product, ...bilingual(product), grams: baseGrams(product), price: basePrice(product) }))

  const kitItems = catalog.kits
    .filter(kit => kit.images?.[0])
    .map(kit => {
      const inside = kitContents(kit).map(item => item.name.replace(/\s*\([^)]*\)/g, '').trim())
      const more = inside.length > 3 ? inside.length - 3 : 0
      return {
        ...toItem(kit),
        from: fromPrice(kit),
        insideEn: inside.length ? `${inside.slice(0, 3).join(', ')}${more ? ` +${more}` : ''}` : '',
        insideHi: inside.length ? `${inside.slice(0, 3).map(name => hindiName(name) || name).join(', ')}${more ? ` +${more}` : ''}` : '',
      }
    })

  const shelves: Shelf[] = [
    {
      key: 'mewa',
      en: 'Dry fruits & seeds',
      hi: 'मेवा और बीज',
      count: catalog.dryFruits.length,
      href: '/products?category=dry-fruits',
      allEn: `See all ${catalog.dryFruits.length} dry fruits & seeds`,
      allHi: `सारे ${catalog.dryFruits.length} मेवे और बीज देखें`,
      items: catalog.pick(SHELVES.mewa).map(toItem),
    },
    {
      key: 'jadi',
      en: 'Herbs',
      hi: 'जड़ी-बूटी',
      count: catalog.herbs.length,
      href: '/products?category=herbs',
      allEn: `See all ${catalog.herbs.length} herbs`,
      allHi: `सारी ${catalog.herbs.length} जड़ी-बूटियाँ देखें`,
      items: catalog.pick(SHELVES.jadi).map(toItem),
    },
    {
      key: 'masale',
      en: 'Whole spices',
      hi: 'साबुत मसाले',
      count: catalog.spices.length,
      href: '/products?category=spices',
      allEn: 'See all spices',
      allHi: 'सारे मसाले देखें',
      items: catalog.pick(SHELVES.masale).map(toItem),
    },
    {
      key: 'kits',
      en: 'Kits',
      hi: 'किट',
      count: catalog.kits.length,
      href: '/kits',
      allEn: 'Build your own kit',
      allHi: 'अपनी पसंद का किट बनाएँ',
      items: kitItems,
    },
  ].filter(shelf => shelf.items.length > 0)

  const now = new Date()
  const dateEn = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(now)
  const dateHi = new Intl.DateTimeFormat('hi-IN', { day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' }).format(now)

  return (
    <PansariRoot
      className={`${sign.variable} ${serif.variable} ${body.variable} ${chalk.variable} min-h-screen bg-[#F3E7D3] text-[#1E1A16] antialiased [font-family:var(--pansari-body)]`}
    >
      {/* Offer strip */}
      <div className="bg-[#1E1A16] px-4 py-2 text-center text-[12.5px] font-medium text-[#F3E7D3]">
        <T
          en={<>Free delivery above ₹999 · <span className="hidden sm:inline">Cash on delivery</span><span className="sm:hidden">COD</span> · 5% cashback</>}
          hi={<>₹999 से ऊपर डिलीवरी फ्री · <span className="hidden sm:inline">कैश ऑन डिलीवरी</span><span className="sm:hidden">COD</span> · 5% कैशबैक</>}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b-2 border-[#1E1A16] bg-[#F3E7D3]">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/prototypes/pansari" className="flex shrink-0 items-center gap-2.5" aria-label="Mana — home">
            <span className="relative h-11 w-11 overflow-hidden rounded-full bg-[#FBF5EA] ring-2 ring-[#1E1A16]">
              <Image src={BRAND.logo} alt="" fill sizes="44px" className="object-contain p-1" priority />
            </span>
            <span className="leading-none">
              <span className="block text-[27px] leading-[1.05] text-[#A8261C] [font-family:var(--pansari-sign)]">Mana</span>
              <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#5A4A3B]">
                <T en="Family pansari" hi="पारिवारिक पंसारी" />
              </span>
            </span>
          </Link>

          <nav aria-label="Shop" className="ml-3 hidden items-center gap-0.5 lg:flex">
            {SHOP_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-[15px] font-semibold text-[#1E1A16] transition hover:bg-[#1E1A16]/5 hover:text-[#A8261C]">
                <T en={link.en} hi={link.hi} />
              </Link>
            ))}
          </nav>

          <SearchBox className="ml-auto hidden w-full max-w-[19rem] md:block" />

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <LangToggle />
            <WhatsAppLink
              className="hidden h-11 w-11 items-center justify-center rounded-full text-[#2F5D3A] transition hover:bg-[#2F5D3A]/10 sm:inline-flex"
              label={['Order on WhatsApp', 'व्हाट्सऐप पर ऑर्डर करें']}
              en={<MessageCircle size={20} aria-hidden />}
              hi={<MessageCircle size={20} aria-hidden />}
            />
            <HeaderCart />
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <SearchBox />
        </div>
      </header>

      <main>
        {/* Hero: the shop front */}
        <section className="relative" style={{ backgroundImage: GRAIN }}>
          <Awning />
          {/* Phones: intro → chalkboard → the rest. Desktop: intro and the rest on the left, chalkboard on the right. */}
          <div className="mx-auto grid max-w-6xl content-start px-4 pb-14 pt-7 sm:px-6 lg:grid-cols-[1.06fr_0.94fr] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:pb-20 lg:pt-12">
            <div className="lg:col-start-1 lg:row-start-1">
              <Signboard />
              <p className="mt-6 text-[12.5px] font-bold uppercase tracking-[0.18em] text-[#A8261C] sm:mt-7">
                <T en="Delhi-NCR’s family pansari, now online" hi="दिल्ली-एनसीआर की पारिवारिक पंसारी दुकान" />
              </p>
              <h1 className="mt-3 text-[1.95rem] leading-[1.22] text-[#1E1A16] sm:text-[2.9rem] lg:text-[3.15rem] [font-family:var(--pansari-serif)]">
                <T
                  en={
                    <>
                      Pure dry fruits, herbs &amp; spices — <em className="text-[#A8261C]">from our family shop to your home.</em>
                    </>
                  }
                  hi={
                    <>
                      शुद्ध मेवा, जड़ी-बूटी और मसाले — <span className="text-[#A8261C]">परिवार की दुकान से सीधे आपके घर।</span>
                    </>
                  }
                />
              </h1>
            </div>

            <div className="order-3 mt-7 lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-0">
              <p className="max-w-xl text-[16px] leading-relaxed text-[#4E4237] lg:mt-4 lg:text-[17px]">
                <T
                  en="For over 20 years our family has weighed, sorted and sold mewa and masale in Delhi-NCR. Now the same counter is open for all of India — packed fresh after you order."
                  hi="20 साल से ज़्यादा से हमारा परिवार दिल्ली-एनसीआर में मेवा और मसाले तौलता, छाँटता और बेचता आया है। अब वही दुकान पूरे भारत के लिए खुली है — ऑर्डर के बाद ताज़ा पैक।"
                />
              </p>
              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                <a
                  href="#dukaan"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#A8261C] px-6 text-[15.5px] font-bold text-white shadow-[0_4px_0_#6E1812] transition hover:translate-y-[2px] hover:shadow-[0_2px_0_#6E1812]"
                >
                  <ShoppingBag size={18} />
                  <T en="Shop the shelves" hi="सामान देखें" />
                </a>
                <Link
                  href="/appointment"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#1E1A16] bg-[#FBF5EA] px-5 text-[15.5px] font-bold text-[#1E1A16] transition hover:bg-white"
                >
                  <Video size={18} />
                  <T en="Video call the shop" hi="दुकान से वीडियो कॉल" />
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] font-medium text-[#4E4237]">
                <li className="inline-flex items-center gap-1.5">
                  <BadgeCheck size={16} className="text-[#2F5D3A]" />
                  <T en="FSSAI licensed" hi="FSSAI लाइसेंस" />
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <FlaskConical size={16} className="text-[#2F5D3A]" />
                  <T en="Every batch lab tested" hi="हर खेप लैब में जाँची" />
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Banknote size={16} className="text-[#2F5D3A]" />
                  <T en="Cash on delivery" hi="कैश ऑन डिलीवरी" />
                </li>
              </ul>
              <div className="mt-6">
                <LangInvite />
              </div>
            </div>

            {/* Today's prices */}
            <div className="order-2 mt-8 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-start lg:pt-2">
              <div className="rounded-[1.1rem] bg-[linear-gradient(135deg,#8E5D35,#5E3B20_38%,#7C4D2B_68%,#4F311B)] p-2.5 shadow-[0_26px_50px_-26px_rgba(30,26,22,0.85)] sm:p-3">
                <div className="relative rounded-xl bg-[#1F2B24] px-4 pb-4 pt-5 text-[#F4F1E8] sm:px-6 [font-family:var(--pansari-chalk)]" style={{ backgroundImage: CHALK_DUST }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-[1.85rem] font-bold leading-none sm:text-[2.3rem]">
                        <T en="Today’s prices" hi="आज के दाम" />
                      </h2>
                      <svg aria-hidden viewBox="0 0 220 12" className="mt-1.5 h-3 w-44 text-[#F2D27B]">
                        <path d="M2 8 C 40 2, 70 11, 110 6 S 180 3, 218 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="shrink-0 -rotate-3 rounded-md border border-dashed border-[#F4F1E8]/40 px-2 py-1 text-[13.5px] leading-none text-[#F4F1E8]/85 sm:text-[15px]">
                      <T en={dateEn} hi={dateHi} />
                    </div>
                  </div>

                  <ul className="mt-3">
                    {board.map(row => (
                      <li key={row.product.id} className="flex items-center gap-3 border-b border-dashed border-white/15 py-2 last:border-b-0">
                        <div className="min-w-0 flex-1 text-[18px] leading-tight sm:text-[20px]">
                          <T
                            en={
                              <>
                                {row.en}
                                <span className="ml-1.5 text-[15px] text-[#F4F1E8]/60 sm:text-[16px]" lang="hi">
                                  {row.hi}
                                </span>
                              </>
                            }
                            hi={row.hi}
                          />
                        </div>
                        <div className="shrink-0 text-right leading-none">
                          <div className="text-[21px] font-bold text-[#F2D27B]">{formatPrice(row.price)}</div>
                          <div className="mt-0.5 text-[13px] text-[#F4F1E8]/65">
                            <T en={`/ ${gramsLabel(row.grams)}`} hi={`/ ${gramsHi(row.grams)}`} />
                          </div>
                        </div>
                        <ChalkAdd product={lean(row.product)} en={row.en} hi={row.hi} />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-[15px] text-[#F4F1E8]/75">
                    <span>
                      <T en="Prices per pack · bigger packs inside" hi="दाम पैक के हिसाब से · बड़े पैक भी हैं" />
                    </span>
                    <Link href="/products" className="inline-flex items-center gap-1 text-[#F2D27B] underline decoration-[#F2D27B]/40 underline-offset-4 hover:decoration-[#F2D27B]">
                      <T en="Full price list" hi="पूरी रेट लिस्ट" /> <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The shelves */}
        <section id="dukaan" className="scroll-mt-32 border-y-2 border-[#1E1A16] bg-[#E7D3B3] py-14 sm:py-20" style={{ backgroundImage: PLANKS }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle
              eyebrow={['From our shelves', 'दुकान की अलमारी से']}
              title={['Pick a pack — we weigh it fresh', 'पैक चुनिए — हम ताज़ा तौलेंगे']}
              sub={[
                'Every tag shows both names, so you always know exactly what you are buying. Prices change with the pack size.',
                'हर पर्ची पर दोनों नाम लिखे हैं, ताकि पता रहे कि क्या खरीद रहे हैं। पैक बदलेंगे तो दाम भी बदलेंगे।',
              ]}
            />
            <Shelves shelves={shelves} />
          </div>
        </section>

        {/* How an order is packed */}
        <section className="py-14 sm:py-20" style={{ backgroundImage: GRAIN }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle
              eyebrow={['How we pack', 'ऐसे होता है पैक']}
              title={['Weighed and packed fresh', 'तौल के, ताज़ा पैक']}
              sub={[
                'Nothing sits ground and waiting in a warehouse. Your order is what starts the grinding.',
                'कुछ भी पहले से पिसा रखा नहीं रहता। आपका ऑर्डर आते ही पिसाई शुरू होती है।',
              ]}
            />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ShoppingBag,
                  n: ['1', '१'],
                  title: ['You order', 'आप ऑर्डर करें'],
                  text: ['On the website or on WhatsApp. Pay online, or cash on delivery.', 'वेबसाइट या व्हाट्सऐप से। ऑनलाइन पेमेंट करें या कैश ऑन डिलीवरी।'],
                },
                {
                  icon: Scale,
                  n: ['2', '२'],
                  title: ['We grind and weigh', 'हम पीसते और तौलते हैं'],
                  text: ['Powders and churnas are ground after your order. Everything is weighed fresh.', 'पाउडर और चूर्ण आपके ऑर्डर के बाद पीसे जाते हैं। सब कुछ ताज़ा तौला जाता है।'],
                },
                {
                  icon: PackageCheck,
                  n: ['3', '३'],
                  title: ['Sealed and sent', 'सील करके रवाना'],
                  text: ['Whole items leave the same day. Powders within 24–48 hours.', 'साबुत सामान उसी दिन निकलता है, पाउडर 24–48 घंटे में।'],
                },
                {
                  icon: MessageCircle,
                  n: ['4', '४'],
                  title: ['Track it on WhatsApp', 'व्हाट्सऐप पर ट्रैकिंग'],
                  text: ['Your tracking link comes on WhatsApp. 2–3 days in NCR, 5–7 days elsewhere.', 'ट्रैकिंग लिंक व्हाट्सऐप पर आता है। एनसीआर में 2–3 दिन, बाकी भारत में 5–7 दिन।'],
                },
              ].map(step => (
                <li
                  key={step.n[0]}
                  className="relative flex gap-4 rounded-2xl bg-[#FBF5EA] p-4 shadow-[0_1px_0_rgba(30,26,22,0.05),0_16px_30px_-22px_rgba(30,26,22,0.6)] ring-1 ring-[#1E1A16]/10 sm:block sm:p-5 sm:pt-6"
                >
                  <div className="flex shrink-0 items-center justify-between">
                    <span
                      aria-hidden
                      className="flex h-12 w-12 -rotate-6 items-center justify-center rounded-full border-[3px] border-double border-[#A8261C] text-[1.4rem] leading-none text-[#A8261C] sm:h-14 sm:w-14 sm:text-[1.6rem] [font-family:var(--pansari-sign)]"
                    >
                      <T en={step.n[0]} hi={step.n[1]} />
                    </span>
                    <step.icon size={26} className="hidden text-[#2F5D3A] sm:block" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold text-[#1E1A16] sm:mt-4 sm:text-[18px]">
                      <T en={step.title[0]} hi={step.title[1]} />
                    </h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-[#4E4237] sm:mt-1.5">
                      <T en={step.text[0]} hi={step.text[1]} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Video call */}
        <section className="bg-[#1E1A16] py-14 text-[#F8EEDC] sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionTitle
                dark
                eyebrow={['Just like visiting the shop', 'बिलकुल दुकान जैसा']}
                title={['See the goods on a video call', 'दुकान देखिए, वीडियो कॉल पर']}
                sub={[
                  'Not sure which almonds, or which cardamom? Book a free video call and we will show you the products live and help you choose. No obligation to buy.',
                  'कौन-से बादाम लें, कौन-सी इलायची? मुफ़्त वीडियो कॉल बुक कीजिए — हम सामान लाइव दिखाएँगे और चुनने में मदद करेंगे। खरीदना ज़रूरी नहीं।',
                ]}
              />
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/appointment"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#E2A50E] px-6 text-[15.5px] font-bold text-[#1E1A16] shadow-[0_4px_0_#9A6F06] transition hover:translate-y-[2px] hover:shadow-[0_2px_0_#9A6F06]"
                >
                  <Video size={18} />
                  <T en="Book a free video call" hi="मुफ़्त वीडियो कॉल बुक करें" />
                </Link>
                <WhatsAppLink
                  className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-[#F8EEDC]/40 px-5 text-[15.5px] font-bold text-[#F8EEDC] transition hover:border-[#F8EEDC] hover:bg-white/5"
                  en={
                    <>
                      <MessageCircle size={18} /> Order on WhatsApp
                    </>
                  }
                  hi={
                    <>
                      <MessageCircle size={18} /> व्हाट्सऐप पर ऑर्डर करें
                    </>
                  }
                />
              </div>
              <p className="mt-5 text-[13.5px] text-[#E8DCC6]/75">
                <T
                  en="Prefer to chat first? Message us on WhatsApp — ask anything, and order right there in the chat."
                  hi="पहले बात करनी है? व्हाट्सऐप पर मैसेज कीजिए — जो पूछना है पूछिए, और वहीं ऑर्डर कर दीजिए।"
                />
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[15.5rem] sm:max-w-[16.5rem]">
              <div aria-hidden className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(226,165,14,0.28),transparent_65%)]" />
              <div className="relative rounded-[2.4rem] bg-[#0E0C0A] p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.95rem] bg-[#2B211A]">
                  <Image src={BRAND.categories.pansari} alt="Dry fruits, herbs and spices laid out for a video call" fill sizes="300px" className="object-cover" />
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-4 text-white">
                    <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/30" />
                    <div className="flex items-center gap-2.5">
                      <span className="relative h-9 w-9 overflow-hidden rounded-full bg-[#FBF5EA]">
                        <Image src={BRAND.logo} alt="" fill sizes="36px" className="object-contain p-1" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-[14px] font-bold">Mana · MK and Sons</div>
                        <div className="text-[11.5px] text-white/75">
                          <T en="Video call" hi="वीडियो कॉल" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/75 to-transparent pb-6 pt-12">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white">
                      <Mic size={18} />
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white">
                      <Camera size={18} />
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D93A2B] text-white">
                      <PhoneOff size={18} />
                    </span>
                  </div>
                </div>
              </div>
              <span
                aria-hidden
                className="absolute -right-3 top-10 flex h-[4.6rem] w-[4.6rem] rotate-12 flex-col items-center justify-center rounded-full border-[3px] border-double border-[#E2A50E] bg-[#1E1A16] text-center text-[13px] font-bold uppercase leading-tight text-[#E2A50E]"
              >
                <T en={<>Free<br />call</>} hi={<>मुफ़्त<br />कॉल</>} />
              </span>
            </div>
          </div>
        </section>

        {/* Family story */}
        <section className="border-b-2 border-[#1E1A16] bg-[#E7D3B3] py-14 sm:py-20" style={{ backgroundImage: PLANKS }}>
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <figure className="relative mx-auto w-full max-w-md -rotate-2 bg-[#FFFDF6] p-3 pb-4 shadow-[0_24px_40px_-22px_rgba(30,26,22,0.7)]">
              <span aria-hidden className="absolute -top-3 left-8 h-7 w-20 -rotate-6 bg-[#E2A50E]/55" />
              <span aria-hidden className="absolute -top-3 right-8 h-7 w-20 rotate-6 bg-[#E2A50E]/55" />
              <div className="relative aspect-[4/3] overflow-hidden bg-[#2B211A]">
                <Image src={BRAND.hero} alt="Mana pouches of dry fruits, herbs and spices" fill sizes="(max-width: 1024px) 90vw, 420px" className="object-cover" />
              </div>
              <figcaption className="mt-3 text-center text-[18px] leading-snug text-[#4E4237] sm:text-[19px] [font-family:var(--pansari-chalk)]">
                <T en="Same quality as our counter in Delhi-NCR" hi="वही माल, जो हमारी दुकान पर मिलता है" />
              </figcaption>
            </figure>

            <div className="relative overflow-hidden rounded-r-2xl rounded-l-md bg-[#FFFDF6] py-8 pl-10 pr-6 shadow-[0_24px_48px_-26px_rgba(30,26,22,0.75)] sm:pl-14 sm:pr-10">
              <span aria-hidden className="absolute inset-y-0 left-0 w-3 bg-[linear-gradient(90deg,#6E1812,#A8261C)] sm:w-4" />
              <span aria-hidden className="absolute inset-y-0 left-7 w-px bg-[#A8261C]/40 sm:left-10" />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 33px, rgba(29,63,154,0.07) 33px 34px)' }}
              />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#A8261C]">
                    <T en="Our story" hi="हमारी कहानी" />
                  </span>
                  <span className="text-[20px] text-[#A8261C] [font-family:var(--pansari-chalk)]">
                    <T en="the family ledger" hi="बही-खाता" />
                  </span>
                </div>
                <h2 className="mt-3 text-[1.75rem] leading-[1.25] text-[#1E1A16] sm:text-[2.2rem] [font-family:var(--pansari-serif)]">
                  <T en="MK and Sons — a family in the mewa trade" hi="एमके एंड संस — मेवे के कारोबार में एक परिवार" />
                </h2>
                <p className="mt-4 text-[15.5px] leading-[1.85] text-[#3F352C]">
                  <T
                    en="MK and Sons is a family-run dry fruits, herbs and spices business in Delhi-NCR. For decades we have bought directly from growers across Kashmir, Kerala, Madhya Pradesh, Rajasthan and beyond — and sorted every batch by hand before it reaches a customer."
                    hi="एमके एंड संस दिल्ली-एनसीआर का पारिवारिक कारोबार है — मेवा, जड़ी-बूटी और मसाले। दशकों से हम कश्मीर, केरल, मध्य प्रदेश, राजस्थान और दूसरी जगहों के किसानों और बाग़वालों से सीधे माल लेते हैं, और ग्राहक तक पहुँचने से पहले हर खेप हाथ से छाँटते हैं।"
                  />
                </p>
                <p className="mt-3 text-[15.5px] leading-[1.85] text-[#3F352C]">
                  <T
                    en="Mana is the same counter, now online: no middlemen, no preservatives, and powders ground only after you order."
                    hi="मना वही दुकान है, अब ऑनलाइन: न बिचौलिए, न प्रिज़र्वेटिव, और पाउडर सिर्फ़ ऑर्डर आने के बाद पिसते हैं।"
                  />
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-dashed border-[#1E1A16]/25 pt-5 sm:grid-cols-4">
                  {[
                    { value: '20+', en: 'years in trade', hi: 'साल का कारोबार' },
                    { value: '2K+', en: 'families served', hi: 'परिवारों का भरोसा' },
                    { value: 'FSSAI', en: 'licensed, lab tested', hi: 'लाइसेंस, लैब टेस्टेड' },
                    { value: '0', en: 'preservatives', hi: 'प्रिज़र्वेटिव' },
                  ].map(stat => (
                    <div key={stat.en}>
                      <dt className="text-[1.65rem] leading-none text-[#A8261C] [font-family:var(--pansari-sign)]">{stat.value}</dt>
                      <dd className="mt-1.5 text-[13px] font-medium leading-snug text-[#4E4237]">
                        <T en={stat.en} hi={stat.hi} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link href="/about" className="mt-6 inline-flex h-11 items-center gap-1.5 text-[15px] font-bold text-[#A8261C] underline decoration-[#A8261C]/30 decoration-2 underline-offset-4 hover:decoration-[#A8261C]">
                  <T en="Read our full story" hi="पूरी कहानी पढ़ें" /> <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="py-14 sm:py-20" style={{ backgroundImage: GRAIN }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionTitle center eyebrow={['Customer chits', 'ग्राहकों की पर्चियाँ']} title={['What our customers say', 'ग्राहक क्या कहते हैं']} />
              <div
                className={`mx-auto mt-10 grid gap-7 ${
                  reviews.length >= 3 ? 'md:grid-cols-3' : reviews.length === 2 ? 'max-w-4xl md:grid-cols-2' : 'max-w-xl'
                }`}
              >
                {reviews.slice(0, 3).map((review, index) => (
                  <figure
                    key={review.id}
                    className={`relative bg-[#FFF8E6] p-6 pt-9 shadow-[0_16px_30px_-18px_rgba(30,26,22,0.7)] ${index % 2 ? 'sm:rotate-[1.2deg]' : 'sm:-rotate-[1.2deg]'}`}
                  >
                    <span aria-hidden className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#E4574A,#A8261C_60%,#6E1812)] shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />
                    <div className="flex gap-0.5 text-[#E2A50E]" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star key={star} size={16} fill={star < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    {review.title && <p className="mt-3 text-[15px] font-bold text-[#1E1A16]">{review.title}</p>}
                    <blockquote className="mt-2 text-[20px] leading-snug text-[#2A231C] [font-family:var(--pansari-chalk)]">“{review.body}”</blockquote>
                    <figcaption className="mt-4 text-[14px] text-[#4E4237]">
                      <b className="text-[#1E1A16]">{reviewerName(review.customer_name)}</b>
                      {review.product_name && <> · <T en={review.product_name} hi={hindiName(review.product_name) || review.product_name} /></>}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-10 text-center">
                <Link href="/products" className="inline-flex h-11 items-center gap-1.5 text-[15px] font-semibold text-[#A8261C] underline decoration-[#A8261C]/30 underline-offset-4 hover:decoration-[#A8261C]">
                  <T en="Bought from us? Leave a review" hi="हमसे खरीदा है? अपनी राय लिखें" /> <ArrowRight size={15} />
                </Link>
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-[#1E1A16] text-[#F3E7D3]">
        <div aria-hidden className="h-2.5" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #A8261C 0 28px, #F3E7D3 28px 56px)' }} />
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <div className="text-[2rem] leading-none text-[#E9B949] [font-family:var(--pansari-sign)]">
              मना · Mana
            </div>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[#F3E7D3]/80">
              <T
                en="Dry fruits, herbs and spices from MK and Sons, a family business in Delhi-NCR — packed fresh to order and delivered across India."
                hi="एमके एंड संस, दिल्ली-एनसीआर के पारिवारिक कारोबार से मेवा, जड़ी-बूटी और मसाले — ऑर्डर पर ताज़ा पैक, पूरे भारत में डिलीवरी।"
              />
            </p>
            <WhatsAppLink
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-[14.5px] font-bold text-[#0B3B22] transition hover:brightness-95"
              en={
                <>
                  <MessageCircle size={17} /> Order on WhatsApp
                </>
              }
              hi={
                <>
                  <MessageCircle size={17} /> व्हाट्सऐप पर ऑर्डर
                </>
              }
            />
          </div>
          <FooterColumn
            title={['Shop', 'दुकान']}
            links={[...SHOP_LINKS.map(link => ({ href: link.href, en: link.en, hi: link.hi })), { href: '/products', en: 'Everything', hi: 'सारा सामान' }]}
          />
          <FooterColumn
            title={['Help', 'मदद']}
            links={[
              { href: '/track-order', en: 'Track your order', hi: 'ऑर्डर ट्रैक करें' },
              { href: '/faq', en: 'FAQs', hi: 'सवाल-जवाब' },
              { href: '/appointment', en: 'Book a video call', hi: 'वीडियो कॉल बुक करें' },
              { href: '/faq', en: 'Returns & refunds', hi: 'वापसी और रिफ़ंड' },
            ]}
          />
          <FooterColumn
            title={['Mana', 'मना']}
            links={[
              { href: '/about', en: 'Our story', hi: 'हमारी कहानी' },
              { href: '/blog', en: 'Blog', hi: 'ब्लॉग' },
              { href: '/profile', en: 'My account', hi: 'मेरा खाता' },
              { href: '/privacy', en: 'Privacy', hi: 'प्राइवेसी' },
              { href: '/terms', en: 'Terms', hi: 'शर्तें' },
            ]}
          />
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-6xl space-y-1.5 px-4 py-5 text-[12.5px] leading-relaxed text-[#F3E7D3]/65 sm:px-6">
            <p>
              <T
                en="Secure payments by Razorpay · UPI · Cards · Net banking · Cash on delivery"
                hi="Razorpay से सुरक्षित पेमेंट · UPI · कार्ड · नेट बैंकिंग · कैश ऑन डिलीवरी"
              />
            </p>
            <p>
              <T
                en="Herbs are listed for their traditional use in Indian kitchens and Ayurveda. This is not medical advice."
                hi="जड़ी-बूटियाँ भारतीय रसोई और आयुर्वेद में पारंपरिक इस्तेमाल के लिए हैं। यह डॉक्टरी सलाह नहीं है।"
              />
            </p>
            <p>© {now.getFullYear()} MK and Sons · Delhi-NCR</p>
          </div>
        </div>
      </footer>

      <BillBar />
    </PansariRoot>
  )
}

/** Striped shop awning with a scalloped edge. */
function Awning() {
  return (
    <div aria-hidden className="relative">
      <div className="h-7 sm:h-9" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #A8261C 0 28px, #F7ECDC 28px 56px)' }} />
      <div
        className="h-3.5"
        style={{
          background:
            'radial-gradient(circle at 14px 0, #A8261C 13.5px, transparent 14px) 0 0 / 56px 14px repeat-x, radial-gradient(circle at 14px 0, #F7ECDC 13.5px, transparent 14px) 28px 0 / 56px 14px repeat-x',
        }}
      />
      <div className="absolute inset-x-0 top-full h-5 bg-gradient-to-b from-[#1E1A16]/15 to-transparent" />
    </div>
  )
}

/** Hand-painted shop sign: the same in both languages, like a real board. */
function Signboard() {
  return (
    <div className="relative inline-block max-w-full rounded-lg bg-[#A8261C] px-6 pb-3.5 pt-4 shadow-[0_6px_0_#6E1812,0_20px_30px_-16px_rgba(30,26,22,0.8)] sm:px-8">
      <span aria-hidden className="absolute inset-1.5 rounded-md border-2 border-[#E2A50E]/80" />
      {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map(position => (
        <span key={position} aria-hidden className={`absolute ${position} h-1.5 w-1.5 rounded-full bg-[#F2D27B]`} />
      ))}
      <div className="relative flex items-baseline gap-3 whitespace-nowrap">
        <span lang="hi" className="text-[2.7rem] leading-[1.15] text-[#FBE3A0] drop-shadow-[2px_2px_0_#5C1510] sm:text-[3.4rem] [font-family:var(--pansari-sign)]">
          मना
        </span>
        <span className="text-[#F2D27B]/70" aria-hidden>
          ·
        </span>
        <span className="text-[2.35rem] leading-none tracking-wide text-[#FBEFD9] drop-shadow-[2px_2px_0_#5C1510] sm:text-[2.9rem] [font-family:var(--pansari-sign)]">MANA</span>
      </div>
      <div className="relative mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FBEFD9]/90 sm:text-[12px]">
        MK and Sons · Delhi-NCR
      </div>
    </div>
  )
}

function FooterColumn({ title, links }: { title: [string, string]; links: { href: string; en: string; hi: string }[] }) {
  return (
    <div>
      <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#E9B949]">
        <T en={title[0]} hi={title[1]} />
      </h3>
      <ul className="mt-3 space-y-1">
        {links.map(link => (
          <li key={`${link.href}-${link.en}`}>
            <Link href={link.href} className="inline-flex min-h-[2.25rem] items-center text-[14.5px] text-[#F3E7D3]/85 transition hover:text-white">
              <T en={link.en} hi={link.hi} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
