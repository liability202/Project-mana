'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { slugify } from '@/lib/utils'
import { ImageManager } from '@/components/admin/ImageManager'
import { VariantEditor, type AdminVariant } from '@/components/admin/VariantEditor'

type Category = 'dry-fruits' | 'herbs' | 'spices' | 'pansari' | 'kits'

const CATEGORY_OPTIONS: Category[] = ['dry-fruits', 'herbs', 'spices', 'pansari', 'kits']

const DEFAULT_VARIANTS: AdminVariant[] = [
  { id: 'v1', name: 'Standard', description: 'Default option', price: 0, quality_tag: 'popular', images: [], in_stock: true },
]

export default function NewAdminProductPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('herbs')
  const [priceRupees, setPriceRupees] = useState('0')
  const [comparePriceRupees, setComparePriceRupees] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('per 500g')
  const [vendor, setVendor] = useState('')
  const [tagsInput, setTagsInput] = useState('bestseller, organic')
  const [imagesInput, setImagesInput] = useState('')
  const [variants, setVariants] = useState<AdminVariant[]>(DEFAULT_VARIANTS)
  const [inStock, setInStock] = useState(true)
  const [badgeX, setBadgeX] = useState(50)
  const [badgeY, setBadgeY] = useState(82)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const derivedSlug = useMemo(() => slugify(name), [name])
  const effectiveSlug = slugTouched ? slug : derivedSlug

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const secret = localStorage.getItem('mana_admin') || ''
      if (!secret) throw new Error('Admin login not found. Please login again.')

      const tags = tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
      const images = imagesInput.split('\n').map(url => url.trim()).filter(Boolean)

      const payload = {
        name: name.trim(),
        slug: effectiveSlug.trim(),
        description: description.trim(),
        category,
        price: Math.round(Number(priceRupees || '0') * 100),
        compare_price: comparePriceRupees ? Math.round(Number(comparePriceRupees) * 100) : null,
        price_per_unit: pricePerUnit.trim(),
        images,
        tags,
        vendor: vendor.trim() || null,
        in_stock: inStock,
        variants,
        badge_x: Number(badgeX),
        badge_y: Number(badgeY),
      }

      if (!payload.name) throw new Error('Product name is required.')
      if (!payload.slug) throw new Error('Slug is required.')
      if (!payload.description) throw new Error('Description is required.')
      if (!Number.isFinite(payload.price) || payload.price <= 0) throw new Error('Price must be greater than 0.')

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create product.')

      setSuccess('Product created successfully.')
      setName('')
      setSlug('')
      setSlugTouched(false)
      setDescription('')
      setCategory('herbs')
      setPriceRupees('0')
      setComparePriceRupees('')
      setPricePerUnit('per 500g')
      setVendor('')
      setTagsInput('bestseller, organic')
      setImagesInput('')
      setVariants(DEFAULT_VARIANTS)
      setInStock(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-green px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-serif text-ivory text-lg">MANA Admin</div>
          <div className="text-[.72rem] text-green-4 mt-0.5">Create a new product</div>
        </div>
        <Link href="/admin" className="btn-outline no-underline text-sm py-2 px-4 bg-white/0 border-green-5 text-green-4 hover:bg-green-2 hover:text-ivory">
          Back to Admin
        </Link>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-6">
          <div className="bg-white border border-ivory-3 rounded-2xl p-6">
            <h1 className="font-serif text-2xl text-ink mb-5">Add Product</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-ink-3 block mb-1.5">Product Name</label>
                <input value={name} onChange={e => handleNameChange(e.target.value)} className="input" placeholder="Ashwagandha Root Powder" />
              </div>

              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Slug</label>
                <input
                  value={effectiveSlug}
                  onChange={e => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  className="input"
                  placeholder="ashwagandha-root-powder"
                />
              </div>

              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as Category)} className="input">
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Price (₹)</label>
                <input value={priceRupees} onChange={e => setPriceRupees(e.target.value)} className="input" inputMode="decimal" placeholder="340" />
              </div>

              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Compare Price (₹)</label>
                <input value={comparePriceRupees} onChange={e => setComparePriceRupees(e.target.value)} className="input" inputMode="decimal" placeholder="380" />
              </div>

              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Price Per Unit</label>
                <input value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} className="input" placeholder="per 500g" />
              </div>

              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Vendor</label>
                <input value={vendor} onChange={e => setVendor(e.target.value)} className="input" placeholder="Madhya Pradesh" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-ink-3 block mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[140px]" placeholder="Pure Ashwagandha powder ground fresh after your order..." />
              </div>

              <div className="md:col-span-2">
                <ImageManager label="Product Images" value={imagesInput} onChange={setImagesInput} />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-ink-3 block mb-1.5">Tags</label>
                <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="input" placeholder="bestseller, organic, premium" />
              </div>

              <BadgePositionPicker 
                imageUrl={imagesInput} 
                badgeX={badgeX} 
                badgeY={badgeY} 
                onChangeX={setBadgeX} 
                onChangeY={setBadgeY} 
              />

              <div className="md:col-span-2">
                <label className="text-xs text-ink-3 block mb-1.5">Variants</label>
                <VariantEditor value={variants} onChange={setVariants} />
                <div className="text-xs text-ink-4 mt-2">Each variant can have its own images, price, quality tag and stock status.</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Status</h2>
              <label className="flex items-center gap-3 text-sm text-ink cursor-pointer">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="h-4 w-4 accent-[var(--green)]" />
                Mark product as in stock
              </label>
            </div>

            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Preview</h2>
              <div className="space-y-2 text-sm text-ink-3">
                <div><span className="text-ink font-medium">Name:</span> {name || 'Product name'}</div>
                <div><span className="text-ink font-medium">Slug:</span> {effectiveSlug || 'product-slug'}</div>
                <div><span className="text-ink font-medium">Category:</span> {category}</div>
                <div><span className="text-ink font-medium">Price:</span> ₹{priceRupees || '0'}</div>
                <div><span className="text-ink font-medium">Tags:</span> {tagsInput || 'none'}</div>
              </div>
            </div>

            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Save</h2>
              {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              {success && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                {submitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function BadgePositionPicker({
  imageUrl,
  badgeX,
  badgeY,
  onChangeX,
  onChangeY
}: {
  imageUrl: string
  badgeX: number
  badgeY: number
  onChangeX: (val: number) => void
  onChangeY: (val: number) => void
}) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    onChangeX(Math.max(5, Math.min(95, x)))
    onChangeY(Math.max(5, Math.min(95, y)))
  }

  const firstUrl = (imageUrl || '').split('\n').map(u => u.trim()).filter(Boolean)[0] || ''

  return (
    <div className="md:col-span-2 border-t border-ivory-3 pt-5 mt-3">
      <div className="text-xs font-semibold text-ink mb-1">Image Weight Badge Position (Live Preview)</div>
      <div className="text-[.72rem] text-ink-4 mb-4">Click anywhere on the image below or adjust the sliders to position the weight badge.</div>
      
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-center">
        {/* Live Interactive Preview Box */}
        <div 
          onClick={handleClick}
          className="relative w-full max-w-[220px] aspect-square rounded-xl overflow-hidden border-2 border-dashed border-green-5 bg-ivory-2 cursor-crosshair group shadow-soft mx-auto md:mx-0 select-none"
          title="Click anywhere on this image to set badge position"
        >
          {firstUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={firstUrl} alt="Preview" className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-ink-4 text-xs">
              <span>Add a product image URL above to see live preview</span>
            </div>
          )}

          {/* Live Moving Badge */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-150 z-10"
            style={{ top: `${badgeY}%`, left: `${badgeX}%` }}
          >
            <div className="bg-black/80 text-white border border-white/30 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-medium tracking-wider shadow-md whitespace-nowrap">
              500g
            </div>
          </div>
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 pointer-events-none">
            <span className="bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-md">Click to position pin</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-ink-3 mb-1">
              <span>Horizontal (X Axis):</span>
              <span className="font-mono font-bold text-green">{badgeX}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="95" 
              value={badgeX} 
              onChange={e => onChangeX(Number(e.target.value))} 
              className="w-full accent-green cursor-pointer h-2 bg-ivory-3 rounded-lg" 
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink-3 mb-1">
              <span>Vertical (Y Axis):</span>
              <span className="font-mono font-bold text-green">{badgeY}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="95" 
              value={badgeY} 
              onChange={e => onChangeY(Number(e.target.value))} 
              className="w-full accent-green cursor-pointer h-2 bg-ivory-3 rounded-lg" 
            />
          </div>
          <button
            type="button"
            onClick={() => { onChangeX(50); onChangeY(82); }}
            className="text-[.68rem] text-green-3 hover:text-green font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer"
          >
            ↺ Reset to Default Position (50%, 82%)
          </button>
        </div>
      </div>
    </div>
  )
}
