//this is kit page
'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'

// ── KIT DATA ──
const KITS = [
  {
    id: 'hair-health-kit',
    name: 'Hair Health Kit',
    tag: 'Bestseller',
    tagColor: 'bg-terra text-white',
    description: 'Complete Ayurvedic hair care — 6 powerful herbs used for centuries for strong, thick, lustrous hair. Choose raw (sabut) or powder form.',
    longDesc: 'Amla, Reetha, Shikakai, Bhringraj, Rosemary and Rose — the complete Ayurvedic formula for healthy hair. All herbs sourced directly, lab tested, packed fresh after your order.',
    img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=700&q=85',
    badge: '🌿 Ground fresh after order',
    benefits: ['Reduces hair fall', 'Promotes hair growth', 'Natural shine & softness', 'Dandruff control', 'Scalp nourishment'],
    formOptions: true, // has raw vs powder option
    items: [
      { name: 'Amla',      hindi: 'आँवला',    benefit: 'Vitamin C · Strengthens roots' },
      { name: 'Reetha',    hindi: 'रीठा',      benefit: 'Natural cleanser · Reduces dandruff' },
      { name: 'Shikakai',  hindi: 'शिकाकाई',  benefit: 'Natural shampoo · Adds shine' },
      { name: 'Bhringraj', hindi: 'भृंगराज',  benefit: 'Promotes growth · Reduces greying' },
      { name: 'Rosemary',  hindi: 'रोज़मेरी',  benefit: 'Stimulates scalp · Prevents hair loss' },
      { name: 'Rose',      hindi: 'गुलाब',    benefit: 'Softens hair · Natural fragrance' },
    ],
    sizes: [
      { label: 'Small',  weight: '100g each', totalWeight: '600g', price: 89900,  save: '₹120', desc: 'Good for 1 month (1 person)' },
      { label: 'Regular',weight: '200g each', totalWeight: '1.2kg', price: 164900, save: '₹240', desc: 'Good for 2 months (1 person)' },
      { label: 'Family', weight: '500g each', totalWeight: '3kg',   price: 379900, save: '₹720', desc: 'Good for 2–3 months (family)' },
    ],
    howToUse: [
      { title: 'Hair Wash', desc: 'Mix Reetha + Shikakai powder in warm water. Apply as natural shampoo. Rinse well.' },
      { title: 'Hair Pack', desc: 'Mix Amla + Bhringraj powder with curd or oil. Apply from root to tip for 30 min.' },
      { title: 'Hair Rinse', desc: 'Boil Rosemary + Rose petals in water. Use as final rinse after washing for shine.' },
      { title: 'Hair Oil', desc: 'Heat coconut oil with Bhringraj + Amla powder. Strain and massage into scalp.' },
    ],
  },
  // Add more kits here later
]

type Form = 'powder' | 'raw'
type Size = 0 | 1 | 2

export default function KitsPage() {
  return (
    <>
      {/* Header */}
      <div className="bg-green px-[5%] py-12">
        <div className="eyebrow" style={{ color: 'var(--green4)' }}>Curated Kits</div>
        <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] text-ivory font-light">
          Everything you need, <em className="not-italic text-green-4">together.</em>
        </h1>
        <p className="text-[.88rem] text-green-4 mt-2 max-w-lg">
          Pre-made kits of our finest herbs and dry fruits — perfectly proportioned, saving you time and money.
        </p>
      </div>

      {/* Kits */}
      <div className="px-[5%] py-10 flex flex-col gap-16 max-w-[1200px] mx-auto">
        {KITS.map(kit => <KitCard key={kit.id} kit={kit} />)}
      </div>

      {/* Custom kit CTA */}
      <div className="bg-ivory-2 border-t border-ivory-3 px-[5%] py-12 text-center">
        <div className="eyebrow justify-center">Can't find what you need?</div>
        <h2 className="section-title mb-2">Build your <em className="not-italic text-green">own kit</em></h2>
        <p className="text-sm text-ink-3 mb-6 max-w-md mx-auto">
          Pick exactly what you want, set your own quantities, and we'll pack it fresh for you.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/kits/custom" className="btn-primary no-underline"><span>Build Custom Kit →</span></Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Mana!%20I%20want%20to%20create%20a%20custom%20kit.%20Can%20you%20help?`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline no-underline"
          >
            💬 Ask on WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

// ── KIT CARD COMPONENT ──
function KitCard({ kit }: { kit: typeof KITS[0] }) {
  const [form, setForm]       = useState<Form>('powder')
  const [sizeIdx, setSizeIdx] = useState<Size>(1) // default Regular
  const [tab, setTab]         = useState<'overview' | 'howto'>('overview')
  const addItem = useCart(s => s.addItem)

  const size = kit.sizes[sizeIdx]
  const price = form === 'raw' ? Math.round(size.price * 0.85) : size.price // raw is cheaper

  const handleAddToCart = () => {
    addItem({
      product_id: kit.id + '-' + form + '-' + sizeIdx,
      product_name: kit.name,
      product_image: kit.img,
      variant_id: form + '-' + sizeIdx,
      variant_name: `${size.label} · ${form === 'powder' ? 'Powder' : 'Raw (Sabut)'} · ${size.weight} each`,
      weight_grams: parseInt(size.totalWeight) * 1000,
      price: price,
      quantity: 1,
    })
    showToast(`✦ ${kit.name} (${size.label}) added!`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  const handleWhatsApp = () => {
    const msg = `Hi Mana! I want to order:\n\n`
      + `Kit: ${kit.name}\n`
      + `Size: ${size.label} (${size.weight} each · ${size.totalWeight} total)\n`
      + `Form: ${form === 'powder' ? 'Powder (ground fresh)' : 'Raw / Sabut'}\n`
      + `Price: ${formatPrice(price)}\n\n`
      + `Items: ${kit.items.map(i => i.name).join(', ')}\n\n`
      + `Please confirm and share payment details. Thank you!`
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="bg-white border border-ivory-3 rounded-2xl overflow-hidden shadow-soft">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left — Image + badge */}
        <div className="relative">
          <div className="aspect-[4/3] lg:aspect-auto lg:h-full min-h-[280px] overflow-hidden">
            <Image
              src={kit.img}
              alt={kit.name}
              fill
              className="object-cover"
            />
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-green/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className={`inline-flex text-[.56rem] font-semibold tracking-[.12em] uppercase px-2.5 py-1 rounded-full mb-2 ${kit.tagColor}`}>
              {kit.tag}
            </div>
            <div className="font-serif text-2xl text-white font-light">{kit.name}</div>
            <div className="text-[.72rem] text-green-4 mt-1">{kit.badge}</div>
          </div>
        </div>

        {/* Right — Details */}
        <div className="p-6 flex flex-col gap-5">

          {/* Description */}
          <p className="text-[.88rem] text-ink-3 leading-[1.8]">{kit.description}</p>

          {/* Items included */}
          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-3">What's inside</div>
            <div className="grid grid-cols-2 gap-2">
              {kit.items.map(item => (
                <div key={item.name} className="flex items-start gap-2.5 bg-ivory-2 border border-ivory-3 rounded-lg p-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-3 flex-shrink-0 mt-1.5" />
                  <div>
                    <div className="text-[.8rem] font-medium text-ink">{item.name}
                      <span className="text-ink-4 font-normal ml-1 text-[.7rem]">· {item.hindi}</span>
                    </div>
                    <div className="text-[.65rem] text-ink-3 leading-tight mt-0.5">{item.benefit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form selector — Powder vs Raw */}
          {kit.formOptions && (
            <div>
              <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Select Form</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setForm('powder')}
                  className={`border rounded-xl p-3 text-left transition-all cursor-pointer ${form === 'powder' ? 'border-green bg-green-6' : 'border-ivory-3 bg-white hover:border-green-4'}`}
                >
                  <div className="text-lg mb-1">🌿</div>
                  <div className="text-sm font-medium text-ink">Powder</div>
                  <div className="text-[.65rem] text-ink-3 mt-0.5">Ground fresh after your order. Ready to use directly.</div>
                  {form === 'powder' && <div className="text-[.6rem] text-green-3 font-medium mt-1.5">✓ Selected</div>}
                </button>
                <button
                  onClick={() => setForm('raw')}
                  className={`border rounded-xl p-3 text-left transition-all cursor-pointer ${form === 'raw' ? 'border-green bg-green-6' : 'border-ivory-3 bg-white hover:border-green-4'}`}
                >
                  <div className="text-lg mb-1">🌾</div>
                  <div className="text-sm font-medium text-ink">Raw / Sabut</div>
                  <div className="text-[.65rem] text-ink-3 mt-0.5">Whole dried herbs. Longer shelf life. Grind yourself.</div>
                  {form === 'raw' && <div className="text-[.6rem] text-green-3 font-medium mt-1.5">✓ Selected · 15% cheaper</div>}
                </button>
              </div>
            </div>
          )}

          {/* Size selector */}
          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Select Size</div>
            <div className="grid grid-cols-3 gap-2">
              {kit.sizes.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setSizeIdx(i as Size)}
                  className={`border rounded-xl p-3 text-center transition-all cursor-pointer ${sizeIdx === i ? 'border-green bg-green-6' : 'border-ivory-3 bg-white hover:border-green-4'}`}
                >
                  <div className="text-sm font-medium text-ink mb-0.5">{s.label}</div>
                  <div className="text-[.65rem] text-green font-medium">{s.weight}</div>
                  <div className="text-[.58rem] text-ink-4 mt-0.5">{s.totalWeight} total</div>
                  <div className="text-[.58rem] text-terra font-medium mt-1">Save {s.save}</div>
                </button>
              ))}
            </div>
            <div className="text-[.7rem] text-ink-3 mt-1.5">📦 {size.desc}</div>
          </div>

          {/* Price + actions */}
          <div className="border-t border-ivory-3 pt-4">
            <div className="flex items-baseline gap-2 mb-1">
              <div className="font-serif text-3xl text-green">{formatPrice(price)}</div>
              {form === 'raw' && (
                <div className="text-sm text-ink-4 line-through">{formatPrice(size.price)}</div>
              )}
            </div>
            <div className="text-[.7rem] text-ink-3 mb-4">
              {size.weight} of each herb · {size.totalWeight} total
              {form === 'powder' ? ' · Ground fresh after order' : ' · Whole/Sabut form'}
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <button onClick={handleAddToCart} className="btn-primary flex-1 justify-center min-w-[140px]">
                <span>Add to Cart</span>
              </button>
              <button onClick={handleWhatsApp} className="btn-outline flex-1 justify-center min-w-[140px]">
                💬 Order via WhatsApp
              </button>
            </div>
          </div>

          {/* Tabs — Benefits / How to use */}
          <div>
            <div className="flex border-b border-ivory-3 mb-3">
              {(['overview', 'howto'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-xs font-medium border-none bg-transparent cursor-pointer transition-all ${tab === t ? 'text-green border-b-2 border-green -mb-px' : 'text-ink-3 hover:text-ink'}`}
                >
                  {t === 'overview' ? 'Benefits' : 'How to Use'}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-1 gap-1.5">
                {kit.benefits.map(b => (
                  <div key={b} className="flex items-center gap-2 text-[.78rem] text-ink-3">
                    <span className="text-green-3 flex-shrink-0">✓</span> {b}
                  </div>
                ))}
              </div>
            )}

            {tab === 'howto' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {kit.howToUse.map(h => (
                  <div key={h.title} className="bg-ivory-2 rounded-lg p-3">
                    <div className="text-[.76rem] font-medium text-ink mb-1">{h.title}</div>
                    <div className="text-[.7rem] text-ink-3 leading-relaxed">{h.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
