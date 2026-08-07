'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollObserver() {
  const pathname = usePathname()

  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let cancelled = false

    // Wait one frame instead of a fixed 50ms timeout: the DOM for the new route
    // is guaranteed to be committed, and there's no visible gap where
    // already-visible sections sit at opacity 0.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return

      const els = Array.from(document.querySelectorAll<HTMLElement>('.fade-in'))
      if (els.length === 0) return

      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible')
              observer?.unobserve(entry.target)
            }
          }
        },
        { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
      )

      // Measure everything first, then mutate. Interleaving reads and writes
      // forced a synchronous layout per element on every navigation.
      const viewportHeight = window.innerHeight
      const alreadyVisible = els.map(el => el.getBoundingClientRect().top < viewportHeight)

      els.forEach((el, i) => {
        if (alreadyVisible[i]) {
          // In view on load — show it immediately, no animation needed.
          el.classList.add('visible')
        } else {
          el.classList.remove('visible')
          observer!.observe(el)
        }
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      // This disconnect used to live inside the timeout callback, so it never
      // ran — every navigation leaked another observer.
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
