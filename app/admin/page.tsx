'use client'
import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { Product, Order } from '@/lib/supabase'

const ADMIN_SECRET = typeof window !== 'undefined' ? localStorage.getItem('mana_admin') || '' : ''

export default function AdminPage() {
  const [auth, setAuth]         = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab]           = useState<'orders' | 'products'>('orders')
  const [orders, setOrders]     = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(false)

  const login = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_HINT || password.length > 6) {
      localStorage.setItem('mana_admin', password)
      setAuth(true)
      loadData(password)
    } else {
      alert('Wrong password')
    }
  }

  const loadData = async (secret: string) => {
    setLoading(true)
    const [oRes, pRes] = await Promise.all([
      fetch('/api/orders', { headers: { authorization: `Bearer ${secret}` } }),
      fetch('/api/products'),
    ])
    const [o, p] = await Promise.all([oRes.json(), pRes.json()])
    if (Array.isArray(o)) setOrders(o)
    if (Array.isArray(p)) setProducts(p)
    setLoading(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem('mana_admin')
    if (saved) { setAuth(true); loadData(saved) }
  }, [])

  const updateOrderStatus = async (id: string, status: string) => {
    const secret = localStorage.getItem('mana_admin') || ''
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify({ id, status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o))
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
        <div className="bg-white border border-ivory-3 rounded-xl p-8 w-full max-w-sm shadow-soft">
          <div className="font-serif text-2xl text-green mb-1">MANA</div>
          <div className="text-xs text-ink-4 mb-6">Admin Panel</div>
          <label className="text-xs text-ink-3 block mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="input mb-4"
            placeholder="Enter admin password"
          />
          <button onClick={login} className="btn-primary w-full justify-center">Login</button>
        </div>
      </div>
    )
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    packed: 'bg-purple-50 text-purple-700 border-purple-200',
    shipped: 'bg-orange-50 text-orange-700 border-orange-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Admin nav */}
      <div className="bg-green px-6 py-3 flex items-center justify-between">
        <div className="font-serif text-ivory text-lg">MANA Admin</div>
        <div className="flex gap-3">
          <button onClick={() => setTab('orders')} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${tab === 'orders' ? 'bg-ivory text-green border-ivory' : 'bg-transparent text-green-4 border-green-5/30'}`}>Orders</button>
          <button onClick={() => setTab('products')} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${tab === 'products' ? 'bg-ivory text-green border-ivory' : 'bg-transparent text-green-4 border-green-5/30'}`}>Products</button>
          <button onClick={() => { localStorage.removeItem('mana_admin'); setAuth(false) }} className="text-xs text-green-4 hover:text-ivory transition-colors">Logout</button>
        </div>
      </div>

      <div className="px-6 py-6 max-w-[1200px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length },
            { label: 'Revenue', value: formatPrice(orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0)) },
            { label: 'Products', value: products.length },
          ].map(s => (
            <div key={s.label} className="bg-white border border-ivory-3 rounded-xl p-4">
              <div className="text-xs text-ink-4 mb-1">{s.label}</div>
              <div className="font-serif text-2xl text-ink">{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-3">Loading…</div>
        ) : tab === 'orders' ? (
          <div>
            <h2 className="font-serif text-xl text-ink mb-4">Orders</h2>
            <div className="flex flex-col gap-3">
              {orders.length === 0 && <div className="text-ink-3 text-sm">No orders yet</div>}
              {orders.map(order => (
                <div key={order.id} className="bg-white border border-ivory-3 rounded-xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div>
                      <div className="text-xs text-ink-4 mb-0.5">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="font-medium text-ink">{order.customer_name}</div>
                      <div className="text-sm text-ink-3">{order.customer_phone}</div>
                      <div className="text-xs text-ink-4 mt-0.5">{order.city} — {order.pincode}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-xl text-green">{formatPrice(order.total)}</div>
                      <div className="text-xs text-ink-4 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded border mt-1 ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-1 mb-3 text-sm text-ink-3">
                    {(order.items as any[]).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}{item.weight_grams ? ` — ${item.weight_grams >= 1000 ? (item.weight_grams/1000).toFixed(1)+'kg' : item.weight_grams+'g'}` : ''} × {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status update */}
                  <div className="flex gap-2 flex-wrap">
                    {['pending','confirmed','packed','shipped','delivered','cancelled'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus(order.id, s)}
                        className={`text-xs px-3 py-1 rounded-md border transition-all cursor-pointer ${order.status === s ? 'bg-green text-ivory border-green' : 'bg-transparent text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'}`}
                      >
                        {s}
                      </button>
                    ))}
                    <a
                      href={`https://wa.me/${order.customer_phone.replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(order.customer_name)}!%20Your%20Mana%20order%20%23${order.id.slice(0,8).toUpperCase()}%20status%20is%3A%20${order.status}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1 rounded-md border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all no-underline"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-xl text-ink">Products</h2>
              <a href="/admin/product/new" className="btn-primary text-sm py-2 px-4 no-underline">+ Add Product</a>
            </div>
            <div className="bg-white border border-ivory-3 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ivory-2 border-b border-ivory-3">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Product</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Category</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Price</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Stock</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-3">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-ivory-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="text-xs text-ink-4">{p.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-3 capitalize">{p.category.replace('-',' ')}</td>
                      <td className="px-4 py-3 font-serif text-green">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${p.in_stock ? 'bg-green-6 text-green-2 border-green-5' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {p.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`/admin/product/${p.id}`} className="text-xs text-green-3 hover:text-green no-underline">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
