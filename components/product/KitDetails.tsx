import Link from 'next/link'
import type { KitContent } from '@/lib/kit-content'
import { getHerbContent } from '@/lib/herb-content'

export type KitDetailItem = { name: string; slug?: string; category?: string }

// Server component, like HerbDetails: all of this is in the page HTML, so
// search engines and AI crawlers read it without running JavaScript.
export function KitDetails({ kit, items }: { kit: KitContent; items: KitDetailItem[] }) {
  return (
    <section className="px-[5%] pt-4 pb-10 max-w-[1000px] mx-auto" aria-labelledby="kit-guide">
      <div className="bg-white border border-ivory-3 rounded-2xl p-6 sm:p-10 shadow-soft">
        <div className="eyebrow mb-2">Kit guide</div>
        <h2 id="kit-guide" className="font-serif text-[clamp(1.5rem,2.6vw,2.1rem)] text-ink font-light leading-tight mb-4">
          About the {kit.title}
        </h2>

        <div className="space-y-3 text-[.92rem] text-ink-2 leading-[1.85] mb-8">
          {kit.intro.map(p => <p key={p}>{p}</p>)}
        </div>

        <h3 className="font-serif text-xl text-ink mb-3">What&apos;s inside</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {items.map(item => {
            const herb = getHerbContent(item.slug)
            const role = (item.slug && kit.itemRoles[item.slug]) || ''
            const name = item.name.replace(/\s+/g, ' ').trim()
            return (
              <li key={item.slug || name} className="bg-ivory-2 border border-ivory-3 rounded-lg p-3">
                <div className="text-[.92rem] font-medium text-ink">
                  {item.slug ? <Link href={`/products/${item.slug}`} className="hover:text-green no-underline text-ink">{name}</Link> : name}
                  {herb && <span className="text-ink-4 font-normal"> · {herb.hindi}</span>}
                </div>
                {(role || herb) && (
                  <div className="text-[.75rem] text-ink-3 mt-0.5 leading-snug">
                    {role}{role && herb ? ' · ' : ''}{herb && <span className="italic">{herb.botanical}</span>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">How to use the {kit.title}</h3>
            <ol className="list-decimal pl-5 space-y-2 text-[.9rem] text-ink-2 leading-[1.75]">
              {kit.routine.map(step => <li key={step}>{step}</li>)}
            </ol>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">Who it&apos;s for</h3>
            <ul className="list-disc pl-5 space-y-2 text-[.9rem] text-ink-2 leading-[1.75]">
              {kit.whoFor.map(w => <li key={w}>{w}</li>)}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">Precautions</h3>
            <ul className="list-disc pl-5 space-y-2 text-[.9rem] text-ink-2 leading-[1.75]">
              {kit.precautions.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">Storage</h3>
            <p className="text-[.9rem] text-ink-2 leading-[1.75]">{kit.storage}</p>
            <h3 className="font-serif text-xl text-ink mt-6 mb-3">Quality</h3>
            <p className="text-[.9rem] text-ink-2 leading-[1.75]">
              Every item in the {kit.title} is lab tested before packing, packed fresh to order and FSSAI certified.
            </p>
          </div>
        </div>

        <h3 className="font-serif text-xl text-ink mb-3">{kit.title}: frequently asked questions</h3>
        <div className="divide-y divide-ivory-3 border-y border-ivory-3">
          {kit.faqs.map(f => (
            <details key={f.q} className="group py-3">
              <summary className="cursor-pointer list-none flex justify-between gap-4 text-[.92rem] font-medium text-ink">
                {f.q}
                <span className="text-green transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-[.88rem] text-ink-3 leading-[1.75]">{f.a}</p>
            </details>
          ))}
        </div>

        {kit.medicalNote && (
          <p className="mt-6 text-[.72rem] text-ink-4 leading-[1.6]">
            This information describes traditional use and is not medical advice. It is not intended to diagnose, treat, cure or
            prevent any disease. Consult a qualified practitioner or your doctor before use, especially if you are pregnant,
            nursing, taking medicine or have a medical condition.
          </p>
        )}
      </div>
    </section>
  )
}
