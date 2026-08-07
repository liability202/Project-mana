import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'
import { NewsletterForm } from '@/components/NewsletterForm'
import { TestimonialsCarousel, type Testimonial } from '@/components/home/TestimonialsCarousel'
import { KitCard } from '@/components/home/KitCard'
import { PackedFreshPromise } from '@/components/home/PackedFreshPromise'
import { ChatAndBuy } from '@/components/home/ChatAndBuy'
import type { Product } from '@/lib/supabase'

export const revalidate = 60

async function getFeaturedProducts(): Promise<Product[]> {
  // First try bestseller-tagged products
  const { data: bestsellers } = await supabase
    .from('products')
    .select('*')
    .contains('tags', ['bestseller'])
    .eq('in_stock', true)
    .limit(4)

  if (bestsellers && bestsellers.length > 0) return bestsellers

  // Fallback: return any 4 in-stock products
  const { data: any4 } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .limit(4)

  return any4 || []
}

async function getKits(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category', 'kits')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(4)
  return data || []
}

const CATEGORIES = [
  { name: 'Dry Fruits', slug: 'dry-fruits', pill: 'Most Popular', img: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/ChatGPT%20Image%20Mar%2024,%202026,%2010_12_09%20PM.png', count: '48 varieties' },
  { name: 'Herbs', slug: 'herbs', pill: 'Ayurvedic', img: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/herbs%20category.png', count: '36 varieties' },
  { name: 'Spices', slug: 'spices', pill: 'Single Origin', img: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/Spices%20category.png', count: '54 varieties' },
  { name: 'Pansari', slug: 'pansari', pill: 'Traditional', img: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/Pansari%20category.png', count: '62 varieties' },
]

const TESTIMONIALS: Testimonial[] = [
  { stars: 5, text: 'The Mamra almonds are unlike anything I have bought before. Premium packaging keeps them fresh for weeks.', name: 'Sunita Rao', city: 'Mumbai' },
  { stars: 5, text: 'Video appointment felt like a real store visit. Expert showed every herb live before I ordered.', name: 'Vikram Patel', city: 'Ahmedabad' },
  { stars: 5, text: 'The Triphala kit is my holy grail. Consistent quality every single month.', name: 'Deepa Krishnan', city: 'Delhi' },
  { stars: 5, text: 'Beautiful packaging, excellent quality. Ordered 3 times already!', name: 'Aryan Gupta', city: 'Delhi' },
  { stars: 5, text: 'Saffron quality is outstanding. You can tell it is real the moment you open the pack.', name: 'Priya Mehta', city: 'Bangalore' },

]

const MARQUEE_ITEMS = [
  'Premium Dry Fruits', 'Ayurvedic Herbs', 'Single Origin Spices',
  'Lab Tested Quality', 'FSSAI Certified', 'Free Shipping ₹999+',
  'Chat & Buy Service', 'Packed Fresh To Order', 'Video Appointments',
]

export default async function HomePage() {
  const [featuredProducts, kits] = await Promise.all([
    getFeaturedProducts(),
    getKits(),
  ])

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative flex items-center justify-center min-h-[60vh] sm:min-h-[85vh] px-[5%] py-12 sm:py-20 overflow-hidden text-center">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 bg-ink">
          <Image
            src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/hero%20banner.png"
            alt="Premium Spices Background"
            fill
            sizes="100vw"
            quality={70}
            className="object-cover object-center opacity-80 animate-kenburns"
            priority
          />
          {/* Elegant Dark Overlay ensuring text readability on all devices.
              This used to carry `backdrop-blur-[2px]`, which forced the browser
              to re-blur the entire viewport on every frame of the 30s Ken Burns
              animation underneath — the main source of the scroll stutter.
              A slightly stronger tint gives the same readability for free. */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center mt-2 sm:mt-8">
          <div className="flex items-center gap-2 text-[.55rem] sm:text-[.65rem] tracking-[.4em] uppercase text-ivory/90 font-medium mb-4 sm:mb-6 animate-fade-up" style={{ animationDelay: '.1s', animationFillMode: 'both' }}>
            <span className="w-8 h-px bg-ivory/60 block" />
            Pure · Natural · Handpicked
            <span className="w-8 h-px bg-ivory/60 block" />
          </div>

          <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-light text-white leading-[1.05] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '.2s', animationFillMode: 'both' }}>
            The <em className="not-italic text-green-4">Essence</em><br />
            of Nature.
          </h1>

          <p className="text-[.9rem] sm:text-[1.05rem] md:text-[1.2rem] leading-[1.7] text-ivory-3 max-w-[580px] mx-auto mb-6 sm:mb-10 animate-fade-up font-light" style={{ animationDelay: '.35s', animationFillMode: 'both' }}>
            Premium dry fruits, Ayurvedic herbs, hand-picked spices and pansari staples — sourced directly from the finest origins across World.
          </p>

          <div className="flex gap-3 sm:gap-5 flex-col sm:flex-row justify-center w-full sm:w-auto animate-fade-up px-3 sm:px-0" style={{ animationDelay: '.5s', animationFillMode: 'both' }}>
            {/* No drop shadow: a coloured glow over the photographic hero read
                as a halo rather than elevation. Hover now lifts and deepens the
                green instead. */}
            <Link href="/products" className="btn-primary no-underline px-6 sm:px-10 py-3 sm:py-4 text-[.9rem] sm:text-[1.05rem] hover:-translate-y-1 transition-[transform,background-color] duration-300 bg-green hover:bg-green-2 text-white border-none w-full sm:w-auto flex items-center justify-center rounded-lg">
              <span>View Collection</span>
            </Link>
            {/* `backdrop-blur-sm` removed: it sat over the animating hero image,
                so the browser re-sampled it every frame for no visual gain. */}
            <Link href="/kits" className="btn-outline no-underline px-6 sm:px-10 py-3 sm:py-4 text-[.9rem] sm:text-[1.05rem] border-white/40 text-white hover:bg-white hover:text-ink transition-colors duration-300 w-full sm:w-auto bg-white/10 flex items-center justify-center rounded-lg">
              Explore Our Kits
            </Link>
          </div>

          <div className="flex gap-6 sm:gap-10 md:gap-16 pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-white/15 flex-wrap justify-center animate-fade-up w-full" style={{ animationDelay: '.65s', animationFillMode: 'both' }}>
            {[
              ['400+', 'Premium Products'],
              ['2K+', 'Happy Families'],
              ['100%', 'Pure & Natural']
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <div className="font-serif text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] text-green-4 leading-none drop-shadow-lg">{n}</div>
                <div className="text-[.5rem] sm:text-[.6rem] md:text-[.65rem] tracking-[.15em] uppercase text-ivory/70 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-green py-2 sm:py-2.5 overflow-hidden select-none flex">
        <div className="flex shrink-0 min-w-full justify-around items-center animate-marquee">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-[.55rem] sm:text-[.68rem] tracking-[.15em] sm:tracking-[.18em] uppercase text-green-4 whitespace-nowrap px-3 sm:px-6 flex items-center gap-1.5 sm:gap-2.5 font-light after:content-['✦'] after:text-[.4rem] sm:after:text-[.52rem] after:text-green-3">
              {item}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 min-w-full justify-around items-center animate-marquee" aria-hidden="true">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={`dup-${i}`} className="text-[.55rem] sm:text-[.68rem] tracking-[.15em] sm:tracking-[.18em] uppercase text-green-4 whitespace-nowrap px-3 sm:px-6 flex items-center gap-1.5 sm:gap-2.5 font-light after:content-['✦'] after:text-[.4rem] sm:after:text-[.52rem] after:text-green-3">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="section fade-in">
        <div className="text-center mb-7 sm:mb-12">
          <div className="eyebrow justify-center text-[.5rem] sm:text-[.56rem]">Shop by Category</div>
          <h2 className="section-title text-[1.8rem] sm:text-[2.2rem] md:text-[2.8rem]">The <em className="not-italic text-green">essence</em> of nature</h2>
          <p className="text-[.78rem] sm:text-[.92rem] text-ink-3 mt-2 max-w-md mx-auto">Four pillars of natural goodness, curated for your home.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="card no-underline group">
              {/* 4:5 rather than 3:4 — matches ProductCard, and the taller
                  crop was stretching these compositions vertically. */}
              <div className="aspect-[4/5] overflow-hidden">
                <Image
                  src={cat.img}
                  alt={cat.name}
                  width={500}
                  height={625}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  quality={72}
                  className="object-cover w-full h-full group-hover:scale-[1.06] transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="text-[.55rem] tracking-[.14em] uppercase bg-green-6 text-green-2 px-1.5 py-0.5 rounded-sm inline-block mb-1.5 font-medium">{cat.pill}</div>
                <div className="font-serif text-[1.18rem] text-ink font-normal">{cat.name}</div>
                <div className="text-[.66rem] text-ink-3 mt-0.5">{cat.count}</div>
                <div className="text-[.64rem] text-green-3 tracking-wide uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Shop Now →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── KITS ── */}
      <section className="section bg-terra-4 fade-in px-[5%] py-12 sm:py-16">
        <div className="text-center mb-7">
          <div className="eyebrow justify-center text-[.5rem] sm:text-[.56rem]">Pre-made Kits</div>
          <h2 className="font-serif text-[1.8rem] sm:text-[2.2rem] md:text-[2.8rem] font-light leading-tight text-ink">Everything <em className="not-italic text-green">together,</em><br />perfectly curated</h2>
        </div>
        {kits.length === 0 ? (
          <div className="text-center py-12 text-ink-3 bg-white/40 border border-ivory-3 rounded-2xl">
            <p className="font-serif text-lg text-ink">No kits available at the moment.</p>
            <p className="text-xs text-ink-4 mt-1">Please check back later or customize your order via WhatsApp!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {kits.map(kit => (
                <KitCard key={kit.id} kit={kit} />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link href="/kits" className="btn-primary no-underline px-9 py-4 text-[1.02rem]">
                View All Kits →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── PACKED FRESH PROMISE ── */}
      <PackedFreshPromise />

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section fade-in px-[5%] py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-7 sm:mb-10 gap-4">
          <div>
            <div className="eyebrow text-[.5rem] sm:text-[.56rem]">Customer Favorites</div>
            <h2 className="font-serif text-[1.8rem] sm:text-[2.2rem] md:text-[2.8rem] font-light leading-tight text-ink">Featured <em className="not-italic text-green">selections</em></h2>
          </div>
          <Link href="/products" className="text-[.6rem] sm:text-[.72rem] tracking-[.15em] sm:tracking-[.18em] uppercase text-green-3 font-medium no-underline hover:text-green transition-colors whitespace-nowrap">
            View All Products ({featuredProducts.length}+) →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* The "Mana Standard / Purity you can see & feel" block used to sit here.
          Removed — the Packed Fresh promise band above now carries the same
          three claims (natural, lab tested, freshly packed) without repeating
          them twice on one page. */}

      {/* ── TESTIMONIALS ── */}
      <section className="section fade-in overflow-hidden">
        <div className="text-center mb-12">
          <div className="eyebrow justify-center">Loved by Families</div>
          <h2 className="section-title">What our <em className="not-italic text-green">customers say</em></h2>
          <p className="text-[.92rem] text-ink-3 mt-2 max-w-md mx-auto">Over 2,000 families across India trust Mana for their daily wellness.</p>
        </div>
        <TestimonialsCarousel items={TESTIMONIALS} />
      </section>

      {/* ── CHAT & BUY ── */}
      <ChatAndBuy />

      {/* ── NEWSLETTER ── */}
      <section className="section bg-green text-white rounded-3xl mx-[5%] my-12 py-16 px-6 text-center fade-in">
        <div className="max-w-xl mx-auto">
          <div className="eyebrow text-green-4 justify-center">Join Our Circle</div>
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-4">
            Get <em className="not-italic text-green-4">10% off</em> your first order
          </h2>
          <p className="text-sm text-ivory/80 mb-8 leading-relaxed font-light">
            Subscribe for seasonal harvest updates, exclusive wellness kits, and traditional Ayurvedic recipes directly in your inbox.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
