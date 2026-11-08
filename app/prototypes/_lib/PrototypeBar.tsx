'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { PROTOTYPES } from './registry'

/** A thin strip above every prototype: which design this is, and quick ways to the others. */
export function PrototypeBar() {
  const pathname = usePathname() || ''
  const slug = pathname.split('/')[2] || ''
  const index = PROTOTYPES.findIndex(prototype => prototype.slug === slug)
  if (index < 0) return null

  const current = PROTOTYPES[index]
  const previous = PROTOTYPES[(index - 1 + PROTOTYPES.length) % PROTOTYPES.length]
  const next = PROTOTYPES[(index + 1) % PROTOTYPES.length]

  return (
    <nav aria-label="Design prototypes" className="relative z-[60] bg-[#111111] text-white [font-family:ui-sans-serif,system-ui,-apple-system,'Segoe_UI',sans-serif]">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-2 px-3 text-[12px] sm:px-6">
        <Link href="/prototypes" className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-semibold text-white/80 transition hover:bg-white/10 hover:text-white">
          <LayoutGrid size={14} />
          <span className="hidden sm:inline">All designs</span>
        </Link>
        <span className="h-4 w-px bg-white/20" aria-hidden />
        <span className="min-w-0 truncate">
          <span className="text-white/60">Design {current.key} of {PROTOTYPES.length} ·</span> <b className="font-semibold">{current.name}</b>
          <span className="hidden text-white/60 md:inline"> — {current.tag}</span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <Link href={`/prototypes/${previous.slug}`} aria-label={`Previous design: ${previous.name}`} className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-white/80 transition hover:bg-white/10 hover:text-white">
            <ChevronLeft size={15} /> <span className="hidden sm:inline">{previous.key}</span>
          </Link>
          <Link href={`/prototypes/${next.slug}`} aria-label={`Next design: ${next.name}`} className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-white/80 transition hover:bg-white/10 hover:text-white">
            <span className="hidden sm:inline">{next.key}</span> <ChevronRight size={15} />
          </Link>
        </span>
      </div>
    </nav>
  )
}
