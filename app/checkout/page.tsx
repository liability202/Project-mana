'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useCart, useCoupon } from '@/lib/store'
import { formatPrice, shippingCost, FREE_SHIPPING_THRESHOLD } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'

declare global { interface Window { Razorpay: any } }

type FormData = {
  name: string; phone: string; email: string
  address: string; city: string; state: string; pincode: string
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { code: couponCode, discount: couponDiscount, clear: clearCoupon } = useCoupon()
  const [form, setForm]       = useState<FormData>({ name:'', phone:'', email:'', address:'', city:'', state:'', pincode:'' })
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState<'details' | 'payment' | 'success'>('details')
  const [orderId, setOrderId] = useState('')

  const subtotal  = total()
  const shipping  = shippingCost(subtotal)
  const discount  = couponDiscount ? Math.round(subtotal * couponDiscount / 100) : 0
  const orderTotal = subtotal + shipping - discount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.name.trim()) { showToast('Please enter your name'); return false }
    if (!form.phone.trim() || form.phone.length < 10) { showToast('Please enter a valid phone number'); return false }
    if (!form.address.trim()) { showToast('Please enter your address'); return false }
    if (!form.city.trim()) { showToast('Please enter your city'); return false }
    if (!form.pincode.trim() || form.pincode.length < 6) { showToast('Please enter a valid pincode'); return false }
    return true
  }

  const loadRazorpay = () => new Promise<boolean>(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayment = async () => {
    if (!validate()) return
    if (items.length === 0) { showToast('Your cart is empty'); return }
    setLoading(true)

    try {
      // 1. Create Razorpay order on server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderTotal, currency: 'INR' }),
      })
      const { orderId: rzpOrderId, error } = await res.json()
      if (error) throw new Error(error)

      // 2. Load Razorpay
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Failed to load payment gateway')

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderTotal,
        currency: 'INR',
        name: 'Mana – The Essence of Nature',
        description: `Order for ${form.name}`,
        order_id: rzpOrderId,
        prefill: { name: form.name, contact: form.phone, email: form.email },
        theme: { color: '#1C3D2E' },
        handler: async (response: any) => {
          // 4. Verify + save order
          const saveRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: form.name,
              customer_phone: form.phone,
              customer_email: form.email,
              address: form.address,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
              items: items.map(i => ({
                product_id: i.product_id,
                product_name: i.product_name,
                variant_name: i.variant_name,
                quantity: i.quantity,
                weight_grams: i.weight_grams,
                price: i.price,
              })),
              subtotal,
              discount,
              shipping,
              total: orderTotal,
              coupon_code: couponCode || null,
              payment_id: response.razorpay_payment_id,
              razorpay_order_id: rzpOrderId,
              payment_status: 'paid',
              status: 'confirmed',
            }),
          })
          const { id } = await saveRes.json()
          setOrderId(id)
          clearCart()
          clearCoupon()
          setStep('success')
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    } catch (err: any) {
      showToast('Payment failed: ' + (err.message || 'Please try again'))
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-[5%] py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-6 border-2 border-green-4 flex items-center justify-center text-2xl text-green mx-auto mb-4">✓</div>
          <h1 className="font-serif text-2xl font-light text-ink mb-2">Order Placed!</h1>
          <p className="text-sm text-ink-3 mb-1">Order ID: <strong className="text-ink">{orderId.slice(0, 8).toUpperCase()}</strong></p>
          <p className="text-sm text-ink-3 mb-6">We'll confirm on WhatsApp shortly.</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi! My order ID is ${orderId.slice(0,8).toUpperCase()}. Please confirm.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary no-underline inline-flex mb-3"
          >
            <span>Confirm on WhatsApp</span>
          </a>
          <br />
          <a href="/" className="btn-outline no-underline inline-flex mt-2">Back to Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[5%] py-10 max-w-[1200px] mx-auto">
      <h1 className="font-serif text-2xl font-light text-ink mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

        {/* Left: Form */}
        <div className="bg-white border border-ivory-3 rounded-xl p-6 shadow-soft">
          <h2 className="font-serif text-lg font-normal text-ink mb-5">Delivery Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-3 block mb-1.5">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="input" />
            </div>
            <div>
              <label className="text-xs text-ink-3 block mb-1.5">WhatsApp Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" type="tel" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-ink-3 block mb-1.5">Email (optional)</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-ink-3 block mb-1.5">Full Address *</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="House/Flat no., Street, Area" className="input" />
            </div>
            <div>
              <label className="text-xs text-ink-3 block mb-1.5">City *</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="input" />
            </div>
            <div>
              <label className="text-xs text-ink-3 block mb-1.5">State</label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input" />
            </div>
            <div>
              <label className="text-xs text-ink-3 block mb-1.5">Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="110001" className="input" maxLength={6} />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-ivory-3">
            <h3 className="font-sans text-sm font-medium text-ink mb-3">Payment Method</h3>
            <div className="flex gap-3 flex-wrap">
              {['UPI / QR', 'Credit / Debit Card', 'Net Banking', 'COD'].map(m => (
                <div key={m} className="flex items-center gap-2 px-3 py-2 bg-green-6 border border-green-5 rounded-md text-sm text-green-2">
                  <span className="w-2 h-2 rounded-full bg-green block" />
                  {m}
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-4 mt-2">Secure payment powered by Razorpay</p>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft lg:sticky lg:top-20">
          <h2 className="font-serif text-lg font-normal text-ink mb-4">Order Summary</h2>

          <div className="flex flex-col gap-3 mb-4 max-h-56 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-ivory-2">
                  {item.product_image && <Image src={item.product_image} alt={item.product_name} width={56} height={56} className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink leading-tight">{item.product_name}</div>
                  {item.variant_name && <div className="text-xs text-ink-4">{item.variant_name}</div>}
                  <div className="text-xs text-ink-4">{item.weight_grams >= 1000 ? (item.weight_grams/1000).toFixed(1)+'kg' : item.weight_grams+'g'} × {item.quantity}</div>
                </div>
                <div className="text-sm font-serif text-green">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-ivory-3 pt-3 flex flex-col gap-2 mb-4">
            <div className="flex justify-between text-sm text-ink-3">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-3">
                <span>Discount ({couponCode})</span><span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink-3">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-3">Free</span> : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-medium text-ink border-t border-ivory-3 pt-2 mt-1">
              <span>Total</span>
              <span className="font-serif text-xl text-green">{formatPrice(orderTotal)}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading || items.length === 0}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            <span>{loading ? 'Processing…' : `Pay ${formatPrice(orderTotal)}`}</span>
          </button>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-ink-4">
            <span>🔒</span> Secured by Razorpay
          </div>
        </div>
      </div>
    </div>
  )
}
