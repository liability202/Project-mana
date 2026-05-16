'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Product, Variant } from '@/lib/supabase'

type KitItem = {
  id: string
  name: string
  slug?: string
  price: number
  category?: string
  image?: string
  grams?: number
  base_price?: number
  price_per_gram?: number
  benefit?: string
}

type KitVariant = Omit<Variant, 'items'> & {
  items?: KitItem[]
  grams_each?: number
  size_desc?: string
}

type KitProduct = Omit<Product, 'variants'> & {
  variants: KitVariant[]
}

type Form = 'powder' | 'whole'

type ItemState = {
  id: string
  selected: boolean
  grams: number
  ratio: number
}

const CREATIVE_SIZE_NAMES = ['Essential', 'Signature', 'Reserve']

function getSizeDisplayName(name: string | undefined, index: number) {
  if (!name) return CREATIVE_SIZE_NAMES[index] || `Kit Size ${index + 1}`
  const normalized = name.trim().toLowerCase()
  if (['small', 'mini', 'mini ritual'].includes(normalized)) return 'Essential'
  if (['medium', 'regular', 'daily bhandar'].includes(normalized)) return 'Signature'
  if (['large', 'family', 'family reserve'].includes(normalized)) return 'Reserve'
  return name
}

function roundToStep(value: number, step = 25) {
  return Math.max(step, Math.round(value / step) * step)
}

function pricePerGram(item: KitItem) {
  if (item.price_per_gram && item.price_per_gram > 0) return item.price_per_gram
  return Math.max(1, Math.round((item.price || 0) / 500))
}

function getBasePrice(item: KitItem, grams: number) {
  return Math.round(pricePerGram(item) * grams)
}

function normalizeVariants(kit: KitProduct): KitVariant[] {
  if (kit.variants?.length) return kit.variants

  return [{
    id: 'kit-default',
    name: 'Signature',
    description: 'Default kit size',
    price: kit.price,
    grams_each: 100,
    items: [],
  }]
}

export default function KitsPage() {
  const [kits, setKits] = useState<KitProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const selectedKit = kits.find(kit => kit.id === selectedKitId) || null

  useEffect(() => {
    let active = true
    void fetch('/api/products?category=kits&limit=50')
      .then(res => res.json())
      .then((data: KitProduct[]) => {
        if (!active) return
        setKits(Array.isArray(data) ? data : [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <div className="bg-green px-[5%] py-12">
        <div className="eyebrow" style={{ color: 'var(--green4)' }}>Curated Kits</div>
        <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] text-ivory font-light">
          Everything you need, <em className="not-italic text-green-4">in one kit.</em>
        </h1>
        <p className="text-[.88rem] text-green-4 mt-2 max-w-xl">
          Browse Mana wellness kits first. Open any kit to choose size, form, and exact item weights.
        </p>
      </div>

      <div className="px-[5%] py-10 flex flex-col gap-10 max-w-[1320px] mx-auto">
        {loading ? (
          <div className="text-ink-3">Loading kits...</div>
        ) : kits.length === 0 ? (
          <div className="bg-white border border-ivory-3 rounded-2xl p-8 text-center">
            <div className="font-serif text-2xl text-ink mb-2">No kits yet</div>
            <div className="text-sm text-ink-3 mb-4">Create your first kit from the admin panel and it will appear here automatically.</div>
            <Link href="/admin/kit/new" className="btn-primary no-underline">Create Kit</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {kits.map(kit => (
              <KitOverviewCard key={kit.id} kit={kit} onSelect={() => setSelectedKitId(kit.id)} />
            ))}
          </div>
        )}
      </div>

      {selectedKit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 px-[4%] py-6 sm:py-10">
          <div className="max-w-[1320px] mx-auto">
            <KitBuilder kit={selectedKit} onClose={() => setSelectedKitId(null)} />
          </div>
        </div>
      )}
    </>
  )
}

function KitOverviewCard({ kit, onSelect }: { kit: KitProduct; onSelect: () => void }) {
  const variants = normalizeVariants(kit)
  const firstVariant = variants[0]
  const items = firstVariant?.items || []
  const image = kit.images?.[0] || items[0]?.image || ''
  const sizeCount = variants.length

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group text-left rounded-[24px] border border-ivory-3 bg-white p-3 shadow-soft transition-all hover:-translate-y-1 hover:border-green-4 hover:shadow-lg"
    >
      <div className="relative overflow-hidden rounded-[20px] border border-ivory-3 bg-ivory2 aspect-[4/3]">
        {image ? (
          <Image src={image} alt={kit.name} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink-4">No image</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-[.62rem] tracking-[.2em] uppercase text-terra mb-2">Mana wellness kit</div>
        <h2 className="font-serif text-2xl leading-tight text-ink font-light">{kit.name}</h2>
        <p className="mt-2 text-sm text-ink-3 leading-[1.65] line-clamp-2">{kit.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-ink-4">{items.length || 'Custom'} items · {sizeCount} ritual size{sizeCount === 1 ? '' : 's'}</div>
            <div className="font-serif text-2xl text-green mt-1">{formatPrice(firstVariant?.price || kit.price)}</div>
          </div>
          <span className="rounded-full bg-green px-4 py-2 text-xs font-medium text-white transition-colors group-hover:bg-terra">
            Customize
          </span>
        </div>
      </div>
    </button>
  )
}

function KitBuilder({ kit, onClose }: { kit: KitProduct; onClose: () => void }) {
  const variants = useMemo(() => normalizeVariants(kit), [kit])
  const [sizeIdx, setSizeIdx] = useState(0)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [form, setForm] = useState<Form>('powder')
  const [tab, setTab] = useState<'benefits' | 'howto'>('benefits')
  const activeVariant = variants[sizeIdx] || variants[0]
  const activeItems = activeVariant?.items || []
  const [itemStates, setItemStates] = useState<ItemState[]>(() => activeItems.map(item => ({
    id: item.id,
    selected: true,
    grams: item.grams || activeVariant?.grams_each || 100,
    ratio: 1,
  })))
  const addItem = useCart(s => s.addItem)

  useEffect(() => {
    const nextVariant = variants[sizeIdx] || variants[0]
    const nextItems = nextVariant?.items || []
    setItemStates(prev => {
      const previousById = new Map(prev.map(item => [item.id, item]))
      return nextItems.map(item => {
        const previous = previousById.get(item.id)
        const recommended = item.grams || nextVariant?.grams_each || 100
        const ratio = previous?.ratio || 1
        return {
          id: item.id,
          selected: previous?.selected ?? true,
          grams: previous?.selected === false ? 0 : roundToStep(recommended * ratio),
          ratio,
        }
      })
    })
  }, [sizeIdx, variants])

  const image = kit.images?.[0] || activeItems[0]?.image || ''

  const selectedItems = activeItems
    .map((item, index) => ({ ...item, ...(itemStates[index] || { id: item.id, selected: true, grams: item.grams || 100, ratio: 1 }) }))
    .filter(item => item.selected && item.grams > 0)

  const defaultRawTotal = activeItems.reduce((sum, item) => (
    sum + getBasePrice(item, item.grams || activeVariant?.grams_each || 100)
  ), 0)
  const dynamicRawTotal = selectedItems.reduce((sum, item) => sum + getBasePrice(item, item.grams), 0)
  const kitFactor = defaultRawTotal > 0 ? (activeVariant?.price || kit.price || defaultRawTotal) / defaultRawTotal : 1
  const powderPrice = Math.max(0, Math.round(dynamicRawTotal * kitFactor))
  const price = form === 'whole' ? Math.round(powderPrice * 0.85) : powderPrice
  const totalWeight = selectedItems.reduce((sum, item) => sum + item.grams, 0)
  const totalWeightLabel = totalWeight >= 1000
    ? `${(totalWeight / 1000).toFixed(totalWeight % 1000 === 0 ? 0 : 1)}kg`
    : `${totalWeight}g`

  const updateItem = (index: number, next: Partial<{ selected: boolean; grams: number }>, recommended: number) => {
    setItemStates(prev => prev.map((item, itemIndex) => (
      itemIndex === index
        ? {
            ...item,
            ...next,
            ratio: typeof next.grams === 'number' && next.grams > 0 ? next.grams / recommended : item.ratio,
          }
        : item
    )))
  }

  const benefits = kit.tags?.filter(tag => !['kit', 'bestseller', 'premium'].includes(tag)) || []
  const howToUse = activeVariant?.description || kit.description
  const sizeLabel = getSizeDisplayName(activeVariant?.name, sizeIdx)

  const handleAddToCart = () => {
    if (!selectedItems.length) {
      showToast('Select at least one item')
      return
    }

    addItem({
      product_id: kit.id,
      product_name: kit.name,
      product_image: image,
      variant_id: `${activeVariant?.id || 'kit'}-${form}-${selectedItems.map(item => `${item.id}:${item.grams}`).join('|')}`,
      variant_name: `${sizeLabel} - ${form === 'powder' ? 'Powder' : 'Whole'} - ${selectedItems.map(item => `${item.name} ${item.grams}g`).join(', ')}`,
      weight_grams: totalWeight,
      price,
      quantity: 1,
    })
    showToast(`${kit.name} added`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  const whatsappMessage = `Hi Mana! I want to buy the ${kit.name}.\n\nSize: ${sizeLabel}\nForm: ${form === 'powder' ? 'Powder' : 'Whole'}\nWeight: ${totalWeightLabel}\nPrice: ${formatPrice(price)}\n\nItems:\n${selectedItems.map(item => `- ${item.name}: ${item.grams}g`).join('\n')}`

  return (
    <div className="bg-white border border-ivory-3 rounded-[28px] overflow-hidden shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-ivory-3 bg-ivory px-5 py-4 sm:px-7">
        <div>
          <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4">Customize selected kit</div>
          <div className="font-serif text-xl text-ink mt-1">{kit.name}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-ivory-3 bg-white px-4 py-2 text-sm text-ink transition-colors hover:border-terra hover:text-terra"
        >
          Close
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="p-5 sm:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-ivory-3">
          <div className="relative overflow-hidden rounded-[24px] border border-ivory-3 bg-ivory2 aspect-[4/3]">
            {image ? (
              <Image src={image} alt={kit.name} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-ink-4">No image</div>
            )}
          </div>
          <div className="mt-5 rounded-[20px] border border-green-5 bg-green-6/50 p-5">
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Description</div>
            <p className="text-[.9rem] text-ink-3 leading-[1.8]">{kit.description}</p>
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8 flex flex-col gap-5">
          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Mana wellness kit</div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-none text-ink font-light">{kit.name}</h2>
            {kit.vendor && <div className="text-sm text-ink-4 mt-2">{kit.vendor}</div>}
          </div>

          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Select size</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {variants.map((variant, index) => (
                <button
                  key={variant.id || variant.name}
                  type="button"
                  onClick={() => setSizeIdx(index)}
                  className={`rounded-xl border p-3 text-left transition-all ${sizeIdx === index ? 'border-green bg-green-6 shadow-soft' : 'border-ivory-3 bg-white hover:border-green-4'}`}
                >
                  <div className="text-sm font-medium text-ink">{getSizeDisplayName(variant.name, index)}</div>
                  <div className="text-[.66rem] text-ink-4 mt-1">{variant.grams_each || variant.items?.[0]?.grams || 100}g each recommended</div>
                  <div className="text-[.82rem] text-green font-medium mt-1">{formatPrice(variant.price || kit.price)}</div>
                </button>
              ))}
            </div>
            {activeVariant?.size_desc && <div className="text-[.72rem] text-ink-3 mt-2">{activeVariant.size_desc}</div>}
          </div>

          <div className="rounded-2xl border border-ivory-3 bg-ivory/70 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4">Selected configuration</div>
                <div className="text-sm text-ink mt-1">{sizeLabel} · {form === 'powder' ? 'Powder' : 'Whole'} · {selectedItems.length} products · {totalWeightLabel}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizing(current => !current)}
                className="rounded-full border border-green-4 bg-white px-4 py-2 text-xs font-medium text-green transition-colors hover:bg-green-6"
              >
                {isCustomizing ? 'Done' : 'Edit / Customize'}
              </button>
            </div>

            <div className="space-y-1.5">
              {selectedItems.length === 0 ? (
                <div className="text-sm text-ink-3">No linked products were saved inside this kit yet.</div>
              ) : (
                selectedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-[.82rem] text-ink-3">
                    <span>{item.name}</span>
                    <span>{item.grams}g</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-2">Choose form</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm('powder')}
                className={`min-w-[140px] rounded-xl border px-5 py-3 text-sm font-medium transition-all ${form === 'powder' ? 'border-green bg-green text-white' : 'border-green-4 bg-white text-green hover:bg-green-6'}`}
              >
                Powder
              </button>
              <button
                type="button"
                onClick={() => setForm('whole')}
                className={`min-w-[140px] rounded-xl border px-5 py-3 text-sm font-medium transition-all ${form === 'whole' ? 'border-green bg-green text-white' : 'border-green-4 bg-white text-green hover:bg-green-6'}`}
              >
                Whole
              </button>
            </div>
            <div className="text-[.7rem] text-ink-4 mt-1">Whole form is calculated 15% lower than powder.</div>
          </div>

          {isCustomizing && (
              <div className="rounded-2xl border border-ivory-3 bg-ivory/70 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4">Adjust individual products</div>
                  <div className="text-[.68rem] text-ink-3">{selectedItems.length}/{activeItems.length} selected</div>
                </div>

                <div className="flex flex-col gap-3">
                  {activeItems.length === 0 ? (
                    <div className="text-sm text-ink-3">No linked products were saved inside this kit yet.</div>
                  ) : (
                    activeItems.map((item, index) => {
                      const state = itemStates[index] || { id: item.id, selected: true, grams: item.grams || 100, ratio: 1 }
                      const recommended = item.grams || activeVariant?.grams_each || 100
                      const minWeight = Math.max(25, Math.round(recommended / 2 / 25) * 25)
                      const maxWeight = Math.max(recommended + 50, recommended * 2)
                      const linePrice = Math.round(getBasePrice(item, state.grams) * kitFactor * (form === 'whole' ? 0.85 : 1))

                      return (
                        <div key={item.id} className="rounded-xl border border-ivory-3 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state.selected}
                                onChange={event => updateItem(index, {
                                  selected: event.target.checked,
                                  grams: event.target.checked ? roundToStep(recommended * (state.ratio || 1)) : 0,
                                }, recommended)}
                                className="h-4 w-4 accent-[var(--green)]"
                              />
                              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-ivory-3 bg-ivory2 flex items-center justify-center text-[.58rem] uppercase tracking-[.12em] text-ink-4">
                                {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <span>Img</span>}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[.9rem] font-medium text-ink">{item.name}</div>
                                <div className="text-[.68rem] text-ink-3 leading-tight">{item.benefit || item.category || 'Kit item'}</div>
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
                              step={25}
                              value={state.selected ? state.grams : minWeight}
                              disabled={!state.selected}
                              onChange={event => updateItem(index, { grams: parseInt(event.target.value, 10) }, recommended)}
                              className={state.selected ? 'opacity-100' : 'opacity-40'}
                            />
                            <div className="mt-1 flex items-center justify-between text-[.64rem] text-ink-4">
                              <span>{minWeight}g</span>
                              <span>{recommended}g</span>
                              <span>{maxWeight}g</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
          )}

          <div className="rounded-2xl border border-green-5 bg-green-6/60 p-4">
            <div className="space-y-1.5 border-b border-green-5 pb-3 mb-3">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-[.78rem] text-ink-3">
                  <span>{item.name} ({item.grams}g)</span>
                  <span>{formatPrice(Math.round(getBasePrice(item, item.grams) * kitFactor * (form === 'whole' ? 0.85 : 1)))}</span>
                </div>
              ))}
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <div className="font-serif text-3xl text-green">{formatPrice(price)}</div>
              {form === 'whole' && <div className="text-sm text-ink-4 line-through">{formatPrice(powderPrice)}</div>}
            </div>
            <div className="text-[.72rem] text-ink-3 mb-4">{totalWeightLabel} total - {form === 'powder' ? 'powder form' : 'whole form'}</div>
            <div className="flex gap-2.5 flex-wrap">
              <button onClick={handleAddToCart} disabled={!selectedItems.length} className="btn-primary flex-1 justify-center min-w-[140px] disabled:opacity-50">
                <span>Add to Cart</span>
              </button>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex-1 justify-center min-w-[140px] no-underline"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div>
            <div className="flex border-b border-ivory-3 mb-3">
              {(['benefits', 'howto'] as const).map(currentTab => (
                <button
                  key={currentTab}
                  type="button"
                  onClick={() => setTab(currentTab)}
                  className={`px-4 py-2 text-xs font-medium border-none bg-transparent cursor-pointer transition-all ${tab === currentTab ? 'text-green border-b-2 border-green -mb-px' : 'text-ink-3 hover:text-ink'}`}
                >
                  {currentTab === 'benefits' ? 'Benefits' : 'How to Use'}
                </button>
              ))}
            </div>

            {tab === 'benefits' && (
              <div className="grid grid-cols-1 gap-1.5">
                {(benefits.length ? benefits : ['Customizable quantities', 'Freshly packed', 'Flexible powder or whole form']).map(benefit => (
                  <div key={benefit} className="flex items-center gap-2 text-[.78rem] text-ink-3">
                    <span className="text-green-3 flex-shrink-0">✓</span>
                    {benefit}
                  </div>
                ))}
              </div>
            )}

            {tab === 'howto' && (
              <div className="text-[.78rem] text-ink-3 leading-[1.8]">
                {howToUse || 'Use as recommended by Mana. For personalized usage, contact us on WhatsApp before ordering.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
