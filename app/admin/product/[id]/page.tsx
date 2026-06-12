'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { slugify } from '@/lib/utils'
import type { Product } from '@/lib/supabase'

type Category = 'dry-fruits' | 'herbs' | 'spices' | 'pansari' | 'kits'

const CATEGORY_OPTIONS: Category[] = ['dry-fruits', 'herbs', 'spices', 'pansari', 'kits']

export default function EditAdminProductPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('herbs')
  const [priceRupees, setPriceRupees] = useState('0')
  const [comparePriceRupees, setComparePriceRupees] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('per 500g')
  const [vendor, setVendor] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [imagesInput, setImagesInput] = useState('')
  const [variantsInput, setVariantsInput] = useState('[]')
  const [inStock, setInStock] = useState(true)

  const derivedSlug = useMemo(() => slugify(name), [name])
  const effectiveSlug = slugTouched ? slug : derivedSlug

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
          setError('Product not found.')
          setLoading(false)
          return
        }
        setName(product.name)
        setSlug(product.slug)
        setDescription(product.description || '')
        setCategory(product.category as Category)
        setPriceRupees(String((product.price || 0) / 100))
        setComparePriceRupees(product.compare_price ? String(product.compare_price / 100) : '')
        setPricePerUnit(product.price_per_unit || 'per 500g')
        setVendor(product.vendor || '')
        setTagsInput((product.tags || []).join(', '))
        setImagesInput((product.images || []).join('\n'))
        setVariantsInput(JSON.stringify(product.variants || [], null, 2))
        setInStock(Boolean(product.in_stock))
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Could not load product.')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const secret = localStorage.getItem('mana_admin') || ''
      if (!secret) throw new Error('Admin login not found. Please login again.')

      const payload = {
        id: params.id,
        name: name.trim(),
        slug: effectiveSlug.trim(),
        description: description.trim(),
        category,
        price: Math.round(Number(priceRupees || '0') * 100),
        compare_price: comparePriceRupees ? Math.round(Number(comparePriceRupees) * 100) : null,
        price_per_unit: pricePerUnit.trim(),
        images: imagesInput.split('\n').map(url => url.trim()).filter(Boolean),
        tags: tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean),
        vendor: vendor.trim() || null,
        in_stock: inStock,
        variants: variantsInput.trim() ? JSON.parse(variantsInput) : [],
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
      if (!res.ok) throw new Error(data?.error || 'Failed to update product.')
      setSuccess('Product updated successfully.')
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
          <div className="text-[.72rem] text-green-4 mt-0.5">Edit product</div>
        </div>
        <Link href="/admin" className="btn-outline no-underline text-sm py-2 px-4 bg-white/0 border-green-5 text-green-4 hover:bg-green-2 hover:text-ivory">
          Back to Admin
        </Link>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-white border border-ivory-3 rounded-2xl p-6 text-ink-3">Loading product...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-6">
            <div className="bg-white border border-ivory-3 rounded-2xl p-6">
              <h1 className="font-serif text-2xl text-ink mb-5">Edit Product</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Product Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input" />
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
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value as Category)} className="input">
                    {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Price (₹)</label>
                  <input value={priceRupees} onChange={e => setPriceRupees(e.target.value)} className="input" inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Compare Price (₹)</label>
                  <input value={comparePriceRupees} onChange={e => setComparePriceRupees(e.target.value)} className="input" inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Price Per Unit</label>
                  <input value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Vendor</label>
                  <input value={vendor} onChange={e => setVendor(e.target.value)} className="input" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[140px]" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Product Images</label>
                  
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
                  <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="input" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1.5">Variants JSON</label>
                  <textarea value={variantsInput} onChange={e => setVariantsInput(e.target.value)} className="input min-h-[260px] font-mono text-xs" />
                  <div className="text-xs text-ink-4 mt-2">Tip: each variant can include an `images` array to show different pictures per variant.</div>
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
                <h2 className="font-serif text-xl text-ink mb-4">Save</h2>
                {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                {success && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
