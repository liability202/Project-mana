'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/lib/store'
import { formatPrice, shippingCost, FREE_SHIPPING_THRESHOLD } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'

declare global {
  interface Window {
    Cashfree: any
  }
}

type FormData = {
  name: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
}

type CouponState = {
  code: string
  discountAmount: number
  valid: boolean
}

type CustomerType = 'new' | 'returning' | null
type ShippingCheck = {
  configured: boolean
  serviceable: boolean | null
  estimatedDeliveryDate: string | null
  courierName: string | null
  availableCourierCount: number
  message?: string
}

const ACCOUNT_PHONE_KEY = 'mana_account_phone'
const COD_CHARGE = 4900 // ₹49 in paise
const SMALL_ORDER_FEE = 4900 // ₹49 in paise – charged on orders below free-shipping threshold

function rememberAccountPhone(phone: string) {
  localStorage.setItem(ACCOUNT_PHONE_KEY, phone)
  document.cookie = `${ACCOUNT_PHONE_KEY}=${phone}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
}

export default function CheckoutPage() {
  const { items, total, clearCart, hydrated } = useCart()
  const [form, setForm] = useState<FormData>({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'success'>('details')
  const [orderId, setOrderId] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponState, setCouponState] = useState<CouponState>({ code: '', discountAmount: 0, valid: false })
  const [couponLoading, setCouponLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletEligible, setWalletEligible] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [useCashback, setUseCashback] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpStatus, setOtpStatus] = useState<'unverified' | 'code-sent' | 'verified'>('unverified')
  const [otpLoading, setOtpLoading] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null)
  const [customerType, setCustomerType] = useState<CustomerType>(null)
  const [otpHint, setOtpHint] = useState('')
  const [shippingCheck, setShippingCheck] = useState<ShippingCheck | null>(null)
  const [shippingCheckLoading, setShippingCheckLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')

  const cartItems = hydrated ? items : []
  const subtotal = hydrated ? total() : 0
  const totalWeightGrams = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.weight_grams || 0) * Number(item.quantity || 1), 0) || 500,
    [cartItems]
  )
  const shipping = shippingCost(subtotal)
  const discount = couponState.discountAmount
  const codCharge = paymentMethod === 'cod' ? COD_CHARGE : 0
  const smallOrderFee = subtotal < FREE_SHIPPING_THRESHOLD ? SMALL_ORDER_FEE : 0
  const walletApplied = useCashback ? Math.min(walletBalance, Math.max(0, subtotal - discount)) : 0
  const orderTotal = Math.max(0, subtotal + shipping + codCharge + smallOrderFee - discount - walletApplied)
  const cashbackPreview = Math.round((orderTotal * 5) / 100)

  const normalizedPhone = useMemo(() => form.phone.replace(/\D/g, ''), [form.phone])
  const isPhoneVerified = otpStatus === 'verified' && verifiedPhone === normalizedPhone
  const loyaltyAutoApplied = customerType === 'returning' && couponState.code === 'LOYAL12' && couponState.valid

  useEffect(() => {
    if (normalizedPhone.length < 10) {
      setWalletBalance(0)
      setWalletEligible(false)
      setUseCashback(false)
      return
    }

    let active = true
    setWalletLoading(true)
    void fetch(`/api/wallet?phone=${normalizedPhone}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return
        setWalletBalance(data.balance || 0)
        setWalletEligible(Boolean(data.is_cashback_eligible))
      })
      .catch(() => {
        if (!active) return
        setWalletBalance(0)
        setWalletEligible(false)
      })
      .finally(() => {
        if (active) setWalletLoading(false)
      })

    return () => {
      active = false
    }
  }, [normalizedPhone])

  useEffect(() => {
    if (!verifiedPhone) return
    if (normalizedPhone === verifiedPhone) return

    setOtpStatus('unverified')
    setOtpCode('')
    setVerifiedPhone('')
    setVerifiedUserId(null)
    setCustomerType(null)
    setOtpHint('')
    setCouponInput('')
    setCouponState({ code: '', discountAmount: 0, valid: false })
  }, [normalizedPhone, verifiedPhone])

  useEffect(() => {
    const pincode = form.pincode.trim()
    if (!/^\d{6}$/.test(pincode)) {
      setShippingCheck(null)
      setShippingCheckLoading(false)
      return
    }

    let active = true
    setShippingCheckLoading(true)
    void fetch(`/api/shipping/serviceability?pincode=${pincode}&grams=${totalWeightGrams}&cod=1`)
      .then(res => res.json())
      .then(data => {
        if (!active) return
        setShippingCheck(data)
      })
      .catch(() => {
        if (!active) return
        setShippingCheck(null)
      })
      .finally(() => {
        if (active) setShippingCheckLoading(false)
      })

    return () => {
      active = false
    }
  }, [form.pincode, totalWeightGrams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const applyCouponCode = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      showToast('Enter a coupon code')
      return false
    }

    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, subtotal, phone: normalizedPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Invalid coupon')

      setCouponInput(data.coupon.code)
      setCouponState({
        code: data.coupon.code,
        discountAmount: data.discount_amount || 0,
        valid: true,
      })
      if (data.customer_type) setCustomerType(data.customer_type)
      showToast(`Coupon ${data.coupon.code} applied`)
      return true
    } catch (err: any) {
      setCouponState({ code: '', discountAmount: 0, valid: false })
      showToast(err.message || 'Invalid coupon')
      return false
    } finally {
      setCouponLoading(false)
    }
  }

  const fetchCustomerType = async () => {
    const res = await fetch(`/api/orders?phone=${normalizedPhone}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Could not check order history')
    const hasPreviousOrders = Array.isArray(data) && data.length > 0
    return hasPreviousOrders ? 'returning' : 'new'
  }

  const sendOtp = async () => {
    if (normalizedPhone.length !== 10) {
      showToast('Enter a valid 10-digit phone number')
      return
    }

    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: form.name,
          email: form.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not send OTP')

      setOtpStatus('code-sent')
      setOtpCode('')
      const channelLabel = Array.isArray(data.channels) && data.channels.length > 0
        ? data.channels.join(' + ')
        : 'your phone'
      const hint = data.dev_otp ? `Test OTP: ${data.dev_otp}` : `OTP sent via ${channelLabel}`
      setOtpHint(hint)
      showToast(hint)
    } catch (err: any) {
      showToast(err.message || 'Could not send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (normalizedPhone.length !== 10) {
      showToast('Enter a valid 10-digit phone number')
      return
    }
    if (otpCode.trim().length < 4) {
      showToast('Enter the OTP you received')
      return
    }

    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otpCode.trim(),
          name: form.name,
          email: form.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'OTP verification failed')

      setOtpStatus('verified')
      setVerifiedPhone(normalizedPhone)
      setVerifiedUserId(data.user_id || null)
      setOtpHint('')
      rememberAccountPhone(normalizedPhone)

      if (data.latest_order) {
        setForm(prev => ({
          ...prev,
          name: prev.name || data.latest_order.customer_name || '',
          email: prev.email || data.latest_order.customer_email || '',
          address: prev.address || data.latest_order.address || '',
          city: prev.city || data.latest_order.city || '',
          state: prev.state || data.latest_order.state || '',
          pincode: prev.pincode || data.latest_order.pincode || '',
        }))
      }

      const nextCustomerType = data.customer_type || await fetchCustomerType()
      setCustomerType(nextCustomerType)

      if (nextCustomerType === 'returning') {
        await applyCouponCode('LOYAL12')
      } else {
        setCouponInput('')
        setCouponState({ code: '', discountAmount: 0, valid: false })
      }

      showToast(nextCustomerType === 'returning' ? 'Phone verified. Welcome back! Your details are auto-filled.' : 'Phone verified. You can now add your influencer code.')
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  const validate = () => {
    if (!form.name.trim()) { showToast('Please enter your name'); return false }
    if (!normalizedPhone || normalizedPhone.length < 10) { showToast('Please enter a valid phone number'); return false }
    if (!isPhoneVerified) { showToast('Please verify your phone with OTP before checkout'); return false }
    if (!form.address.trim()) { showToast('Please enter your address'); return false }
    if (!form.city.trim()) { showToast('Please enter your city'); return false }
    if (!form.pincode.trim() || form.pincode.length < 6) { showToast('Please enter a valid pincode'); return false }
    if (shippingCheck?.serviceable === false) { showToast('Delivery is not available on this pincode yet'); return false }
    return true
  }

  const applyCoupon = async () => {
    if (!isPhoneVerified) {
      showToast('Verify your phone first to unlock influencer or loyalty discounts')
      return
    }
    await applyCouponCode(couponInput)
  }

  const clearCoupon = () => {
    if (loyaltyAutoApplied) return
    setCouponInput('')
    setCouponState({ code: '', discountAmount: 0, valid: false })
  }

  const loadCashfree = () => new Promise<boolean>(resolve => {
    if (window.Cashfree) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayment = async () => {
    if (!validate()) return
    if (cartItems.length === 0) { showToast('Your cart is empty'); return }
    setLoading(true)

    try {
      const gatewayOrderId = `mana_${Date.now()}`
      const res = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderTotal,
          orderId: gatewayOrderId,
          customerId: verifiedUserId || normalizedPhone,
          name: form.name,
          email: form.email,
          phone: normalizedPhone,
          returnUrl: `${window.location.origin}/checkout?cf_order_id={order_id}`,
          orderNote: `Mana order for ${form.name}`,
        }),
      })
      const { orderId: cashfreeOrderId, paymentSessionId, error } = await res.json()
      if (error) throw new Error(error)

      const loaded = await loadCashfree()
      if (!loaded) throw new Error('Failed to load payment gateway')

      const cashfree = window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      })

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      })

      const verificationRes = await fetch('/api/cashfree/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: cashfreeOrderId }),
      })

      const verification = await verificationRes.json()
      if (!verificationRes.ok) throw new Error(verification?.error || 'Could not verify payment')
      if (!verification.isPaid) throw new Error('Payment was not completed')

      const saveRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: normalizedPhone,
          customer_email: form.email,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          user_id: verifiedUserId,
          items: cartItems.map(i => ({
            product_id: i.product_id,
            product_name: i.product_name,
            variant_name: i.variant_name,
            quantity: i.quantity,
            weight_grams: i.weight_grams,
            price: i.price,
          })),
          subtotal,
          shipping,
          coupon_code: couponState.code || null,
          wallet_amount: walletApplied,
          cod_charge: 0,
          small_order_fee: smallOrderFee,
          payment_id: verification.paymentId,
          cashfree_order_id: verification.orderId,
          payment_status: 'paid',
          status: 'confirmed',
          notes: `Cashfree order ${verification.orderId}`,
        }),
      })

      const data = await saveRes.json()
      if (!saveRes.ok) throw new Error(data?.error || 'Could not save order')

      setOrderId(data.id)
      clearCart()
      clearCoupon()
      setUseCashback(false)
      setStep('success')
    } catch (err: any) {
      showToast('Payment failed: ' + (err.message || 'Please try again'))
      setLoading(false)
    }
  }

  const handleCashOnDelivery = async () => {
    if (!validate()) return
    if (cartItems.length === 0) { showToast('Your cart is empty'); return }
    setLoading(true)

    try {
      const saveRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: normalizedPhone,
          customer_email: form.email,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          user_id: verifiedUserId,
          items: cartItems.map(i => ({
            product_id: i.product_id,
            product_name: i.product_name,
            variant_name: i.variant_name,
            quantity: i.quantity,
            weight_grams: i.weight_grams,
            price: i.price,
          })),
          subtotal,
          shipping,
          cod_charge: COD_CHARGE,
          small_order_fee: smallOrderFee,
          coupon_code: couponState.code || null,
          wallet_amount: walletApplied,
          payment_status: 'pending',
          status: 'pending',
          notes: 'Cash on Delivery',
        }),
      })

      const data = await saveRes.json()
      if (!saveRes.ok) throw new Error(data?.error || 'Could not save COD order')

      setOrderId(data.id)
      clearCart()
      clearCoupon()
      setUseCashback(false)
      setStep('success')
    } catch (err: any) {
      showToast(err.message || 'Could not place COD order')
    } finally {
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
          <p className="text-sm text-ink-3 mb-2">We&apos;ll confirm on WhatsApp shortly.</p>
          {cashbackPreview > 0 && <p className="text-sm text-green-3 mb-6">You will earn {formatPrice(cashbackPreview)} cashback to your wallet after delivery.</p>}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi! My order ID is ${orderId.slice(0, 8).toUpperCase()}. Please confirm.`}
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
              <div className="mt-2 rounded-lg border border-ivory-3 bg-ivory-2 p-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  {otpStatus === 'verified' ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-6 border border-green-5 rounded-lg text-green-2 w-full font-medium">
                      <span className="text-lg leading-none">✓</span> Verified
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading || normalizedPhone.length !== 10}
                      className="btn-outline justify-center disabled:opacity-50 w-full"
                    >
                      <span>{otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-4">
                  {isPhoneVerified
                    ? customerType === 'returning'
                      ? 'Verified returning customer. Your LOYAL12 discount is auto-applied.'
                      : 'Verified new customer. You can enter an influencer code below for 10% off.'
                    : 'Verify your phone first. We will create your account automatically after OTP verification.'}
                </p>
                {otpHint && !isPhoneVerified && (
                  <p className="mt-1 text-xs text-green-3">{otpHint}</p>
                )}
              </div>
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
              {shippingCheckLoading ? (
                <div className="mt-2 text-xs text-ink-4">Checking delivery availability...</div>
              ) : shippingCheck ? (
                <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${shippingCheck.serviceable ? 'border-green-5 bg-green-6 text-green-2' : 'border-terra/30 bg-[#fff1eb] text-terra'}`}>
                  <div className="font-medium">
                    {shippingCheck.serviceable ? 'Delivery available' : shippingCheck.configured ? 'Delivery unavailable' : 'NimbusPost check not configured'}
                  </div>
                  {shippingCheck.serviceable && (
                    <div className="mt-1">
                      Expected by {shippingCheck.estimatedDeliveryDate
                        ? new Date(shippingCheck.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : 'soon'}
                    </div>
                  )}
                  {!shippingCheck.serviceable && shippingCheck.message && <div className="mt-1">{shippingCheck.message}</div>}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-ivory-3 space-y-5">
            <div>
              <h3 className="font-sans text-sm font-medium text-ink mb-3">Discounts</h3>
              {customerType === 'returning' && isPhoneVerified ? (
                <div className="rounded-lg border border-green-5 bg-green-6 px-4 py-3 text-sm text-green-2">
                  <div className="font-medium text-green">LOYAL12 auto-filled for your repeat order.</div>
                  <div className="mt-1 text-green-2">You save {formatPrice(couponState.discountAmount)} automatically on this checkout.</div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-ink-4 mb-2">
                    {isPhoneVerified
                      ? 'First order hai? Apna influencer code enter karke 10% discount le sakte ho.'
                      : 'Code abhi enter kar sakte ho. Apply karne ke liye phone verification zaroori rahega.'}
                  </p>
                  <div className="flex gap-2">
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="input" placeholder="Enter influencer code" />
                    <button type="button" onClick={applyCoupon} disabled={couponLoading} className="btn-primary justify-center px-5">
                      <span>{couponLoading ? 'Checking...' : 'Apply'}</span>
                    </button>
                  </div>
                  {couponState.valid && (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-green-5 bg-green-6 px-3 py-2 text-sm text-green-2">
                      <span>{couponState.code} applied. You saved {formatPrice(couponState.discountAmount)}.</span>
                      <button type="button" onClick={clearCoupon} className="text-xs underline bg-transparent border-none cursor-pointer">Remove</button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <h3 className="font-sans text-sm font-medium text-ink mb-3">Cashback Wallet</h3>
              <div className="rounded-xl border border-ivory-3 bg-ivory-2 p-4">
                {normalizedPhone.length < 10 ? (
                  <p className="text-sm text-ink-3">Enter your WhatsApp number to check wallet balance and cashback eligibility.</p>
                ) : walletLoading ? (
                  <p className="text-sm text-ink-3">Loading wallet...</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-3">Wallet Balance</span>
                      <span className="font-serif text-lg text-green">{formatPrice(walletBalance)}</span>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCashback}
                        onChange={e => setUseCashback(e.target.checked)}
                        disabled={walletBalance <= 0}
                        className="h-4 w-4 accent-[var(--green)]"
                      />
                      Use cashback on this order
                    </label>
                    {useCashback && walletApplied > 0 && (
                      <div className="text-sm text-green-3">Using {formatPrice(walletApplied)} from wallet.</div>
                    )}
                    <div className="text-xs text-ink-4">
                      You earn 5% cashback on every order.
                      <br/>You will get {formatPrice(cashbackPreview)} credited to your wallet once this order is delivered.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-sans text-sm font-medium text-ink mb-3">Payment Method</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'bg-green-6 border-green-4 text-green shadow-sm'
                      : 'bg-ivory-2 border-ivory-3 text-ink-3 hover:border-green-5'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full block ${paymentMethod === 'online' ? 'bg-green' : 'bg-ink-4'}`} />
                  Online Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'bg-green-6 border-green-4 text-green shadow-sm'
                      : 'bg-ivory-2 border-ivory-3 text-ink-3 hover:border-green-5'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full block ${paymentMethod === 'cod' ? 'bg-green' : 'bg-ink-4'}`} />
                  Cash on Delivery
                </button>
              </div>
              {paymentMethod === 'cod' && (
                <p className="text-xs text-terra mt-2">₹49 COD charge will be added to your order.</p>
              )}
              <p className="text-xs text-ink-4 mt-2">Secure payment powered by Cashfree</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft lg:sticky lg:top-20">
          <h2 className="font-serif text-lg font-normal text-ink mb-4">Order Summary</h2>

          <div className="flex flex-col gap-3 mb-4 max-h-56 overflow-y-auto">
            {cartItems.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-ivory-2">
                  {item.product_image && <Image src={item.product_image} alt={item.product_name} width={56} height={56} className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink leading-tight">{item.product_name}</div>
                  {item.variant_name && <div className="text-xs text-ink-4">{item.variant_name}</div>}
                  <div className="text-xs text-ink-4">{item.weight_grams >= 1000 ? (item.weight_grams / 1000).toFixed(1) + 'kg' : item.weight_grams + 'g'} × {item.quantity}</div>
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
                <span>Discount ({couponState.code})</span><span>-{formatPrice(discount)}</span>
              </div>
            )}
            {walletApplied > 0 && (
              <div className="flex justify-between text-sm text-green-3">
                <span>Wallet Cashback</span><span>-{formatPrice(walletApplied)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink-3">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-3">Free</span> : formatPrice(shipping)}</span>
            </div>
            {codCharge > 0 && (
              <div className="flex justify-between text-sm text-ink-3">
                <span>COD Charge</span><span>{formatPrice(codCharge)}</span>
              </div>
            )}
            {smallOrderFee > 0 && (
              <div className="flex justify-between text-sm text-ink-3">
                <span>Handling Fee</span><span>{formatPrice(smallOrderFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-ink border-t border-ivory-3 pt-2 mt-1">
              <span>Total</span>
              <span className="font-serif text-xl text-green">{formatPrice(orderTotal)}</span>
            </div>
            <div className="text-xs text-ink-4">
              Cashback preview: {formatPrice(cashbackPreview)}
            </div>
            {shippingCheck?.serviceable && (
              <div className="text-xs text-green-3">
                Expected delivery: {shippingCheck.estimatedDeliveryDate
                  ? new Date(shippingCheck.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Will be confirmed soon'}
              </div>
            )}
            {shippingCheck?.serviceable === false && (
              <div className="text-xs text-terra">
                This pincode is currently not serviceable for delivery.
              </div>
            )}
          </div>

          {paymentMethod === 'online' ? (
            <button onClick={handlePayment} disabled={loading || cartItems.length === 0} className="btn-primary w-full justify-center disabled:opacity-50">
              <span>{loading ? 'Processing...' : `Pay ${formatPrice(orderTotal)}`}</span>
            </button>
          ) : (
            <button
              onClick={handleCashOnDelivery}
              disabled={loading || cartItems.length === 0}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : `Place COD Order · ${formatPrice(orderTotal)}`}</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-ink-4">
            <span>🔒</span> Secured by Cashfree
          </div>
        </div>
      </div>

      {otpStatus === 'code-sent' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] p-6 relative">
            <button 
              onClick={() => setOtpStatus('unverified')} 
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-ivory-2 text-ink-3 hover:text-ink hover:bg-ivory-3 transition-colors border-none cursor-pointer"
            >
              ✕
            </button>
            <h3 className="font-serif text-xl mb-1 text-ink text-center">OTP Verification</h3>
            <p className="text-sm text-ink-3 text-center mb-6">
              Code sent to <strong className="text-ink font-medium">+91 {normalizedPhone}</strong>
            </p>
            
            <input
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="input w-full text-center tracking-[0.5em] text-2xl font-bold mb-4 py-3 placeholder:tracking-normal placeholder:font-normal placeholder:text-base outline-none focus:ring-2 focus:ring-green-4 border-2 border-ivory-3"
              inputMode="numeric"
              autoFocus
            />
            
            <button
              type="button"
              onClick={verifyOtp}
              disabled={otpLoading || otpCode.trim().length < 4}
              className="btn-primary w-full justify-center py-3.5 disabled:opacity-50 shadow-md shadow-green/20"
            >
              <span>{otpLoading ? 'Verifying...' : 'Verify Code'}</span>
            </button>
            
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={sendOtp} 
                disabled={otpLoading}
                className="text-xs font-medium text-green-3 hover:text-green-2 underline bg-transparent border-none cursor-pointer p-0"
              >
                Didn't receive it? Resend
              </button>
            </div>
            
            {otpHint && (
              <div className="mt-5 p-3 rounded-lg bg-green-6 border border-green-5 text-xs text-center text-green-2">
                {otpHint}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
