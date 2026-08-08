'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import { Package, Wallet, Clock, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'

const ACCOUNT_PHONE_KEY = 'mana_account_phone'
const ACCOUNT_COOKIE_KEY = 'mana_account_phone'
const STATUS_STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipping' },
  { key: 'delivered', label: 'Delivered' },
]

function saveAccountPhone(phone: string) {
  localStorage.setItem(ACCOUNT_PHONE_KEY, phone)
  document.cookie = `${ACCOUNT_COOKIE_KEY}=${phone}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
}

function readAccountPhone() {
  const stored = localStorage.getItem(ACCOUNT_PHONE_KEY)
  if (stored) return stored

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${ACCOUNT_COOKIE_KEY}=`))
    ?.split('=')[1] || ''
}

function clearAccountPhone() {
  localStorage.removeItem(ACCOUNT_PHONE_KEY)
  document.cookie = `${ACCOUNT_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`
}

function getStatusIndex(status: string) {
  if (status === 'cancelled') return -1
  const index = STATUS_STEPS.findIndex((step) => step.key === status)
  return index >= 0 ? index : 0
}

function TrackingTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid rgba(var(--c-terra), 0.3)', background: 'rgba(var(--c-terra), 0.1)', color: 'var(--terra)' }}>
        This order has been cancelled.
      </div>
    )
  }

  const activeIndex = getStatusIndex(status)

  return (
    <div className="mt-4 grid grid-cols-5 gap-2 text-[.62rem]">
      {STATUS_STEPS.map((step, index) => {
        const done = index <= activeIndex
        return (
          <div key={step.key} className="flex flex-col items-center text-center gap-1">
            <div className="h-2 w-full rounded-full" style={{ background: done ? 'var(--green)' : 'var(--ink4)' }} />
            <span style={{ color: done ? 'var(--green)' : 'var(--ink4)', fontWeight: done ? 500 : 300 }}>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function TrackingDetails({ order, formatDate }: { order: any; formatDate: (value: string) => string }) {
  const expectedDelivery = order.expected_delivery ? formatDate(order.expected_delivery) : 'Not available yet'

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-lg px-3 py-2 min-w-0 overflow-hidden" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory2))' }}>
        <div className="text-[.62rem] tracking-widest uppercase" style={{ color: 'var(--ink4)' }}>Courier</div>
        <div className="text-sm mt-1 truncate" style={{ color: 'var(--ink)' }} title={order.courier_name || ''}>
          {order.courier_name || (order.status === 'shipped' ? 'Assigned soon' : 'After dispatch')}
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 min-w-0 overflow-hidden" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory2))' }}>
        <div className="text-[.62rem] tracking-widest uppercase" style={{ color: 'var(--ink4)' }}>Tracking No.</div>
        <div className="text-sm font-mono mt-1 truncate select-all" style={{ color: 'var(--ink)' }} title={order.tracking_number || ''}>
          {order.tracking_number || 'Not available yet'}
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 min-w-0 overflow-hidden" style={{ border: '1px solid rgb(var(--c-ivory3))', background: 'rgb(var(--c-ivory2))' }}>
        <div className="text-[.62rem] tracking-widest uppercase" style={{ color: 'var(--ink4)' }}>Expected Delivery</div>
        <div className="text-sm mt-1 truncate" style={{ color: 'var(--ink)' }}>{expectedDelivery}</div>
      </div>
      {order.tracking_link && (
        <a href={order.tracking_link} target="_blank" rel="noopener noreferrer" className="sm:col-span-3 btn-outline text-center no-underline justify-center">
          Track with courier
        </a>
      )}
    </div>
  )
}

export default function ProfilePage() {
  // Auth State
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [step, setStep] = useState<'login' | 'verify' | 'dashboard'>('login')
  const [loading, setLoading] = useState(false)
  const [otpHint, setOtpHint] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [initializing, setInitializing] = useState(true)

  // Dashboard Data State
  const [walletBalance, setWalletBalance] = useState(0)
  const [orders, setOrders] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [siteSettings, setSiteSettings] = useState({ enable_cashback_earning: true, enable_cashback_spending: true })

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' }).then(res => res.json()).then(data => setSiteSettings(data)).catch(() => {})
  }, [])

  const clearCart = useCart(s => s.clearCart)
  const addItem = useCart(s => s.addItem)
  const router = useRouter()

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10)

  useEffect(() => {
    const rememberedPhone = readAccountPhone().replace(/\D/g, '').slice(-10)

    if (rememberedPhone.length === 10) {
      setPhone(rememberedPhone)
      setVerifiedPhone(rememberedPhone)
      setStep('dashboard')
      void fetchDashboardData(rememberedPhone)
      setInitializing(false)
      return
    }

    setDataLoading(false)
    setInitializing(false)
  }, [])

  const sendOtp = async () => {
    if (normalizedPhone.length !== 10) {
      showToast('Enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not send OTP')

      setStep('verify')
      setOtpCode('')
      const hint = `OTP sent via WhatsApp`
      setOtpHint(hint)
      showToast('OTP sent successfully')
    } catch (err: any) {
      showToast(err.message || 'Could not send OTP')
    } finally {
      setLoading(false)
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

    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otpCode.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'OTP verification failed')

      saveAccountPhone(normalizedPhone)
      setVerifiedPhone(normalizedPhone)
      setStep('dashboard')
      showToast('Successfully logged in')
      fetchDashboardData(normalizedPhone)
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async (userPhone: string) => {
    setDataLoading(true)
    try {
      // Fetch Wallet
      const walletRes = await fetch(`/api/wallet?phone=${userPhone}`)
      const walletData = await walletRes.json()
      if (walletRes.ok && walletData.wallet) {
        setWalletBalance(walletData.balance || walletData.wallet.balance || 0)
      }

      // Fetch Orders
      const orderRes = await fetch(`/api/orders?phone=${userPhone}`)
      const orderData = await orderRes.json()
      if (orderRes.ok) {
        setOrders(orderData || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err)
      showToast('Failed to load some dashboard data.')
    } finally {
      setDataLoading(false)
    }
  }

  const handleReorder = (order: any) => {
    if (!order.items || order.items.length === 0) return

    clearCart()
    let count = 0
    order.items.forEach((item: any) => {
      addItem({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image || '', // Fallback if missing
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        weight_grams: item.weight_grams || 500, // Fallback
        price: item.price,
        quantity: item.quantity || 1,
      })
      count++
    })

    showToast(`Added ${count} item(s) to your cart`)
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'text-green bg-green-6 border-green-5 dark:border-green/20'
      case 'cancelled': return 'text-terra bg-terra/10 border-terra/20'
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30'
      default: return 'text-ink-2 bg-ivory-3 border-ivory-4 dark:text-ivory dark:bg-green-5/10 dark:border-green-5/20'
    }
  }

  const logout = () => {
    clearAccountPhone()
    setStep('login')
    setVerifiedPhone('')
    setPhone('')
    setOtpCode('')
    setOtpHint('')
    setOrders([])
    setWalletBalance(0)
  }

  if (initializing) {
    return (
      <div className="min-h-[70vh] pt-12 pb-24" style={{ background: 'rgb(var(--c-ivory))' }}>
        <div className="max-w-4xl mx-auto px-[5%]">
          <div className="max-w-md mx-auto rounded-2xl p-8 shadow-soft" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
            <h1 className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>Opening your profile...</h1>
            <p className="text-sm" style={{ color: 'var(--ink3)' }}>Loading your saved account and latest orders.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] pt-12 pb-24 overflow-x-hidden" style={{ background: 'rgb(var(--c-ivory))' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-[5%]">
        
        {step !== 'dashboard' && (
          <div className="max-w-md mx-auto rounded-2xl p-8 shadow-soft" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl mb-2" style={{ color: 'var(--ink)' }}>My Account</h1>
              <p className="text-sm" style={{ color: 'var(--ink3)' }}>Sign in securely with your WhatsApp number</p>
            </div>

            {step === 'login' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: 'var(--ink3)' }}>WhatsApp Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 border border-r-0 rounded-l-lg font-medium" style={{ background: 'rgb(var(--c-ivory3))', borderColor: 'rgb(var(--c-ivory3))', color: 'var(--ink3)' }}>
                      +91
                    </span>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 min-w-0 px-4 py-3 rounded-r-lg font-medium outline-none" 
                      style={{ background: 'rgb(var(--c-ivory2))', color: 'var(--ink)', border: '1px solid rgb(var(--c-ivory3))' }}
                      placeholder="98765 43210" 
                      maxLength={10} 
                    />
                  </div>
                </div>
                <button 
                  onClick={sendOtp} 
                  disabled={loading || normalizedPhone.length !== 10}
                  className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Secure OTP'}
                </button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: 'var(--ink3)' }}>Enter Verification Code</label>
                  <input 
                    type="text" 
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\s/g, ''))}
                    className="w-full px-4 py-3 rounded-lg font-medium text-center tracking-[0.5em] text-xl outline-none" 
                    style={{ background: 'rgb(var(--c-ivory2))', color: 'var(--ink)', border: '1px solid rgb(var(--c-ivory3))' }}
                    placeholder="XXXXXX" 
                    maxLength={6} 
                  />
                  {otpHint && <div className="text-xs mt-2 text-center" style={{ color: 'var(--ink4)' }}>{otpHint}</div>}
                </div>
                <button 
                  onClick={verifyOtp} 
                  disabled={loading || otpCode.length < 4}
                  className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <div className="text-center mt-4">
                  <button onClick={() => setStep('login')} className="text-xs underline hover:text-green bg-transparent border-none cursor-pointer" style={{ color: 'var(--ink4)' }}>Use a different number</button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-3xl" style={{ color: 'var(--ink)' }}>Welcome back</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--ink4)' }}>+91 {verifiedPhone.replace(/(\d{5})(\d{5})/, '$1 $2')}</p>
              </div>
              <button 
                onClick={logout}
                className="text-sm font-medium transition-colors px-4 py-2 border rounded-lg"
                style={{ background: 'rgb(var(--c-ivory2))', borderColor: 'rgb(var(--c-ivory3))', color: 'var(--ink3)' }}
              >
                Log out
              </button>
            </div>

            {dataLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-t-green rounded-full animate-spin" style={{ borderColor: 'rgb(var(--c-ivory3))' }} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                
                {/* Left Column: Wallet & Quick Actions */}
                <div className="space-y-6">
                  {/* Wallet Card */}
                  {siteSettings.enable_cashback_spending && (
                  <div className="rounded-2xl p-6 relative overflow-hidden shadow-sm border" style={{ background: 'rgba(var(--c-green5), 0.1)', borderColor: 'rgba(var(--c-green5), 0.3)' }}>
                    <div className="absolute -right-6 -top-6 opacity-30" style={{ color: 'var(--green)' }}>
                      <Wallet size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--green)' }}>
                        <Wallet size={16} /> Mana Cashback Wallet
                      </div>
                      <div className="font-serif text-4xl mb-2" style={{ color: 'var(--green)' }}>{formatPrice(walletBalance)}</div>
                      <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: 'var(--green2)' }}>
                        Available balance to use on your next purchase. {siteSettings.enable_cashback_earning ? 'Earn 5% cashback on every order!' : ''}
                      </p>
                    </div>
                  </div>
                  )}

                  {/* Need Help Box */}
                  <div className="rounded-2xl p-6 text-center shadow-sm relative overflow-hidden" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>Need help with an order?</p>
                    <a
                      href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Mana!%20I%20have%20a%20question%20regarding%20my%20recent%20order.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full justify-center bg-green shadow-soft"
                    >
                      Chat with Support
                    </a>
                  </div>
                </div>

                {/* Right Column: Order History */}
                <div className="rounded-2xl p-6 sm:p-8 shadow-sm" style={{ background: 'rgb(var(--c-ivory2))', border: '1px solid rgb(var(--c-ivory3))' }}>
                  <h2 className="font-serif text-2xl mb-6 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                    <Package style={{ color: 'var(--green)' }} /> Order History
                  </h2>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 rounded-xl border border-dashed" style={{ background: 'rgb(var(--c-ivory))', borderColor: 'rgb(var(--c-ivory3))' }}>
                      <Clock className="mx-auto mb-3" style={{ color: 'var(--ink4)' }} size={32} />
                      <h3 className="font-medium mb-1" style={{ color: 'var(--ink)' }}>No orders yet</h3>
                      <p className="text-sm mb-4" style={{ color: 'var(--ink4)' }}>When you place an order, it will appear here.</p>
                      <button onClick={() => router.push('/products')} className="btn-outline">
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="rounded-xl overflow-hidden transition-all" style={{ border: '1px solid rgb(var(--c-ivory3))' }}>
                          {/* Order Header */}
                          <div className="px-5 py-4 flex flex-wrap justify-between items-center gap-4" style={{ background: 'rgb(var(--c-ivory3))', borderBottom: '1px solid rgb(var(--c-ivory3))' }}>
                            <div>
                              <div className="text-xs font-mono mb-1" style={{ color: 'var(--ink4)' }}>#{order.order_ref || order.id.slice(0, 8)}</div>
                              <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{formatDate(order.created_at)}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-serif" style={{ color: 'var(--green)' }}>{formatPrice(order.final_amount || order.total)}</div>
                                <div className="text-[.65rem] uppercase tracking-wider" style={{ color: 'var(--ink4)' }}>{order.items?.length || 0} Items</div>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full border border-solid capitalize font-medium ${getStatusColor(order.status)}`}>
                                {(order.status || 'Processing').replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="px-5 pt-4">
                            <TrackingTimeline status={order.status || 'pending'} />
                            {order.status !== 'cancelled' && <TrackingDetails order={order} formatDate={formatDate} />}
                          </div>

                          {/* Order Items */}
                          <div className="px-5 py-4 divide-y divide-ivory-3 dark:divide-green-5/20">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="py-3 flex justify-between items-start gap-4 first:pt-0 last:pb-0">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium line-clamp-1" style={{ color: 'var(--ink)' }}>{item.product_name}</div>
                                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink3)' }}>
                                    {item.quantity} × {item.weight_grams >= 1000 ? (item.weight_grams / 1000).toFixed(1) + 'kg' : item.weight_grams + 'g'}
                                    {item.variant_name ? ` • ${item.variant_name}` : ''}
                                  </div>
                                  {order.status === 'delivered' && item.product_slug && (
                                    <Link
                                      href={`/products/${item.product_slug}#reviews`}
                                      className="inline-flex items-center gap-1 mt-2 text-[0.7rem] font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full transition-colors no-underline dark:bg-amber-900/10 dark:border-amber-800/30"
                                      style={{ color: 'var(--terra)' }}
                                    >
                                      <Star size={10} fill="currentColor" />
                                      Leave a Review
                                    </Link>
                                  )}
                                </div>
                                <div className="text-sm font-serif whitespace-nowrap" style={{ color: 'var(--ink2)' }}>
                                  {formatPrice(item.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Action */}
                          <div className="px-5 py-3 border-t" style={{ background: 'rgba(var(--c-ivory), 0.3)', borderColor: 'rgb(var(--c-ivory3))' }}>
                            <button 
                              onClick={() => handleReorder(order)} 
                              className="text-sm font-medium flex items-center gap-1 hover:text-green-2 transition-colors ml-auto bg-transparent border-none cursor-pointer"
                              style={{ color: 'var(--green)' }}
                            >
                              1-Click Reorder <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
