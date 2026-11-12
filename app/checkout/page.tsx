'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/lib/store'
import { confirmOtp, requestOtp, useSession, useSessionLoader } from '@/lib/use-session'
import { LOYALTY_CODE } from '@/lib/commerce'
import { COD_CHARGE, SMALL_ORDER_FEE, SMALL_ORDER_THRESHOLD, computeTotals, type CouponRules, type Totals } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'
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

type ShippingCheck = {
  configured: boolean
  serviceable: boolean | null
  estimatedDeliveryDate: string | null
  courierName: string | null
  availableCourierCount: number
  message?: string
}

type QuoteResponse = {
  lines: {
    input_key: string
    product_id: string
    product_name: string
    product_image: string
    variant_id: string | null
    variant_name: string | null
    weight_grams: number
    price: number
  }[]
  errors: string[]
  totals: Totals
  coupon: null | {
    code: string
    rules: CouponRules | null
    applied: boolean
    error: string | null
    message: string | null
  }
  wallet: { balance: number }
  settings: { enable_cashback_earning: boolean; enable_cashback_spending: boolean }
}

type PlacedOrder = { id: string; ref: string; cashback: number }

const DEFAULT_SETTINGS = { enable_cashback_earning: true, enable_cashback_spending: true }

export default function CheckoutPage() {
  const { items, hydrated, updateQty, removeItem, clearCart, syncPrices } = useCart()
  const session = useSessionLoader()
  const isPhoneVerified = session.status === 'authenticated'

  const [form, setForm] = useState<FormData>({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' })
  const [loading, setLoading] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponFeedbackFor, setCouponFeedbackFor] = useState('')
  const [useCashback, setUseCashback] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')
  const [otpCode, setOtpCode] = useState('')
  const [otpOpen, setOtpOpen] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [quote, setQuote] = useState<(QuoteResponse & { key: string }) | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [quoteNonce, setQuoteNonce] = useState(0)
  const [quoteRetries, setQuoteRetries] = useState(0)
  const [shippingCheck, setShippingCheck] = useState<ShippingCheck | null>(null)
  const [shippingCheckLoading, setShippingCheckLoading] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const prefilledFor = useRef('')
  const loyaltyAutoApplied = useRef(false)

  const cartItems = useMemo(() => (hydrated ? items : []), [hydrated, items])
  const normalizedPhone = form.phone.replace(/\D/g, '').slice(0, 10)

  // A creator's referral link pre-fills their code.
  useEffect(() => {
    try {
      const refCookie = document.cookie.split('; ').find((row) => row.startsWith('mana_ref='))?.split('=')[1]
      if (refCookie) setCouponInput(decodeURIComponent(refCookie).toUpperCase())
    } catch {}
  }, [])

  // Signed in: fill the phone and the last delivery address.
  useEffect(() => {
    if (session.status !== 'authenticated' || prefilledFor.current === session.phone) return
    prefilledFor.current = session.phone
    setForm(prev => ({ ...prev, phone: session.phone }))

    fetch('/api/orders', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        const latest = Array.isArray(data) ? data[0] : null
        if (!latest) return
        setForm(prev => ({
          ...prev,
          name: prev.name || latest.customer_name || '',
          email: prev.email || latest.customer_email || '',
          address: prev.address || latest.address || '',
          city: prev.city || latest.city || '',
          state: prev.state || latest.state || '',
          pincode: prev.pincode || latest.pincode || '',
        }))
      })
      .catch(() => {})
  }, [session.status, session.phone])

  // Returning customers get LOYAL12 unless they've picked another code.
  useEffect(() => {
    if (session.status === 'authenticated' && session.customerType === 'returning') {
      setCouponCode(current => {
        if (current) return current
        loyaltyAutoApplied.current = true
        return LOYALTY_CODE
      })
    }
  }, [session.status, session.customerType])

  useEffect(() => {
    if (form.pincode.length !== 6) {
      setPincodeLoading(false)
      return
    }
    let active = true
    setPincodeLoading(true)
    fetch(`https://api.postalpincode.in/pincode/${form.pincode}`)
      .then(res => res.json())
      .then(data => {
        const postOffice = data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : null
        if (!active || !postOffice) return
        setForm(prev => ({
          ...prev,
          city: postOffice.District || postOffice.Region || prev.city || '',
          state: postOffice.State || prev.state || '',
        }))
      })
      .catch(() => {})
      .finally(() => {
        if (active) setPincodeLoading(false)
      })
    return () => {
      active = false
    }
  }, [form.pincode])

  const totalWeightGrams = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.weight_grams || 0) * Number(item.quantity || 1), 0) || 500,
    [cartItems]
  )

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
        if (active) setShippingCheck(data)
      })
      .catch(() => {
        if (active) setShippingCheck(null)
      })
      .finally(() => {
        if (active) setShippingCheckLoading(false)
      })

    return () => {
      active = false
    }
  }, [form.pincode, totalWeightGrams])

  // ── Server quote: the authoritative price for exactly this cart ──
  const quoteBody = useMemo(() => ({
    items: cartItems.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      weight_grams: item.weight_grams,
      quantity: item.quantity,
    })),
    coupon_code: couponCode || null,
    payment_method: paymentMethod,
    use_wallet: useCashback,
    city: form.city,
    state: form.state,
    pincode: /^\d{6}$/.test(form.pincode) ? form.pincode : '',
  }), [cartItems, couponCode, paymentMethod, useCashback, form.city, form.state, form.pincode])
  const quoteKey = `${JSON.stringify(quoteBody)}|${session.phone}|${quoteNonce}`

  useEffect(() => {
    if (!hydrated || session.status === 'loading') return
    if (!quoteBody.items.length) {
      setQuote(null)
      setQuoteLoading(false)
      return
    }

    let active = true
    setQuoteLoading(true)
    const timer = setTimeout(() => {
      fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteBody),
        cache: 'no-store',
      })
        .then(async res => {
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Could not calculate your total.')
          return data as QuoteResponse
        })
        .then(data => {
          if (!active) return
          setQuote({ ...data, key: quoteKey })
          setQuoteError('')
          setQuoteRetries(0)
          syncPrices(data.lines)
        })
        .catch(err => {
          if (active) setQuoteError(err.message || 'Could not calculate your total.')
        })
        .finally(() => {
          if (active) setQuoteLoading(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
    // quoteKey covers every input that changes the price.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey, hydrated, session.status])

  // A failed price check (network blip, rate limit) would otherwise leave the
  // pay button stuck on "Updating total…": retry a few times, then offer a button.
  useEffect(() => {
    if (!quoteError || quoteLoading || quoteRetries >= 3) return
    const timer = setTimeout(() => {
      setQuoteRetries(count => count + 1)
      setQuoteNonce(n => n + 1)
    }, 2000 * 2 ** quoteRetries)
    return () => clearTimeout(timer)
  }, [quoteError, quoteLoading, quoteRetries])

  const quoteFresh = Boolean(quote && quote.key === quoteKey && !quoteLoading)
  const settings = quote?.settings || DEFAULT_SETTINGS
  const walletBalance = quote?.wallet.balance || 0
  const couponInfo = couponCode && quote?.coupon?.code === couponCode ? quote.coupon : null
  const couponRules = couponInfo?.rules || null

  // Until the server answers, recompute locally with the same rules so the
  // summary (and any coupon discount) follows the cart immediately.
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totals: Totals = quoteFresh && quote
    ? quote.totals
    : computeTotals({
        subtotal,
        coupon: couponRules,
        paymentMethod,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        walletBalance,
        useWallet: useCashback && isPhoneVerified,
        walletSpendingEnabled: settings.enable_cashback_spending,
        cashbackEarningEnabled: settings.enable_cashback_earning,
      })
  const appliedRules = totals.couponApplied ? couponRules : null
  const blockingErrors = quoteFresh && quote
    ? [...quote.errors, ...(quote.coupon?.error ? [quote.coupon.error] : [])]
    : []
  const canSubmit = quoteFresh && !blockingErrors.length && cartItems.length > 0 && !loading

  // Toast the outcome of a code the shopper just applied.
  useEffect(() => {
    if (!couponFeedbackFor || !quote || quote.key !== quoteKey || quote.coupon?.code !== couponFeedbackFor) return
    setCouponFeedbackFor('')
    if (quote.coupon.error) {
      showToast(quote.coupon.error)
      setCouponCode('')
    } else if (quote.coupon.applied) {
      showToast(`${quote.coupon.code} applied!`)
    } else if (quote.coupon.message) {
      showToast(quote.coupon.message)
    }
  }, [quote, quoteKey, couponFeedbackFor])

  // An auto-applied loyalty code that turns out not to apply is dropped quietly.
  useEffect(() => {
    if (!loyaltyAutoApplied.current || !quoteFresh || quote?.coupon?.code !== LOYALTY_CODE || !quote.coupon.error) return
    loyaltyAutoApplied.current = false
    setCouponCode('')
  }, [quote, quoteFresh])

  const sendOtp = async () => {
    if (normalizedPhone.length !== 10) {
      showToast('Enter a valid 10-digit number')
      return
    }
    setOtpLoading(true)
    setOtpCode('')
    try {
      await requestOtp(normalizedPhone)
      setOtpOpen(true)
      showToast('OTP sent on WhatsApp')
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
      const data = await confirmOtp(normalizedPhone, otpCode.trim())
      setOtpOpen(false)
      setOtpCode('')
      showToast(data.customer_type === 'returning' ? `Welcome back! ${LOYALTY_CODE} applied.` : 'Phone number verified!')
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  const changePhone = async () => {
    await useSession.getState().signOut()
    prefilledFor.current = ''
    loyaltyAutoApplied.current = false
    setForm(prev => ({ ...prev, phone: '' }))
    setCouponCode('')
    setUseCashback(false)
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    if (!isPhoneVerified) {
      showToast('Please verify your phone number first')
      return
    }
    loyaltyAutoApplied.current = false
    setCouponFeedbackFor(code)
    setCouponCode(code)
  }

  const clearCoupon = () => {
    loyaltyAutoApplied.current = false
    setCouponCode('')
    setCouponInput('')
    showToast('Coupon removed')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : name === 'pincode' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }))
  }

  const validate = () => {
    if (!form.name.trim()) { showToast('Name is required'); return false }
    if (!isPhoneVerified) { showToast('Please verify your phone number'); return false }
    if (!form.address.trim()) { showToast('Address is required'); return false }
    if (!form.city.trim()) { showToast('City is required'); return false }
    if (!form.state.trim()) { showToast('State is required'); return false }
    if (!/^\d{6}$/.test(form.pincode)) { showToast('6-digit pincode is required'); return false }
    if (shippingCheck && shippingCheck.serviceable === false) {
      showToast('This pincode is currently not serviceable for delivery')
      return false
    }
    if (!quoteFresh) { showToast('Updating your total — one moment'); return false }
    if (blockingErrors.length) { showToast(blockingErrors[0]); return false }
    return true
  }

  const orderPayload = () => ({
    items: quoteBody.items,
    coupon_code: couponCode || null,
    use_wallet: useCashback,
    expected_total: totals.total,
    customer: {
      name: form.name,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
    },
  })

  const completeOrder = (order: PlacedOrder) => {
    setPlacedOrder(order)
    clearCart()
    loyaltyAutoApplied.current = false
    setCouponCode('')
    setCouponInput('')
    setUseCashback(false)
    setLoading(false)
    window.scrollTo({ top: 0 })
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
    setLoading(true)

    try {
      await loadRazorpayScript()
      // The server prices the cart, saves the order and opens a Razorpay
      // order for exactly that amount.
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload()),
      })
      const data = await orderRes.json()
      if (!orderRes.ok) {
        if (data?.quote) setQuoteNonce(n => n + 1)
        throw new Error(data?.error || 'Could not create payment session')
      }

      if (data.paid) {
        completeOrder({ id: data.order_id, ref: data.order_ref, cashback: 0 })
        return
      }

      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Mana Dry Fruits',
        description: `Order ${data.order_ref}`,
        order_id: data.razorpay_order_id,
        prefill: {
          name: form.name,
          email: form.email || undefined,
          contact: '+91' + normalizedPhone,
        },
        theme: { color: '#1C3D2E' },
        modal: {
          ondismiss: function () {
            setLoading(false)
            showToast('Payment window closed')
          },
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const result = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(result?.error || 'Could not confirm your payment')
            completeOrder({ id: result.id, ref: result.order_ref, cashback: result.cashback_earned || 0 })
          } catch (err: any) {
            showToast(`${err.message || 'Could not confirm your payment'} (Payment ID: ${response.razorpay_payment_id})`)
            setLoading(false)
          }
        },
      })
      rzp.on('payment.failed', function (response: any) {
        showToast('Payment failed: ' + (response.error?.description || 'Please try again'))
        setLoading(false)
      })
      rzp.open()
    } catch (err: any) {
      showToast(err.message || 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  const handleCashOnDelivery = async () => {
    if (!validate()) return
    setLoading(true)

    try {
      const saveRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload()),
      })
      const data = await saveRes.json()
      if (!saveRes.ok) {
        if (data?.quote) setQuoteNonce(n => n + 1)
        throw new Error(data?.error || 'Could not place COD order')
      }
      completeOrder({ id: data.id, ref: data.order_ref, cashback: data.cashback_earned || 0 })
    } catch (err: any) {
      showToast(err.message || 'Could not place COD order')
      setLoading(false)
    }
  }

  if (placedOrder) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-[5%] py-16" style={{ background: 'rgb(var(--c-ivory))' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: 'rgb(var(--c-green5) / 0.1)', border: '2px solid var(--green)', color: 'var(--green)' }}>✓</div>
          <h1 className="font-serif text-2xl font-light mb-2" style={{ color: 'var(--ink)' }}>Order Placed!</h1>
          <p className="text-sm mb-1" style={{ color: 'var(--ink3)' }}>Order ID: <strong style={{ color: 'var(--ink)' }}>{placedOrder.ref || placedOrder.id.slice(0, 8).toUpperCase()}</strong></p>
          <p className="text-sm mb-2" style={{ color: 'var(--ink3)' }}>Thank you for shopping with us.</p>
          {settings.enable_cashback_earning && placedOrder.cashback > 0 && <p className="text-sm mb-6" style={{ color: 'var(--green)' }}>You will earn {formatPrice(placedOrder.cashback)} cashback to your wallet after delivery.</p>}
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
              <label htmlFor="checkout-name" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Full Name *</label>
              <input id="checkout-name" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" autoComplete="name" className="input" />
            </div>
            <div>
              <label htmlFor="checkout-phone" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>WhatsApp Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg text-sm font-medium" style={{ background: 'rgb(var(--c-ivory3))', borderColor: 'rgb(var(--c-ivory3))', color: 'var(--ink3)' }}>
                  +91
                </span>
                <input
                  id="checkout-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  readOnly={isPhoneVerified}
                  className="input rounded-l-none"
                />
              </div>
              <div className="mt-2 rounded-lg p-3" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory3))' }}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {isPhoneVerified ? (
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg w-full font-medium" style={{ background: 'rgb(var(--c-green5) / 0.1)', border: '1px solid var(--green)', color: 'var(--green)' }}>
                      <span className="flex items-center gap-2"><span className="text-lg leading-none">✓</span> Verified</span>
                      <button type="button" onClick={changePhone} className="text-xs underline bg-transparent border-none cursor-pointer" style={{ color: 'var(--green)' }}>
                        Change number
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading || normalizedPhone.length !== 10 || session.status === 'loading'}
                      className="btn-outline justify-center disabled:opacity-50 w-full"
                    >
                      <span>{otpLoading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--ink4)' }}>
                  {isPhoneVerified
                    ? session.customerType === 'returning'
                      ? `Verified returning customer. Your ${LOYALTY_CODE} discount is auto-applied.`
                      : 'Verified new customer. You can enter an influencer code below for 10% off.'
                    : 'Verify your phone first. We will create your account automatically after OTP verification.'}
                </p>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="checkout-email" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Email (optional)</label>
              <input id="checkout-email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" autoComplete="email" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="checkout-address" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Full Address *</label>
              <input id="checkout-address" name="address" value={form.address} onChange={handleChange} placeholder="House/Flat no., Street, Area" autoComplete="street-address" className="input" />
            </div>
            <div>
              <label htmlFor="checkout-city" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>City *</label>
              <div className="relative">
                <input
                  id="checkout-city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder={pincodeLoading ? 'Fetching...' : 'City'}
                  autoComplete="address-level2"
                  className={`input pr-16 ${pincodeLoading ? 'opacity-60' : ''}`}
                  readOnly={pincodeLoading}
                />
                {pincodeLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-medium animate-pulse" style={{ color: 'var(--ink4)' }}>Fetching...</span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="checkout-state" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>State *</label>
              <div className="relative">
                <input
                  id="checkout-state"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder={pincodeLoading ? 'Fetching...' : 'State'}
                  autoComplete="address-level1"
                  className={`input pr-16 ${pincodeLoading ? 'opacity-60' : ''}`}
                  readOnly={pincodeLoading}
                />
                {pincodeLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-medium animate-pulse" style={{ color: 'var(--ink4)' }}>Fetching...</span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="checkout-pincode" className="text-xs block mb-1.5 font-medium" style={{ color: 'var(--ink3)' }}>Pincode *</label>
              <input id="checkout-pincode" name="pincode" value={form.pincode} onChange={handleChange} placeholder="110001" inputMode="numeric" autoComplete="postal-code" className="input" maxLength={6} />
              {shippingCheckLoading ? (
                <div className="mt-2 text-xs" style={{ color: 'var(--ink4)' }}>Checking delivery availability...</div>
              ) : shippingCheck ? (
                <div className="mt-2 rounded-lg border px-3 py-2 text-xs" style={{
                  borderColor: shippingCheck.serviceable ? 'rgb(var(--c-green5) / 0.4)' : 'rgb(var(--c-terra3) / 0.4)',
                  background: shippingCheck.serviceable ? 'rgb(var(--c-green6) / 0.2)' : 'rgb(var(--c-terra4) / 0.2)',
                  color: shippingCheck.serviceable ? 'var(--green)' : 'var(--terra)'
                }}>
                  <div className="font-medium">
                    {shippingCheck.serviceable ? 'Delivery available' : shippingCheck.configured ? 'Delivery unavailable' : 'Delivery check unavailable right now'}
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
                  ? (session.customerType === 'returning' ? `Welcome back! Your ${LOYALTY_CODE} discount is auto-applied if eligible, but you can use another code.` : 'Enter your discount or influencer code to apply your savings.')
                  : 'You can enter a discount code now. Phone verification is required to apply it.'}
              </p>
              {!couponCode ? (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') applyCoupon() }}
                    className="input"
                    placeholder="Enter influencer code"
                    aria-label="Coupon code"
                  />
                  <button type="button" onClick={applyCoupon} className="btn-primary justify-center px-5">
                    <span>Apply</span>
                  </button>
                </div>
              ) : (
                <div
                  className="mt-2 flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm"
                  style={totals.couponApplied
                    ? { borderColor: 'rgb(var(--c-green5) / 0.4)', background: 'rgb(var(--c-green5) / 0.1)', color: 'var(--green)' }
                    : { borderColor: 'rgb(var(--c-terra3) / 0.4)', background: 'rgb(var(--c-terra4) / 0.15)', color: 'var(--terra)' }}
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      {totals.couponApplied ? (
                        <>
                          <span className="font-medium">{couponCode} applied.</span>
                          {totals.discount > 0 && <span className="ml-1">You save {formatPrice(totals.discount)}.</span>}
                        </>
                      ) : couponInfo?.error ? (
                        <span>{couponInfo.error}</span>
                      ) : totals.couponMessage ? (
                        <span>{totals.couponMessage}</span>
                      ) : (
                        <span style={{ color: 'var(--ink3)' }}>Checking {couponCode}…</span>
                      )}
                    </div>
                    <button type="button" onClick={clearCoupon} className="text-xs underline bg-transparent border-none cursor-pointer hover:text-terra shrink-0" style={{ color: 'inherit' }}>Remove</button>
                  </div>
                  {appliedRules && (appliedRules.free_shipping || appliedRules.free_cod || appliedRules.free_handling) && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {appliedRules.free_shipping && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--green)' }}>Free Delivery</span>}
                      {appliedRules.free_cod && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--green)' }}>Free COD</span>}
                      {appliedRules.free_handling && <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--green)' }}>Free Handling</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {settings.enable_cashback_spending && (
            <div>
              <h3 className="font-sans text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Cashback Wallet</h3>
              <div className="rounded-xl p-4" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory3))' }}>
                {!isPhoneVerified ? (
                  <p className="text-sm" style={{ color: 'var(--ink3)' }}>Verify your WhatsApp number to check your wallet balance and cashback.</p>
                ) : !quote ? (
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
                    {useCashback && totals.walletUsed > 0 && (
                      <div className="text-sm" style={{ color: 'var(--green)' }}>Using {formatPrice(totals.walletUsed)} from wallet.</div>
                    )}
                    {settings.enable_cashback_earning && (
                      <div className="text-xs" style={{ color: 'var(--ink4)' }}>
                        You earn 5% cashback on every order.
                        <br/>You will get {formatPrice(totals.cashback)} credited to your wallet once this order is delivered.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}


            <div>
              <h3 className="font-sans text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Payment Method</h3>
              <div className="flex gap-3 flex-wrap" role="radiogroup" aria-label="Payment method">
                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === 'online'}
                  onClick={() => setPaymentMethod('online')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                  style={{
                    background: paymentMethod === 'online' ? 'rgb(var(--c-green5) / 0.1)' : 'rgb(var(--c-ivory3))',
                    borderColor: paymentMethod === 'online' ? 'var(--green)' : 'rgb(var(--c-ivory3))',
                    color: paymentMethod === 'online' ? 'var(--green)' : 'var(--ink3)'
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full block" style={{ background: paymentMethod === 'online' ? 'var(--green)' : 'var(--ink4)' }} />
                  Online Payment
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === 'cod'}
                  onClick={() => setPaymentMethod('cod')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border cursor-pointer transition-all"
                  style={{
                    background: paymentMethod === 'cod' ? 'rgb(var(--c-green5) / 0.1)' : 'rgb(var(--c-ivory3))',
                    borderColor: paymentMethod === 'cod' ? 'var(--green)' : 'rgb(var(--c-ivory3))',
                    color: paymentMethod === 'cod' ? 'var(--green)' : 'var(--ink3)'
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full block" style={{ background: paymentMethod === 'cod' ? 'var(--green)' : 'var(--ink4)' }} />
                  Cash on Delivery
                </button>
              </div>
              {paymentMethod === 'cod' && (
                <p className="text-xs mt-2" style={{ color: 'var(--terra)' }}>
                  {appliedRules?.free_cod ? 'COD charge waived by your coupon.' : `${formatPrice(COD_CHARGE)} COD charge will be added to your order.`}
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--ink4)' }}>Secure payment powered by Razorpay</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 shadow-soft lg:sticky lg:top-20" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
          <h2 className="font-serif text-lg font-normal mb-4" style={{ color: 'var(--ink)' }}>Order Summary</h2>

          {hydrated && cartItems.length === 0 && (
            <div className="text-sm py-6 text-center" style={{ color: 'var(--ink3)' }}>
              Your cart is empty. <a href="/products" style={{ color: 'var(--green)' }}>Browse products</a>
            </div>
          )}

          <div className="flex flex-col gap-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div key={`${item.product_id}-${item.variant_id}-${item.weight_grams}`} className="flex gap-3">
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
                      type="button"
                      onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1, item.weight_grams)}
                      aria-label={`Decrease quantity of ${item.product_name}`}
                      className="w-6 h-6 rounded border bg-transparent text-base flex items-center justify-center cursor-pointer transition-colors"
                      style={{ color: 'var(--green)', borderColor: 'rgb(var(--c-ivory3))' }}
                    >−</button>
                    <span className="text-sm font-medium min-w-[20px] text-center" style={{ color: 'var(--ink)' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product_id, item.variant_id, Math.min(10, item.quantity + 1), item.weight_grams)}
                      disabled={item.quantity >= 10}
                      aria-label={`Increase quantity of ${item.product_name}`}
                      className="w-6 h-6 rounded border bg-transparent text-base flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                      style={{ color: 'var(--green)', borderColor: 'rgb(var(--c-ivory3))' }}
                    >+</button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id, item.variant_id, item.weight_grams)}
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

          <div className="pt-3 flex flex-col gap-2 mb-4" style={{ borderTop: '1px solid rgb(var(--c-ivory3))' }} aria-live="polite">
            <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
              <span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--green)' }}>
                <span>Discount ({couponCode})</span><span>-{formatPrice(totals.discount)}</span>
              </div>
            )}
            {totals.walletUsed > 0 && (
              <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--green)' }}>
                <span>Wallet Cashback</span><span>-{formatPrice(totals.walletUsed)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
              <span>Shipping</span>
              <span>{totals.shipping === 0 ? <span className="font-medium" style={{ color: 'var(--green)' }}>{appliedRules?.free_shipping ? 'FREE (Coupon)' : 'Free'}</span> : formatPrice(totals.shipping)}</span>
            </div>
            {paymentMethod === 'cod' && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
                <span>COD Charge</span>
                <span>{totals.codCharge === 0 ? <span className="font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}><span className="line-through text-xs" style={{ color: 'var(--ink4)' }}>{formatPrice(COD_CHARGE)}</span> FREE</span> : formatPrice(totals.codCharge)}</span>
              </div>
            )}
            {totals.subtotal < SMALL_ORDER_THRESHOLD && totals.subtotal > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--ink3)' }}>
                <span>Handling Fee</span>
                <span>{totals.smallOrderFee === 0 ? <span className="font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}><span className="line-through text-xs" style={{ color: 'var(--ink4)' }}>{formatPrice(SMALL_ORDER_FEE)}</span> FREE</span> : formatPrice(totals.smallOrderFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 mt-1" style={{ borderTop: '1px solid rgb(var(--c-ivory3))', color: 'var(--ink)' }}>
              <span>Total</span>
              <span className="font-serif text-xl" style={{ color: 'var(--green)' }}>{formatPrice(totals.total)}</span>
            </div>
            {settings.enable_cashback_earning && totals.cashback > 0 && (
              <div className="flex items-center justify-between font-medium mb-3 pt-3" style={{ borderTop: '1px solid rgb(var(--c-ivory3))', color: 'var(--green)' }}>
                <span className="text-sm">
                  Cashback preview: {formatPrice(totals.cashback)}
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

          {(blockingErrors.length > 0 || quoteError) && (
            <div className="mb-3 rounded-lg px-3 py-2 text-xs" role="alert" style={{ border: '1px solid rgb(var(--c-terra3) / 0.4)', background: 'rgb(var(--c-terra4) / 0.15)', color: 'var(--terra)' }}>
              {(blockingErrors.length ? blockingErrors : [quoteError]).map(message => <div key={message}>{message}</div>)}
              {!blockingErrors.length && quoteError && !quoteLoading && quoteRetries >= 3 && (
                <button
                  type="button"
                  onClick={() => { setQuoteRetries(0); setQuoteNonce(n => n + 1) }}
                  className="mt-1 underline bg-transparent border-none cursor-pointer p-0 text-xs"
                  style={{ color: 'inherit' }}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {paymentMethod === 'online' ? (
            <button type="button" onClick={handlePayment} disabled={!canSubmit} className="btn-primary w-full justify-center disabled:opacity-50">
              <span>{loading ? 'Processing...' : !quoteFresh && cartItems.length ? 'Updating total…' : `Pay ${formatPrice(totals.total)}`}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCashOnDelivery}
              disabled={!canSubmit}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : !quoteFresh && cartItems.length ? 'Updating total…' : `Place COD Order · ${formatPrice(totals.total)}`}</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mt-3 text-xs" style={{ color: 'var(--ink4)' }}>
            <span>🔒</span> Secured by Razorpay
          </div>
        </div>
      </div>

      {otpOpen && !isPhoneVerified && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00000080] backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="otp-title">
          <div className="rounded-2xl shadow-2xl w-full max-w-[360px] p-6 relative" style={{ background: 'rgb(var(--c-ivory2))' }}>
            <button
              type="button"
              onClick={() => setOtpOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors border-none cursor-pointer"
              style={{ background: 'rgb(var(--c-ivory3))', color: 'var(--ink3)' }}
            >
              ✕
            </button>
            <h3 id="otp-title" className="font-serif text-xl mb-1 text-center" style={{ color: 'var(--ink)' }}>OTP Verification</h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--ink3)' }}>
              Code sent to <strong style={{ color: 'var(--ink)' }}>+91 {normalizedPhone}</strong> on WhatsApp
            </p>

            <input
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => { if (e.key === 'Enter') void verifyOtp() }}
              placeholder="123456"
              aria-label="One-time password"
              autoComplete="one-time-code"
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
                Didn&apos;t receive it? Resend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
