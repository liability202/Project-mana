'use client'

import { useCallback, useEffect, useState } from 'react'

type Status = {
  tokenSet: boolean
  chatIdSet: boolean
  chats: Array<{ id: string; name: string; username: string | null }>
  error?: string
}

/** Admin → Settings card: set up and test new-order alerts on Telegram. */
export function TelegramAlerts({ adminSecret }: { adminSecret: string }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const refresh = useCallback(async () => {
    if (!adminSecret) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/telegram', { headers: { authorization: `Bearer ${adminSecret}` }, cache: 'no-store' })
      setStatus(await res.json())
    } catch {
      setStatus({ tokenSet: false, chatIdSet: false, chats: [], error: 'Could not load the alert status.' })
    } finally {
      setLoading(false)
    }
  }, [adminSecret])

  useEffect(() => { refresh() }, [refresh])

  const sendTest = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/telegram', { method: 'POST', headers: { authorization: `Bearer ${adminSecret}` } })
      const data = await res.json()
      setMessage(res.ok ? { ok: true, text: 'Test alert sent — check Telegram on your phone.' } : { ok: false, text: data.error || 'Sending failed.' })
    } catch {
      setMessage({ ok: false, text: 'Sending failed.' })
    } finally {
      setLoading(false)
    }
  }

  const ready = status?.tokenSet && status?.chatIdSet

  return (
    <div className="bg-white border border-ivory-3 rounded-xl p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-ink">Order alerts on Telegram</h2>
        <span className={`text-xs font-medium ${ready ? 'text-green-3' : 'text-ink-4'}`}>{status ? (ready ? '● On' : '○ Not set up') : '…'}</span>
      </div>

      <p className="text-sm text-ink-3 mb-4">Get a message on your phone for every new order — cash on delivery as soon as it is placed, online orders once payment arrives.</p>

      {!ready && (
        <ol className="text-sm text-ink-2 space-y-2 mb-4 list-decimal pl-5">
          <li className={status?.tokenSet ? 'line-through text-ink-4' : ''}>In Telegram, open <b>@BotFather</b>, send <code>/newbot</code>, and follow the steps. It gives you a key (token).</li>
          <li className={status?.tokenSet ? 'line-through text-ink-4' : ''}>In Vercel → project-mana → Settings → Environment Variables, add <code>TELEGRAM_BOT_TOKEN</code> = that key, then redeploy.</li>
          <li className={status?.chatIdSet ? 'line-through text-ink-4' : ''}>Open your new bot in Telegram and send it <code>hi</code>. Then press <b>Find my chat ID</b> below.</li>
          <li className={status?.chatIdSet ? 'line-through text-ink-4' : ''}>Add <code>TELEGRAM_CHAT_ID</code> = your chat ID in Vercel the same way, and redeploy.</li>
        </ol>
      )}

      {status?.tokenSet && !status.chatIdSet && (
        <div className="mb-4 rounded-lg bg-ivory-2 border border-ivory-3 p-3 text-sm">
          {status.chats.length ? (
            <>
              <div className="font-medium text-ink mb-1">Chats that messaged your bot:</div>
              {status.chats.map(c => (
                <div key={c.id} className="text-ink-2">
                  {c.name || 'Unnamed'}{c.username ? ` (@${c.username})` : ''} — chat ID <code className="font-semibold">{c.id}</code>
                </div>
              ))}
            </>
          ) : (
            <div className="text-ink-3">No messages found yet. Send your bot a message in Telegram, then press Find my chat ID.</div>
          )}
        </div>
      )}

      {status?.error && <div className="mb-3 text-sm text-red-700">{status.error}</div>}
      {message && <div className={`mb-3 text-sm ${message.ok ? 'text-green-3' : 'text-red-700'}`}>{message.text}</div>}

      <div className="flex gap-2">
        <button onClick={refresh} disabled={loading} className="text-sm px-4 py-2 rounded-lg border border-ivory-3 text-ink hover:bg-ivory-2 disabled:opacity-50">
          {status?.tokenSet && !status.chatIdSet ? 'Find my chat ID' : 'Refresh status'}
        </button>
        <button onClick={sendTest} disabled={loading || !ready} className="text-sm px-4 py-2 rounded-lg bg-green text-ivory hover:opacity-90 disabled:opacity-40">
          Send test alert
        </button>
      </div>
    </div>
  )
}
