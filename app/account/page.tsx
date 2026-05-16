'use client'
import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Order } from '@/lib/supabase'

const ACCOUNT_PHONE_KEY = 'mana_account_phone'
const ACCOUNT_COOKIE_KEY = 'mana_account_phone'

const STATUS_STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

type Transaction = {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: 'cashback' | 'usage' | 'adjustment'
  description?: string
  created_at: string
}

type TrackingOrder = Order & {
  tracking_number?: string | null
  tracking_link?: string | null
  courier_name?: string | null
  expected_delivery?: string | null
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, '').slice(-10)
}

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

function getOrderCode(order: TrackingOrder) {
  return order.order_ref || order.id.slice(0, 8).toUpperCase()
}

function getStatusIndex(status: string) {
  if (status === 'cancelled') return -1
  const index = STATUS_STEPS.findIndex((step) => step.key === status)
  return index >= 0 ? index : 0
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available yet'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AccountPage() {
  const [phone, setPhone] = useState('')
  const [savedPhone, setSavedPhone] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [entered, setEntered] = useState(false)
  const [balance, setBalance] = useState(0)
  const [eligible, setEligible] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'none' | 'requested' | 'approved'>('none')
  const [txns, setTxns] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<TrackingOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const latestOrder = useMemo(() => orders[0], [orders])

  const loadAccount = async (rawPhone: string, options?: { remember?: boolean; quiet?: boolean }) => {
    const clean = cleanPhone(rawPhone)
    if (clean.length !== 10) {
      showToast('Enter a valid 10-digit number')
      return
    }

    setLoading(true)
    try {
      const [walletRes, orderRes] = await Promise.all([
        fetch(`/api/wallet?phone=${clean}`),
        fetch(`/api/orders?phone=${clean}`),
      ])
      const [walletData, orderData] = await Promise.all([walletRes.json(), orderRes.json()])

      if (!walletRes.ok) throw new Error(walletData?.error || 'Could not load wallet')
      if (!orderRes.ok) throw new Error(orderData?.error || 'Could not load orders')

      setPhone(clean)
      setSavedPhone(clean)
      setBalance(walletData.balance || 0)
      setEligible(Boolean(walletData.is_cashback_eligible))
      setRequestStatus(walletData.profile?.cashback_request_status || 'none')
      setInstagramHandle(walletData.profile?.instagram_handle || '')
      setTxns(walletData.transactions || [])
      setOrders(Array.isArray(orderData) ? orderData : [])
      setEntered(true)

      if (options?.remember !== false) {
        saveAccountPhone(clean)
      }
      if (!options?.quiet) showToast('Account loaded')
    } catch (err: any) {
      showToast(err.message || 'Could not open account')
    } finally {
      setLoading(false)
      setInitializing(false)
    }
  }

  useEffect(() => {
    const rememberedPhone = readAccountPhone()
    if (rememberedPhone) {
      void loadAccount(rememberedPhone, { remember: false, quiet: true })
      return
    }
    setInitializing(false)
  }, [])

  const lookup = async () => {
    await loadAccount(phone)
  }

  const refreshAccount = async () => {
    if (!savedPhone) return
    if (latestOrder?.order_ref) {
      await fetch(`/api/shipping/track?orderRef=${latestOrder.order_ref}&phone=${savedPhone}`).catch(() => null)
    }
    await loadAccount(savedPhone, { remember: false, quiet: true })
    showToast('Order tracking refreshed')
  }

  const requestCashback = async () => {
    const clean = cleanPhone(savedPhone || phone)
    const res = await fetch('/api/wallet/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: clean, instagram_handle: instagramHandle }),
    })
    const data = await res.json()
    if (!res.ok) {
      showToast(data?.error || 'Could not submit request')
      return
    }
    setRequestStatus('requested')
    showToast('Cashback request submitted')
  }

  const logout = () => {
    clearAccountPhone()
    setPhone('')
    setSavedPhone('')
    setEntered(false)
    setBalance(0)
    setEligible(false)
    setRequestStatus('none')
    setInstagramHandle('')
    setTxns([])
    setOrders([])
  }

  if (initializing) {
    return (
      <div className="px-[5%] py-10 max-w-[980px] mx-auto">
        <div className="bg-white border border-ivory-3 rounded-xl p-8 shadow-soft max-w-md">
          <div className="font-serif text-xl text-ink mb-2">Opening your account...</div>
          <p className="text-sm text-ink-3">Loading your saved profile and latest order tracking.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-[5%] py-10 max-w-[980px] mx-auto">
      <div className="eyebrow">My Account</div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <h1 className="font-serif text-3xl font-light text-ink">
          Wallet, Orders & <em className="not-italic text-green">Cashback</em>
        </h1>
        {entered && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={refreshAccount} disabled={loading} className="btn-outline text-sm py-2 px-4 disabled:opacity-50">
              Refresh tracking
            </button>
            <button onClick={logout} className="text-sm text-ink-3 underline bg-transparent border-none cursor-pointer">
              Switch account
            </button>
          </div>
        )}
      </div>

      {!entered ? (
        <div className="bg-white border border-ivory-3 rounded-xl p-8 shadow-soft max-w-md">
          <div className="text-2xl mb-4">Phone</div>
          <h2 className="font-serif text-xl text-ink mb-1">Enter your WhatsApp number</h2>
          <p className="text-sm text-ink-3 mb-5">We will remember this profile on this device, so you will not need to login again every time.</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder="98765 43210"
            className="input mb-4"
          />
          <button onClick={lookup} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
            <span>{loading ? 'Loading...' : 'Open My Account'}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="bg-green rounded-2xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase text-green-4 mb-2">Logged In As</div>
              <div className="font-serif text-2xl text-ivory">+91 {savedPhone}</div>
              <div className="text-xs text-green-4 mt-1">Saved on this device</div>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase text-green-4 mb-2">Wallet Balance</div>
              <div className="font-serif text-4xl text-ivory">{formatPrice(balance)}</div>
              <div className="text-xs text-green-4 mt-1">Available for next order</div>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase text-green-4 mb-2">Cashback Status</div>
              <div className="font-serif text-2xl text-green-4">
                {eligible ? 'Eligible' : requestStatus === 'requested' ? 'Requested' : 'Not Eligible'}
              </div>
              <div className="text-xs text-green-4 mt-1">5% cashback after delivery</div>
            </div>
          </div>

          {latestOrder && <LatestTrackingCard order={latestOrder} />}

          {!eligible && (
            <div className="bg-white border border-ivory-3 rounded-xl p-5">
              <div className="font-serif text-lg text-ink mb-2">Unlock cashback</div>
              <p className="text-sm text-ink-3 mb-4">
                Follow the brand on Instagram or complete the required action, then submit your handle here for approval.
              </p>
              <div className="flex gap-3 flex-wrap">
                <input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@yourhandle"
                  className="input max-w-[280px]"
                />
                <button onClick={requestCashback} disabled={requestStatus === 'requested'} className="btn-primary">
                  <span>{requestStatus === 'requested' ? 'Request Sent' : 'Request Cashback Access'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-ivory-3 rounded-xl overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-ivory-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-serif text-lg text-ink">Order Tracking</div>
                <div className="text-xs text-ink-4 mt-1">{orders.length} order{orders.length === 1 ? '' : 's'} linked to +91 {savedPhone}</div>
              </div>
              <a href="/checkout" className="btn-primary no-underline text-sm py-2 px-4">
                Shop again
              </a>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-10 text-ink-3 text-sm">No orders found for this number yet.</div>
            ) : (
              <div className="divide-y divide-ivory-3">
                {orders.map((order) => (
                  <OrderTrackingCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-ivory-3 rounded-xl overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-ivory-3">
              <div className="font-serif text-lg text-ink">Wallet Transaction History</div>
            </div>
            {txns.length === 0 ? (
              <div className="text-center py-10 text-ink-3 text-sm">No wallet transactions yet.</div>
            ) : (
              <div className="divide-y divide-ivory-3">
                {txns.map((t) => {
                  const isCredit = t.type === 'credit'
                  return (
                    <div key={t.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="text-sm text-ink">{t.description || t.reason}</div>
                        <div className="text-xs text-ink-4 mt-0.5">{formatDate(t.created_at)}</div>
                      </div>
                      <div className={`font-serif text-base ${isCredit ? 'text-green' : 'text-terra'}`}>
                        {isCredit ? '+' : '-'}{formatPrice(Math.abs(t.amount))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LatestTrackingCard({ order }: { order: TrackingOrder }) {
  return (
    <div className="bg-ivory-2 border border-green-5 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="text-xs tracking-widest uppercase text-green-3 mb-1">Latest Order</div>
          <div className="font-serif text-2xl text-green">#{getOrderCode(order)}</div>
          <div className="text-sm text-ink-3 mt-1">Placed on {formatDate(order.created_at)}</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl text-green">{formatPrice(order.final_amount || order.total)}</div>
          <div className="text-xs text-ink-3 capitalize mt-1">{order.payment_status} payment</div>
        </div>
      </div>
      <StatusTimeline status={order.status} />
      <TrackingMeta order={order} />
    </div>
  )
}

function OrderTrackingCard({ order }: { order: TrackingOrder }) {
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0)
    : 0

  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-medium text-ink">#{getOrderCode(order)}</div>
          <div className="text-xs text-ink-4 mt-1">Placed on {formatDate(order.created_at)}</div>
          <div className="text-xs text-ink-4 mt-1">{itemCount} item{itemCount === 1 ? '' : 's'} - {order.city}, {order.pincode}</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-lg text-green">{formatPrice(order.final_amount || order.total)}</div>
          <div className="text-xs text-ink-3 mt-1 capitalize">{order.status}</div>
        </div>
      </div>

      <div className="mt-4">
        <StatusTimeline status={order.status} compact />
      </div>

      <TrackingMeta order={order} />

      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="mt-4 rounded-lg bg-ivory-2 border border-ivory-3 p-3">
          <div className="text-xs tracking-widest uppercase text-ink-4 mb-2">Items</div>
          <div className="space-y-1">
            {order.items.slice(0, 3).map((item: any, index: number) => (
              <div key={`${item.product_id || item.product_name}-${index}`} className="flex justify-between gap-3 text-xs text-ink-3">
                <span>{item.product_name || item.name || 'Product'} {item.variant_name ? `- ${item.variant_name}` : ''}</span>
                <span>x{item.quantity || 1}</span>
              </div>
            ))}
            {order.items.length > 3 && <div className="text-xs text-ink-4">+{order.items.length - 3} more item(s)</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusTimeline({ status, compact = false }: { status: string; compact?: boolean }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-lg border border-terra/30 bg-terra/10 px-3 py-2 text-sm text-terra">
        This order has been cancelled.
      </div>
    )
  }

  const activeIndex = getStatusIndex(status)

  return (
    <div className={`grid grid-cols-5 gap-2 ${compact ? 'text-[.62rem]' : 'text-xs'}`}>
      {STATUS_STEPS.map((step, index) => {
        const done = index <= activeIndex
        return (
          <div key={step.key} className="flex flex-col items-center text-center gap-1">
            <div className={`h-2 w-full rounded-full ${done ? 'bg-green' : 'bg-ivory-4'}`} />
            <span className={done ? 'text-green-3 font-medium' : 'text-ink-4'}>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function TrackingMeta({ order }: { order: TrackingOrder }) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
      <Meta label="Courier" value={order.courier_name || (order.status === 'shipped' ? 'Assigned soon' : 'After dispatch')} />
      <Meta label="Tracking No." value={order.tracking_number || 'Not available yet'} />
      <Meta label="Expected Delivery" value={formatDate(order.expected_delivery)} />
      <Meta label="Tracking Status" value={order.shiprocket_tracking_status || 'Waiting for courier update'} />
      {order.tracking_link && (
        <a href={order.tracking_link} target="_blank" rel="noopener noreferrer" className="sm:col-span-4 btn-outline text-center no-underline justify-center">
          Track with courier
        </a>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ivory-3 bg-white px-3 py-2">
      <div className="text-[.62rem] tracking-widest uppercase text-ink-4">{label}</div>
      <div className="text-sm text-ink mt-1">{value}</div>
    </div>
  )
}
