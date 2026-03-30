'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Could not subscribe right now.')

      setStatus('success')
      setMessage(data?.message || 'Thanks for subscribing.')
      setEmail('')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Could not subscribe right now.')
    }
  }

  return (
    <div className="max-w-[400px] mx-auto">
      <form className="flex border border-ivory-3 rounded-md overflow-hidden" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-4 py-3.5 bg-white border-none outline-none font-sans text-[.84rem] text-ink placeholder:text-ink-4"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-green text-ivory border-none px-5 font-sans text-[.7rem] font-medium tracking-wide uppercase cursor-pointer hover:bg-green-2 transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {status === 'loading' ? 'Saving...' : 'Subscribe'}
        </button>
      </form>

      {message && (
        <div className={`mt-2 text-xs ${status === 'success' ? 'text-green-3' : 'text-terra'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
