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
      <div className="bg-green py-2.5 overflow-hidden">
        <div className="flex w-max animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-[.68rem] tracking-[.18em] uppercase text-green-4 whitespace-nowrap px-7 flex items-center gap-2.5 font-light after:content-['✦'] after:text-[.52rem] after:text-green-3">
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
                    <div className="text-[.56rem] tracking-wide uppercase bg-green-6 text-green-2 px-1.5 py-0.5 rounded-sm inline-block mb-2 font-medium w-fit">{tag}</div>
                    <div className="font-serif text-[1.1rem] text-ink mb-1 leading-tight">{kit.name}</div>
                    <div className="text-[.74rem] text-ink-3 mb-3 line-clamp-2">{kit.description}</div>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-ivory-3">
                      <div>
                        <div className="font-serif text-[1.2rem] text-green leading-none">{formatPrice(price)}</div>
                        <div className="text-[.58rem] text-ink-4 mt-0.5">{kit.price_per_unit || 'per kit'}</div>
                      </div>
                      {savePct > 0 && (
                        <span className="text-[.58rem] bg-terra-4 text-terra border border-terra-3 px-2 py-0.5 rounded-sm font-medium">Save {savePct}%</span>
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
      <section className="section bg-green fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="eyebrow" style={{ color: 'var(--green4)' }}>Our Promise</div>
            <h2 className="section-title text-ivory mb-4">
              Ground and packed <em className="not-italic" style={{ color: 'var(--green4)' }}>after your order.</em>
            </h2>
            <p className="text-[.92rem] text-green-5/70 leading-[1.88] mb-5">
              For all powders, churnas and ground spices — we do not pre-grind in bulk. Your order triggers the grinding. The difference in freshness and potency is immediate.
            </p>
            <div className="flex flex-col gap-3">
              {['Ashwagandha powder — ground after order', 'Triphala churna — blended to order', 'Ground spices — never pre-ground in bulk', 'All powders sealed immediately after grinding'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-green-5/25 bg-green-5/10 flex items-center justify-center text-green-4 text-xs flex-shrink-0">✓</div>
                  <span className="text-[.84rem] text-green-4">{item}</span>
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
              <div key={card.title} className="bg-green-5/10 border border-green-5/15 rounded-xl p-5">
                <div className="text-2xl mb-2">{card.icon}</div>
                <div className="font-serif text-ivory text-base mb-1">{card.title}</div>
                <div className="text-[.78rem] text-green-5/60 leading-relaxed">{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BESTSELLERS ── */}
      <section className="section bg-white fade-in">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
          <div>
            <div className="eyebrow">Bestsellers</div>
            <h2 className="section-title">Curated <em className="not-italic text-green">favourites</em></h2>
          </div>
          <Link href="/products" className="btn-outline text-sm py-2 px-5 no-underline">View All →</Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-ivory-3 rounded-2xl bg-ivory-2">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="font-serif text-xl text-ink mb-2">Products coming soon</h3>
            <p className="text-[.84rem] text-ink-3 mb-6 max-w-xs mx-auto">
              Add your first products in Supabase to see them appear here automatically.
            </p>
            <Link href="/products" className="btn-primary no-underline inline-flex">
              <span>Browse All →</span>
            </Link>
          </div>
        )}
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section bg-ivory-2 overflow-hidden fade-in">
        <div className="text-center mb-10">
          <div className="eyebrow justify-center">Testimonials</div>
          <h2 className="section-title">Loved by <em className="not-italic text-green">thousands</em></h2>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-4 w-max" style={{ animation: 'scroll-left 28s linear infinite' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} className="w-[290px] flex-shrink-0 bg-white border border-ivory-3 rounded-xl p-5 shadow-soft">
                <div className="text-terra text-[.78rem] mb-2.5">{'★'.repeat(t.stars)}</div>
                <p className="text-[.8rem] text-ink-3 leading-[1.7] mb-3.5 italic">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-green-6 border border-green-5 flex items-center justify-center text-[.7rem] font-medium text-green flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-[.74rem] text-ink font-medium">{t.name}</div>
                    <div className="text-[.6rem] text-ink-4">{t.city} · Verified</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAT & BUY ── */}
      <section className="section bg-green-6 fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="bg-white border border-ivory-3 rounded-2xl p-5 shadow-soft max-w-md mx-auto w-full">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-ivory-3 mb-3.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-green-5">
                <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" alt="assistant" width={36} height={36} className="object-cover" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink">Mana Assistant</div>
                <div className="text-[.6rem] text-green-3 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-3 inline-block" />Online · Instant Reply</div>
              </div>
            </div>
            <div className="flex flex-col gap-3 mb-3.5">
              <div className="bg-ivory-2 rounded-[10px_10px_10px_3px] px-3.5 py-2.5 max-w-[85%] text-[.78rem] text-ink leading-relaxed">
                Namaste! 🙏 Share your list or tell me what you need.
              </div>
              <div className="bg-green text-ivory rounded-[10px_10px_3px_10px] px-3.5 py-2.5 max-w-[85%] text-[.78rem] self-end leading-relaxed">
                Almonds, ashwagandha and tulsi for this month
              </div>
              <div className="bg-ivory-2 rounded-[10px_10px_10px_3px] px-3.5 py-2.5 max-w-[90%] text-[.78rem] text-ink leading-relaxed">
                How should I pick them?
                <div className="flex flex-wrap gap-2 mt-2">
                  {['⭐ Highest Quality', '🔥 Most Selling', '💰 Best Price'].map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-full text-[.62rem] bg-green-6 border border-green-5 text-green-2 cursor-pointer">{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center bg-ivory-2 border border-ivory-3 rounded-lg px-3 py-2">
              <span className="text-[.76rem] text-ink-4 flex-1">Type or upload your list…</span>
              <div className="w-7 h-7 rounded-md bg-green flex items-center justify-center text-ivory text-sm cursor-pointer">↑</div>
            </div>
          </div>
          <div>
            <div className="eyebrow">Chat & Buy</div>
            <h3 className="font-serif text-[clamp(1.7rem,2.6vw,2.5rem)] font-light text-ink mb-3 leading-tight">
              Tell us what you need,<br /><em className="not-italic text-green">we do the rest.</em>
            </h3>
            <div className="flex flex-col gap-4 mb-7">
              {[
                ['1', 'Upload your list', 'Image, PDF or text — whatever works for you'],
                ['2', 'Choose a preference', 'Highest quality, most popular, or best price'],
                ['3', 'Pay a small advance', '10–20% to confirm your order'],
                ['4', 'Remaining at dispatch', 'Or pay in full anytime before delivery'],
              ].map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-green-6 border border-green-4 flex items-center justify-center text-[.66rem] text-green font-medium flex-shrink-0 mt-0.5">{n}</div>
                  <div>
                    <div className="text-sm font-medium text-ink">{t}</div>
                    <div className="text-[.8rem] text-ink-3 mt-0.5">{d}</div>
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
      <section className="section text-center bg-white relative overflow-hidden fade-in">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-green-6/40 pointer-events-none" />
        <div className="relative">
          <div className="eyebrow justify-center">Stay Connected</div>
          <h2 className="section-title mb-2">Nature's finest, <em className="not-italic text-green">in your inbox.</em></h2>
          <p className="text-[.88rem] text-ink-3 mb-6">Early access, seasonal drops and wellness tips — no spam, ever.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}