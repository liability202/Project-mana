'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { RangeFilter } from '@/components/ui/RangeFilter'
import { type DateRange } from '@/lib/date-ranges'

/**
 * Performance of the built-in loyalty code, shown apart from the coupon table
 * because LOYAL12 has no row in `coupons` — it is granted in code to returning
 * customers, so it can never appear in that list.
 */
export function LoyaltyPanel({ adminSecret }: { adminSecret: string }) {
  const [range, setRange] = useState<DateRange>('all')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`/api/admin/loyalty?range=${range}`, { headers: { authorization: `Bearer ${adminSecret}` } })
      .then(async res => {
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error || 'Could not load loyalty analytics.')
        return body
      })
      .then(body => !cancelled && setData(body))
      .catch(err => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [range, adminSecret])

  const tiles = data
    ? [
        { label: 'Orders', value: String(data.totalOrders), hint: 'Excl. cancelled' },
        { label: 'Revenue', value: formatPrice(data.revenue), hint: 'Subtotal before discount' },
        { label: 'Discount Given', value: formatPrice(data.discountGiven), hint: `${data.discount_pct}% off each order` },
        { label: 'Net Revenue', value: formatPrice(data.netRevenue), hint: 'After the discount' },
        { label: 'Avg Order', value: formatPrice(data.averageOrderValue), hint: 'Per redeeming order' },
        {
          label: 'Customers',
          value: String(data.uniqueCustomers),
          hint: `${data.repeatCustomers} used it more than once`,
        },
      ]
    : []

  return (
    <div className="bg-white border border-ivory-3 rounded-xl shadow-soft overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-ivory-3 bg-ivory-2/50">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-serif text-xl text-ink">Loyalty Programme</h2>
            <span className="px-2 py-0.5 rounded bg-green-6 text-green-2 text-[.6rem] font-bold uppercase tracking-widest">
              {data?.code || 'LOYAL12'}
            </span>
            <span className="px-2 py-0.5 rounded bg-ivory-3 text-ink-3 text-[.6rem] font-bold uppercase tracking-widest">
              Built in
            </span>
          </div>
          <p className="text-xs text-ink-4 mt-1.5 max-w-xl">
            Auto-offered to anyone who has ordered before, so it has no row in the coupon table above. Figures are
            derived from the orders that used the code.
          </p>
        </div>
        <RangeFilter value={range} onChange={setRange} size="sm" />
      </div>

      {error ? (
        <div className="p-5 text-xs text-red-700 bg-red-50 border-b border-red-100">{error}</div>
      ) : loading && !data ? (
        <div className="p-10 text-center text-ink-4 font-serif italic text-sm">Loading loyalty analytics...</div>
      ) : data ? (
        <div className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 p-5">
            {tiles.map(tile => (
              <div key={tile.label} className="bg-ivory-2 border border-ivory-3 rounded-xl p-4">
                <div className="text-[.6rem] uppercase tracking-wider text-ink-4 font-bold">{tile.label}</div>
                <div className="font-serif text-lg text-ink mt-1.5 leading-none">{tile.value}</div>
                <div className="text-[.55rem] text-ink-4 mt-1.5 leading-snug">{tile.hint}</div>
              </div>
            ))}
          </div>

          {data.cancelledOrders > 0 && (
            <div className="mx-5 mb-4 text-[.68rem] text-ink-4">
              {data.cancelledOrders} cancelled order{data.cancelledOrders === 1 ? '' : 's'} used this code and{' '}
              {data.cancelledOrders === 1 ? 'is' : 'are'} excluded from the figures above.
            </div>
          )}

          <div className="border-t border-ivory-3 overflow-x-auto max-h-[340px] overflow-y-auto">
            <table className="w-full text-left text-sm min-w-[560px]">
              <thead className="bg-ivory-2 border-b border-ivory-3 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Date & Order</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Customer</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4 text-right">Discount</th>
                  <th className="px-4 py-3 text-[.6rem] font-bold uppercase tracking-widest text-ink-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-3">
                {data.orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-ink-4 italic font-serif text-sm">
                      No one used this code in this period.
                    </td>
                  </tr>
                ) : (
                  data.orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-ivory-2/40">
                      <td className="px-4 py-3">
                        <div className="text-ink text-xs font-medium">
                          {new Date(o.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[.6rem] text-green-3 uppercase tracking-widest font-bold mt-0.5">
                          #{o.order_ref}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-ink-2">{o.customer_name || '—'}</div>
                        <div className="text-[.6rem] text-ink-4 mt-0.5">{o.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-right text-ink-2">{formatPrice(o.subtotal)}</td>
                      <td className="px-4 py-3 text-right font-serif text-sm text-green">-{formatPrice(o.discount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[.55rem] font-bold uppercase tracking-widest ${
                            o.status === 'cancelled'
                              ? 'bg-red-50 text-red-600'
                              : o.status === 'delivered'
                              ? 'bg-green-50 text-green-600'
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
      ) : null}
    </div>
  )
}
