import type { ReactNode } from 'react'
import { whatsappUrl } from '@/lib/utils'

/**
 * Bilingual text. Both languages are rendered and the page root shows one of
 * them (CSS keyed on data-lang), so this works inside server components and
 * switching language is instant, with no layout jump from loading text.
 */
export function T({ en, hi }: { en: ReactNode; hi: ReactNode }) {
  return (
    <>
      <span className="t-en">{en}</span>
      <span className="t-hi" lang="hi">
        {hi}
      </span>
    </>
  )
}

export const WHATSAPP_EN = 'Hi Mana! I would like to place an order.'
export const WHATSAPP_HI = 'नमस्ते मना! मुझे ऑर्डर करना है।'

/** A WhatsApp link whose prefilled message matches the language on screen. */
export function WhatsAppLink({
  className = '',
  en,
  hi,
  label,
  messageEn = WHATSAPP_EN,
  messageHi = WHATSAPP_HI,
}: {
  className?: string
  en: ReactNode
  hi: ReactNode
  /** Accessible names when the link shows only an icon. */
  label?: [string, string]
  messageEn?: string
  messageHi?: string
}) {
  return (
    <>
      <a href={whatsappUrl(messageEn)} target="_blank" rel="noopener noreferrer" aria-label={label?.[0]} className={`t-en ${className}`}>
        {en}
      </a>
      <a href={whatsappUrl(messageHi)} target="_blank" rel="noopener noreferrer" aria-label={label?.[1]} className={`t-hi ${className}`} lang="hi">
        {hi}
      </a>
    </>
  )
}

/** Section heading: a small painted label, the title, and an optional line under it. */
export function SectionTitle({
  eyebrow,
  title,
  sub,
  center = false,
  dark = false,
}: {
  eyebrow: [ReactNode, ReactNode]
  title: [ReactNode, ReactNode]
  sub?: [ReactNode, ReactNode]
  center?: boolean
  dark?: boolean
}) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-[#E9B949]' : 'text-[#A8261C]'}`}>
        <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-current" />
        <T en={eyebrow[0]} hi={eyebrow[1]} />
        <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-current" />
      </div>
      <h2 className={`mt-3 text-[1.9rem] leading-[1.2] sm:text-[2.5rem] [font-family:var(--pansari-sign)] ${dark ? 'text-[#F8EEDC]' : 'text-[#1E1A16]'}`}>
        <T en={title[0]} hi={title[1]} />
      </h2>
      {sub && (
        <p className={`mt-3 text-[15px] leading-relaxed sm:text-base ${dark ? 'text-[#E8DCC6]' : 'text-[#4E4237]'}`}>
          <T en={sub[0]} hi={sub[1]} />
        </p>
      )}
    </div>
  )
}
