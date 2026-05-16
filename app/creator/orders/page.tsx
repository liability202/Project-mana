'use client'
import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'

export default function CreatorOrdersPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const creatorStr = sessionStorage.getItem('mana_creator')
    if (creatorStr) {
      const creator = JSON.parse(creatorStr)
      fetchOrders(creator.id, filter)
    }
  }, [filter])

  const fetchOrders = async (creatorId: string, status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/creator/orders?creatorId=${creatorId}&status=${status}`)
      const data = await res.json()
      if (res.ok) {
        setCommissions(data)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'confirmed': return 'bg-green-50 text-green-600 border-green-100'
      case 'paid': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header>
        <h1 className="font-serif text-3xl text-ink mb-1.5 font-light">Referral Orders</h1>
        <p className="text-sm text-ink-3">A transparent log of every order placed using your code and its current settlement status.</p>
      </header>

      <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none">
        {['all', 'pending', 'confirmed', 'paid', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-[.68rem] font-bold uppercase tracking-wider border transition-all whitespace-nowrap shadow-sm ${
              filter === f 
                ? 'bg-green text-ivory border-green shadow-soft' 
                : 'bg-white text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border border-ivory-3 rounded-2xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-ivory-2/80 border-b border-ivory-3">
                <th className="px-6 py-5 text-[.65rem] font-bold uppercase tracking-[.2em] text-ink-4">Date & Order ID</th>
                <th className="px-6 py-5 text-[.65rem] font-bold uppercase tracking-[.2em] text-ink-4">Customer</th>
                <th className="px-6 py-5 text-[.65rem] font-bold uppercase tracking-[.2em] text-ink-4">Products</th>
                <th className="px-6 py-5 text-[.65rem] font-bold uppercase tracking-[.2em] text-ink-4 text-right">Order Value</th>
                <th className="px-6 py-5 text-[.65rem] font-bold uppercase tracking-[.2em] text-ink-4 text-right">Commission</th>
                <th className="px-6 py-5 text-[.65rem] font-bold uppercase tracking-[.2em] text-ink-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-3">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border-2 border-ivory-3 border-t-green animate-spin mb-3" />
                      <p className="text-ink-4 font-serif italic text-sm">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-ink-4 italic font-serif">
                     <div className="text-2xl mb-2">📦</div>
                     No orders found in this category yet.
                  </td>
                </tr>
              ) : (
                commissions.map(c => (
                  <tr key={c.id} className="hover:bg-ivory-2/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[.62rem] text-green-3 uppercase tracking-widest font-bold mt-1">#{c.orders?.order_ref || c.order_id.slice(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-ink-2 font-medium">
                        {c.orders?.customer_name?.split(' ')[0]} {c.orders?.customer_name?.split(' ').slice(1).map((n: string) => n?.[0] + '.').join(' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-ink-3">
                        <span className="text-[.82rem]">{c.orders?.items?.[0]?.product_name}</span>
                        {c.orders?.items?.length > 1 && (
                          <span className="text-[.62rem] font-bold bg-ivory-3 text-ink-4 px-1.5 py-0.5 rounded-md ml-2 inline-block">+{c.orders.items.length - 1} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-ink-2">
                       {formatPrice(c.order_total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-serif text-[1.05rem] text-green font-normal">{formatPrice(c.commission_amount)}</div>
                      <div className="text-[.58rem] text-ink-4 uppercase tracking-tighter mt-1 font-bold">{c.commission_pct}% commission</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-3 py-1 rounded-lg text-[.6rem] font-bold uppercase tracking-widest border border-solid ${getStatusColor(c.status)} shadow-sm`}>
                         {c.status}
                       </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
