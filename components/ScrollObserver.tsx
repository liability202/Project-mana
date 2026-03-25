'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollObserver() {
  const pathname = usePathname()

  useEffect(() => {
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      const els = document.querySelectorAll('.fade-in')

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.08 }
      )

      els.forEach(el => {
        // Reset so animation works fresh on each navigation
        el.classList.remove('visible')
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight) {
          // Already in viewport — show immediately, no animation needed
          el.classList.add('visible')
        } else {
          observer.observe(el)
        }
      })

      return () => observer.disconnect()
    }, 50)

    return () => clearTimeout(timer)
  }, [pathname]) // ✅ re-runs on every page navigation

  return null
}
