'use client'
import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  subtitle?: string
}

export function StatCard({ label, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft transition-transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[.68rem] uppercase tracking-wider text-ink-3 font-medium">{label}</span>
        {icon && <div className="text-green opacity-70">{icon}</div>}
      </div>
      <div className="font-serif text-2xl text-ink leading-none">{value}</div>
      {subtitle && <div className="text-[.62rem] text-green-3 mt-2">{subtitle}</div>}
    </div>
  )
}
