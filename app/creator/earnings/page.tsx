'use client'
import { useState, useEffect } from 'react'
import { StatCard } from '@/components/creator/StatCard'
import { 
  CircleDollarSign, 
  Wallet, 
  Clock, 
  ArrowUpRight, 
  CreditCard,
  MessageCircle 
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default function CreatorEarningsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [creator, setCreator] = useState<any>(null)

  useEffect(() => {
    const creatorStr = sessionStorage.getItem('mana_creator')
    if (creatorStr) {
      const c = JSON.parse(creatorStr)
      setCreator(c)
      fetchEarnings(c.id)
    }
  }, [])

  const fetchEarnings = async (id: string) => {
    try {
      const res = await fetch(`/api/creator/earnings?creatorId=${id}`)
      const d = await res.json()
      if (res.ok) {
        setData(d)
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (data.availableBalance < 50000) { // ₹500
      alert('Minimum payout is ₹500')
      return
    }

    if (!confirm(`Request payout of ${formatPrice(data.availableBalance)} to your registered payment method?`)) return

    setRequesting(true)
    try {
      const res = await fetch('/api/creator/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          creatorId: creator.id, 
          amount: data.availableBalance 
        })
      })
      if (res.ok) {
        alert('Payout request submitted successfully! Our team will process it within 48 hours.')
        fetchEarnings(creator.id)
      } else {
        const err = await res.json()
        alert(err.error || 'Request failed')
      }
    } catch (err) {
      alert('Something went wrong')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 rounded-full border-4 border-ivory-3 border-t-green animate-spin mb-4" />
      <p className="text-ink-3 font-serif italic">Reviewing your rewards balance...</p>
    </div>
  )
  
  if (!data) return (
    <div className="py-20 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="font-serif text-xl text-ink">Failed to load earnings</h2>
      <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
    </div>
  )

  const totalPaidOut = (data.payouts || [])
    .filter((p: any) => p.status === 'processed')
    .reduce((sum: number, p: any) => sum + p.amount, 0)
    
  const totalEarnedLifetime = totalPaidOut + data.availableBalance + (data.payouts || []).filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + p.amount, 0)

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-1.5 font-light">Earnings & Payouts</h1>
          <p className="text-sm text-ink-3 leading-relaxed max-w-md">Manage your commission income, track settlement history, and request transfers to your account.</p>
        </div>
        <button
          onClick={handleRequestPayout}
          disabled={requesting || data.availableBalance < 50000}
          className="bg-green text-ivory px-6 py-3.5 rounded-xl text-[.82rem] font-bold flex items-center justify-center gap-2 no-underline hover:bg-green-2 transition-transform active:scale-95 shadow-soft shadow-green/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
        >
          {requesting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>Request Payout <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
          )}
        </button>
      </header>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Lifetime Rewards" 
          value={formatPrice(totalEarnedLifetime)} 
          icon={<CircleDollarSign size={18} />} 
        />
        <StatCard 
          label="Available Balance" 
          value={formatPrice(data.availableBalance)} 
          icon={<Wallet size={18} />} 
          subtitle="Confirmed commission ready to pay" 
        />
        <StatCard 
          label="Total Settled" 
          value={formatPrice(totalPaidOut)} 
          icon={<CreditCard size={18} />} 
          subtitle="Successfully paid to your account"
        />
        <StatCard 
          label="In Process" 
          value={formatPrice((data.payouts || []).filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + p.amount, 0))} 
          icon={<Clock size={18} />} 
          subtitle="Waiting for bank approval"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Payout History Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-ivory-3 rounded-2xl overflow-hidden shadow-soft">
            <div className="px-6 py-5 border-b border-ivory-3 bg-ivory-2/40">
               <h3 className="font-serif text-lg text-ink font-light">Settlement History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-ivory-2/20 border-b border-ivory-3">
                    <th className="px-6 py-4 text-[.6rem] font-bold uppercase tracking-[.2em] text-ink-4">Request Date</th>
                    <th className="px-6 py-4 text-[.6rem] font-bold uppercase tracking-[.2em] text-ink-4">Amount</th>
                    <th className="px-6 py-4 text-[.6rem] font-bold uppercase tracking-[.2em] text-ink-4">Status</th>
                    <th className="px-6 py-4 text-[.6rem] font-bold uppercase tracking-[.2em] text-ink-4">Settlement Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-3 text-ink-2">
                  {data.payouts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-ink-4 italic font-serif">
                        <div className="text-2xl mb-2">📜</div>
                        Your payout history will appear here.
                      </td>
                    </tr>
                  ) : (
                    data.payouts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-ivory-2/30 transition-colors">
                        <td className="px-6 py-5 font-medium">{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-5 font-serif text-[1.1rem] text-ink font-normal">{formatPrice(p.amount)}</td>
                        <td className="px-6 py-5">
                           <span className={`px-2.5 py-1 rounded-lg text-[.6rem] font-bold uppercase tracking-widest border border-solid shadow-sm ${
                             p.status === 'processed' ? 'bg-green-50 text-green-600 border-green-100' :
                             p.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             'bg-red-50 text-red-600 border-red-100'
                           }`}>
                             {p.status}
                           </span>
                        </td>
                        <td className="px-6 py-5">
                           <div className="text-[.7rem] text-ink-3 font-medium">
                              {p.upi_id ? (
                                <span className="flex items-center gap-1.5"><MessageCircle size={10} className="text-green-3" /> {p.upi_id}</span>
                              ) : (
                                <span className="flex items-center gap-1.5"><CreditCard size={10} className="text-green-3" /> •••• {p.bank_account?.slice(-4)}</span>
                              )}
                           </div>
                           {p.processed_at && (
                             <div className="text-[.6rem] text-ink-4 mt-1">Paid on {new Date(p.processed_at).toLocaleDateString()}</div>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Policy & Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-ivory-3 rounded-2xl p-6 lg:p-8 shadow-soft">
            <div className="w-10 h-10 rounded-full bg-ivory-3 flex items-center justify-center text-lg mb-4">📜</div>
            <h3 className="font-serif text-xl text-ink mb-6 font-light">Settlement Policy</h3>
            <ul className="space-y-5">
              {[
                { title: 'Threshold', text: 'Minimum payout threshold is ₹500.' },
                { title: 'Clearing', text: 'Commissions are confirmed only after orders are marked as delivered.' },
                { title: 'Timeline', text: 'Payouts are processed 2x every week (Monday & Thursday).' },
                { title: 'Verification', text: 'Please ensure your UPI ID is correct in Profile settings.' }
              ].map((policy, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-green mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="text-[.72rem] font-bold text-ink-2 uppercase tracking-wide mb-1">{policy.title}</h4>
                    <p className="text-[.78rem] text-ink-3 leading-relaxed font-medium">{policy.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
