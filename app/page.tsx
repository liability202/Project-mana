import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'
import { NewsletterForm } from '@/components/NewsletterForm'
import { formatPrice } from '@/lib/utils'
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

const TESTIMONIALS = [
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
      <section className="relative flex items-center justify-center min-h-[85vh] px-[5%] py-20 overflow-hidden text-center">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes kenburns {
            0% { transform: scale(1); }
            100% { transform: scale(1.15); }
          }
          .animate-kenburns {
            animation: kenburns 30s ease-in-out infinite alternate;
          }
        `}} />

        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 bg-ink">
          <Image
            src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/hero%20banner.png"
            alt="Premium Spices Background"
            fill
            className="object-cover object-center opacity-80 animate-kenburns"
            priority
          />
          {/* Elegant Dark Overlay ensuring text readability on all devices */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center mt-8">
          <div className="flex items-center gap-3 text-[.65rem] tracking-[.4em] uppercase text-ivory/90 font-medium mb-6 animate-fade-up" style={{ animationDelay: '.1s', animationFillMode: 'both' }}>
            <span className="w-8 h-px bg-ivory/60 block" />
            Pure · Natural · Handpicked
            <span className="w-8 h-px bg-ivory/60 block" />
          </div>

          <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-light text-white leading-[1.05] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '.2s', animationFillMode: 'both' }}>
            The <em className="not-italic text-green-4">Essence</em><br />
            of Nature.
          </h1>

          <p className="text-[1.05rem] md:text-[1.2rem] leading-[1.8] text-ivory-3 max-w-[580px] mx-auto mb-10 animate-fade-up font-light" style={{ animationDelay: '.35s', animationFillMode: 'both' }}>
            Premium dry fruits, Ayurvedic herbs, hand-picked spices and pansari staples — sourced directly from the finest origins across World.
          </p>

          <div className="flex gap-5 flex-col sm:flex-row justify-center w-full sm:w-auto animate-fade-up px-4 sm:px-0" style={{ animationDelay: '.5s', animationFillMode: 'both' }}>
            <Link href="/products" className="btn-primary no-underline px-10 py-4 text-[.95rem] shadow-xl shadow-green/20 hover:shadow-green/40 hover:-translate-y-1 transition-all bg-green hover:bg-green-4 text-white border-none w-full sm:w-auto flex items-center justify-center">
              <span>view collection</span>
            </Link>
            <Link href="/kits" className="btn-outline no-underline px-10 py-4 text-[.95rem] border-white/40 text-white hover:bg-white hover:text-ink transition-all w-full sm:w-auto backdrop-blur-sm bg-white/5 flex items-center justify-center">
              Explore Our Kits
            </Link>
          </div>

          <div className="flex gap-10 sm:gap-16 pt-12 mt-12 border-t border-white/15 flex-wrap justify-center animate-fade-up w-full" style={{ animationDelay: '.65s', animationFillMode: 'both' }}>
            {[
              ['400+', 'Premium Products'],
              ['2K+', 'Happy Families'],
              ['100%', 'Pure & Natural']
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col items-center gap-1.5">
                <div className="font-serif text-[1.8rem] sm:text-[2.2rem] text-green-4 leading-none drop-shadow-lg">{n}</div>
                <div className="text-[.6rem] sm:text-[.65rem] tracking-[.2em] uppercase text-ivory/70 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-green py-2.5 overflow-hidden select-none flex">
        <div className="flex shrink-0 min-w-full justify-around items-center animate-marquee">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-[.68rem] tracking-[.18em] uppercase text-green-4 whitespace-nowrap px-6 flex items-center gap-2.5 font-light after:content-['✦'] after:text-[.52rem] after:text-green-3">
              {item}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 min-w-full justify-around items-center animate-marquee" aria-hidden="true">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={`dup-${i}`} className="text-[.68rem] tracking-[.18em] uppercase text-green-4 whitespace-nowrap px-6 flex items-center gap-2.5 font-light after:content-['✦'] after:text-[.52rem] after:text-green-3">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="section fade-in">
        <div className="text-center mb-12">
          <div className="eyebrow justify-center">Shop by Category</div>
          <h2 className="section-title">The <em className="not-italic text-green">essence</em> of nature</h2>
          <p className="text-[.92rem] text-ink-3 mt-2 max-w-md mx-auto">Four pillars of natural goodness, curated for your home.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="card no-underline group">
              <div className="aspect-[3/4] overflow-hidden">
                <Image src={cat.img} alt={cat.name} width={500} height={650} className="object-cover w-full h-full group-hover:scale-[1.06] transition-transform duration-500" />
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
      <section className="section bg-terra-4 fade-in">
        <div className="text-center mb-10">
          <div className="eyebrow justify-center">Pre-made Kits</div>
          <h2 className="section-title">Everything <em className="not-italic text-green">together,</em><br />perfectly curated</h2>
        </div>
        {kits.length === 0 ? (
          <div className="text-center py-12 text-ink-3 bg-white/40 border border-ivory-3 rounded-2xl">
            <p className="font-serif text-lg text-ink">No kits available at the moment.</p>
            <p className="text-xs text-ink-4 mt-1">Please check back later or customize your order via WhatsApp!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kits.map(kit => (
              <ProductCard key={kit.id} product={kit} />
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <div className="eyebrow">Customer Favorites</div>
            <h2 className="section-title">Featured <em className="not-italic text-green">selections</em></h2>
          </div>
          <Link href="/products" className="text-[.72rem] tracking-[.18em] uppercase text-green-3 font-medium no-underline hover:text-green transition-colors">
            View All Products ({featuredProducts.length}+) →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── WHY MANA ── */}
      <section className="section bg-ivory-2 fade-in">
        <div className="text-center mb-12">
          <div className="eyebrow justify-center">The Mana Standard</div>
          <h2 className="section-title">Purity you can <em className="not-italic text-green">see & feel</em></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Source Direct',
              desc: 'We source Kashmiri saffron, Mamra almonds, and Himalayan shilajit directly from trusted farming families.',
              icon: '🌱',
            },
            {
              title: 'Lab Tested Quality',
              desc: 'Every batch undergoes rigorous quality testing for purity, moisture content, and zero adulteration.',
              icon: '🔬',
            },
            {
              title: 'Freshly Packed',
              desc: 'Items are nitrogen-sealed in food-grade packaging immediately after order confirmation to lock in natural oils.',
              icon: '✨',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-ivory-3 rounded-2xl p-8 text-center shadow-soft">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-serif text-xl text-ink mb-3 font-normal">{item.title}</h3>
              <p className="text-sm text-ink-3 leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section fade-in">
        <div className="text-center mb-12">
          <div className="eyebrow justify-center">Loved by Families</div>
          <h2 className="section-title">What our <em className="not-italic text-green">customers say</em></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="text-gold text-sm mb-3">{'★'.repeat(t.stars)}</div>
                <p className="text-sm text-ink-2 leading-relaxed italic mb-4 font-light">"{t.text}"</p>
              </div>
              <div className="border-t border-ivory-3 pt-3 flex justify-between items-center text-xs">
                <span className="font-medium text-ink">{t.name}</span>
                <span className="text-ink-4">{t.city}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

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
