'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCart, useCoupon } from '@/lib/store'
import { formatPrice, formatWeight } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import { ReviewForm } from '@/components/product/ReviewForm'
import { ReviewList } from '@/components/product/ReviewList'
import { ProductRecommendations } from '@/components/product/ProductRecommendations'
import type { Product, Variant } from '@/lib/supabase'

const ACCOUNT_PHONE_KEY = 'mana_account_phone'

function readAccountPhone() {
  if (typeof window === 'undefined') return ''

  const stored = window.localStorage.getItem(ACCOUNT_PHONE_KEY)
  if (stored) return stored

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${ACCOUNT_PHONE_KEY}=`))
    ?.split('=')[1] || ''
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct]       = useState<Product | null>(null)
  const [activeImg, setActiveImg]   = useState(0)
  const [activeVar, setActiveVar]   = useState<Variant | null>(null)
  const [unit, setUnit]             = useState<'g' | 'kg'>('g')
  const [grams, setGrams]           = useState(500)
  const [loading, setLoading]       = useState(true)
  const [deliveryPincode, setDeliveryPincode] = useState('')
  const [deliveryCheck, setDeliveryCheck] = useState<any>(null)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [reviewCheckLoading, setReviewCheckLoading] = useState(true)

  const addItem = useCart(s => s.addItem)
  const cartItems = useCart(s => s.items)

  useEffect(() => {
    supabase.from('products').select('*').eq('slug', params.slug).single()
      .then(({ data }) => {
        if (data) {
          setProduct(data)
          setActiveVar(data.variants?.[0] || null)
        }
        setLoading(false)
      })
  }, [params.slug])

  useEffect(() => {
    setActiveImg(0)
  }, [activeVar?.id])

  useEffect(() => {
    if (!product) {
      setCanReview(false)
      setReviewCheckLoading(true)
      return
    }

    const savedPhone = readAccountPhone().replace(/\D/g, '').slice(-10)
    if (savedPhone.length !== 10) {
      setCanReview(false)
      setReviewCheckLoading(false)
      return
    }

    let active = true
    setReviewCheckLoading(true)
    void fetch(`/api/orders?phone=${savedPhone}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return
        const purchased = Array.isArray(data) && data.some((order: any) =>
          order?.status !== 'cancelled' &&
          Array.isArray(order?.items) &&
          order.items.some((item: any) =>
            item.product_id === product.id ||
            item.product_slug === product.slug ||
            item.product_name === product.name
          )
        )
        setCanReview(purchased)
      })
      .catch(() => {
        if (!active) return
        setCanReview(false)
      })
      .finally(() => {
        if (active) setReviewCheckLoading(false)
      })

    return () => {
      active = false
    }
  }, [product])

  useEffect(() => {
    const pincode = deliveryPincode.trim()
    if (!/^\d{6}$/.test(pincode)) {
      setDeliveryCheck(null)
      setDeliveryLoading(false)
      return
    }

    let active = true
    setDeliveryLoading(true)
    void fetch(`/api/shipping/serviceability?pincode=${pincode}&grams=${grams}&cod=1`)
      .then(res => res.json())
      .then(data => {
        if (!active) return
        setDeliveryCheck(data)
      })
      .catch(() => {
        if (!active) return
        setDeliveryCheck(null)
      })
      .finally(() => {
        if (active) setDeliveryLoading(false)
      })

    return () => {
      active = false
    }
  }, [deliveryPincode, grams])

  if (loading) return <ProductSkeleton />
  if (!product) return <div className="section text-center text-ink-3">Product not found. <Link href="/products">Browse all products →</Link></div>

  const galleryImages = activeVar?.images?.length ? activeVar.images : product.images
  const basePrice = activeVar?.price || product.price
  const livePrice = Math.round((basePrice / 500) * grams)
  const sliderMax = unit === 'kg' ? 5 : 1000
  const sliderMin = unit === 'kg' ? 0.5 : 100
  const sliderStep = unit === 'kg' ? 0.5 : 50
  const sliderVal = unit === 'kg' ? grams / 1000 : grams
  const sliderPct = ((sliderVal - sliderMin) / (sliderMax - sliderMin)) * 100

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image: galleryImages?.[0] || '',
      variant_id: activeVar?.id,
      variant_name: activeVar?.name,
      weight_grams: grams,
      price: livePrice,
      quantity: 1,
    })
    showToast(`✦ ${product.name} added!`)
  }

  const inCart = cartItems.some(i => i.product_id === product.id && i.weight_grams === grams)

  const QUALITY_TAGS: Record<string, { label: string; cls: string }> = {
    best:    { label: 'Best Quality', cls: 'bg-green text-ivory' },
    popular: { label: 'Most Selling', cls: 'bg-terra text-white' },
    basic:   { label: 'Basic',        cls: 'bg-ivory-3 text-ink-2' },
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="px-[5%] py-3 flex gap-1.5 text-[.68rem] text-ink-4">
        <Link href="/" className="hover:text-green transition-colors">Home</Link>
        <span>›</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-green transition-colors capitalize">{product.category.replace('-', ' ')}</Link>
        <span>›</span>
        <span className="text-ink-3">{product.name}</span>
      </div>

      <div className="px-[5%] py-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-[1400px] mx-auto">
        {/* Gallery */}
        <div className="lg:sticky lg:top-20">
          <div className="rounded-xl overflow-hidden border border-ivory-3 bg-ivory-2 mb-3 shadow-soft">
            {galleryImages?.[activeImg] ? (
              <Image src={galleryImages[activeImg]} alt={product.name} width={700} height={700} className="object-cover w-full aspect-square" priority />
            ) : (
              <div className="w-full aspect-square bg-ivory-2 flex items-center justify-center text-ink-4">No image</div>
            )}
          </div>
          {galleryImages && galleryImages.length > 1 && (
            <div className="flex gap-2.5">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-[68px] h-[68px] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${activeImg === i ? 'border-green' : 'border-transparent hover:border-green-4'}`}
                >
                  <Image src={img} alt="" width={68} height={68} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Badges */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {product.tags?.includes('bestseller') && <span className="text-[.52rem] tracking-wide uppercase px-2 py-0.5 bg-terra text-white rounded-sm font-medium">Bestseller</span>}
            {product.tags?.includes('organic') && <span className="text-[.52rem] tracking-wide uppercase px-2 py-0.5 bg-green text-ivory rounded-sm font-medium">Organic</span>}
          </div>

          {product.vendor && <div className="text-[.6rem] tracking-[.18em] uppercase text-ink-4 mb-2">{product.vendor}</div>}
          <h1 className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] text-ink font-light leading-tight mb-2 tracking-tight">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-terra text-base">★★★★★</span>
            <span className="text-sm font-medium text-ink">4.9</span>
            <span className="text-sm text-green-3 underline cursor-pointer">See reviews</span>
          </div>

          <p className="text-[.88rem] text-ink-3 leading-[1.85] mb-5 pb-5 border-b border-ivory-3">{product.description}</p>

          {/* Variants */}
          {product.variants && product.variants.length > 1 && (
            <div className="mb-5">
              <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-3">Select Variety</div>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v: Variant) => {
                  const qt = v.quality_tag ? QUALITY_TAGS[v.quality_tag] : null
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveVar(v)}
                      className={`border rounded-lg p-3 text-left cursor-pointer transition-all ${activeVar?.id === v.id ? 'border-green bg-green-6' : 'border-ivory-3 bg-white hover:border-green-4'}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-sm font-medium text-ink">{v.name}</div>
                        {qt && <span className={`text-[.5rem] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-sm ${qt.cls}`}>{qt.label}</span>}
                      </div>
                      {v.description && <div className="text-[.65rem] text-ink-4">{v.description}</div>}
                      <div className="font-serif text-base text-green mt-1">{formatPrice(v.price)}/500g</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Slider */}
          <div className="mb-5">
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-3">Select Quantity</div>
            <div className="bg-ivory-2 border border-ivory-3 rounded-xl p-4">
              {/* Unit toggle */}
              <div className="flex border border-ivory-3 rounded-md overflow-hidden w-fit mb-4 bg-white">
                {(['g', 'kg'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      setUnit(u)
                      if (u === 'kg') setGrams(Math.max(500, Math.round(grams / 500) * 500))
                    }}
                    className={`px-4 py-1.5 text-xs border-none cursor-pointer font-sans transition-all ${unit === u ? 'bg-green text-ivory font-medium' : 'bg-transparent text-ink-3'}`}
                  >
                    {u === 'g' ? 'Grams' : 'Kilograms'}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={sliderVal}
                onChange={e => {
                  const v = parseFloat(e.target.value)
                  setGrams(unit === 'kg' ? Math.round(v * 1000) : Math.round(v))
                }}
                className="w-full mb-1"
                style={{ background: `linear-gradient(to right,var(--green3) ${Math.max(0, Math.min(100, sliderPct))}%,var(--ivory3) ${Math.max(0, Math.min(100, sliderPct))}%)` }}
              />
              <div className="relative h-5 text-[.56rem] text-ink-4 mb-3 mt-2">
                {unit === 'g' ? (
                  <>
                    <span className="absolute left-0">100g</span>
                    <span className="absolute font-medium text-ink -translate-x-1/2" style={{ left: '16.6%' }}>250g</span>
                    <span className="absolute font-medium text-ink -translate-x-1/2" style={{ left: '44.4%' }}>500g</span>
                    <span className="absolute font-medium text-ink right-0">1kg</span>
                  </>
                ) : (
                  <>
                    <span className="absolute left-0">0.5kg</span>
                    <span className="absolute font-medium text-ink -translate-x-1/2" style={{ left: '11.1%' }}>1kg</span>
                    <span className="absolute font-medium text-ink -translate-x-1/2" style={{ left: '33.3%' }}>2kg</span>
                    <span className="absolute text-ink-4 -translate-x-1/2" style={{ left: '66.6%' }}>3.5kg</span>
                    <span className="absolute right-0">5kg</span>
                  </>
                )}
              </div>

              {/* Input + Live price */}
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="number"
                  value={unit === 'kg' ? (grams / 1000).toFixed(1) : grams}
                  min={sliderMin}
                  max={sliderMax}
                  step={sliderStep}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0
                    setGrams(unit === 'kg' ? Math.round(v * 1000) : Math.round(v))
                  }}
                  className="w-24 text-center px-3 py-2 border border-ivory-3 rounded-md font-sans text-sm text-ink bg-white outline-none focus:border-green-3"
                />
                <span className="text-sm text-ink-3">{unit}</span>
                <div className="ml-auto text-right">
                  <div className="font-serif text-2xl text-green leading-none">{formatPrice(livePrice)}</div>
                  <div className="text-[.7rem] text-ink-4 mt-0.5">for {formatWeight(grams)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Note */}
          <div className="bg-white border-2 border-dashed border-green-4 rounded-lg p-4 mb-5 text-center shadow-sm">
            <div className="text-sm font-bold text-green tracking-wide">🏷 Got a discount code?</div>
            <div className="text-xs text-ink-3 mt-1.5 font-medium">You can apply your coupon code securely at checkout.</div>
          </div>

          <div className="bg-white border border-ivory-3 rounded-xl p-4 mb-5">
            <div className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mb-3">Check Estimated Delivery Date</div>
            <div className="flex gap-2 flex-wrap">
              <input
                value={deliveryPincode}
                onChange={e => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter pincode"
                className="input max-w-[220px]"
              />
              <div className="text-xs text-ink-4 self-center">Estimate for {formatWeight(grams)}</div>
            </div>
            {deliveryLoading ? (
              <div className="mt-3 text-sm text-ink-3">Checking estimated delivery date...</div>
            ) : deliveryCheck ? (
              <div className={`mt-3 rounded-lg border px-3 py-3 text-sm ${deliveryCheck.serviceable ? 'border-green-5 bg-green-6 text-green-2' : 'border-terra/30 bg-[#fff1eb] text-terra'}`}>
                <div className="font-medium">
                  {deliveryCheck.serviceable ? 'Delivery available on this pincode' : deliveryCheck.configured ? 'Delivery not available yet' : 'NimbusPost check not configured'}
                </div>
                {deliveryCheck.serviceable && (
                  <div className="mt-1 text-xs">
                    Expected by {deliveryCheck.estimatedDeliveryDate
                      ? new Date(deliveryCheck.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : 'soon'}
                  </div>
                )}
                {!deliveryCheck.serviceable && deliveryCheck.message && (
                  <div className="mt-1 text-xs">{deliveryCheck.message}</div>
                )}
              </div>
            ) : (
              <div className="mt-3 text-xs text-ink-4">Enter your pincode to check the estimated delivery date.</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-5 flex-wrap">
            {inCart ? (
              <Link href="/checkout" className="btn-primary flex-1 justify-center bg-green-2 border-green-2 hover:bg-green-3">
                <span>Proceed to Checkout</span>
              </Link>
            ) : (
              <button onClick={handleAddToCart} className="btn-primary flex-1 justify-center">
                <span>Add to Cart</span>
              </button>
            )}
            <button
              onClick={() => {
                const msg = `Hi Mana! I want to buy: ${product.name}${activeVar ? ` (${activeVar.name})` : ''} — ${formatWeight(grams)} for ${formatPrice(livePrice)}. Please confirm.`
                window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
              className="btn-outline flex-1 justify-center"
            >
              Buy via WhatsApp
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ['🌿', '100% Natural', 'No additives or preservatives'],
              ['🔬', 'Lab Tested', 'Every batch quality checked'],
              ['📦', 'Free Shipping', 'Orders above ₹999'],
              ['🔄', 'Easy Returns', '7-day return policy'],
            ].map(([ico, t, d]) => (
              <div key={t} className="bg-ivory-2 border border-ivory-3 rounded-lg p-3 flex items-center gap-2.5">
                <span className="text-base flex-shrink-0">{ico}</span>
                <div>
                  <div className="text-[.72rem] font-medium text-ink">{t}</div>
                  <div className="text-[.65rem] text-ink-3 leading-tight mt-0.5">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <ProductRecommendations 
        currentSlug={product.slug} 
        category={product.category} 
        grams={grams} 
      />

      <div className="px-[5%] pb-14 max-w-[1400px] mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-8 items-start">
          <ReviewList productSlug={product.slug} />
          {reviewCheckLoading ? (
            <div className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft">
              <div className="font-serif text-2xl text-ink mb-2">Write a review</div>
              <div className="text-sm text-ink-3">Checking whether this account has previously ordered the product...</div>
            </div>
          ) : canReview ? (
            <ReviewForm productId={product.id} productSlug={product.slug} productName={product.name} />
          ) : (
            <div className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft">
              <div className="font-serif text-2xl text-ink mb-2">Write a review</div>
              <div className="text-sm text-ink-3 leading-[1.8]">
                This section appears only for customers who have already ordered this product using their saved WhatsApp number on this device.
              </div>
              <div className="mt-4 rounded-lg border border-ivory-3 bg-ivory-2 px-4 py-3 text-sm text-ink-3 leading-[1.7]">
                If you have already purchased it, open your account first so this device remembers your number, then come back to this product page.
              </div>
              <Link href="/account" className="btn-outline no-underline inline-flex mt-5">
                Open My Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ProductSkeleton() {
  return (
    <div className="px-[5%] py-8 grid grid-cols-1 lg:grid-cols-2 gap-16 animate-pulse">
      <div className="aspect-square bg-ivory-3 rounded-xl" />
      <div className="space-y-4">
        <div className="h-6 bg-ivory-3 rounded w-3/4" />
        <div className="h-10 bg-ivory-3 rounded w-full" />
        <div className="h-4 bg-ivory-3 rounded w-1/2" />
        <div className="h-24 bg-ivory-3 rounded" />
        <div className="h-32 bg-ivory-3 rounded" />
      </div>
    </div>
  )
}
