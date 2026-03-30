'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import type { Coupon, Order, Product } from '@/lib/supabase'

type AdminTab = 'orders' | 'products' | 'coupons' | 'customers'
type OrderFilter = 'all' | 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
type CustomerSnapshot = {
  balance: number
  is_cashback_eligible: boolean
  profile?: {
    phone?: string
    instagram_handle?: string | null
    cashback_request_status?: 'none' | 'requested' | 'approved'
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packed: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const ORDER_FILTERS: OrderFilter[] = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

function getDeadlineDate(order: Order) {
  const created = new Date(order.created_at)
  const deadline = new Date(created)
  const status = order.status

  if (status === 'pending') deadline.setDate(deadline.getDate() + 1)
  else if (status === 'confirmed') deadline.setDate(deadline.getDate() + 2)
  else if (status === 'packed') deadline.setDate(deadline.getDate() + 3)
  else if (status === 'shipped') deadline.setDate(deadline.getDate() + 7)
  else deadline.setDate(deadline.getDate() + 5)

  return deadline
}

function isOverdue(order: Order) {
  if (order.status === 'delivered' || order.status === 'cancelled') return false
  return getDeadlineDate(order).getTime() < Date.now()
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<AdminTab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    influencer_name: '',
    commission_rate: '',
    min_order_amount: '',
    max_discount: '',
    usage_limit: '',
    is_active: true,
  })
  const [couponMessage, setCouponMessage] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerData, setCustomerData] = useState<CustomerSnapshot | null>(null)
  const [customerMessage, setCustomerMessage] = useState('')

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
    const [oRes, pRes, cRes] = await Promise.all([
      fetch('/api/orders', { headers: { authorization: `Bearer ${secret}` } }),
      fetch('/api/products'),
      fetch('/api/coupons', { headers: { authorization: `Bearer ${secret}` } }),
    ])
    const [o, p, c] = await Promise.all([oRes.json(), pRes.json(), cRes.json()])
    if (Array.isArray(o)) setOrders(o)
    if (Array.isArray(p)) setProducts(p)
    if (Array.isArray(c)) setCoupons(c)
    setLoading(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem('mana_admin')
    if (saved) {
      setAuth(true)
      loadData(saved)
    }
  }, [])

  const updateOrderStatus = async (id: string, status: string) => {
    const secret = localStorage.getItem('mana_admin') || ''
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify({ id, status }),
    })
    const updated = await res.json()
    if (res.ok) {
      setOrders(prev => prev.map(order => order.id === id ? updated : order))
    }
  }

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    const secret = localStorage.getItem('mana_admin') || ''
    setCouponMessage('')

    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        code: couponForm.code,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value || 0),
        influencer_name: couponForm.influencer_name || null,
        commission_rate: couponForm.commission_rate ? Number(couponForm.commission_rate) : null,
        min_order_amount: couponForm.min_order_amount ? Math.round(Number(couponForm.min_order_amount) * 100) : 0,
        max_discount: couponForm.max_discount ? Math.round(Number(couponForm.max_discount) * 100) : null,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
        is_active: couponForm.is_active,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setCouponMessage(data?.error || 'Could not create coupon.')
      return
    }

    setCoupons(prev => [data, ...prev])
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      influencer_name: '',
      commission_rate: '',
      min_order_amount: '',
      max_discount: '',
      usage_limit: '',
      is_active: true,
    })
    setCouponMessage('Coupon created successfully.')
  }

  const lookupCustomer = async () => {
    const phone = customerPhone.replace(/\D/g, '')
    if (phone.length < 10) {
      setCustomerMessage('Enter a valid phone number.')
      return
    }
    const data = await fetch(`/api/wallet?phone=${phone}`).then(res => res.json())
    setCustomerData(data)
    setCustomerMessage('')
  }

  const updateCustomerEligibility = async (eligible: boolean) => {
    const phone = customerPhone.replace(/\D/g, '')
    const secret = localStorage.getItem('mana_admin') || ''
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        phone,
        is_cashback_eligible: eligible,
        instagram_handle: customerData?.profile?.instagram_handle || null,
        cashback_request_status: eligible ? 'approved' : 'none',
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCustomerMessage(data?.error || 'Could not update cashback eligibility.')
      return
    }
    setCustomerData(prev => prev ? {
      ...prev,
      is_cashback_eligible: eligible,
      profile: {
        ...prev.profile,
        cashback_request_status: eligible ? 'approved' : 'none',
      },
    } : prev)
    setCustomerMessage(`Cashback ${eligible ? 'approved' : 'removed'} for this customer.`)
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

  const paidRevenue = orders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + (order.final_amount || order.total), 0)
  const filteredOrders = orders.filter(order => orderFilter === 'all' ? true : order.status === orderFilter)

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-green px-6 py-3 flex items-center justify-between">
        <div className="font-serif text-ivory text-lg">MANA Admin</div>
        <div className="flex gap-3">
          <button onClick={() => setTab('orders')} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${tab === 'orders' ? 'bg-ivory text-green border-ivory' : 'bg-transparent text-green-4 border-green-5/30'}`}>Orders</button>
          <button onClick={() => setTab('products')} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${tab === 'products' ? 'bg-ivory text-green border-ivory' : 'bg-transparent text-green-4 border-green-5/30'}`}>Products</button>
          <button onClick={() => setTab('coupons')} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${tab === 'coupons' ? 'bg-ivory text-green border-ivory' : 'bg-transparent text-green-4 border-green-5/30'}`}>Coupons</button>
          <button onClick={() => setTab('customers')} className={`text-xs px-3 py-1.5 rounded-md border transition-all ${tab === 'customers' ? 'bg-ivory text-green border-ivory' : 'bg-transparent text-green-4 border-green-5/30'}`}>Customers</button>
          <button onClick={() => { localStorage.removeItem('mana_admin'); setAuth(false) }} className="text-xs text-green-4 hover:text-ivory transition-colors">Logout</button>
        </div>
      </div>

      <div className="px-6 py-6 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'Pending', value: orders.filter(order => order.status === 'pending').length },
            { label: 'Revenue', value: formatPrice(paidRevenue) },
            { label: 'Coupons', value: coupons.length },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-ivory-3 rounded-xl p-4">
              <div className="text-xs text-ink-4 mb-1">{stat.label}</div>
              <div className="font-serif text-2xl text-ink">{stat.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-ink-3">Loading...</div>
        ) : tab === 'orders' ? (
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="font-serif text-xl text-ink">Orders</h2>
                <div className="text-sm text-ink-3 mt-1">{filteredOrders.length} shown</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {ORDER_FILTERS.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setOrderFilter(filter)}
                    className={`text-xs px-3 py-1.5 rounded-md border transition-all ${orderFilter === filter ? 'bg-green text-ivory border-green' : 'bg-white text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'}`}
                  >
                    {filter === 'all' ? 'All Orders' : `${filter[0].toUpperCase()}${filter.slice(1)}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {filteredOrders.length === 0 && <div className="text-ink-3 text-sm">No orders in this stage</div>}
              {filteredOrders.map(order => {
                const deadline = getDeadlineDate(order)
                const overdue = isOverdue(order)
                return (
                <div key={order.id} className={`bg-white border rounded-xl p-5 ${overdue ? 'border-terra' : 'border-ivory-3'}`}>
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div>
                      <div className="text-xs text-ink-4 mb-0.5">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="font-medium text-ink">{order.customer_name}</div>
                      <div className="text-sm text-ink-3">{order.customer_phone}</div>
                      <div className="text-xs text-ink-4 mt-0.5">{order.city} - {order.pincode}</div>
                      {order.coupon_code && <div className="text-xs text-green-3 mt-1">Coupon: {order.coupon_code}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-xl text-green">{formatPrice(order.final_amount || order.total)}</div>
                      <div className="text-xs text-ink-4 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded border mt-1 ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-xs">
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-ink-4 mb-1">Order Date</div>
                      <div className="font-medium text-ink">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 ${overdue ? 'bg-red-50' : 'bg-ivory-2'}`}>
                      <div className="text-ink-4 mb-1">Deadline Date</div>
                      <div className={`font-medium ${overdue ? 'text-red-700' : 'text-ink'}`}>
                        {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 ${overdue ? 'bg-red-50' : 'bg-ivory-2'}`}>
                      <div className="text-ink-4 mb-1">Priority</div>
                      <div className={`font-medium ${overdue ? 'text-red-700' : 'text-green-3'}`}>
                        {overdue ? 'Overdue' : 'On track'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 text-xs">
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-ink-4 mb-1">Discount</div>
                      <div className="font-medium text-ink">{formatPrice(order.discount_amount || order.discount || 0)}</div>
                    </div>
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-ink-4 mb-1">Wallet Used</div>
                      <div className="font-medium text-ink">{formatPrice(order.wallet_used || 0)}</div>
                    </div>
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-ink-4 mb-1">Cashback</div>
                      <div className="font-medium text-ink">{formatPrice(order.cashback_earned || 0)}</div>
                    </div>
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-ink-4 mb-1">Payment</div>
                      <div className="font-medium text-ink">{order.payment_status}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mb-3 text-sm text-ink-3">
                    {(order.items as any[]).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}{item.weight_grams ? ` - ${item.weight_grams >= 1000 ? (item.weight_grams / 1000).toFixed(1) + 'kg' : item.weight_grams + 'g'}` : ''} × {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(order.id, status)}
                        className={`text-xs px-3 py-1 rounded-md border transition-all cursor-pointer ${order.status === status ? 'bg-green text-ivory border-green' : 'bg-transparent text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        ) : tab === 'products' ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-xl text-ink">Products</h2>
              <div className="flex gap-2">
                <a href="/admin/kit/new" className="btn-outline text-sm py-2 px-4 no-underline">+ Add Kit</a>
                <a href="/admin/product/new" className="btn-primary text-sm py-2 px-4 no-underline">+ Add Product</a>
              </div>
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
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-ivory-2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{product.name}</div>
                        <div className="text-xs text-ink-4">{product.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-3 capitalize">{product.category.replace('-', ' ')}</td>
                      <td className="px-4 py-3 font-serif text-green">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${product.in_stock ? 'bg-green-6 text-green-2 border-green-5' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a href={`/admin/product/${product.id}`} className="text-xs text-green-3 hover:text-green no-underline">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'coupons' ? (
          <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
            <form onSubmit={createCoupon} className="bg-white border border-ivory-3 rounded-xl p-5">
              <h2 className="font-serif text-xl text-ink mb-4">Create Coupon</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Coupon Code</label>
                  <input value={couponForm.code} onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="input" placeholder="SHUBH10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-ink-3 block mb-1.5">Discount Type</label>
                    <select value={couponForm.discount_type} onChange={e => setCouponForm(prev => ({ ...prev, discount_type: e.target.value }))} className="input">
                      <option value="percentage">percentage</option>
                      <option value="fixed">fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-ink-3 block mb-1.5">Discount Value</label>
                    <input value={couponForm.discount_value} onChange={e => setCouponForm(prev => ({ ...prev, discount_value: e.target.value }))} className="input" inputMode="decimal" placeholder="10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Influencer Name</label>
                  <input value={couponForm.influencer_name} onChange={e => setCouponForm(prev => ({ ...prev, influencer_name: e.target.value }))} className="input" placeholder="Shubh" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Commission Rate (%)</label>
                  <input value={couponForm.commission_rate} onChange={e => setCouponForm(prev => ({ ...prev, commission_rate: e.target.value }))} className="input" inputMode="decimal" placeholder="10" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Minimum Order (₹)</label>
                  <input value={couponForm.min_order_amount} onChange={e => setCouponForm(prev => ({ ...prev, min_order_amount: e.target.value }))} className="input" inputMode="decimal" placeholder="500" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Max Discount (₹)</label>
                  <input value={couponForm.max_discount} onChange={e => setCouponForm(prev => ({ ...prev, max_discount: e.target.value }))} className="input" inputMode="decimal" placeholder="250" />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1.5">Usage Limit</label>
                  <input value={couponForm.usage_limit} onChange={e => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))} className="input" inputMode="numeric" placeholder="100" />
                </div>
                <label className="flex items-center gap-3 text-sm text-ink cursor-pointer">
                  <input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm(prev => ({ ...prev, is_active: e.target.checked }))} className="h-4 w-4 accent-[var(--green)]" />
                  Active coupon
                </label>
                {couponMessage && <div className="text-sm text-ink-3">{couponMessage}</div>}
                <button type="submit" className="btn-primary w-full justify-center">Create Coupon</button>
              </div>
            </form>

            <div className="bg-white border border-ivory-3 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-ivory-3">
                <h2 className="font-serif text-xl text-ink">Coupon Performance</h2>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ivory-2 border-b border-ivory-3">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Code</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Discount</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Influencer</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Orders</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Revenue</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Discount Given</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-ink-4 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-3">
                    {coupons.map(coupon => (
                      <tr key={coupon.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{coupon.code}</div>
                          {coupon.commission_rate != null && <div className="text-xs text-ink-4">{coupon.commission_rate}% commission</div>}
                        </td>
                        <td className="px-4 py-3 text-ink-3">
                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}
                          {(coupon.min_order_amount || coupon.max_discount || coupon.usage_limit) ? (
                            <div className="text-xs text-ink-4 mt-1">
                              {coupon.min_order_amount ? `Min ${formatPrice(coupon.min_order_amount)}` : 'No min'}
                              {coupon.max_discount ? ` · Max ${formatPrice(coupon.max_discount)}` : ''}
                              {coupon.usage_limit ? ` · Limit ${coupon.usage_limit}` : ''}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-ink-3">{coupon.influencer_name || '-'}</td>
                        <td className="px-4 py-3 text-ink-3">{coupon.total_orders || coupon.usage_count || 0}</td>
                        <td className="px-4 py-3 text-ink-3">{formatPrice(coupon.total_revenue || 0)}</td>
                        <td className="px-4 py-3 text-ink-3">{formatPrice(coupon.total_discount_given || 0)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded border ${coupon.is_active ? 'bg-green-6 text-green-2 border-green-5' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-ink-3">No coupons created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
            <div className="bg-white border border-ivory-3 rounded-xl p-5">
              <h2 className="font-serif text-xl text-ink mb-4">Cashback Eligibility</h2>
              <div className="space-y-4">
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input" placeholder="Customer phone number" />
                <button onClick={lookupCustomer} className="btn-primary w-full justify-center">Lookup Customer</button>
                {customerMessage && <div className="text-sm text-ink-3">{customerMessage}</div>}
              </div>
            </div>
            <div className="bg-white border border-ivory-3 rounded-xl p-5">
              <h2 className="font-serif text-xl text-ink mb-4">Customer Snapshot</h2>
              {!customerData ? (
                <div className="text-sm text-ink-3">Lookup a customer to view cashback status and wallet details.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-xs text-ink-4 mb-1">Wallet Balance</div>
                      <div className="font-medium text-ink">{formatPrice(customerData.balance || 0)}</div>
                    </div>
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-xs text-ink-4 mb-1">Eligibility</div>
                      <div className="font-medium text-ink">{customerData.is_cashback_eligible ? 'Eligible' : 'Not eligible'}</div>
                    </div>
                    <div className="rounded-lg bg-ivory-2 p-3">
                      <div className="text-xs text-ink-4 mb-1">Request Status</div>
                      <div className="font-medium text-ink capitalize">{customerData.profile?.cashback_request_status || 'none'}</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-ivory-2 p-3">
                    <div className="text-xs text-ink-4 mb-1">Instagram Handle</div>
                    <div className="font-medium text-ink">{customerData.profile?.instagram_handle || 'Not provided'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateCustomerEligibility(true)} className="btn-primary">Approve Cashback</button>
                    <button onClick={() => updateCustomerEligibility(false)} className="btn-outline">Remove Eligibility</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
