import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'
import { NewsletterForm } from '@/components/NewsletterForm'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/supabase'

export const revalidate = 60

async function getFeaturedProducts(): Promise<Product[]> {
  const { data: bestsellers } = await supabase
    .from('products')
    .select('*')
    .contains('tags', ['bestseller'])
    .eq('in_stock', true)
    .limit(4)
  if (bestsellers && bestsellers.length > 0) return bestsellers
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
  { name: 'Dry Fruits', slug: 'dry-fruits', pill: 'Most Popular', img: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/ChatGPT%20Image%20Aug%208,%202026,%2001_17_56%20PM%20copy.png', count: '48 varieties' },
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
          @keyframes kenburns { 0% { transform: scale(1) translateZ(0); } 100% { transform: scale(1.15) translateZ(0); } }
          .animate-kenburns { 
            animation: kenburns 30s ease-in-out infinite alternate; 
            will-change: transform;
          }
        `}} />
        <div className="absolute inset-0 z-0 bg-ink">
          <Image
            src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/hero%20banner.png"
            alt="Premium Spices Background"
            fill
            className="object-cover object-center opacity-80 animate-kenburns"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        </div>
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center mt-8">
          <div className="flex items-center gap-3 text-[.65rem] tracking-[.4em] uppercase text-ivory/90 font-medium mb-6 animate-fade-up" style={{ animationDelay: '.1s', animationFillMode: 'both' }}>
            <span className="w-8 h-px bg-ivory/60 block" />
            Pure · Natural · Handpicked
            <span className="w-8 h-px bg-ivory/60 block" />
          </div>
          <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-light text-white leading-[1.05] tracking-tight mb-6 animate-fade-up" style={{ animationDelay: '.2s', animationFillMode: 'both' }}>
            The <em className="not-italic" style={{ color: 'var(--green4)' }}>Essence</em><br />
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
                <div className="font-serif text-[1.8rem] sm:text-[2.2rem] leading-none drop-shadow-lg" style={{ color: 'var(--green4)' }}>{n}</div>
                <div className="text-[.6rem] sm:text-[.65rem] tracking-[.2em] uppercase text-ivory/70 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-green dark:bg-[#0A1810] py-2.5 overflow-hidden">
        <div className="flex w-max animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-[.68rem] tracking-[.18em] uppercase whitespace-nowrap px-7 flex items-center gap-2.5 font-light after:content-['✦'] after:text-[.52rem]" style={{ color: 'var(--green4)' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="section fade-in dark:bg-[rgb(var(--c-ivory))]">
        <div className="text-center mb-12">
          <div className="eyebrow justify-center">Shop by Category</div>
          <h2 className="section-title">The <em className="not-italic" style={{ color: 'var(--green)' }}>essence</em> of nature</h2>
          <p className="text-[.92rem] mt-2 max-w-md mx-auto" style={{ color: 'var(--ink3)' }}>Four pillars of natural goodness, curated for your home.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="card no-underline group">
              <div className="aspect-[3/4] overflow-hidden">
                <Image src={cat.img} alt={cat.name} width={500} height={650} className="object-cover w-full h-full group-hover:scale-[1.06] transition-transform duration-500" />
              </div>
              <div className="p-4">
                <div className="text-[.55rem] tracking-[.14em] uppercase bg-green-6 dark:bg-green/10 px-1.5 py-0.5 rounded-sm inline-block mb-1.5 font-medium" style={{ color: 'var(--green2)' }}>{cat.pill}</div>
                <div className="font-serif text-[1.18rem] font-normal" style={{ color: 'var(--ink)' }}>{cat.name}</div>
                <div className="text-[.66rem] mt-0.5" style={{ color: 'var(--ink3)' }}>{cat.count}</div>
                <div className="text-[.64rem] tracking-wide uppercase mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium" style={{ color: 'var(--green3)' }}>Shop Now →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── KITS ── */}
      <section className="section fade-in dark:bg-[rgb(var(--c-ivory2))]" style={{ background: 'var(--terra4)' }}>
        <div className="text-center mb-10">
          <div className="eyebrow justify-center">Pre-made Kits</div>
          <h2 className="section-title">Everything <em className="not-italic" style={{ color: 'var(--green)' }}>together,</em><br />perfectly curated</h2>
        </div>
        {kits.length === 0 ? (
          <div className="text-center py-12 bg-white/40 dark:bg-green-5/5 border border-ivory-3 dark:border-green-5/15 rounded-2xl">
            <p className="font-serif text-lg" style={{ color: 'var(--ink)' }}>No kits available at the moment.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink4)' }}>Please check back later or customize your order via WhatsApp!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kits.map(kit => {
              const firstVariant = kit.variants?.[0]
              const price = firstVariant?.price || kit.price
              const comparePrice = firstVariant?.compare_price || kit.compare_price
              const savePct = comparePrice && comparePrice > price
                ? Math.round(((comparePrice - price) / comparePrice) * 100)
                : 0
              const image = kit.images?.[0] || 'https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=600&q=80'
              const tag = kit.tags?.filter(t => t !== 'kit')[0] || 'Wellness Kit'
              return (
                <Link key={kit.id} href="/kits" className="card no-underline group flex flex-col">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <Image src={image} alt={kit.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-[.56rem] tracking-wide uppercase bg-green-6 dark:bg-green/10 px-1.5 py-0.5 rounded-sm inline-block mb-2 font-medium w-fit" style={{ color: 'var(--green2)' }}>{tag}</div>
                    <div className="font-serif text-[1.1rem] mb-1 leading-tight" style={{ color: 'var(--ink)' }}>{kit.name}</div>
                    <div className="text-[.74rem] mb-3 line-clamp-2" style={{ color: 'var(--ink3)' }}>{kit.description}</div>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-ivory-3 dark:border-green-5/15">
                      <div>
                        <div className="font-serif text-[1.2rem] leading-none" style={{ color: 'var(--green)' }}>{formatPrice(price)}</div>
                        <div className="text-[.58rem] mt-0.5" style={{ color: 'var(--ink4)' }}>{kit.price_per_unit || 'per kit'}</div>
                      </div>
                      {savePct > 0 && (
                        <span className="text-[.58rem] px-2 py-0.5 rounded-sm font-medium border" style={{ background: 'var(--terra4)', color: 'var(--terra)', borderColor: 'var(--terra3)' }}>Save {savePct}%</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        <div className="text-center">
          <Link href="/kits" className="btn-primary no-underline inline-flex items-center gap-2">
            <span>View All Kit →</span>
          </Link>
        </div>
      </section>

      {/* ── QUALITY PROMISE ── */}
      <section className="section fade-in bg-green dark:bg-[#0A1810]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="eyebrow" style={{ color: '#C2E0CE' }}>Our Promise</div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light leading-tight tracking-tight text-white mb-4">
              Ground and packed <em className="not-italic" style={{ color: '#C2E0CE' }}>after your order.</em>
            </h2>
            <p className="text-[.92rem] leading-[1.88] mb-5" style={{ color: 'rgba(234, 244, 238, 0.75)' }}>
              For all powders, churnas and ground spices — we do not pre-grind in bulk. Your order triggers the grinding. The difference in freshness and potency is immediate.
            </p>
            <div className="flex flex-col gap-3">
              {['Ashwagandha powder — ground after order', 'Triphala churna — blended to order', 'Ground spices — never pre-ground in bulk', 'All powders sealed immediately after grinding'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ border: '1px solid rgba(194, 224, 206, 0.3)', background: 'rgba(194, 224, 206, 0.1)', color: '#C2E0CE' }}>✓</div>
                  <span className="text-[.84rem]" style={{ color: '#EAF4EE' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🌿', title: '100% Natural', desc: 'No additives, fillers or preservatives. Ever.' },
              { icon: '🔬', title: 'Lab Tested', desc: 'Every batch quality checked before dispatch.' },
              { icon: '📦', title: 'Packed Fresh', desc: 'Ground and packed to order, not to stock.' },
              { icon: '🤝', title: 'Direct Sourcing', desc: 'Straight from farmers to your home.' },
            ].map(card => (
              <div key={card.title} className="rounded-xl p-5" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(194, 224, 206, 0.15)' }}>
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="font-serif text-white text-base mb-1">{card.title}</div>
                <div className="text-[.78rem] leading-relaxed" style={{ color: 'rgba(234, 244, 238, 0.75)' }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BESTSELLERS ── */}
      <section className="section fade-in dark:bg-[rgb(var(--c-ivory))]" style={{ background: 'rgb(var(--c-surface))' }}>
        <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
          <div>
            <div className="eyebrow">Featured selections</div>
            <h2 className="section-title">Curated <em className="not-italic" style={{ color: 'var(--green)' }}>favourites</em></h2>
          </div>
          <Link href="/products" className="btn-outline text-sm py-2 px-5 no-underline">View All →</Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-ivory-3 dark:border-green-5/20 rounded-2xl" style={{ background: 'rgb(var(--c-ivory2))' }}>
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--ink)' }}>Products coming soon</h3>
            <p className="text-[.84rem] mb-6 max-w-xs mx-auto" style={{ color: 'var(--ink3)' }}>
              Add your first products in Supabase to see them appear here automatically.
            </p>
            <Link href="/products" className="btn-primary no-underline inline-flex">
              <span>Browse All →</span>
            </Link>
          </div>
        )}
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section overflow-hidden fade-in" style={{ background: 'rgb(var(--c-ivory2))' }}>
        <div className="text-center mb-10">
          <div className="eyebrow justify-center">Testimonials</div>
          <h2 className="section-title">What our <em className="not-italic" style={{ color: 'var(--green)' }}>customers say</em></h2>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-4 w-max" style={{ animation: 'scroll-left 28s linear infinite' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="w-[290px] flex-shrink-0 rounded-xl p-5" style={{ background: 'rgb(var(--c-ivory3))', border: '1px solid rgba(var(--c-green5), 0.15)', boxShadow: 'var(--shadow-soft)' }}>
                <div className="text-[.78rem] mb-2.5" style={{ color: 'var(--terra)' }}>{'★'.repeat(t.stars)}</div>
                <p className="text-[.8rem] leading-[1.7] mb-3.5 italic" style={{ color: 'var(--ink3)' }}>"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[.7rem] font-medium flex-shrink-0" style={{ background: 'rgba(var(--c-green6), 1)', border: '1px solid rgba(var(--c-green5), 0.3)', color: 'var(--green)' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-[.74rem] font-medium" style={{ color: 'var(--ink)' }}>{t.name}</div>
                    <div className="text-[.6rem]" style={{ color: 'var(--ink4)' }}>{t.city} · Verified</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAT & BUY ── */}
      <section className="section fade-in bg-green-6 dark:bg-[rgb(var(--c-ivory))]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="rounded-2xl p-5 max-w-md mx-auto w-full" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgba(var(--c-green5), 0.2)', boxShadow: 'var(--shadow-soft)' }}>
            <div className="flex items-center gap-2.5 pb-3.5 mb-3.5" style={{ borderBottom: '1px solid rgba(var(--c-green5), 0.15)' }}>
              <div className="w-9 h-9 rounded-full overflow-hidden" style={{ border: '2px solid rgba(var(--c-green5), 0.4)' }}>
                <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" alt="assistant" width={36} height={36} className="object-cover" />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Mana Assistant</div>
                <div className="text-[.6rem] flex items-center gap-1" style={{ color: 'var(--green3)' }}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--green3)' }} />Online · Instant Reply</div>
              </div>
            </div>
            <div className="flex flex-col gap-3 mb-3.5">
              <div className="rounded-[10px_10px_10px_3px] px-3.5 py-2.5 max-w-[85%] text-[.78rem] leading-relaxed" style={{ background: 'rgb(var(--c-ivory3))', color: 'var(--ink)' }}>
                Namaste! 🙏 Share your list or tell me what you need.
              </div>
              <div className="rounded-[10px_10px_3px_10px] px-3.5 py-2.5 max-w-[85%] text-[.78rem] self-end leading-relaxed text-ivory" style={{ background: 'var(--green)' }}>
                Almonds, ashwagandha and tulsi for this month
              </div>
              <div className="rounded-[10px_10px_10px_3px] px-3.5 py-2.5 max-w-[90%] text-[.78rem] leading-relaxed" style={{ background: 'rgb(var(--c-ivory3))', color: 'var(--ink)' }}>
                How should I pick them?
                <div className="flex flex-wrap gap-2 mt-2">
                  {['⭐ Highest Quality', '🔥 Most Selling', '💰 Best Price'].map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-full text-[.62rem] cursor-pointer" style={{ background: 'rgba(var(--c-green6), 1)', border: '1px solid rgba(var(--c-green5), 0.3)', color: 'var(--green2)' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center rounded-lg px-3 py-2" style={{ background: 'rgb(var(--c-ivory3))', border: '1px solid rgba(var(--c-green5), 0.15)' }}>
              <span className="text-[.76rem] flex-1" style={{ color: 'var(--ink4)' }}>Type or upload your list…</span>
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-ivory text-sm cursor-pointer" style={{ background: 'var(--green)' }}>↑</div>
            </div>
          </div>
          <div>
            <div className="eyebrow">Chat & Buy</div>
            <h3 className="font-serif text-[clamp(1.7rem,2.6vw,2.5rem)] font-light mb-3 leading-tight" style={{ color: 'var(--ink)' }}>
              Tell us what you need,<br /><em className="not-italic" style={{ color: 'var(--green)' }}>we do the rest.</em>
            </h3>
            <div className="flex flex-col gap-4 mb-7">
              {[
                ['1', 'Upload your list', 'Image, PDF or text — whatever works for you'],
                ['2', 'Choose a preference', 'Highest quality, most popular, or best price'],
                ['3', 'Pay a small advance', '10–20% to confirm your order'],
                ['4', 'Remaining at dispatch', 'Or pay in full anytime before delivery'],
              ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[.66rem] font-medium flex-shrink-0 mt-0.5" style={{ background: 'rgba(var(--c-green6), 1)', border: '1px solid rgba(var(--c-green4), 0.4)', color: 'var(--green)' }}>{n}</div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t}</div>
                    <div className="text-[.8rem] mt-0.5" style={{ color: 'var(--ink3)' }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Mana!%20I%20want%20to%20Chat%20%26%20Buy.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary no-underline inline-flex"
            >
              <span>Start Chat & Buy →</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="section text-center relative overflow-hidden fade-in" style={{ background: 'rgb(var(--c-ivory2))' }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'rgba(var(--c-green6), 0.4)' }} />
        <div className="relative">
          <div className="eyebrow justify-center">Stay Connected</div>
          <h2 className="section-title mb-2">Get <em className="not-italic" style={{ color: 'var(--green)' }}>10% off</em> your first order</h2>
          <p className="text-[.88rem] mb-6" style={{ color: 'var(--ink3)' }}>Early access, seasonal drops and wellness tips — no spam, ever.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
