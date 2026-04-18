'use client'

import { FormEvent, useState } from 'react'

type Message = {
  role: 'user' | 'bot'
  text: string
}

export default function TestBotPage() {
  const [phone, setPhone] = useState('919121111111')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault()
    const trimmedMessage = message.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedPhone || !trimmedMessage) {
      setError('Phone and message are required.')
      return
    }

    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', text: trimmedMessage }])
    setMessage('')

    try {
      const response = await fetch('/api/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: trimmedPhone,
          message: trimmedMessage,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not test bot.')
      }

      setMessages((prev) => [...prev, { role: 'bot', text: data.reply || '(No reply)' }])
    } catch (err: any) {
      const message = err?.message || 'Something went wrong.'
      setError(message)
      setMessages((prev) => [...prev, { role: 'bot', text: `Error: ${message}` }])
    } finally {
      setLoading(false)
    }
  }

  function quickSend(text: string) {
    setMessage(text)
  }

  return (
    <section className="section">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="eyebrow">Bot Sandbox</div>
          <h1 className="section-title mb-3">WhatsApp Bot Tester</h1>
          <p className="text-ink-3 max-w-2xl">
            Test the MANA bot locally without sending real WhatsApp messages.
            The same session state is stored in Supabase, so you can simulate full conversations.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="card bg-white p-5 h-fit">
            <div className="font-serif text-xl text-ink mb-4">Session</div>

            <label className="text-xs text-ink-3 block mb-1.5">Phone</label>
            <input
              className="input mb-4"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="919121111111"
            />

            <div className="text-xs text-ink-3 mb-2">Quick messages</div>
            <div className="flex flex-wrap gap-2 mb-5">
              {['Hi', 'lang_en', 'menu_order', 'dry-fruits', 'q_mid', 'menu_advice'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="btn-outline text-xs py-2 px-3"
                  onClick={() => quickSend(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-ivory-2 p-4 text-sm text-ink-3 leading-7">
              <div className="font-medium text-ink mb-1">How to use</div>
              <div>1. Keep the same phone number for one conversation.</div>
              <div>2. Send one message at a time.</div>
              <div>3. The bot reply appears in the chat panel.</div>
            </div>
          </div>

          <div className="card bg-white overflow-hidden">
            <div className="border-b border-ivory-3 px-5 py-4 bg-ivory-2">
              <div className="font-serif text-xl text-ink">Conversation</div>
              <div className="text-sm text-ink-3 mt-1">Endpoint: <span className="font-mono">/api/test-bot</span></div>
            </div>

            <div className="min-h-[520px] max-h-[520px] overflow-y-auto bg-[var(--ivory)] px-5 py-5 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="text-sm text-ink-3">
                  Start with <span className="font-mono">Hi</span> or click a quick message.
                </div>
              ) : (
                messages.map((entry, index) => (
                  <div
                    key={`${entry.role}-${index}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap ${
                      entry.role === 'user'
                        ? 'ml-auto bg-green text-ivory'
                        : 'bg-white border border-ivory-3 text-ink'
                    }`}
                  >
                    {entry.text}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="border-t border-ivory-3 p-5 bg-white">
              <label className="text-xs text-ink-3 block mb-1.5">Message</label>
              <textarea
                className="input min-h-[110px] resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a bot test message..."
              />

              <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
                <div className="text-sm text-red-600 min-h-[20px]">{error}</div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Testing...' : 'Send To Bot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
