'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import Image from 'next/image'
import { useCart } from '@/lib/store'
import { formatPrice, shippingCost, FREE_SHIPPING_THRESHOLD } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'

declare global {
  interface Window {
    Razorpay: any
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
  free_shipping?: boolean
  free_cod?: boolean
  free_handling?: boolean
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
const COD_CHARGE = 2900 // ₹29 in paise
const SMALL_ORDER_FEE = 1900 // ₹19 in paise – charged on orders below ₹500

function rememberAccountPhone(phone: string) {
  localStorage.setItem(ACCOUNT_PHONE_KEY, phone)
  document.cookie = `${ACCOUNT_PHONE_KEY}=${phone}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
}

export default function CheckoutPage() {
  const { items, total, clearCart, hydrated, updateQty, removeItem } = useCart()
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
  const [siteSettings, setSiteSettings] = useState({ enable_cashback_earning: true, enable_cashback_spending: true })
  const [pincodeLoading, setPincodeLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' }).then(res => res.json()).then(data => setSiteSettings(data)).catch(() => {})
  }, [])

  useEffect(() => {
    let rememberedPhone = ''
    try {
      rememberedPhone = localStorage.getItem(ACCOUNT_PHONE_KEY) || document.cookie.split('; ').find((row) => row.startsWith(`${ACCOUNT_PHONE_KEY}=`))?.split('=')[1] || ''
    } catch(e) {}

    try {
      const refCookie = document.cookie.split('; ').find((row) => row.startsWith('mana_ref='))?.split('=')[1]
      if (refCookie && !couponState.valid) {
        setCouponInput(refCookie)
      }
    } catch(e) {}

    const normalized = rememberedPhone.replace(/\D/g, '').slice(-10)

    if (normalized.length === 10) {
      setForm(prev => ({ ...prev, phone: normalized }))
      setVerifiedPhone(normalized)
      setOtpStatus('verified')
      
      fetch(`/api/orders?phone=${normalized}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0]
            setForm(prev => ({
              ...prev,
              phone: normalized,
              name: prev.name || latest.customer_name || '',
              email: prev.email || latest.customer_email || '',
              address: prev.address || latest.address || '',
              city: prev.city || latest.city || '',
              state: prev.state || latest.state || '',
              pincode: prev.pincode || latest.pincode || '',
            }))
            setCustomerType('returning')
          } else {
            setCustomerType('new')
          }
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (form.pincode.length === 6) {
      setPincodeLoading(true)
      fetch(`https://api.postalpincode.in/pincode/${form.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0]?.Status === 'Success') {
            const postOffice = data[0].PostOffice[0]
            if (postOffice) {
              setForm(prev => ({
                ...prev,
                city: postOffice.District || postOffice.Region || prev.city || '',
                state: postOffice.State || prev.state || ''
              }))
            }
          }
        })
        .catch(() => {})
        .finally(() => setPincodeLoading(false))
    } else {
      setPincodeLoading(false)
    }
  }, [form.pincode])

  const cartItems = hydrated ? items : []
  const subtotal = hydrated ? total() : 0
  const totalWeightGrams = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.weight_grams || 0) * Number(item.quantity || 1), 0) || 500,
    [cartItems]
  )
  const rawShipping = shippingCost(subtotal, form.city)
  const shipping = couponState.free_shipping ? 0 : rawShipping
  const discount = couponState.discountAmount
  const rawCodCharge = paymentMethod === 'cod' ? COD_CHARGE : 0
  const codCharge = couponState.free_cod ? 0 : rawCodCharge
  const rawSmallOrderFee = subtotal < 50000 ? SMALL_ORDER_FEE : 0
  const smallOrderFee = couponState.free_handling ? 0 : rawSmallOrderFee
  const walletApplied = (useCashback && siteSettings.enable_cashback_spending) ? Math.min(walletBalance, Math.max(0, subtotal - discount)) : 0
  const orderTotal = Math.max(0, subtotal + shipping + codCharge + smallOrderFee - discount - walletApplied)
  const cashbackPreview = siteSettings.enable_cashback_earning ? Math.round((orderTotal * 5) / 100) : 0

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

    if (!form.city || !form.state) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (active && data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
             setForm(prev => ({
               ...prev,
               city: prev.city || data[0].PostOffice[0].District,
               state: prev.state || data[0].PostOffice[0].State
             }))
          }
        })
        .catch(() => {})
    }

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
  }, [form.pincode, totalWeightGrams, form.city, form.state])

  const sendOtp = async () => {
    if (normalizedPhone.length !== 10) {
      showToast('Enter a valid 10-digit number')
      return
    }
    setOtpLoading(true)
    setOtpCode('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send OTP')
      setOtpStatus('code-sent')
      setOtpHint('OTP sent via WhatsApp')
      showToast('OTP sent successfully')
    } catch (err: any) {
      showToast(err.message || 'Could not send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (otpCode.trim().length < 4) {
      showToast('Enter the OTP received')
      return
    }
    setOtpLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, otp: otpCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Invalid OTP')
      setOtpStatus('verified')
      setVerifiedPhone(normalizedPhone)
      setVerifiedUserId(data.user_id || null)
      showToast('Phone number verified successfully!')
      
      const ordersRes = await fetch(`/api/orders?phone=${normalizedPhone}`).then(r => r.json())
      if (Array.isArray(ordersRes) && ordersRes.length > 0) {
        const latest = ordersRes[0]
        setForm(prev => ({
          ...prev,
          name: prev.name || latest.customer_name || '',
          email: prev.email || latest.customer_email || '',
          address: prev.address || latest.address || '',
          city: prev.city || latest.city || '',
          state: prev.state || latest.state || '',
          pincode: prev.pincode || latest.pincode || '',
        }))
        setCustomerType('returning')
        rememberAccountPhone(normalizedPhone)
        
        const autoCoupon = 'LOYAL12'
        const cpRes = await fetch(`/api/coupons/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: autoCoupon, subtotal, phone: normalizedPhone, isReturning: true })
        })
        const cpData = await cpRes.json()
        if (cpRes.ok && cpData.valid) {
          setCouponState({
            code: autoCoupon,
            discountAmount: cpData.discount_amount,
            valid: true,
            free_shipping: cpData.free_shipping,
            free_cod: cpData.free_cod,
            free_handling: cpData.free_handling,
          })
          showToast('LOYAL12 coupon applied automatically!')
        }
      } else {
        setCustomerType('new')
        rememberAccountPhone(normalizedPhone)
      }
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    if (!isPhoneVerified) {
      showToast('Please verify your phone number first')
      return
    }
    setCouponLoading(true)
    try {
      const res = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, phone: normalizedPhone, isReturning: customerType === 'returning' })
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'Invalid coupon code')
      }
      setCouponState({
        code,
        discountAmount: data.discount_amount,
        valid: true,
        free_shipping: data.free_shipping,
        free_cod: data.free_cod,
        free_handling: data.free_handling,
      })
      showToast('Coupon code applied!')
    } catch (err: any) {
      showToast(err.message || 'Could not apply coupon')
      setCouponState({ code: '', discountAmount: 0, valid: false })
    } finally {
      setCouponLoading(false)
    }
  }

  const clearCoupon = () => {
    setCouponState({ code: '', discountAmount: 0, valid: false })
    setCouponInput('')
    showToast('Coupon removed')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value,
    }))
  }

  const validate = () => {
    if (!form.name.trim()) { showToast('Name is required'); return false }
    if (normalizedPhone.length !== 10) { showToast('Valid 10-digit number is required'); return false }
    if (!isPhoneVerified) { showToast('Please verify your phone number'); return false }
    if (!form.address.trim()) { showToast('Address is required'); return false }
    if (!form.city.trim()) { showToast('City is required'); return false }
    if (!form.state.trim()) { showToast('State is required'); return false }
    if (!/^\d{6}$/.test(form.pincode)) { showToast('6-digit pincode is required'); return false }
    if (shippingCheck && shippingCheck.serviceable === false) {
      showToast('This pincode is currently not serviceable for delivery');
      return false
    }
    return true
  }

  // Dynamically loads the Razorpay checkout script if not already present.
  // Resolves when window.Razorpay is ready, rejects on load failure.
  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay === 'function') {
        resolve()
        return
      }
      const existing = document.getElementById('razorpay-checkout-js')
      if (existing) {
        // Script tag already in DOM but not yet executed — wait for it
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')))
        return
      }
      const script = document.createElement('script')
      script.id = 'razorpay-checkout-js'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Could not load Razorpay. Check your internet connection.'))
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    if (!validate()) return
    if (cartItems.length === 0) { showToast('Your cart is empty'); return }
    setLoading(true)

    try {
      // Ensure Razorpay SDK is loaded before proceeding
      await loadRazorpayScript()
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderTotal }),
      })
      const rzpOrder = await orderRes.json()
      if (!orderRes.ok) throw new Error(rzpOrder?.error || 'Could not create payment session')

      const options = {
        key: (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').replace(/"/g, ''),
        amount: rzpOrder.amount,
        currency: 'INR',
        name: 'Mana Dry Fruits',
        description: 'Order Payment',
        order_id: rzpOrder.orderId,
        prefill: {
          name: form.name,
          email: form.email || undefined,
          contact: '+91' + normalizedPhone,
        },
        theme: { color: '#1C3D2E' },
        handler: async function (response: any) {
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
                cod_charge: 0,
                small_order_fee: smallOrderFee,
                coupon_code: couponState.code || null,
                wallet_amount: walletApplied,
                payment_id: response.razorpay_payment_id,
                payment_status: 'paid',
                status: 'pending',
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
            showToast('Order saved with error: ' + (err.message || 'Please contact support'))
          } finally {
            setLoading(false)
          }
        }
      }

      const rzp1 = new window.Razorpay(options)
      rzp1.on('payment.failed', function (response: any) {
        showToast('Payment failed: ' + (response.error?.description || 'Please try again'))
        setLoading(false)
      })
      rzp1.open()

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
      <div className="min-h-[60vh] flex items-center justify-center px-[5%] py-16" style={{ background: 'rgb(var(--c-ivory))' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: 'rgba(var(--c-green5), 0.1)', border: '2px solid var(--green)', color: 'var(--green)' }}>✓</div>
          <h1 className="font-serif text-2xl font-light mb-2" style={{ color: 'var(--ink)' }}>Order Placed!</h1>
          <p className="text-sm mb-1" style={{ color: 'var(--ink3)' }}>Order ID: <strong style={{ color: 'var(--ink)' }}>{orderId.slice(0, 8).toUpperCase()}</strong></p>
          <p className="text-sm mb-2" style={{ color: 'var(--ink3)' }}>Thank you for shopping with us.</p>
          {siteSettings.enable_cashback_earning && cashbackPreview > 0 && <p className="text-sm mb-6" style={{ color: 'var(--green)' }}>You will earn {formatPrice(cashbackPreview)} cashback to your wallet after delivery.</p>}
          <a
            href="/profile"
            className="btn-primary no-underline inline-flex mb-3"
          >
            <span>View Order Status</span>
          </a>
          <br />
          <a href="/" className="btn-outline no-underline inline-flex mt-2">Back to Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[5%] py-10 max-w-[1200px] mx-auto min-h-screen" style={{ background: 'rgb(var(--c-ivory))' }}>
      <h1 className="font-serif text-2xl font-light mb-8" style={{ color: 'var(--ink)' }}>Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        <div className="rounded-xl p-6 shadow-soft" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
          <h2 className="font-serif text-lg font-normal mb-5" style={{ color: 'var(--ink)' }}>Delivery Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="input" />
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>WhatsApp Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg text-sm font-medium" style={{ background: 'rgb(var(--c-ivory3))', borderColor: 'rgb(var(--c-ivory3))', color: 'var(--ink3)' }}>
                  +91
                </span>
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  placeholder="9876543210" 
                  type="tel" 
                  maxLength={10}
                  className="input rounded-l-none" 
                />
              </div>
              <div className="mt-2 rounded-lg p-3" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory3))' }}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {otpStatus === 'verified' ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg w-full font-medium" style={{ background: 'rgba(var(--c-green5), 0.1)', border: '1px solid var(--green)', color: 'var(--green)' }}>
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
                <p className="mt-2 text-xs" style={{ color: 'var(--ink4)' }}>
                  {isPhoneVerified
                    ? customerType === 'returning'
                      ? 'Verified returning customer. Your LOYAL12 discount is auto-applied.'
                      : 'Verified new customer. You can enter an influencer code below for 10% off.'
                    : 'Verify your phone first. We will create your account automatically after OTP verification.'}
                </p>
                {otpHint && !isPhoneVerified && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--green)' }}>{otpHint}</p>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Email (optional)</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Full Address *</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="House/Flat no., Street, Area" className="input" />
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>City *</label>
              <div className="relative">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder={pincodeLoading ? 'Fetching...' : 'City'}
                  className={`input pr-16 ${pincodeLoading ? 'opacity-60' : ''}`}
                  readOnly={pincodeLoading}
                />
                {pincodeLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-medium animate-pulse" style={{ color: 'var(--ink4)' }}>Fetching...</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>State</label>
              <div className="relative">
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder={pincodeLoading ? 'Fetching...' : 'State'}
                  className={`input pr-16 ${pincodeLoading ? 'opacity-60' : ''}`}
                  readOnly={pincodeLoading}
                />
                {pincodeLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-medium animate-pulse" style={{ color: 'var(--ink4)' }}>Fetching...</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="110001" className="input" maxLength={6} />
              {shippingCheckLoading ? (
                <div className="mt-2 text-xs" style={{ color: 'var(--ink4)' }}>Checking delivery availability...</div>
              ) : shippingCheck ? (
                <div className="mt-2 rounded-lg border px-3 py-2 text-xs" style={{
                  borderColor: shippingCheck.serviceable ? 'rgba(var(--c-green5), 0.4)' : 'rgba(var(--c-terra3), 0.4)',
                  background: shippingCheck.serviceable ? 'rgba(var(--c-green6), 0.2)' : 'rgba(var(--c-terra4), 0.2)',
                  color: shippingCheck.serviceable ? 'var(--green)' : 'var(--terra)'
                }}>
                  <div className="font-medium">
                    {shippingCheck.serviceable ? 'Delivery available' : shippingCheck.configured ? 'Delivery unavailable' : 'NimbusPost check not configured'}
                  </div>
                  {shippingCheck.serviceable && (
                    <div className="mt-1" style={{ color: 'var(--ink3)' }}>
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

          <div className="mt-6 pt-5 space-y-5" style={{ borderTop: '1px solid rgb(var(--c-ivory3))' }}>
            <div>
              <h3 className="font-sans text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Discounts</h3>
              <p className="text-xs mb-2" style={{ color: 'var(--ink4)' }}>
                {isPhoneVerified
                  ? (customerType === 'returning' ? 'Welcome back! Your LOYAL12 discount is auto-applied if eligible, but you can use another code.' : 'Enter your discount or influencer code to apply your savings.')
                  : 'You can enter a discount code now. Phone verification is required to apply it.'}
              </p>
              {!couponState.valid ? (
                <div className="flex gap-2">
                  <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="input" placeholder="Enter influencer code" />
                  <button type="button" onClick={applyCoupon} disabled={couponLoading} className="btn-primary justify-center px-5">
                    <span>{couponLoading ? 'Checking...' : 'Apply'}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'rgba(var(--c-green5), 0.4)', background: 'rgba(var(--c-green5), 0.1)', color: 'var(--green)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{couponState.code} applied.</span>
                      {discount > 0 && <span className="ml-1">You saved {formatPrice(couponState.discountAmount)}.</span>}
                    </div>
                    <button type="button" onClick={clearCoupon} className="text-xs underline bg-transparent border-none cursor-pointer hover:text-terra" style={{ color: 'var(--green)' }}>Remove</button>
                  </div>
                  {(couponState.free_shipping || couponState.free_cod || couponState.free_handling) && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {couponState.free_shipping && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--green)' }}>Free Delivery</span>}
                      {couponState.free_cod && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--green)' }}>Free COD</span>}
                      {couponState.free_handling && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--green)' }}>Free Handling</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {siteSettings.enable_cashback_spending && (
            <div>
              <h3 className="font-sans text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Cashback Wallet</h3>
              <div className="rounded-xl p-4" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory3))' }}>
                {normalizedPhone.length < 10 ? (
                  <p className="text-sm" style={{ color: 'var(--ink3)' }}>Enter your WhatsApp number to check wallet balance and cashback eligibility.</p>
                ) : walletLoading ? (
                  <p className="text-sm" style={{ color: 'var(--ink3)' }}>Loading wallet...</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--ink3)' }}>Wallet Balance</span>
                      <span className="font-serif text-lg" style={{ color: 'var(--green)' }}>{formatPrice(walletBalance)}</span>
                    </div>
                    <label className="flex items-center gap-3 text-sm cursor-pointer" style={{ color: 'var(--ink)' }}>
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
                      <div className="text-sm" style={{ color: 'var(--green)' }}>Using {formatPrice(walletApplied)} from wallet.</div>
                    )}
                    {siteSettings.enable_cashback_earning && (
                      <div className="text-xs" style={{ color: 'var(--ink4)' }}>
                        You earn 5% cashback on every order.
                        <br/>You will get {formatPrice(cashbackPreview)} credited to your wallet once this order is delivered.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}


            <div>
              <h3 className="font-sans text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Payment Method</h3>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                  style={{
                    background: paymentMethod === 'online' ? 'rgba(var(--c-green5), 0.1)' : 'rgb(var(--c-ivory3))',
                    borderColor: paymentMethod === 'online' ? 'var(--green)' : 'rgb(var(--c-ivory3))',
                    color: paymentMethod === 'online' ? 'var(--green)' : 'var(--ink3)'
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full block" style={{ background: paymentMethod === 'online' ? 'var(--green)' : 'var(--ink4)' }} />
                  Online Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                  style={{
                    background: paymentMethod === 'cod' ? 'rgba(var(--c-green5), 0.1)' : 'rgb(var(--c-ivory3))',
                    borderColor: paymentMethod === 'cod' ? 'var(--green)' : 'rgb(var(--c-ivory3))',
                    color: paymentMethod === 'cod' ? 'var(--green)' : 'var(--ink3)'
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full block" style={{ background: paymentMethod === 'cod' ? 'var(--green)' : 'var(--ink4)' }} />
                  Cash on Delivery
                </button>
              </div>
              {paymentMethod === 'cod' && (
                <p className="text-xs mt-2" style={{ color: 'var(--terra)' }}>₹29 COD charge will be added to your order.</p>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--ink4)' }}>Secure payment powered by Razorpay</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 shadow-soft lg:sticky lg:top-20" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
          <h2 className="font-serif text-lg font-normal mb-4" style={{ color: 'var(--ink)' }}>Order Summary</h2>

          <div className="flex flex-col gap-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
            {cartItems.map((item, i) => (
              <div key={`${item.product_id}-${item.variant_id}-${i}`} className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgb(var(--c-ivory3))' }}>
                  {item.product_image && <Image src={item.product_image} alt={item.product_name} width={64} height={64} className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-sm font-medium leading-tight" style={{ color: 'var(--ink)' }}>{item.product_name}</div>
                  {item.variant_name && <div className="text-xs mt-0.5" style={{ color: 'var(--ink4)' }}>{item.variant_name}</div>}
                  {item.weight_grams > 0 && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--ink4)' }}>
                      {(item.weight_grams * item.quantity) >= 1000 ? ((item.weight_grams * item.quantity) / 1000).toFixed(1) + 'kg total' : (item.weight_grams * item.quantity) + 'g total'}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)}
                      className="w-6 h-6 rounded border bg-transparent text-base flex items-center justify-center cursor-pointer transition-colors"
                      style={{ color: 'var(--green)', borderColor: 'rgb(var(--c-ivory3))' }}
                    >−</button>
                    <span className="text-sm font-medium min-w-[20px] text-center" style={{ color: 'var(--ink)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, item.variant_id, Math.min(10, item.quantity + 1))}
                      disabled={item.quantity >= 10}
                      className="w-6 h-6 rounded border bg-transparent text-base flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                      style={{ color: 'var(--green)', borderColor: 'rgb(var(--c-ivory3))' }}
                    >+</button>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id)}
                      className="text-xs underline bg-transparent border-none cursor-pointer hover:text-terra transition-colors ml-2"
                      style={{ color: 'var(--ink4)' }}
                    >Remove</button>
                  </div>
                </div>
                <div className="text-sm font-serif flex flex-col justify-end items-end pb-1" style={{ color: 'var(--green)' }}>
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex flex-col gap-2 mb-4" style={{ borderTop: '1px solid rgb(var(--c-ivory3))' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--green)' }}>
                <span>Discount ({couponState.code})</span><span>-{formatPrice(discount)}</span>
              </div>
            )}
            {walletApplied > 0 && (
              <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--green)' }}>
                <span>Wallet Cashback</span><span>-{formatPrice(walletApplied)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="font-medium" style={{ color: 'var(--green)' }}>{couponState.free_shipping ? 'FREE (Coupon)' : 'Free'}</span> : formatPrice(shipping)}</span>
            </div>
            {(codCharge > 0 || (paymentMethod === 'cod' && couponState.free_cod)) && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
                <span>COD Charge</span>
                <span>{couponState.free_cod ? <span className="font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}><span className="line-through text-xs" style={{ color: 'var(--ink4)' }}>₹29</span> FREE</span> : formatPrice(codCharge)}</span>
              </div>
            )}
            {(smallOrderFee > 0 || (subtotal < 50000 && couponState.free_handling)) && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
                <span>Handling Fee</span>
                <span>{couponState.free_handling ? <span className="font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}><span className="line-through text-xs" style={{ color: 'var(--ink4)' }}>₹19</span> FREE</span> : formatPrice(smallOrderFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 mt-1" style={{ borderTop: '1px solid rgb(var(--c-ivory3))', color: 'var(--ink)' }}>
              <span>Total</span>
              <span className="font-serif text-xl" style={{ color: 'var(--green)' }}>{formatPrice(orderTotal)}</span>
            </div>
            {siteSettings.enable_cashback_earning && cashbackPreview > 0 && (
              <div className="flex items-center justify-between font-medium mb-3 pt-3" style={{ borderTop: '1px solid rgb(var(--c-ivory3))', color: 'var(--green)' }}>
                <span className="text-sm">
                  Cashback preview: {formatPrice(cashbackPreview)}
                </span>
              </div>
            )}
            {shippingCheck?.serviceable && (
              <div className="text-xs font-medium" style={{ color: 'var(--green)' }}>
                Expected delivery: {shippingCheck.estimatedDeliveryDate
                  ? new Date(shippingCheck.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Will be confirmed soon'}
              </div>
            )}
            {shippingCheck?.serviceable === false && (
              <div className="text-xs" style={{ color: 'var(--terra)' }}>
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

          <div className="flex items-center justify-center gap-2 mt-3 text-xs" style={{ color: 'var(--ink4)' }}>
            <span>🔒</span> Secured by Razorpay
          </div>
        </div>
      </div>

      {otpStatus === 'code-sent' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-[360px] p-6 relative" style={{ background: 'rgb(var(--c-ivory2))' }}>
            <button 
              onClick={() => setOtpStatus('unverified')} 
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors border-none cursor-pointer"
              style={{ background: 'rgb(var(--c-ivory3))', color: 'var(--ink3)' }}
            >
              ✕
            </button>
            <h3 className="font-serif text-xl mb-1 text-center" style={{ color: 'var(--ink)' }}>OTP Verification</h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--ink3)' }}>
              Code sent to <strong style={{ color: 'var(--ink)' }}>+91 {normalizedPhone}</strong>
            </p>
            
            <input
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="input w-full text-center tracking-[0.5em] text-2xl font-bold mb-4 py-3 placeholder:tracking-normal placeholder:font-normal placeholder:text-base outline-none focus:ring-2 focus:ring-green-4"
              style={{ border: '2px solid rgb(var(--c-ivory3))' }}
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
                className="text-xs font-medium underline bg-transparent border-none cursor-pointer p-0"
                style={{ color: 'var(--green)' }}
              >
                Didn't receive it? Resend
              </button>
            </div>
            
            {otpHint && (
              <div className="mt-5 p-3 rounded-lg text-xs text-center font-medium" style={{ border: '1px solid var(--green)', background: 'rgba(var(--c-green5), 0.1)', color: 'var(--green)' }}>
                {otpHint}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
