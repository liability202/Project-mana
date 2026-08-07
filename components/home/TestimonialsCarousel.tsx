'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export type Testimonial = {
  stars: number
  text: string
  name: string
  city: string
}

/**
 * Drift speed in px/second — framerate-independent, so it looks the same on a
 * 60Hz and a 120Hz display. Slow enough to read a card as it passes.
 */
const DRIFT_PX_PER_SECOND = 38

function Stars({ count, className = '' }: { count: number; className?: string }) {
  return (
    <div className={`text-gold ${className}`} aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
      <span className="text-ink-4">{'★'.repeat(Math.max(0, 5 - count))}</span>
    </div>
  )
}

/**
 * Continuously drifting testimonial rail.
 *
 * The list is rendered twice; once the rail scrolls past the halfway point we
 * subtract half the width, which lands on a visually identical frame — so the
 * loop is seamless and infinite in both directions. Driving the native
 * `scrollLeft` (rather than animating a transform) means touch swiping, arrow
 * buttons and keyboard scrolling all share one source of truth.
 *
 * Clicking a card opens it in a dialog; the drift pauses while that's open.
 */
export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Sub-pixel scroll position; see the rAF loop for why this isn't read from the DOM. */
  const offsetRef = useRef(0)

  const [active, setActive] = useState<Testimonial | null>(null)
  const [paused, setPaused] = useState(false)

  // The rAF loop can't read state directly, so mirror both pause sources into
  // refs. Keeping them separate means closing the dialog doesn't clobber a
  // hover pause (and vice versa).
  const pausedRef = useRef(false)
  const dialogOpenRef = useRef(false)

  const pause = useCallback((value: boolean) => {
    pausedRef.current = value
    setPaused(value)
  }, [])

  const openTestimonial = useCallback((testimonial: Testimonial) => {
    dialogOpenRef.current = true
    setActive(testimonial)
  }, [])

  const closeTestimonial = useCallback(() => {
    dialogOpenRef.current = false
    setActive(null)
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    let frame = 0
    let lastTime = performance.now()

    const step = (now: number) => {
      const elapsedSeconds = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      const running =
        !pausedRef.current && !dialogOpenRef.current && document.visibilityState === 'visible'

      const half = scroller.scrollWidth / 2

      if (running && half > 0) {
        // The position is accumulated here rather than read back from the DOM
        // each frame. `scrollLeft` gets rounded to whole pixels by the browser,
        // so `scrollLeft += 0.45` would read back as 0 forever and the rail
        // would never actually move.
        let next = offsetRef.current + DRIFT_PX_PER_SECOND * elapsedSeconds
        if (next >= half) next -= half
        offsetRef.current = next
        scroller.scrollLeft = next
      } else {
        // Paused (hover, dialog, manual swipe or arrow) — resync the
        // accumulator so the drift continues from wherever the user left it.
        offsetRef.current = scroller.scrollLeft
      }

      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Escape closes the dialog, and the page behind it shouldn't scroll.
  useEffect(() => {
    if (!active) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTestimonial()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [active, closeTestimonial])

  // Keep manual scrolling inside the loop window too.
  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const half = scroller.scrollWidth / 2
    if (half <= 0) return

    // Only resync the accumulator when we actually wrap. This handler also
    // fires for the loop's own writes, and copying the (rounded) DOM value back
    // every frame would defeat the sub-pixel accumulation entirely.
    if (scroller.scrollLeft <= 0) {
      scroller.scrollLeft += half
      offsetRef.current = scroller.scrollLeft
    } else if (scroller.scrollLeft >= half * 2) {
      scroller.scrollLeft -= half
      offsetRef.current = scroller.scrollLeft
    }
  }, [])

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current
      if (!scroller) return

      const card = scroller.querySelector<HTMLElement>('[data-testimonial-card]')
      const step = card ? card.offsetWidth + 24 : 320

      // Pause while the smooth scroll plays out, otherwise the drift fights it.
      pause(true)
      scroller.scrollBy({ left: direction * step, behavior: 'smooth' })

      if (resumeTimer.current) clearTimeout(resumeTimer.current)
      resumeTimer.current = setTimeout(() => pause(false), 3500)
    },
    [pause]
  )

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
    },
    []
  )

  if (items.length === 0) return null

  // Second pass is the seamless-loop clone — hidden from assistive tech.
  const loop = [...items, ...items]

  return (
    <div className="relative">
      {/* Soft edge fades so cards dissolve rather than getting sliced off. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-ivory to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ivory to-transparent sm:w-24" />

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onMouseEnter={() => pause(true)}
        onMouseLeave={() => pause(false)}
        onFocusCapture={() => pause(true)}
        onBlurCapture={() => pause(false)}
        onTouchStart={() => pause(true)}
        onTouchEnd={() => {
          if (resumeTimer.current) clearTimeout(resumeTimer.current)
          resumeTimer.current = setTimeout(() => pause(false), 3500)
        }}
        // Replaces the removed arrow buttons — keyboard users can still step
        // through the rail one card at a time.
        onKeyDown={e => {
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            nudge(1)
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            nudge(-1)
          }
        }}
        className="overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-6 py-2">
          {loop.map((testimonial, i) => {
            const isClone = i >= items.length
            return (
              <figure
                key={i}
                data-testimonial-card
                aria-hidden={isClone}
                role="button"
                // Clones are duplicates — keep them out of the tab order so
                // keyboard users don't walk the same five reviews twice.
                tabIndex={isClone ? -1 : 0}
                onClick={() => openTestimonial(testimonial)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openTestimonial(testimonial)
                  }
                }}
                className="group relative flex w-[80vw] shrink-0 cursor-pointer flex-col justify-between rounded-2xl border border-ivory-3 bg-white p-6 shadow-soft outline-none transition-colors hover:border-green-4 focus-visible:border-green-4 focus-visible:ring-2 focus-visible:ring-green-4 sm:w-[340px]"
              >
                <div className="relative">
                  <Stars count={testimonial.stars} className="mb-3 text-sm" />
                  <blockquote className="mb-4 line-clamp-4 text-sm font-light italic leading-relaxed text-ink-2">
                    {testimonial.text}
                  </blockquote>
                  <span className="mb-4 block text-[.68rem] font-medium uppercase tracking-wider text-green-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    Read full review →
                  </span>
                </div>
                <figcaption className="flex items-center gap-3 border-t border-ivory-3 pt-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-6 font-serif text-sm text-green-2">
                    {testimonial.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{testimonial.name}</span>
                    <span className="block truncate text-[.68rem] text-ink-4">{testimonial.city}</span>
                  </span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>

      {/* The visible control strip is intentionally gone — the rail is driven by
          hover/touch/focus pause, native swipe and click-to-open instead. The
          keyboard path below keeps it operable without any on-screen chrome. */}
      <span className="sr-only" aria-live="polite">
        {paused ? 'Testimonials paused' : 'Testimonials scrolling automatically'}
      </span>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && closeTestimonial()}
          role="dialog"
          aria-modal="true"
          aria-label={`Review by ${active.name}`}
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-ivory-3 bg-white p-7 shadow-medium sm:p-9">
            <button
              type="button"
              onClick={closeTestimonial}
              aria-label="Close review"
              autoFocus
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-4 transition-colors hover:bg-ivory-2 hover:text-ink"
            >
              <X size={18} />
            </button>

            <Stars count={active.stars} className="mb-4 text-base" />

            <blockquote className="font-serif text-lg font-light italic leading-relaxed text-ink sm:text-xl">
              {active.text}
            </blockquote>

            <div className="mt-7 flex items-center gap-3 border-t border-ivory-3 pt-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-6 font-serif text-lg text-green-2">
                {active.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{active.name}</span>
                <span className="block truncate text-xs text-ink-4">{active.city}</span>
              </span>
              <span className="ml-auto shrink-0 rounded-full border border-green-5 bg-green-6 px-2.5 py-1 text-[.62rem] font-medium uppercase tracking-wider text-green-2">
                Verified Buyer
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
