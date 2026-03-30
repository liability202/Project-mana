'use client'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { showToast } from '@/components/ui/Toaster'
import type { Order } from '@/lib/supabase'

type Transaction = {
  id: string
  amount: number
  type: 'credit' | 'debit'
  reason: 'cashback' | 'usage' | 'adjustment'
  description?: string
  created_at: string
}

export default function AccountPage() {
  const [phone, setPhone] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [entered, setEntered] = useState(false)
  const [balance, setBalance] = useState(0)
  const [eligible, setEligible] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'none' | 'requested' | 'approved'>('none')
  const [txns, setTxns] = useState<Transaction[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const lookup = async () => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 10) { showToast('Enter a valid 10-digit number'); return }
    setLoading(true)
    const [walletRes, orderRes] = await Promise.all([
      fetch(`/api/wallet?phone=${clean}`),
      fetch(`/api/orders?phone=${clean}`),
    ])
    const [walletData, orderData] = await Promise.all([walletRes.json(), orderRes.json()])
    setBalance(walletData.balance || 0)
    setEligible(Boolean(walletData.is_cashback_eligible))
    setRequestStatus(walletData.profile?.cashback_request_status || 'none')
    setInstagramHandle(walletData.profile?.instagram_handle || '')
    setTxns(walletData.transactions || [])
    setOrders(Array.isArray(orderData) ? orderData : [])
    setEntered(true)
    setLoading(false)
  }

  const requestCashback = async () => {
    const clean = phone.replace(/\D/g, '')
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

  return (
    <div className="px-[5%] py-10 max-w-[980px] mx-auto">
      <div className="eyebrow">My Account</div>
      <h1 className="font-serif text-3xl font-light text-ink mb-8">
        Wallet, Orders & <em className="not-italic text-green">Cashback</em>
      </h1>

      {!entered ? (
        <div className="bg-white border border-ivory-3 rounded-xl p-8 shadow-soft max-w-md">
          <div className="text-2xl mb-4">📱</div>
          <h2 className="font-serif text-xl text-ink mb-1">Enter your WhatsApp number</h2>
          <p className="text-sm text-ink-3 mb-5">Track your wallet, cashback status, and order history using the same number you used at checkout.</p>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
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
            <div className="text-center flex flex-col items-center justify-center">
              <a href="/checkout" className="btn-primary no-underline text-sm py-2.5 px-6">
                <span>Use Cashback →</span>
              </a>
              <p className="text-xs text-green-4 mt-2">Wallet balance can be used on the next order</p>
            </div>
          </div>

          {!eligible && (
            <div className="bg-white border border-ivory-3 rounded-xl p-5">
              <div className="font-serif text-lg text-ink mb-2">Unlock cashback</div>
              <p className="text-sm text-ink-3 mb-4">
                Follow the brand on Instagram or complete the required action, then submit your handle here for approval.
              </p>
              <div className="flex gap-3 flex-wrap">
                <input
                  value={instagramHandle}
                  onChange={e => setInstagramHandle(e.target.value)}
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
            <div className="px-5 py-4 border-b border-ivory-3">
              <div className="font-serif text-lg text-ink">Order Tracking</div>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-10 text-ink-3 text-sm">No orders found for this number yet.</div>
            ) : (
              <div className="divide-y divide-ivory-3">
                {orders.map(order => (
                  <div key={order.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-sm font-medium text-ink">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-ink-4 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-ink-4 mt-1">{Array.isArray(order.items) ? order.items.length : 0} items</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-lg text-green">{formatPrice(order.final_amount || order.total)}</div>
                      <div className="text-xs text-ink-3 mt-1 capitalize">{order.status}</div>
                    </div>
                  </div>
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
                {txns.map(t => {
                  const isCredit = t.type === 'credit'
                  return (
                    <div key={t.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="text-sm text-ink">{t.description || t.reason}</div>
                        <div className="text-xs text-ink-4 mt-0.5">
                          {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
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

          <button onClick={() => { setEntered(false); setPhone('') }} className="text-sm text-ink-3 underline text-center bg-transparent border-none cursor-pointer">
            Switch account
          </button>
        </div>
      )}
    </div>
  )
}
