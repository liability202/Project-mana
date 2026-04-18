'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Review } from '@/lib/supabase'

type SortOption = 'recent' | 'highest' | 'lowest'

function formatReviewerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return parts[0] || 'Anonymous'
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function renderStars(rating: number, size = 'text-base') {
  return (
    <div className={`flex gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'text-terra' : 'text-ivory-4'}>★</span>
      ))}
    </div>
  )
}

export function ReviewList({ productSlug }: { productSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  useEffect(() => {
    let active = true
    void fetch(`/api/reviews?slug=${productSlug}`)
      .then(res => res.json())
      .then((data: Review[]) => {
        if (!active) return
        setReviews(Array.isArray(data) ? data : [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [productSlug])

  const sortedReviews = useMemo(() => {
    const list = [...reviews]
    if (sortBy === 'highest') return list.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'lowest') return list.sort((a, b) => a.rating - b.rating)
    return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  }, [reviews, sortBy])

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
  const breakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(review => review.rating === stars).length
    const percent = reviews.length ? Math.round((count / reviews.length) * 100) : 0
    return { stars, count, percent }
  })

  if (loading) {
    return <div className="text-sm text-ink-3">Loading reviews...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-serif text-4xl text-ink">{reviews.length ? averageRating.toFixed(1) : '0.0'}</div>
            <div className="mt-2">{renderStars(Math.round(averageRating), 'text-xl')}</div>
            <div className="text-sm text-ink-3 mt-2">{reviews.length} review{reviews.length === 1 ? '' : 's'}</div>
          </div>
          <div className="min-w-[240px] flex-1 max-w-[420px]">
            {breakdown.map(row => (
              <div key={row.stars} className="flex items-center gap-3 mb-2">
                <div className="text-sm text-ink min-w-[42px]">{row.stars} star</div>
                <div className="flex-1 h-2 rounded-full bg-ivory-3 overflow-hidden">
                  <div className="h-full bg-green" style={{ width: `${row.percent}%` }} />
                </div>
                <div className="text-xs text-ink-4 w-10 text-right">{row.percent}%</div>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-ink-3 block mb-1.5">Sort by</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="input min-w-[170px]">
              <option value="recent">Most recent</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>
        </div>
      </div>

      {sortedReviews.length === 0 ? (
        <div className="bg-white border border-ivory-3 rounded-2xl p-6 text-sm text-ink-3 shadow-soft">
          No reviews yet — be the first to review this product
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map(review => (
            <div key={review.id} className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  {renderStars(review.rating)}
                  {review.title && <div className="font-serif text-xl text-ink mt-2">{review.title}</div>}
                </div>
                <div className="text-right text-xs text-ink-4">
                  <div>{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  {review.verified_purchase && (
                    <div className="mt-2 inline-flex items-center rounded-full border border-green-5 bg-green-6 px-2.5 py-1 text-[.65rem] uppercase tracking-[.14em] text-green">
                      Verified Purchase
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-ink-3 leading-[1.8]">{review.body}</p>
              <div className="text-sm text-ink mt-4">{formatReviewerName(review.customer_name)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
