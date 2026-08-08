'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'mana_theme'

export type Theme = 'light' | 'dark'

/** Kept in sync with the blocking script in app/layout.tsx. */
function resolveTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage blocked — fall through to the OS preference */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  // `null` until mounted so SSR and the first client paint agree — the blocking
  // script has already put the right class on <html>, so nothing flashes.
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setTheme(resolveTheme())

    // Follow the OS while the visitor hasn't made an explicit choice.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      let stored: string | null = null
      try {
        stored = localStorage.getItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      if (stored === 'light' || stored === 'dark') return
      const next: Theme = media.matches ? 'dark' : 'light'
      setTheme(next)
      applyTheme(next)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      className={`cursor-pointer border-none bg-transparent p-1.5 text-ink-2 transition-colors hover:text-green ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      type="button"
    >
      {/* Both icons render; opacity/rotation swap keeps the button from
          shifting layout before the theme is known. */}
      <span className="relative block h-[19px] w-[19px]">
        <Sun
          size={19}
          className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
        />
        <Moon
          size={19}
          className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        />
      </span>
    </button>
  )
}
