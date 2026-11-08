'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { GOALS, PROTOTYPES, type GoalKey } from './registry'

const FILTERS = GOALS.filter(goal => PROTOTYPES.filter(prototype => prototype.goals.includes(goal.key)).length >= 2)

/** The ten design cards, with a "what matters most?" filter. */
export function IndexGrid() {
  const [goal, setGoal] = useState<GoalKey | 'all'>('all')
  const shown = goal === 'all' ? PROTOTYPES : PROTOTYPES.filter(prototype => prototype.goals.includes(goal))

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center gap-2" role="group" aria-label="Filter designs by what matters most">
        <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6B6B6B]">What matters most?</span>
        {[{ key: 'all' as const, label: 'Show all' }, ...FILTERS].map(filter => {
          const count = filter.key === 'all' ? PROTOTYPES.length : PROTOTYPES.filter(prototype => prototype.goals.includes(filter.key)).length
          const active = goal === filter.key
          return (
            <button
              key={filter.key}
              type="button"
              aria-pressed={active}
              onClick={() => setGoal(filter.key)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition ${
                active ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#3A3A3A] ring-1 ring-black/10 hover:ring-black/30'
              }`}
            >
              {filter.label}
              <span className={`text-xs font-semibold ${active ? 'text-white/70' : 'text-[#8A8A8A]'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shown.map(prototype => (
          <article key={prototype.slug} className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.35)]">
            <Link href={`/prototypes/${prototype.slug}`} className="relative block aspect-[16/11] overflow-hidden" style={{ backgroundColor: prototype.swatches[0] }} aria-label={`Open design ${prototype.key}, ${prototype.name}`}>
              <Image
                src={`/prototype-thumbs/${prototype.slug}-desktop.jpg`}
                alt={`Desktop view of design ${prototype.key}, ${prototype.name}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute bottom-3 right-3 block aspect-[390/844] w-[24%] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-[3px] ring-[#111]">
                <Image
                  src={`/prototype-thumbs/${prototype.slug}-mobile.jpg`}
                  alt={`Phone view of design ${prototype.key}, ${prototype.name}`}
                  fill
                  sizes="120px"
                  className="object-cover object-top"
                />
              </span>
              <span className="absolute left-3 top-3 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#111] px-2.5 text-sm font-extrabold text-white shadow">{prototype.key}</span>
              {prototype.isNew && (
                <span className="absolute left-14 top-3 inline-flex h-8 items-center gap-1 rounded-full bg-[#F59E0B] px-3 text-xs font-extrabold text-[#1A1A1A] shadow">
                  <Sparkles size={13} /> New
                </span>
              )}
            </Link>

            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-extrabold leading-tight">
                  <span className="mr-1.5 text-[#8A8A8A]">{prototype.key}.</span>
                  {prototype.name}
                </h2>
                <div className="mt-1 flex shrink-0 -space-x-1.5" aria-hidden>
                  {prototype.swatches.map(color => (
                    <span key={color} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
              </div>
              <div className="mt-1 text-xs font-semibold text-[#6B6B6B]">{prototype.tag}</div>
              <p className="mt-3 text-sm leading-relaxed text-[#3F3F3F]">{prototype.text}</p>
              <div className="mt-3 text-[13px] text-[#3F3F3F]">
                <b className="text-[#1A1A1A]">Best for:</b> {prototype.bestFor}
              </div>
              <ul className="mt-3 space-y-1.5">
                {prototype.points.map(point => (
                  <li key={point} className="flex gap-2 text-[13px] text-[#3F3F3F]">
                    <Check size={15} className="mt-0.5 shrink-0 text-[#0F7A47]" /> {point}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-[#F4F2EE] p-3.5 text-[12.5px] leading-relaxed text-[#3F3F3F]">
                <b className="text-[#1A1A1A]">Why it can work:</b> {prototype.why}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="text-[11px] text-[#8A8A8A]">{prototype.fonts}</span>
                <Link href={`/prototypes/${prototype.slug}`} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-[#1A1A1A] px-4 text-sm font-bold text-white transition hover:bg-black">
                  Open <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
