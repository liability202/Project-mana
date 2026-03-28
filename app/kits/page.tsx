'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import { supabase } from '@/lib/supabase'
import type { Product, Variant } from '@/lib/supabase'

type Form = 'powder' | 'whole'
type Size = 0 | 1 | 2

const KITS = [
  {
    id: 'hair-health-kit',
    name: 'Hair Health Kit',
    tag: 'Bestseller',
    tagColor: 'bg-terra text-white',
    description: 'Complete Ayurvedic hair care kit with six powerful herbs. Choose powder or whole, then adjust each herb weight the way you want.',
    img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=1200&q=85',
    badge: 'Ground fresh after order',
    benefits: [
      'Reduces hair fall',
      'Promotes hair growth',
      'Natural shine and softness',
      'Dandruff control',
      'Scalp nourishment',
    ],
    formOptions: true,
    items: [
      { name: 'Amla', benefit: 'Vitamin C · Strengthens roots', unitPrice100g: 9500 },
      { name: 'Reetha', benefit: 'Natural cleanser · Reduces dandruff', unitPrice100g: 8000 },
      { name: 'Shikakai', benefit: 'Natural shampoo · Adds shine', unitPrice100g: 8800 },
      { name: 'Bhringraj', benefit: 'Promotes growth · Reduces greying', unitPrice100g: 11000 },
      { name: 'Rosemary', benefit: 'Stimulates scalp · Prevents hair loss', unitPrice100g: 12500 },
      { name: 'Rose Petals', benefit: 'Softens hair · Natural fragrance', unitPrice100g: 7200 },
    ],
    sizes: [
      { label: 'Small', gramsEach: 100, price: 89900, desc: 'Good for 1 month' },
      { label: 'Medium', gramsEach: 200, price: 164900, desc: 'Good for 2 months' },
      { label: 'Large', gramsEach: 500, price: 379900, desc: 'Good for family use' },
    ],
    howToUse: [
      { title: 'Hair Wash', desc: 'Mix Reetha and Shikakai in warm water and use as a natural cleanser.' },
      { title: 'Hair Pack', desc: 'Mix Amla and Bhringraj with curd or oil. Apply root to tip for 30 minutes.' },
      { title: 'Hair Rinse', desc: 'Boil Rosemary and Rose Petals in water and use as the final rinse.' },
      { title: 'Hair Oil', desc: 'Warm coconut oil with Bhringraj and Amla, then massage into the scalp.' },
    ],
  },
] as const

const KIT_PRODUCT_MATCHES = [
  { key: 'amla', labels: ['Amla', 'Amla Powder', 'Amla Whole'] },
  { key: 'reetha', labels: ['Reetha', 'Ritha', 'Aritha'] },
  { key: 'shikakai', labels: ['Shikakai', 'Shikakai Pods'] },
  { key: 'bhringraj', labels: ['Bhringraj', 'Bhringraj Powder'] },
  { key: 'rosemary', labels: ['Rosemary', 'Rosemary Leaves'] },
  { key: 'rose', labels: ['Rose Petals', 'Rose', 'Dried Rose Petals'] },
] as const

function getMatchKey(itemName: string) {
  return itemName === 'Rose Petals' ? 'rose' : itemName.toLowerCase()
}

function getCatalogPricePer100g(product?: Product) {
  if (!product) return null
  const variantPrice = (product.variants?.[0] as Variant | undefined)?.price
  return Math.round((((variantPrice || product.price) || 0) / 500) * 100)
}

export default function KitsPage() {
  return (
    <>
      <div className="bg-green px-[5%] py-12">
        <div className="eyebrow" style={{ color: 'var(--green4)' }}>Curated Kits</div>
        <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] text-ivory font-light">
          Everything you need, <em className="not-italic text-green-4">together.</em>
        </h1>
        <p className="text-[.88rem] text-green-4 mt-2 max-w-lg">
          Pre-made kits of our finest herbs, built for easy customization and packed fresh for every order.
        </p>
      </div>

      <div className="px-[5%] py-10 flex flex-col gap-16 max-w-[1320px] mx-auto">
        {KITS.map(kit => <KitCard key={kit.id} kit={kit} />)}
      </div>

      <div className="bg-ivory-2 border-t border-ivory-3 px-[5%] py-12 text-center">
        <div className="eyebrow justify-center">Need something custom?</div>
        <h2 className="section-title mb-2">Build your <em className="not-italic text-green">own kit</em></h2>
        <p className="text-sm text-ink-3 mb-6 max-w-md mx-auto">
          Pick your own herbs, choose custom weights, and we will prepare it exactly the way you want.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/kits/custom" className="btn-primary no-underline"><span>Build Custom Kit →</span></Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Mana!%20I%20want%20to%20create%20a%20custom%20kit.%20Can%20you%20help?`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline no-underline"
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

function KitCard({ kit }: { kit: typeof KITS[number] }) {
  const [form, setForm] = useState<Form>('powder')
  const [sizeIdx, setSizeIdx] = useState<Size>(1)
  const [tab, setTab] = useState<'overview' | 'howto'>('overview')
  const [catalogItems, setCatalogItems] = useState<Partial<Record<string, Product>>>({})
  const [itemStates, setItemStates] = useState(() => kit.items.map(() => ({
    selected: true,
    grams: kit.sizes[1].gramsEach,
  })))
  const addItem = useCart(s => s.addItem)

  const size = kit.sizes[sizeIdx]

  useEffect(() => {
    void supabase
      .from('products')
      .select('*')
      .eq('category', 'herbs')
      .eq('in_stock', true)
      .then(({ data }) => {
        if (!data?.length) return

        const matches: Partial<Record<string, Product>> = {}
        for (const config of KIT_PRODUCT_MATCHES) {
          const found = data.find((product: Product) =>
            config.labels.some(label =>
              product.name.toLowerCase().includes(label.toLowerCase()) ||
              product.slug.toLowerCase().includes(label.toLowerCase().replace(/\s+/g, '-'))
            )
          )
          if (found) matches[config.key] = found
        }
        setCatalogItems(matches)
      })
  }, [])

  const updateItem = (idx: number, next: Partial<{ selected: boolean; grams: number }>) => {
    setItemStates(prev => prev.map((item, itemIdx) => (
      itemIdx === idx ? { ...item, ...next } : item
    )))
  }

  const handleSizeChange = (nextIdx: Size) => {
    setSizeIdx(nextIdx)
    const nextSize = kit.sizes[nextIdx]
    setItemStates(prev => prev.map(item => ({
      ...item,
      grams: item.selected ? nextSize.gramsEach : 0,
    })))
  }

  const selectedItems = kit.items
    .map((item, idx) => ({ ...item, ...itemStates[idx] }))
    .filter(item => item.selected && item.grams > 0)

  const powderPrice = selectedItems.reduce((sum, item) => (
    sum + Math.round(((getCatalogPricePer100g(catalogItems[getMatchKey(item.name)]) || item.unitPrice100g) * item.grams) / 100)
  ), 0)
  const price = form === 'whole' ? Math.round(powderPrice * 0.85) : powderPrice
  const totalWeight = selectedItems.reduce((sum, item) => sum + item.grams, 0)
  const totalWeightLabel = totalWeight >= 1000
    ? `${(totalWeight / 1000).toFixed(totalWeight % 1000 === 0 ? 0 : 1)}kg`
    : `${totalWeight}g`

  const handleAddToCart = () => {
    if (!selectedItems.length) return

    addItem({
      product_id: `${kit.id}-${form}-${sizeIdx}`,
      product_name: kit.name,
      product_image: kit.img,
      variant_id: `${form}-${sizeIdx}`,
      variant_name: `${size.label} · ${form === 'powder' ? 'Powder' : 'Whole'} · ${selectedItems.map(item => `${item.name} ${item.grams}g`).join(', ')}`,
      weight_grams: totalWeight,
      price,
      quantity: 1,
    })

    showToast(`${kit.name} (${size.label}) added`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  const handleWhatsApp = () => {
    const msg = `Hi Mana! I want to order:\n\n`
      + `Kit: ${kit.name}\n`
      + `Size: ${size.label}\n`
      + `Form: ${form === 'powder' ? 'Powder' : 'Whole'}\n`
      + `Total: ${formatPrice(price)}\n\n`
      + `Items:\n${selectedItems.map(item => `- ${item.name}: ${item.grams}g`).join('\n')}`

    window.open(
      `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank'
    )
  }

  return (
    <div className="bg-white border border-ivory-3 rounded-[28px] overflow-hidden shadow-soft">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="border-b border-ivory-3 lg:border-b-0 lg:border-r p-5 sm:p-7 lg:p-8">
          <div className="relative overflow-hidden rounded-[24px] border border-ivory-3 bg-ivory2 aspect-[4/3]">
            <Image
              src={kit.img}
              alt={kit.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-md bg-terra px-4 py-2 text-[.7rem] font-medium text-white">
              {kit.tag}
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-green-5 bg-green-6/50 p-5">
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Description</div>
            <p className="text-[.9rem] text-ink-3 leading-[1.8]">{kit.description}</p>
            <div className="mt-4">
              <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Key benefits</div>
              <div className="grid grid-cols-1 gap-1.5">
                {kit.benefits.map(benefit => (
                  <div key={benefit} className="flex items-center gap-2 text-[.78rem] text-ink-3">
                    <span className="text-green-3 flex-shrink-0">✓</span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8 flex flex-col gap-5">
          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Customizable herbal kit</div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-ink font-light">{kit.name}</h2>
          </div>

          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Select size</div>
            <div className="grid grid-cols-3 gap-2">
              {kit.sizes.map((option, idx) => (
                <button
                  key={option.label}
                  onClick={() => handleSizeChange(idx as Size)}
                  className={`rounded-xl border p-3 text-center transition-all ${sizeIdx === idx ? 'border-green bg-green-6 shadow-soft' : 'border-ivory-3 bg-white hover:border-green-4'}`}
                >
                  <div className="text-sm font-medium text-ink">{option.label}</div>
                  <div className="text-[.66rem] text-ink-4 mt-1">{option.gramsEach}g each</div>
                  <div className="text-[.82rem] text-green font-medium mt-1">{formatPrice(option.price)}</div>
                </button>
              ))}
            </div>
            <div className="text-[.72rem] text-ink-3 mt-2">{size.desc}</div>
          </div>

          {kit.formOptions && (
            <div>
              <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Choose form</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setForm('powder')}
                  className={`min-w-[140px] rounded-xl border px-5 py-3 text-sm font-medium transition-all ${form === 'powder' ? 'border-green bg-green text-white' : 'border-green-4 bg-white text-green hover:bg-green-6'}`}
                >
                  Powder
                </button>
                <button
                  onClick={() => setForm('whole')}
                  className={`min-w-[140px] rounded-xl border px-5 py-3 text-sm font-medium transition-all ${form === 'whole' ? 'border-green bg-green text-white' : 'border-green-4 bg-white text-green hover:bg-green-6'}`}
                >
                  Whole
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-ivory-3 bg-ivory/70 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4">Adjust individual items</div>
              <div className="text-[.68rem] text-ink-3">{size.gramsEach}g recommended</div>
            </div>

            <div className="flex flex-col gap-3">
              {kit.items.map((item, idx) => {
                const state = itemStates[idx]
                const matchKey = getMatchKey(item.name)
                const catalogProduct = catalogItems[matchKey]
                const displayName = catalogProduct?.name || item.name
                const displayImage = catalogProduct?.images?.[0]
                const pricePer100g = getCatalogPricePer100g(catalogProduct) || item.unitPrice100g
                const minWeight = Math.max(50, Math.round(size.gramsEach / 2))
                const maxWeight = size.gramsEach * 2
                const linePrice = Math.round((pricePer100g * state.grams) / 100)

                return (
                  <div key={item.name} className="rounded-xl border border-ivory-3 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.selected}
                          onChange={(e) => updateItem(idx, {
                            selected: e.target.checked,
                            grams: e.target.checked ? (state.grams || size.gramsEach) : 0,
                          })}
                          className="h-4 w-4 accent-[var(--green)]"
                        />
                        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-ivory-3 bg-ivory2 flex items-center justify-center text-[.58rem] uppercase tracking-[.12em] text-ink-4">
                          {displayImage ? (
                            <Image src={displayImage} alt={displayName} fill className="object-cover" />
                          ) : (
                            <span>Img</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[.9rem] font-medium text-ink">{displayName}</div>
                          <div className="text-[.68rem] text-ink-3 leading-tight">{item.benefit}</div>
                        </div>
                      </label>
                      <div className="text-right">
                        <div className="text-[.9rem] font-medium text-ink">{state.grams}g</div>
                        <div className="text-[.68rem] text-ink-4">{formatPrice(linePrice)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        type="range"
                        min={minWeight}
                        max={maxWeight}
                        step={50}
                        value={state.selected ? state.grams : minWeight}
                        disabled={!state.selected}
                        onChange={(e) => updateItem(idx, { grams: parseInt(e.target.value, 10) })}
                        className={state.selected ? 'opacity-100' : 'opacity-40'}
                      />
                      <div className="mt-1 flex items-center justify-between text-[.64rem] text-ink-4">
                        <span>{minWeight}g</span>
                        <span>{size.gramsEach}g</span>
                        <span>{maxWeight}g</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-green-5 bg-green-6/60 p-4">
            <div className="space-y-1.5 border-b border-green-5 pb-3 mb-3">
              {selectedItems.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-[.78rem] text-ink-3">
                  <span>{catalogItems[getMatchKey(item.name)]?.name || item.name} ({item.grams}g)</span>
                  <span>{formatPrice(Math.round(((getCatalogPricePer100g(catalogItems[getMatchKey(item.name)]) || item.unitPrice100g) * item.grams) / 100))}</span>
                </div>
              ))}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <div className="font-serif text-3xl text-green">{formatPrice(price)}</div>
              {form === 'whole' && <div className="text-sm text-ink-4 line-through">{formatPrice(powderPrice)}</div>}
            </div>
            <div className="text-[.72rem] text-ink-3 mb-4">
              {totalWeightLabel} total · {form === 'powder' ? 'powder form' : 'whole form'}
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <button onClick={handleAddToCart} disabled={!selectedItems.length} className="btn-primary flex-1 justify-center min-w-[140px]">
                <span>Add to Cart</span>
              </button>
              <button onClick={handleWhatsApp} className="btn-outline flex-1 justify-center min-w-[140px]">
                WhatsApp
              </button>
            </div>
          </div>

          <div>
            <div className="flex border-b border-ivory-3 mb-3">
              {(['overview', 'howto'] as const).map(currentTab => (
                <button
                  key={currentTab}
                  onClick={() => setTab(currentTab)}
                  className={`px-4 py-2 text-xs font-medium border-none bg-transparent cursor-pointer transition-all ${tab === currentTab ? 'text-green border-b-2 border-green -mb-px' : 'text-ink-3 hover:text-ink'}`}
                >
                  {currentTab === 'overview' ? 'Benefits' : 'How to Use'}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="text-[.78rem] text-ink-3 leading-[1.8]">
                Each herb can be included or removed with its own checkbox, and the slider lets you fine-tune the weight before adding the kit to cart.
              </div>
            )}

            {tab === 'howto' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {kit.howToUse.map(item => (
                  <div key={item.title} className="bg-ivory-2 rounded-lg p-3">
                    <div className="text-[.76rem] font-medium text-ink mb-1">{item.title}</div>
                    <div className="text-[.7rem] text-ink-3 leading-relaxed">{item.desc}</div>
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
