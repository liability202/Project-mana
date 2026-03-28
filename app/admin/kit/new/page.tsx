'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatPrice, slugify } from '@/lib/utils'
import type { Product } from '@/lib/supabase'

type SelectedKitProduct = {
  id: string
  name: string
  slug: string
  price: number
  category: string
  image?: string
}

export default function NewAdminKitPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('Mana')
  const [tagsInput, setTagsInput] = useState('bestseller, kit')
  const [imagesInput, setImagesInput] = useState('')
  const [priceRupees, setPriceRupees] = useState('')
  const [comparePriceRupees, setComparePriceRupees] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('per kit')
  const [inStock, setInStock] = useState(true)
  const [catalog, setCatalog] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<SelectedKitProduct[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const derivedSlug = useMemo(() => slugify(name), [name])
  const effectiveSlug = slugTouched ? slug : derivedSlug

  useEffect(() => {
    let active = true
    void fetch('/api/products?limit=200')
      .then(res => res.json())
      .then((data: Product[]) => {
        if (!active) return
        setCatalog(Array.isArray(data) ? data.filter(product => product.category !== 'kits') : [])
      })
      .catch(() => {
        if (active) setError('Could not load products for kit selection.')
      })
      .finally(() => {
        if (active) setLoadingProducts(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return catalog
    return catalog.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  }, [catalog, search])

  const estimatedTotal = selectedProducts.reduce((sum, product) => sum + product.price, 0)

  const toggleProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const exists = prev.some(item => item.id === product.id)
      if (exists) return prev.filter(item => item.id !== product.id)
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          category: product.category,
          image: product.images?.[0],
        },
      ]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const secret = localStorage.getItem('mana_admin') || ''
      if (!secret) throw new Error('Admin login not found. Please login again.')
      if (!name.trim()) throw new Error('Kit name is required.')
      if (!effectiveSlug.trim()) throw new Error('Kit slug is required.')
      if (!description.trim()) throw new Error('Description is required.')
      if (!selectedProducts.length) throw new Error('Select at least one product for this kit.')

      const manualPrice = Math.round(Number(priceRupees || '0') * 100)
      const manualComparePrice = comparePriceRupees ? Math.round(Number(comparePriceRupees) * 100) : null
      const images = imagesInput.split('\n').map(url => url.trim()).filter(Boolean)
      const tags = tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)

      const payload = {
        name: name.trim(),
        slug: effectiveSlug.trim(),
        description: description.trim(),
        category: 'kits',
        price: manualPrice > 0 ? manualPrice : estimatedTotal,
        compare_price: manualComparePrice,
        price_per_unit: pricePerUnit.trim() || 'per kit',
        images,
        tags,
        vendor: vendor.trim() || null,
        in_stock: inStock,
        variants: [
          {
            id: 'kit-default',
            name: 'Kit',
            description: `Includes ${selectedProducts.length} products`,
            price: manualPrice > 0 ? manualPrice : estimatedTotal,
            items: selectedProducts,
          },
        ],
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create kit.')

      setSuccess('Kit created successfully.')
      setName('')
      setSlug('')
      setSlugTouched(false)
      setDescription('')
      setVendor('Mana')
      setTagsInput('bestseller, kit')
      setImagesInput('')
      setPriceRupees('')
      setComparePriceRupees('')
      setPricePerUnit('per kit')
      setInStock(true)
      setSelectedProducts([])
      setSearch('')
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
          <div className="text-[.72rem] text-green-4 mt-0.5">Create a new kit</div>
        </div>
        <Link href="/admin" className="btn-outline no-underline text-sm py-2 px-4 bg-white/0 border-green-5 text-green-4 hover:bg-green-2 hover:text-ivory">
          Back to Admin
        </Link>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1.05fr_.95fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h1 className="font-serif text-2xl text-ink mb-5">Kit Details</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Kit Name</label>
                  <input value={name} onChange={e => {
                    setName(e.target.value)
                    if (!slugTouched) setSlug(slugify(e.target.value))
                  }} className="input" placeholder="Hair Health Kit" />
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
                    placeholder="hair-health-kit"
                  />
                </div>

                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Vendor</label>
                  <input value={vendor} onChange={e => setVendor(e.target.value)} className="input" placeholder="Mana" />
                </div>

                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Kit Price (₹)</label>
                  <input value={priceRupees} onChange={e => setPriceRupees(e.target.value)} className="input" inputMode="decimal" placeholder="Leave blank to use selected products total" />
                </div>

                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Compare Price (₹)</label>
                  <input value={comparePriceRupees} onChange={e => setComparePriceRupees(e.target.value)} className="input" inputMode="decimal" placeholder="Optional" />
                </div>

                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Price Per Unit</label>
                  <input value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} className="input" placeholder="per kit" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[140px]" placeholder="A curated hair care kit with herbs chosen for stronger, healthier hair." />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Kit Image URLs</label>
                  <textarea value={imagesInput} onChange={e => setImagesInput(e.target.value)} className="input min-h-[110px]" placeholder={"One image URL per line\nhttps://...\nhttps://..."} />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Tags</label>
                  <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="input" placeholder="bestseller, premium, kit" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="font-serif text-xl text-ink">Select Products</h2>
                <div className="text-sm text-ink-3">{selectedProducts.length} selected</div>
              </div>

              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input mb-4"
                placeholder="Search products by name, slug, or category"
              />

              <div className="max-h-[460px] overflow-auto border border-ivory-3 rounded-xl divide-y divide-ivory-3">
                {loadingProducts ? (
                  <div className="p-4 text-sm text-ink-3">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 text-sm text-ink-3">No products found.</div>
                ) : (
                  filteredProducts.map(product => {
                    const checked = selectedProducts.some(item => item.id === product.id)
                    return (
                      <label key={product.id} className="flex items-start gap-3 p-4 cursor-pointer hover:bg-ivory-2 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(product)}
                          className="mt-1 h-4 w-4 accent-[var(--green)]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-ink">{product.name}</div>
                              <div className="text-xs text-ink-4 mt-0.5">{product.slug} · {product.category}</div>
                            </div>
                            <div className="font-serif text-green whitespace-nowrap">{formatPrice(product.price)}</div>
                          </div>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Selected Products</h2>
              {selectedProducts.length === 0 ? (
                <div className="text-sm text-ink-3">No products selected yet.</div>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-ivory-3 p-3">
                      <div className="min-w-0">
                        <div className="font-medium text-ink">{product.name}</div>
                        <div className="text-xs text-ink-4">{product.category} · {product.slug}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProducts(prev => prev.filter(item => item.id !== product.id))}
                        className="text-xs text-terra hover:text-terra-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Kit Summary</h2>
              <div className="space-y-2 text-sm text-ink-3">
                <div><span className="text-ink font-medium">Name:</span> {name || 'Kit name'}</div>
                <div><span className="text-ink font-medium">Slug:</span> {effectiveSlug || 'kit-slug'}</div>
                <div><span className="text-ink font-medium">Selected Products:</span> {selectedProducts.length}</div>
                <div><span className="text-ink font-medium">Estimated Total:</span> {formatPrice(estimatedTotal)}</div>
                <div><span className="text-ink font-medium">Selling Price:</span> {priceRupees ? `₹${priceRupees}` : formatPrice(estimatedTotal)}</div>
              </div>
            </div>

            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Status</h2>
              <label className="flex items-center gap-3 text-sm text-ink cursor-pointer">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="h-4 w-4 accent-[var(--green)]" />
                Mark kit as in stock
              </label>
            </div>

            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h2 className="font-serif text-xl text-ink mb-4">Save Kit</h2>
              {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              {success && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                {submitting ? 'Creating Kit...' : 'Create Kit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
