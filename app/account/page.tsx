'use client'
import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'

type Transaction = {
  id: string; type: string; amount: number
  description: string; status: string
  scheduled_for?: string; created_at: string
}

export default function AccountPage() {
  const [phone, setPhone]     = useState('')
  const [entered, setEntered] = useState(false)
  const [balance, setBalance] = useState(0)
  const [txns, setTxns]       = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const lookup = async () => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 10) { showToast('Enter a valid 10-digit number'); return }
    setLoading(true)
    const res = await fetch(`/api/wallet?phone=${clean}`)
    const data = await res.json()
    setBalance(data.balance || 0)
    setTxns(data.transactions || [])
    setEntered(true)
    setLoading(false)
  }

  const pendingCashback = txns
    .filter(t => t.status === 'pending' && t.type === 'cashback')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="px-[5%] py-10 max-w-[800px] mx-auto">
      <div className="eyebrow">My Account</div>
      <h1 className="font-serif text-3xl font-light text-ink mb-8">
        Wallet & <em className="not-italic text-green">Credits</em>
      </h1>

      {!entered ? (
        <div className="bg-white border border-ivory-3 rounded-xl p-8 shadow-soft max-w-md">
          <div className="text-2xl mb-4">📱</div>
          <h2 className="font-serif text-xl text-ink mb-1">Enter your WhatsApp number</h2>
          <p className="text-sm text-ink-3 mb-5">We use your phone number to find your wallet and order history.</p>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="98765 43210"
            className="input mb-4"
          />
          <button onClick={lookup} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
            <span>{loading ? 'Looking up…' : 'View My Wallet'}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Balance card */}
          <div className="bg-green rounded-2xl p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase text-green-4 mb-2">Available Credits</div>
              <div className="font-serif text-4xl text-ivory">{formatPrice(balance)}</div>
              <div className="text-xs text-green-4 mt-1">Ready to use</div>
            </div>
            <div className="text-center">
              <div className="text-xs tracking-widest uppercase text-green-4 mb-2">Pending Cashback</div>
              <div className="font-serif text-4xl text-green-4">{formatPrice(pendingCashback)}</div>
              <div className="text-xs text-green-4 mt-1">Releases 48hr after delivery</div>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <a
                href="/products"
                className="btn-primary no-underline text-sm py-2.5 px-6"
              >
                <span>Use Credits →</span>
              </a>
              <p className="text-xs text-green-4 mt-2">Applied automatically at checkout</p>
            </div>
          </div>

          {/* How cashback works */}
          <div className="bg-green-6 border border-green-5 rounded-xl p-5">
            <div className="font-serif text-base text-ink mb-3">How your cashback works</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['🛍', 'Place an order', 'Use coupon MANA10 for 10% off at checkout'],
                ['⏳', 'Wait 48 hours', 'After your order is delivered, 5% cashback is added'],
                ['💰', 'Credits in wallet', 'Use your credits on your next order automatically'],
              ].map(([ico, t, d]) => (
                <div key={t} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{ico}</span>
                  <div>
                    <div className="text-sm font-medium text-ink">{t}</div>
                    <div className="text-xs text-ink-3 mt-0.5">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white border border-ivory-3 rounded-xl overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-ivory-3">
              <div className="font-serif text-lg text-ink">Transaction History</div>
            </div>
            {txns.length === 0 ? (
              <div className="text-center py-10 text-ink-3 text-sm">
                No transactions yet. Place your first order to earn cashback!
              </div>
            ) : (
              <div className="divide-y divide-ivory-3">
                {txns.map(t => {
                  const isCredit = t.amount > 0
                  const isPending = t.status === 'pending'
                  const availableDate = t.scheduled_for
                    ? new Date(t.scheduled_for).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : null
                  return (
                    <div key={t.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${isCredit ? 'bg-green-6' : 'bg-terra-4'}`}>
                          {t.type === 'cashback' ? '💰' : t.type === 'redemption' ? '🛒' : '🎁'}
                        </div>
                        <div>
                          <div className="text-sm text-ink">{t.description}</div>
                          <div className="text-xs text-ink-4 mt-0.5">
                            {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {isPending && availableDate && ` · Available ${availableDate}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-serif text-base ${isCredit ? 'text-green' : 'text-terra'}`}>
                          {isCredit ? '+' : ''}{formatPrice(Math.abs(t.amount))}
                        </div>
                        <div className={`text-[.6rem] uppercase tracking-wide mt-0.5 ${isPending ? 'text-amber-600' : 'text-green-3'}`}>
                          {t.status}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <button onClick={() => { setEntered(false); setPhone('') }} className="text-sm text-ink-3 underline text-center bg-transparent border-none cursor-pointer">
            Switch account
          </button>
        </div>
      )}
    </div>
  )
}
