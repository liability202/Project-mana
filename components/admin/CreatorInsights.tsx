'use client'
import { useCallback, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatPrice } from '@/lib/utils'
import { RangeFilter } from '@/components/ui/RangeFilter'
import { chartCaption, type DateRange } from '@/lib/date-ranges'

/**
 * Full read-only view of one creator: payout requests waiting on the admin,
 * performance stats, order volume over time, and the orders behind the numbers.
 *
 * Performance figures come from the same endpoints the creator's own portal
 * uses, so admin and creator can never see different numbers for one account.
 */

type PayoutRequest = {
  id: string
  amount: number
  status: 'pending' | 'processed' | 'rejected'
  upi_id?: string | null
  bank_account?: string | null
  bank_ifsc?: string | null
  created_at: string
  processed_at?: string | null
}

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

/** Payment destination, preferring what was captured on the request itself. */
function PaymentDestination({
  upi,
  account,
  ifsc,
  fallbackNote,
}: {
  upi?: string | null
  account?: string | null
  ifsc?: string | null
  fallbackNote?: string
}) {
  const copy = (value: string) => {
    navigator.clipboard?.writeText(value)
  }

  if (upi) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[.58rem] font-bold uppercase tracking-widest text-green-3">UPI</span>
        <span className="font-mono text-sm text-ink font-medium break-all">{upi}</span>
        <button
          onClick={() => copy(upi)}
          className="text-[.58rem] font-bold uppercase tracking-widest text-ink-4 hover:text-green border border-ivory-3 rounded px-2 py-0.5"
        >
          Copy
        </button>
      </div>
    )
  }

  if (account) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[.58rem] font-bold uppercase tracking-widest text-green-3">A/C</span>
          <span className="font-mono text-sm text-ink font-medium break-all">{account}</span>
          <button
            onClick={() => copy(account)}
            className="text-[.58rem] font-bold uppercase tracking-widest text-ink-4 hover:text-green border border-ivory-3 rounded px-2 py-0.5"
          >
            Copy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[.58rem] font-bold uppercase tracking-widest text-ink-4">IFSC</span>
          <span className="font-mono text-xs text-ink-2">{ifsc || '—'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      {fallbackNote || 'No payment details on file — ask the creator to add a UPI ID or bank account in their profile.'}
    </div>
  )
}

export function CreatorInsights({ creator, adminSecret }: { creator: any; adminSecret: string }) {
  const [range, setRange] = useState<DateRange>('month')
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payoutBusy, setPayoutBusy] = useState<string | null>(null)

  const loadPayouts = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/payouts?creatorId=${creator.id}`, {
        headers: { authorization: `Bearer ${adminSecret}` },
      })
      const data = await res.json()
      if (Array.isArray(data)) setPayouts(data)
    } catch {
      /* the section simply stays empty */
    }
  }, [creator.id, adminSecret])

  useEffect(() => {
    void loadPayouts()
  }, [loadPayouts])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      fetch(`/api/creator/stats?creatorId=${creator.id}&range=${range}`).then(r => r.json()),
      fetch(`/api/creator/orders?creatorId=${creator.id}&status=all&range=${range}`).then(r => r.json()),
    ])
      .then(([statsData, ordersData]) => {
        if (cancelled) return
        if (statsData?.error) setError(statsData.error)
        else setStats(statsData)
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      })
      .catch(() => !cancelled && setError('Could not load insights for this creator.'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [creator.id, range])

  const updatePayout = async (id: string, status: 'processed' | 'rejected') => {
    setPayoutBusy(id)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not update the payout request.')
      await loadPayouts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPayoutBusy(null)
    }
  }

  // Commission actually earned in the selected window; the lifetime tiles above
  // don't move with the range picker.
  const liveOrders = orders.filter(o => o.status !== 'cancelled')
  const rangeCommission = liveOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0)
  const rangeRevenue = liveOrders.reduce((sum, o) => sum + (o.order_total || 0), 0)

  const points = stats?.chartData || []
  const tickInterval = points.length > 12 ? Math.ceil(points.length / 10) - 1 : 0

  const pendingPayouts = payouts.filter(p => p.status === 'pending')
  const settledPayouts = payouts.filter(p => p.status !== 'pending')

  const tiles = [
    { label: 'Total Orders', value: stats ? stats.totalOrders : '—', hint: 'Lifetime, excl. cancelled' },
    { label: 'Link Visits', value: stats ? stats.totalVisits ?? 0 : '—', hint: 'Referral link opens' },
    { label: 'Earned', value: formatPrice(creator.total_earned || 0), hint: 'Lifetime commission' },
    { label: 'Paid Out', value: formatPrice(creator.total_paid || 0), hint: 'Settled to date' },
    {
      label: 'Pending',
      value: formatPrice(Math.max(0, (creator.total_earned || 0) - (creator.total_paid || 0))),
      hint: 'Awaiting settlement',
    },
  ]

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg">{error}</div>
      )}

      {/* Payout requests — the reason an admin opens this page */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-1">Payout Requests</h2>
        <p className="text-xs text-ink-4 mb-4">
          Where this creator asked to be paid. Details are captured at request time, so an older request keeps the
          account it was raised against.
        </p>

        {pendingPayouts.length > 0 && (
          <div className="space-y-3 mb-4">
            {pendingPayouts.map(p => (
              <div
                key={p.id}
                className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center gap-5"
              >
                <div className="lg:w-48 shrink-0">
                  <div className="text-[.58rem] font-bold uppercase tracking-widest text-amber-700">
                    Awaiting payment
                  </div>
                  <div className="font-serif text-2xl text-ink mt-1">{formatPrice(p.amount)}</div>
                  <div className="text-[.62rem] text-ink-4 mt-1">Requested {formatDate(p.created_at)}</div>
                </div>

                <div className="flex-1 min-w-0 bg-white border border-ivory-3 rounded-lg px-4 py-3">
                  <div className="text-[.58rem] font-bold uppercase tracking-widest text-ink-4 mb-2">Pay to</div>
                  <PaymentDestination
                    upi={p.upi_id}
                    account={p.bank_account}
                    ifsc={p.bank_ifsc}
                    fallbackNote="This request carries no payment details. Check the creator's profile below before paying."
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (confirm(`Confirm payment of ${formatPrice(p.amount)} to ${creator.name}?`)) {
                        void updatePayout(p.id, 'processed')
                      }
                    }}
                    disabled={payoutBusy === p.id}
                    className="text-[.62rem] font-bold uppercase tracking-widest bg-green text-ivory px-4 py-2.5 rounded-xl shadow-soft hover:bg-green-2 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {payoutBusy === p.id ? 'Saving...' : 'Mark Paid'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Reject this payout request?')) void updatePayout(p.id, 'rejected')
                    }}
                    disabled={payoutBusy === p.id}
                    className="text-[.62rem] font-bold uppercase tracking-widest bg-white text-ink-3 border border-ivory-3 px-4 py-2.5 rounded-xl hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingPayouts.length === 0 && (
          <div className="bg-white border border-ivory-3 rounded-xl px-5 py-6 text-sm text-ink-4 italic font-serif mb-4">
            No payout request waiting on you.
          </div>
        )}

        {/* Payment details the creator keeps on their profile */}
        <div className="bg-white border border-ivory-3 rounded-xl p-5">
          <div className="text-[.58rem] font-bold uppercase tracking-widest text-ink-4 mb-2.5">
            Payment details on profile
          </div>
          <PaymentDestination upi={creator.upi_id} account={creator.bank_account} ifsc={creator.bank_ifsc} />
        </div>

        {settledPayouts.length > 0 && (
          <div className="mt-4 border border-ivory-3 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-2 border-b border-ivory-3">
                <tr>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Requested</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Amount</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Paid to</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Settled</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-3">
                {settledPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-ivory-2/40">
                    <td className="px-4 py-3 text-xs text-ink-2">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 font-serif text-sm text-ink">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-ink-2 font-mono break-all">
                      {p.upi_id || p.bank_account || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-3">{formatDate(p.processed_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[.55rem] font-bold uppercase tracking-widest ${
                          p.status === 'processed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Lifetime tiles */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-4">Lifetime</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tiles.map(tile => (
            <div key={tile.label} className="bg-white border border-ivory-3 rounded-xl p-4 shadow-soft">
              <div className="text-[.6rem] uppercase tracking-wider text-ink-4 font-bold">{tile.label}</div>
              <div className="font-serif text-xl text-ink mt-1.5 leading-none">{tile.value}</div>
              <div className="text-[.58rem] text-ink-4 mt-1.5">{tile.hint}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Range-scoped performance */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl text-ink">Performance</h2>
            <p className="text-[.62rem] text-ink-4 uppercase tracking-wider mt-0.5">
              {chartCaption(range, stats?.chartGranularity || 'day')}
            </p>
          </div>
          <RangeFilter value={range} onChange={setRange} size="sm" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-ivory-3 rounded-xl p-4 shadow-soft">
            <div className="text-[.6rem] uppercase tracking-wider text-ink-4 font-bold">Orders</div>
            <div className="font-serif text-xl text-ink mt-1.5 leading-none">{orders.length}</div>
          </div>
          <div className="bg-white border border-ivory-3 rounded-xl p-4 shadow-soft">
            <div className="text-[.6rem] uppercase tracking-wider text-ink-4 font-bold">Order Value</div>
            <div className="font-serif text-xl text-ink mt-1.5 leading-none">{formatPrice(rangeRevenue)}</div>
          </div>
          <div className="bg-white border border-ivory-3 rounded-xl p-4 shadow-soft">
            <div className="text-[.6rem] uppercase tracking-wider text-ink-4 font-bold">Commission</div>
            <div className="font-serif text-xl text-green mt-1.5 leading-none">{formatPrice(rangeCommission)}</div>
          </div>
        </div>

        <div
          className={`bg-white border border-ivory-3 rounded-xl p-5 shadow-soft h-[300px] w-full transition-opacity ${
            loading ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F5F0E8" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#8A7860', fontWeight: 500 }}
                dy={10}
                interval={tickInterval}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#8A7860', fontWeight: 500 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#FDF0E8', radius: 4 }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #EDE5D6',
                  boxShadow: '0 8px 24px rgba(26,18,8,0.08)',
                  fontSize: '11px',
                  padding: '12px',
                }}
                itemStyle={{ fontWeight: 700, color: '#1C3D2E' }}
              />
              <Bar dataKey="orders" fill="#1C3D2E" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Orders behind the numbers */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-4">Referral Orders</h2>
        <div className="bg-white border border-ivory-3 rounded-xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[620px]">
              <thead className="bg-ivory-2 border-b border-ivory-3">
                <tr>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Date & Order</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Customer</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4 text-right">Value</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4 text-right">Commission</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-3">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-ink-4 text-xs italic">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-ink-4 text-xs italic">
                      No orders in this period.
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id} className="hover:bg-ivory-2/40">
                      <td className="px-4 py-3">
                        <div className="text-ink text-xs font-medium">{formatDate(o.created_at)}</div>
                        <div className="text-[.6rem] text-green-3 uppercase tracking-widest font-bold mt-0.5">
                          #{o.orders?.order_ref || String(o.order_id).slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-2">{o.orders?.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-right text-ink-2">{formatPrice(o.order_total || 0)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-serif text-sm text-green">{formatPrice(o.commission_amount || 0)}</div>
                        <div className="text-[.55rem] text-ink-4 uppercase font-bold mt-0.5">{o.commission_pct}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[.55rem] font-bold uppercase tracking-widest ${
                            o.status === 'paid'
                              ? 'bg-blue-50 text-blue-600'
                              : o.status === 'confirmed'
                              ? 'bg-green-50 text-green-600'
                              : o.status === 'cancelled'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
