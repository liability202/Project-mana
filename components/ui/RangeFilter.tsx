'use client'
import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react'
import { DATE_RANGES, DATE_RANGE_LABELS, type DateRange } from '@/lib/date-ranges'

interface RangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  /** `sm` suits chart headers and modals; `md` matches the orders filter row. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Today / This Week / This Month / This Year / All Time picker.
 * Shared by the creator orders list, the dashboard chart and admin insights so
 * the three stay in step.
 */
export function RangeFilter({ value, onChange, size = 'md', className = '' }: RangeFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const active = value !== 'all'
  const padding = size === 'sm' ? 'px-3.5 py-2 text-[.62rem]' : 'px-5 py-2.5 text-[.68rem]'

  return (
    <div className={`relative shrink-0 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full sm:w-auto flex items-center justify-between gap-2 rounded-xl font-bold uppercase tracking-wider border transition-all whitespace-nowrap shadow-sm ${padding} ${
          active
            ? 'bg-green text-ivory border-green shadow-soft'
            : 'bg-white text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'
        }`}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={size === 'sm' ? 12 : 13} />
          {DATE_RANGE_LABELS[value]}
        </span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-full sm:w-48 bg-white border border-ivory-3 rounded-xl shadow-soft overflow-hidden animate-fade-in"
        >
          {DATE_RANGES.map(range => (
            <button
              key={range}
              type="button"
              role="option"
              aria-selected={value === range}
              onClick={() => {
                onChange(range)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-[.72rem] font-medium transition-colors ${
                value === range ? 'bg-ivory-2 text-green font-bold' : 'text-ink-2 hover:bg-ivory-2/60'
              }`}
            >
              {DATE_RANGE_LABELS[range]}
              {value === range && <Check size={13} className="text-green" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
