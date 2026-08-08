'use client'
import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  subtitle?: string
  /** When set, the whole card becomes a link through to the detail screen. */
  href?: string
}

export function StatCard({ label, value, icon, subtitle, href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[.68rem] uppercase tracking-wider text-ink-3 font-medium">{label}</span>
        {icon && <div className="text-green opacity-70">{icon}</div>}
      </div>
      <div className="font-serif text-2xl text-ink leading-none">{value}</div>
      {subtitle && (
        <div className="text-[.62rem] text-green-3 mt-2 flex items-center gap-1">
          {subtitle}
          {href && <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      )}
    </>
  )

  const base = 'block bg-white border border-ivory-3 rounded-xl p-5 shadow-soft transition-transform hover:scale-[1.02]'

  if (href) {
    return (
      <Link href={href} className={`${base} group no-underline hover:border-green-4 cursor-pointer`}>
        {body}
      </Link>
    )
  }

  return <div className={base}>{body}</div>
}
