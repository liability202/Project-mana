'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import { Package, Wallet, Clock, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
  // Auth State
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [step, setStep] = useState<'login' | 'verify' | 'dashboard'>('login')
  const [loading, setLoading] = useState(false)
  const [otpHint, setOtpHint] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')

  // Dashboard Data State
  const [walletBalance, setWalletBalance] = useState(0)
  const [orders, setOrders] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const clearCart = useCart(s => s.clearCart)
  const addItem = useCart(s => s.addItem)
  const router = useRouter()

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10)

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
      const hint = data.dev_otp ? `Test OTP: ${data.dev_otp}` : `OTP sent via SMS/WhatsApp`
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
        setWalletBalance(walletData.wallet.balance || 0)
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
      case 'delivered': return 'text-green bg-green-6 border-green-5'
      case 'cancelled': return 'text-terra bg-terra/10 border-terra/20'
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-ink-2 bg-ivory-3 border-ivory-4'
    }
  }

  return (
    <div className="min-h-[70vh] bg-ivory pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-[5%]">
        
        {step !== 'dashboard' && (
          <div className="max-w-md mx-auto bg-white border border-ivory-3 rounded-2xl p-8 shadow-soft">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-ink mb-2">My Account</h1>
              <p className="text-sm text-ink-3">Sign in securely with your WhatsApp number</p>
            </div>

            {step === 'login' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider block mb-2">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center justify-center px-4 bg-ivory-2 border border-ivory-3 rounded-lg text-ink-3 font-medium">+91</span>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-4 py-3 border border-ivory-3 rounded-lg text-ink font-medium focus:border-green-3 outline-none" 
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
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider block mb-2">Enter Verification Code</label>
                  <input 
                    type="text" 
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\s/g, ''))}
                    className="w-full px-4 py-3 border border-ivory-3 rounded-lg text-ink font-medium focus:border-green-3 text-center tracking-[0.5em] text-xl outline-none" 
                    placeholder="XXXXXX" 
                    maxLength={6} 
                  />
                  {otpHint && <div className="text-xs text-ink-4 mt-2 text-center">{otpHint}</div>}
                </div>
                <button 
                  onClick={verifyOtp} 
                  disabled={loading || otpCode.length < 4}
                  className="btn-primary w-full justify-center py-3.5 mt-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <div className="text-center mt-4">
                  <button onClick={() => setStep('login')} className="text-xs text-ink-4 underline hover:text-green">Use a different number</button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
                <p className="text-ink-4 text-sm mt-1">+91 {verifiedPhone.replace(/(\d{5})(\d{5})/, '$1 $2')}</p>
              </div>
              <button 
                onClick={() => {
                  setStep('login')
                  setVerifiedPhone('')
                  setPhone('')
                  setOtpCode('')
                }}
                className="text-sm font-medium text-ink-3 hover:text-terra transition-colors px-4 py-2 border border-ivory-3 rounded-lg bg-white"
              >
                Log out
              </button>
            </div>

            {dataLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-8 h-8 border-4 border-ivory-3 border-t-green rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-start">
                
                {/* Left Column: Wallet & Quick Actions */}
                <div className="space-y-6">
                  {/* Wallet Card */}
                  <div className="bg-green-6 border-2 border-green-5 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                    <div className="absolute -right-6 -top-6 text-green-5 opacity-50">
                      <Wallet size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-sm font-semibold text-green mb-1 flex items-center gap-2">
                        <Wallet size={16} /> Mana Cashback Wallet
                      </div>
                      <div className="font-serif text-4xl text-green mb-2">{formatPrice(walletBalance)}</div>
                      <p className="text-xs text-green-2 leading-relaxed max-w-[200px]">
                        Available balance to use on your next purchase. Earn 5% cashback on every order!
                      </p>
                    </div>
                  </div>

                  {/* Need Help Box */}
                  <div className="bg-white border border-ivory-3 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
                    <p className="text-sm font-medium text-ink mb-3">Need help with an order?</p>
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
                <div className="bg-white border border-ivory-3 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <h2 className="font-serif text-2xl text-ink mb-6 flex items-center gap-2">
                    <Package className="text-green" /> Order History
                  </h2>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 bg-ivory-2 rounded-xl border border-dashed border-ivory-3">
                      <Clock className="mx-auto text-ink-4 mb-3" size={32} />
                      <h3 className="text-ink font-medium mb-1">No orders yet</h3>
                      <p className="text-sm text-ink-4 mb-4">When you place an order, it will appear here.</p>
                      <button onClick={() => router.push('/products')} className="btn-outline">
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-ivory-3 rounded-xl overflow-hidden transition-all hover:border-green-4">
                          {/* Order Header */}
                          <div className="bg-ivory-2 px-5 py-4 border-b border-ivory-3 flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <div className="text-xs font-mono text-ink-4 mb-1">#{order.order_ref || order.id.slice(0, 8)}</div>
                              <div className="text-sm font-medium text-ink">{formatDate(order.created_at)}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-serif text-green">{formatPrice(order.final_amount || order.total)}</div>
                                <div className="text-[.65rem] text-ink-4 uppercase tracking-wider">{order.items?.length || 0} Items</div>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full border border-solid capitalize font-medium ${getStatusColor(order.status)}`}>
                                {(order.status || 'Processing').replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="px-5 py-4 divide-y divide-ivory-3">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="py-3 flex justify-between items-center gap-4 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-ink line-clamp-1">{item.product_name}</div>
                                  <div className="text-xs text-ink-3 mt-0.5">
                                    {item.quantity} × {item.weight_grams >= 1000 ? (item.weight_grams / 1000).toFixed(1) + 'kg' : item.weight_grams + 'g'}
                                    {item.variant_name ? ` • ${item.variant_name}` : ''}
                                  </div>
                                </div>
                                <div className="text-sm font-serif text-ink-2 whitespace-nowrap">
                                  {formatPrice(item.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Order Action */}
                          <div className="px-5 py-3 bg-ivory/50 border-t border-ivory-3">
                            <button 
                              onClick={() => handleReorder(order)} 
                              className="text-sm font-medium text-green flex items-center gap-1 hover:text-green-2 transition-colors ml-auto"
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
