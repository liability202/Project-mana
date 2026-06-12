'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { calcPriceForWeight, formatPrice, parseBaseWeightGrams, slugify } from '@/lib/utils'
import type { Product } from '@/lib/supabase'

type SelectedKitProduct = {
  id: string
  name: string
  slug: string
  price: number
  price_per_unit: string
  category: string
  image?: string
}

type KitSize = {
  id: string
  name: string
  gramsEach: string
  priceRupees: string
  comparePriceRupees: string
  description: string
}

type WeightMatrix = Record<string, Record<string, string>>

export default function EditAdminKitPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('Mana')
  const [tagsInput, setTagsInput] = useState('bestseller, kit')
  const [imagesInput, setImagesInput] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('per kit')
  const [kitSizes, setKitSizes] = useState<KitSize[]>([
    { id: 'small', name: 'Essential', gramsEach: '100', priceRupees: '', comparePriceRupees: '', description: 'Starter size' },
    { id: 'medium', name: 'Signature', gramsEach: '200', priceRupees: '', comparePriceRupees: '', description: 'Recommended size' },
    { id: 'large', name: 'Reserve', gramsEach: '500', priceRupees: '', comparePriceRupees: '', description: 'Best value size' },
  ])
  const [inStock, setInStock] = useState(true)
  const [catalog, setCatalog] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<SelectedKitProduct[]>([])
  const [productWeights, setProductWeights] = useState<WeightMatrix>({})
  const [submitting, setSubmitting] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const derivedSlug = useMemo(() => slugify(name), [name])
  const effectiveSlug = slugTouched ? slug : derivedSlug

  // Load product catalog for kit options
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

  // Load the kit being edited
  useEffect(() => {
    let active = true
    const secret = localStorage.getItem('mana_admin') || ''
    void fetch(`/api/products?id=${params.id}&include_all=1`, {
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
    })
      .then(res => res.json())
      .then((data: Product[] | Product) => {
        if (!active) return
        const product = Array.isArray(data) ? data[0] : data
        if (!product) {
          setError('Kit not found.')
          setLoading(false)
          return
        }
        setName(product.name)
        setSlug(product.slug)
        setDescription(product.description || '')
        setVendor(product.vendor || 'Mana')
        setTagsInput((product.tags || []).join(', '))
        setImagesInput((product.images || []).join('\n'))
        setPricePerUnit(product.price_per_unit || 'per kit')
        setInStock(Boolean(product.in_stock))

        // Populate kitSizes and productWeights from variants
        if (product.variants && product.variants.length > 0) {
          const sizes = product.variants.map((v: any) => {
            const sizeId = v.id.replace('kit-', '')
            return {
              id: sizeId,
              name: v.name,
              gramsEach: String(v.grams_each || ''),
              priceRupees: String((v.price || 0) / 100),
              comparePriceRupees: v.compare_price ? String(v.compare_price / 100) : '',
              description: v.description || '',
            }
          })
          setKitSizes(sizes)

          // Extract selected products from variants
          const uniqueProds: Record<string, SelectedKitProduct> = {}
          const weights: WeightMatrix = {}
          product.variants.forEach((v: any) => {
            const sizeId = v.id.replace('kit-', '')
            if (v.items && Array.isArray(v.items)) {
              v.items.forEach((item: any) => {
                if (!uniqueProds[item.id]) {
                  uniqueProds[item.id] = {
                    id: item.id,
                    name: item.name,
                    slug: item.slug || '',
                    price: item.price,
                    price_per_unit: item.price_per_unit || 'per 500g',
                    category: item.category || '',
                    image: item.image || '',
                  }
                }
                if (!weights[item.id]) {
                  weights[item.id] = {}
                }
                weights[item.id][sizeId] = String(item.grams || '')
              })
            }
          })
          setSelectedProducts(Object.values(uniqueProds))
          setProductWeights(weights)
        }
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setError('Could not load kit details.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [params.id])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return catalog
    return catalog.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  }, [catalog, search])

  const getProductWeight = (productId: string, sizeId: string, fallbackGrams: string) => {
    return productWeights[productId]?.[sizeId] || fallbackGrams
  }

  const getSizeTotal = (sizeId: string, fallbackGrams: string) => {
    return selectedProducts.reduce((sum, product) => {
      const grams = Math.max(0, Number(getProductWeight(product.id, sizeId, fallbackGrams) || '0'))
      return sum + calcPriceForWeight(product.price, product.price_per_unit, grams)
    }, 0)
  }

  const estimatedMediumTotal = getSizeTotal(kitSizes[1]?.id || 'medium', kitSizes[1]?.gramsEach || '200')
  const estimatedTotal = estimatedMediumTotal
  const priceRupees = kitSizes[1]?.priceRupees || ''

  const updateKitSize = (id: string, next: Partial<KitSize>) => {
    setKitSizes(prev => prev.map(size => size.id === id ? { ...size, ...next } : size))
  }

  const updateProductWeight = (productId: string, sizeId: string, grams: string) => {
    setProductWeights(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [sizeId]: grams.replace(/[^\d]/g, ''),
      },
    }))
  }

  const toggleProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const exists = prev.some(item => item.id === product.id)
      if (exists) {
        setProductWeights(current => {
          const next = { ...current }
          delete next[product.id]
          return next
        })
        return prev.filter(item => item.id !== product.id)
      }
      setProductWeights(current => ({
        ...current,
        [product.id]: Object.fromEntries(kitSizes.map(size => [size.id, size.gramsEach])),
      }))
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          price_per_unit: product.price_per_unit,
          category: product.category,
          image: product.images?.[0],
        },
      ]
    })
  }

  const removeSelectedProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== productId))
    setProductWeights(prev => {
      const next = { ...prev }
      delete next[productId]
      return next
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

      const images = imagesInput.split('\n').map(url => url.trim()).filter(Boolean)
      const tags = tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
      const variants = kitSizes.map(size => {
        const gramsEach = Math.max(0, Number(size.gramsEach || '0'))
        const computedPrice = getSizeTotal(size.id, size.gramsEach)
        const manualPrice = Math.round(Number(size.priceRupees || '0') * 100)
        const price = manualPrice > 0 ? manualPrice : computedPrice

        return {
          id: `kit-${size.id}`,
          name: size.name,
          description: size.description || `${gramsEach}g each`,
          size_desc: size.description || `${gramsEach}g each`,
          grams_each: gramsEach,
          price,
          compare_price: size.comparePriceRupees ? Math.round(Number(size.comparePriceRupees) * 100) : null,
          items: selectedProducts.map(product => {
            const productGrams = Math.max(0, Number(getProductWeight(product.id, size.id, size.gramsEach) || '0'))
            const pricePerGram = product.price / parseBaseWeightGrams(product.price_per_unit)
            return {
              ...product,
              grams: productGrams,
              base_price: Math.round(pricePerGram * productGrams),
              price_per_gram: pricePerGram,
            }
          }),
        }
      })
      const defaultVariant = variants[1] || variants[0]

      const payload = {
        id: params.id,
        name: name.trim(),
        slug: effectiveSlug.trim(),
        description: description.trim(),
        category: 'kits',
        price: defaultVariant.price,
        compare_price: defaultVariant.compare_price,
        price_per_unit: pricePerUnit.trim() || 'per kit',
        images,
        tags,
        vendor: vendor.trim() || null,
        in_stock: inStock,
        variants,
      }

      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update kit.')

      setSuccess('Kit updated successfully.')
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
          <div className="text-[.72rem] text-green-4 mt-0.5">Edit kit details</div>
        </div>
        <Link href="/admin" className="btn-outline no-underline text-sm py-2 px-4 bg-white/0 border-green-5 text-green-4 hover:bg-green-2 hover:text-ivory">
          Back to Admin
        </Link>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-white border border-ivory-3 rounded-2xl p-6 text-ink-3">Loading kit details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1.05fr_.95fr] gap-6">
            <div className="space-y-6">
              <div className="bg-white border border-ivory-3 rounded-2xl p-6">
                <h1 className="font-serif text-2xl text-ink mb-5">Edit Kit</h1>

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
                    <label className="text-xs text-ink-3 block mb-1.5">Price Per Unit</label>
                    <input value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} className="input" placeholder="per kit" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-ink-3 block mb-1.5">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[140px]" placeholder="A curated hair care kit with herbs chosen for stronger, healthier hair." />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-ink-3 block mb-1.5">Kit Images</label>
                    
                    {/* Visual Thumbnails Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
                      {imagesInput.split('\n').map(url => url.trim()).filter(Boolean).map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl border border-ivory-3 overflow-hidden bg-ivory-2 group">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const list = imagesInput.split('\n').map(u => u.trim()).filter(Boolean)
                              list.splice(idx, 1)
                              setImagesInput(list.join('\n'))
                            }}
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-terra/80 hover:bg-terra text-white text-xs flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload Trigger */}
                      <label className="flex flex-col items-center justify-center aspect-square rounded-xl border border-dashed border-green-5/40 hover:border-green bg-white hover:bg-green-6/20 transition-all cursor-pointer text-center p-2">
                        <span className="text-xl text-green mb-1">＋</span>
                        <span className="text-[.7rem] text-ink-3">Upload Photo</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || [])
                            if (!files.length) return
                            const secret = localStorage.getItem('mana_admin') || ''
                            const uploadedUrls: string[] = []
                            
                            for (const file of files) {
                              const fd = new FormData()
                              fd.append('file', file)
                              try {
                                const res = await fetch('/api/admin/upload', {
                                  method: 'POST',
                                  headers: { authorization: `Bearer ${secret}` },
                                  body: fd,
                                })
                                const data = await res.json()
                                if (res.ok && data.url) {
                                  uploadedUrls.push(data.url)
                                } else {
                                  alert(`Upload failed: ${data.error || 'Unknown error'}`)
                                }
                              } catch (err) {
                                alert(`Upload failed for ${file.name}`)
                              }
                            }
                            
                            if (uploadedUrls.length) {
                              const current = imagesInput.split('\n').map(u => u.trim()).filter(Boolean)
                              setImagesInput([...current, ...uploadedUrls].join('\n'))
                            }
                          }}
                        />
                      </label>
                    </div>
                    
                    {/* Fallback Textarea for manually pasting/editing URLs */}
                    <details className="mt-2">
                      <summary className="text-[.7rem] text-ink-4 cursor-pointer hover:text-ink transition-colors">Edit Raw URLs</summary>
                      <textarea
                        value={imagesInput}
                        onChange={e => setImagesInput(e.target.value)}
                        className="input min-h-[90px] text-xs font-mono mt-1.5"
                        placeholder={"One image URL per line\nhttps://...\nhttps://..."}
                      />
                    </details>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-ink-3 block mb-1.5">Tags</label>
                    <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="input" placeholder="bestseller, premium, kit" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-ivory-3 rounded-2xl p-6">
                <div className="mb-4">
                  <h2 className="font-serif text-xl text-ink">Size & Weight Options</h2>
                  <p className="text-sm text-ink-3 mt-1">Set default grams for each size. Exact per-product grams are controlled in the selected products matrix.</p>
                </div>

                <div className="space-y-4">
                  {kitSizes.map(size => {
                    const autoPrice = getSizeTotal(size.id, size.gramsEach)
                    return (
                      <div key={size.id} className="rounded-2xl border border-ivory-3 bg-ivory-1 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-ink-3 block mb-1.5">Size Name</label>
                            <input
                              value={size.name}
                              onChange={e => updateKitSize(size.id, { name: e.target.value })}
                              className="input bg-white"
                              placeholder="Signature"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-ink-3 block mb-1.5">Default Grams</label>
                            <input
                              value={size.gramsEach}
                              onChange={e => updateKitSize(size.id, { gramsEach: e.target.value.replace(/[^\d]/g, '') })}
                              className="input bg-white"
                              inputMode="numeric"
                              placeholder="200"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-ink-3 block mb-1.5">Selling Price (Rs)</label>
                            <input
                              value={size.priceRupees}
                              onChange={e => updateKitSize(size.id, { priceRupees: e.target.value })}
                              className="input bg-white"
                              inputMode="decimal"
                              placeholder={`Auto ${formatPrice(autoPrice)}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-ink-3 block mb-1.5">Compare Price (Rs)</label>
                            <input
                              value={size.comparePriceRupees}
                              onChange={e => updateKitSize(size.id, { comparePriceRupees: e.target.value })}
                              className="input bg-white"
                              inputMode="decimal"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-xs text-ink-3 block mb-1.5">Size Description</label>
                          <input
                            value={size.description}
                            onChange={e => updateKitSize(size.id, { description: e.target.value })}
                            className="input bg-white"
                            placeholder="Good for 2 months"
                          />
                        </div>
                        <div className="mt-2 text-xs text-ink-4">
                          Auto estimate: {formatPrice(autoPrice)} using the product weights below. New products start at {size.gramsEach || 0}g for this size.
                        </div>
                      </div>
                    )
                  })}
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
                <h2 className="font-serif text-xl text-ink mb-1">Selected Products</h2>
                <p className="text-sm text-ink-3 mb-4">Set exact grams for each product in each kit size.</p>
                {selectedProducts.length === 0 ? (
                  <div className="text-sm text-ink-3">No products selected yet.</div>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map(product => (
                      <div key={product.id} className="rounded-xl border border-ivory-3 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-ink">{product.name}</div>
                            <div className="text-xs text-ink-4">{product.category} · {product.slug}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedProduct(product.id)}
                            className="text-xs text-terra hover:text-terra-2"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {kitSizes.map(size => (
                            <div key={size.id}>
                              <label className="text-[.64rem] text-ink-4 block mb-1">{size.name}</label>
                              <div className="relative">
                                <input
                                  value={getProductWeight(product.id, size.id, size.gramsEach)}
                                  onChange={e => updateProductWeight(product.id, size.id, e.target.value)}
                                  className="input bg-ivory pr-8 text-sm"
                                  inputMode="numeric"
                                  placeholder={size.gramsEach}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[.68rem] text-ink-4">g</span>
                              </div>
                            </div>
                          ))}
                        </div>
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
                  <div><span className="text-ink font-medium">Medium Auto Estimate:</span> {formatPrice(estimatedMediumTotal)}</div>
                  <div className="space-y-1 pt-1">
                    {kitSizes.map(size => {
                      const autoPrice = getSizeTotal(size.id, size.gramsEach)
                      return (
                        <div key={size.id}>
                          <span className="text-ink font-medium">{size.name || 'Size'}:</span> {size.priceRupees ? `Rs ${size.priceRupees}` : formatPrice(autoPrice)}
                        </div>
                      )
                    })}
                  </div>
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
                <h2 className="font-serif text-xl text-ink mb-4">Save Changes</h2>
                {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                {success && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                  {submitting ? 'Saving...' : 'Save Kit'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
