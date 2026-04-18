'use client'

import { useState } from 'react'

export function ReviewForm({ productId, productSlug, productName }: { productId: string; productSlug: string; productName: string }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!customerName.trim()) {
      setError('Name is required.')
      return
    }
    if (!rating) {
      setError('Please select a rating.')
      return
    }
    if (!body.trim() || body.trim().length < 20) {
      setError('Review body must be at least 20 characters.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          product_slug: productSlug,
          product_name: productName,
          customer_name: customerName,
          customer_phone: customerPhone,
          rating,
          title,
          body,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not submit review.')
      setMessage('Thank you! Your review will appear after verification.')
      setCustomerName('')
      setCustomerPhone('')
      setRating(0)
      setHoverRating(0)
      setTitle('')
      setBody('')
    } catch (err: any) {
      setError(err.message || 'Could not submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft">
      <div className="font-serif text-2xl text-ink mb-2">Write a review</div>
      <div className="text-sm text-ink-3 mb-5">Tell other customers how this product worked for you.</div>

      <div className="mb-5">
        <div className="text-xs text-ink-3 mb-2">Your rating *</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => {
            const active = (hoverRating || rating) >= star
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className={`text-2xl transition-transform ${active ? 'text-terra' : 'text-ivory-4'} hover:scale-110`}
              >
                ★
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-ink-3 block mb-1.5">Name *</label>
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="text-xs text-ink-3 block mb-1.5">WhatsApp Number *</label>
          <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input" placeholder="98765 43210" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-ink-3 block mb-1.5">Review title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Optional title" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-ink-3 block mb-1.5">Your review *</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} className="input min-h-[140px]" placeholder="Share your experience with the product..." />
        </div>
      </div>

      <div className="text-xs font-medium text-ink-3 mt-3 px-3 py-2 bg-ivory-2 rounded-lg border border-ivory-3 leading-relaxed">
        Note: You can only submit a review if you have previously purchased this product. Please use the same WhatsApp number you used during checkout.
      </div>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}

      <button type="submit" disabled={submitting} className="btn-primary mt-5">
        <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
      </button>
    </form>
  )
}
