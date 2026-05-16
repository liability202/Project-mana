'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

type TrackingOrder = {
  id: string
  order_ref?: string
  customer_name: string
  customer_phone: string
  status: string
  payment_status: string
  final_amount?: number
  total: number
  created_at: string
  courier_name?: string | null
  tracking_number?: string | null
  tracking_link?: string | null
  expected_delivery?: string | null
  shiprocket_tracking_status?: string | null
  items?: any[]
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, '').slice(-10)
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available yet'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const [orderRef, setOrderRef] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    setLoading(true)
    setError('')
    try {
      const ref = orderRef.trim().toUpperCase()
      const normalizedPhone = cleanPhone(phone)
      const res = await fetch(`/api/shipping/track?orderRef=${encodeURIComponent(ref)}&phone=${normalizedPhone}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not track this order.')
      setOrder(data.order || null)
    } catch (err: any) {
      setOrder(null)
      setError(err.message || 'Could not track this order.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initialOrderRef = searchParams.get('orderRef') || ''
    const initialPhone = searchParams.get('phone') || ''
    if (!initialOrderRef || !initialPhone) return

    setOrderRef(initialOrderRef.toUpperCase())
    setPhone(initialPhone)
  }, [searchParams])

  useEffect(() => {
    if (!orderRef || cleanPhone(phone).length !== 10) return
    void lookup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRef, phone])

  return (
    <div className="px-[5%] py-10 max-w-[900px] mx-auto">
      <div className="eyebrow">Track Order</div>
      <h1 className="font-serif text-3xl font-light text-ink mb-3">Track your Mana shipment</h1>
      <p className="text-sm text-ink-3 mb-6">Enter your order ID and phone number to see the latest NimbusPost tracking details.</p>

      <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <input value={orderRef} onChange={e => setOrderRef(e.target.value.toUpperCase())} placeholder="Order ID (e.g. MANA123456)" className="input" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="input" />
          <button onClick={lookup} disabled={loading} className="btn-primary justify-center">
            <span>{loading ? 'Checking...' : 'Track Order'}</span>
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-terra">{error}</div>}
      </div>

      {order && (
        <div className="bg-white border border-ivory-3 rounded-xl p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <div className="text-xs tracking-widest uppercase text-green-4 mb-1">Order</div>
              <div className="font-serif text-2xl text-green">#{order.order_ref || order.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-sm text-ink-3 mt-1">Placed on {formatDate(order.created_at)}</div>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl text-green">{formatPrice(order.final_amount || order.total)}</div>
              <div className="text-xs text-ink-3 mt-1 capitalize">{order.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Meta label="Courier" value={order.courier_name || 'Pending'} />
            <Meta label="Tracking No." value={order.tracking_number || 'Pending'} />
            <Meta label="Expected Delivery" value={formatDate(order.expected_delivery)} />
            <Meta label="Tracking Status" value={order.shiprocket_tracking_status || 'Waiting for update'} />
          </div>

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="mt-5 rounded-xl border border-ivory-3 bg-ivory-2 p-4">
              <div className="text-xs tracking-widest uppercase text-ink-4 mb-2">Items</div>
              <div className="space-y-2 text-sm text-ink-3">
                {order.items.map((item: any, index: number) => (
                  <div key={`${item.product_name || item.name}-${index}`} className="flex justify-between gap-3">
                    <span>{item.product_name || item.name || 'Product'} {item.variant_name ? `- ${item.variant_name}` : ''}</span>
                    <span>x{item.quantity || 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.tracking_link && (
            <a href={order.tracking_link} className="btn-outline no-underline inline-flex mt-5" target="_blank" rel="noopener noreferrer">
              Open tracking link
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ivory-3 bg-ivory-2 px-3 py-3">
      <div className="text-[.62rem] tracking-widest uppercase text-ink-4">{label}</div>
      <div className="text-sm text-ink mt-1">{value}</div>
    </div>
  )
}
