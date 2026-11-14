'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Stage = 'new' | 'browsing' | 'cart' | 'details' | 'payment_sent' | 'paid' | 'needs_human' | 'closed'

type Conversation = {
  phone: string
  name: string | null
  stage: Stage
  bot_paused: boolean
  needs_human_reason: string | null
  cart: Array<{ name: string; variant_name: string | null; grams: number | null; quantity: number }>
  customer: { name?: string; address?: string; city?: string; state?: string | null; pincode?: string }
  last_order_ref: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
  can_reply?: boolean
}

type Message = { id: number; direction: 'in' | 'out'; sender: string; type: string; body: string | null; payload: any; status: string | null; created_at: string }

const STAGE_LABEL: Record<Stage, string> = {
  new: 'New', browsing: 'Browsing', cart: 'Cart', details: 'Details', payment_sent: 'Payment link sent',
  paid: 'Paid', needs_human: 'Needs you', closed: 'Closed',
}
const STAGE_STYLE: Record<Stage, string> = {
  new: 'bg-ivory-2 text-ink-3 border-ivory-3',
  browsing: 'bg-ivory-2 text-ink-2 border-ivory-3',
  cart: 'bg-green-6 text-green-2 border-green-5',
  details: 'bg-green-6 text-green-2 border-green-5',
  payment_sent: 'bg-[#fff6ef] text-terra border-terra/30',
  paid: 'bg-green text-ivory border-green',
  needs_human: 'bg-red-50 text-red-600 border-red-200',
  closed: 'bg-ivory-2 text-ink-4 border-ivory-3',
}
const FILTERS: Array<{ value: '' | Stage; label: string }> = [
  { value: '', label: 'All' },
  { value: 'needs_human', label: 'Needs you' },
  { value: 'payment_sent', label: 'Payment link sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'cart', label: 'Cart' },
  { value: 'browsing', label: 'Browsing' },
  { value: 'closed', label: 'Closed' },
]

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function displayPhone(phone: string) {
  return phone.length === 12 && phone.startsWith('91') ? `+91 ${phone.slice(2, 7)} ${phone.slice(7)}` : `+${phone}`
}

export default function WhatsAppInboxPage() {
  const [secret, setSecret] = useState('')
  const [filter, setFilter] = useState<'' | Stage>('')
  const [search, setSearch] = useState('')
  const [list, setList] = useState<Conversation[]>([])
  const [counts, setCounts] = useState({ today: 0, needs_human: 0, payment_sent: 0, paid: 0 })
  const [listError, setListError] = useState('')
  const [openPhone, setOpenPhone] = useState<string | null>(null)
  const [chat, setChat] = useState<{ conversation: Conversation; messages: Message[] } | null>(null)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { setSecret((localStorage.getItem('mana_admin') || '').trim()) } catch {}
  }, [])

  const headers = useCallback(() => ({ authorization: `Bearer ${secret}`, 'content-type': 'application/json' }), [secret])

  const loadList = useCallback(async () => {
    if (!secret) return
    const params = new URLSearchParams()
    if (filter) params.set('stage', filter)
    if (search.trim()) params.set('q', search.trim())
    const res = await fetch(`/api/admin/whatsapp?${params}`, { headers: headers(), cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setListError(data.error || 'Could not load chats.'); return }
    setListError('')
    setList(data.conversations || [])
    setCounts(data.counts || counts)
  }, [secret, filter, search, headers]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadChat = useCallback(async (phone: string) => {
    const res = await fetch(`/api/admin/whatsapp?phone=${encodeURIComponent(phone)}`, { headers: headers(), cache: 'no-store' })
    if (res.ok) setChat(await res.json())
  }, [headers])

  // Refresh the list every 10 s and the open chat every 5 s.
  useEffect(() => {
    loadList()
    const t = setInterval(loadList, 10000)
    return () => clearInterval(t)
  }, [loadList])

  useEffect(() => {
    if (!openPhone) { setChat(null); return }
    loadChat(openPhone)
    const t = setInterval(() => loadChat(openPhone), 5000)
    return () => clearInterval(t)
  }, [openPhone, loadChat])

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [chat?.messages.length])

  const act = async (action: 'reply' | 'pause' | 'resume' | 'close', text?: string) => {
    if (!openPhone) return
    setBusy(true)
    setActionError('')
    try {
      const res = await fetch('/api/admin/whatsapp', { method: 'POST', headers: headers(), body: JSON.stringify({ action, phone: openPhone, text }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setActionError(data.error || 'That did not work.'); return false }
      await Promise.all([loadChat(openPhone), loadList()])
      return true
    } finally {
      setBusy(false)
    }
  }

  const sendReply = async () => {
    if (!reply.trim()) { setActionError('Type a message first.'); return }
    if (await act('reply', reply.trim())) setReply('')
  }

  if (!secret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center text-sm text-ink-3">
          Log in to the admin panel first. <Link href="/admin" className="text-green underline">Go to admin</Link>
        </div>
      </div>
    )
  }

  const c = chat?.conversation

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-green px-[4%] py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-serif text-xl text-ivory">WhatsApp inbox</div>
          <div className="text-xs text-green-4">Chats on your WhatsApp business number · updates automatically</div>
        </div>
        <Link href="/admin" className="text-xs px-3 py-1.5 rounded-md border border-green-5/40 text-green-4 no-underline hover:text-ivory">← Admin</Link>
      </div>

      <div className="px-[4%] py-4 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            ['Chats today', counts.today, ''],
            ['Need you', counts.needs_human, counts.needs_human ? 'text-red-600' : ''],
            ['Awaiting payment', counts.payment_sent, ''],
            ['Paid on WhatsApp', counts.paid, ''],
          ].map(([label, value, cls]) => (
            <div key={String(label)} className="bg-white border border-ivory-3 rounded-xl px-4 py-3">
              <div className="text-xs text-ink-3">{label}</div>
              <div className={`text-2xl font-serif ${cls}`}>{value}</div>
            </div>
          ))}
        </div>

        {listError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError}</div>}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTERS.map(f => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${filter === f.value ? 'bg-green text-ivory border-green' : 'bg-white text-ink-3 border-ivory-3 hover:border-green-4'}`}
            >
              {f.label}{f.value === 'needs_human' && counts.needs_human ? ` (${counts.needs_human})` : ''}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or number" className="input ml-auto max-w-[220px] text-xs py-1.5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] bg-white border border-ivory-3 rounded-xl overflow-hidden min-h-[70vh]">
          {/* Chat list (hidden on phones while a chat is open) */}
          <div className={`border-r border-ivory-3 overflow-y-auto max-h-[75vh] ${openPhone ? 'hidden md:block' : ''}`}>
            {list.length === 0 && !listError && <div className="p-6 text-sm text-ink-3">No chats here yet.</div>}
            {list.map(conv => (
              <button
                key={conv.phone}
                type="button"
                onClick={() => setOpenPhone(conv.phone)}
                className={`w-full text-left px-4 py-3 border-b border-ivory-3 cursor-pointer hover:bg-ivory-2 ${openPhone === conv.phone ? 'bg-ivory-2' : 'bg-white'}`}
              >
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium text-ink truncate">{conv.name || displayPhone(conv.phone)}</span>
                  <span className="text-[11px] text-ink-4 shrink-0">{ago(conv.last_message_at)}</span>
                </div>
                <div className="text-xs text-ink-3 truncate my-1">{conv.last_message_preview || '—'}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${STAGE_STYLE[conv.stage] || STAGE_STYLE.new}`}>
                    {STAGE_LABEL[conv.stage] || conv.stage}{conv.stage === 'paid' && conv.last_order_ref ? ` · ${conv.last_order_ref}` : ''}
                  </span>
                  {conv.bot_paused && <span className="text-[10px] text-ink-4">assistant paused</span>}
                  {conv.unread_count > 0 && <span className="ml-auto text-[10px] bg-green text-ivory rounded-full px-1.5">{conv.unread_count}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Open chat */}
          <div className={`flex flex-col min-w-0 ${openPhone ? '' : 'hidden md:flex'}`}>
            {!c ? (
              <div className="flex-1 flex items-center justify-center text-sm text-ink-3 p-6">Choose a chat to read it.</div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-ivory-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button type="button" onClick={() => setOpenPhone(null)} className="md:hidden text-xs text-green mb-1 cursor-pointer bg-transparent border-none p-0">← All chats</button>
                    <div className="text-sm font-medium text-ink">
                      {c.name || displayPhone(c.phone)} <span className="text-xs font-normal text-ink-4">{displayPhone(c.phone)}</span>
                    </div>
                    <div className="text-xs text-ink-3 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded border mr-2 ${STAGE_STYLE[c.stage]}`}>{STAGE_LABEL[c.stage]}</span>
                      {c.needs_human_reason && <span className="text-red-600">{c.needs_human_reason}</span>}
                    </div>
                    {c.cart?.length > 0 && (
                      <div className="text-xs text-ink-3 mt-1">Cart: {c.cart.map(l => `${l.name}${l.variant_name ? ` (${l.variant_name})` : ''}${l.grams ? ` ${l.grams} g` : ''}${l.quantity > 1 ? ` ×${l.quantity}` : ''}`).join(', ')}</div>
                    )}
                    {c.customer?.pincode && (
                      <div className="text-xs text-ink-3">Deliver to: {c.customer.name}, {c.customer.address}, {c.customer.city} {c.customer.pincode}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.bot_paused
                      ? <button type="button" disabled={busy} onClick={() => act('resume')} className="text-xs px-3 py-1.5 rounded-md border border-green-4 text-green bg-white cursor-pointer">Hand back to assistant</button>
                      : <button type="button" disabled={busy} onClick={() => act('pause')} className="text-xs px-3 py-1.5 rounded-md border border-ivory-3 text-ink-2 bg-white cursor-pointer">Take over</button>}
                    {c.stage !== 'closed' && <button type="button" disabled={busy} onClick={() => act('close')} className="text-xs px-3 py-1.5 rounded-md border border-ivory-3 text-ink-3 bg-white cursor-pointer">Mark done</button>}
                    {c.last_order_ref && <Link href="/admin" className="text-xs px-3 py-1.5 rounded-md border border-ivory-3 text-ink-3 no-underline">Order {c.last_order_ref}</Link>}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 bg-ivory-2/40 max-h-[55vh]">
                  {chat?.messages.map(m => {
                    const mine = m.direction === 'out'
                    const label = m.sender === 'admin' ? 'You' : m.sender === 'system' ? 'Mana (automatic)' : m.sender === 'bot' ? 'Assistant' : null
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1.5`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${mine ? (m.sender === 'admin' ? 'bg-green text-ivory' : 'bg-green-6 text-ink') : 'bg-white border border-ivory-3 text-ink'}`}>
                          {label && <div className={`text-[10px] mb-0.5 ${m.sender === 'admin' ? 'text-green-4' : 'text-ink-4'}`}>{label}</div>}
                          {m.body}
                          {m.type === 'buttons' && Array.isArray(m.payload?.buttons) && (
                            <div className="flex flex-wrap gap-1 mt-1.5">{m.payload.buttons.map((b: any) => <span key={b.id} className="text-[11px] border border-green-4 rounded px-2 py-0.5">{b.title}</span>)}</div>
                          )}
                          <div className={`text-[10px] mt-1 text-right ${m.sender === 'admin' ? 'text-green-4' : 'text-ink-4'}`}>
                            {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            {mine && m.status && m.status !== 'sent' ? ` · ${m.status}` : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-ivory-3 p-3">
                  {!c.can_reply && <div className="text-[11px] text-terra mb-2">More than 24 hours since the customer last wrote — WhatsApp won&apos;t deliver a normal reply. Ask them to message you, or call them.</div>}
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={e => { setReply(e.target.value); setActionError('') }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      placeholder={c.bot_paused ? 'Reply as Mana' : 'Reply as Mana (this pauses the assistant for this chat)'}
                      rows={2}
                      className="input flex-1 text-sm resize-none"
                    />
                    <button type="button" disabled={busy} onClick={sendReply} className="btn-primary text-sm px-4 self-end">Send</button>
                  </div>
                  {actionError && <div className="text-xs text-red-600 mt-1.5">{actionError}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
