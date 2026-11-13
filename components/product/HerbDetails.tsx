import type { HerbContent } from '@/lib/herb-content'

// Server component: everything here is in the page's HTML, so search engines
// and AI crawlers read it without running JavaScript. The FAQ uses <details>
// so it works as an accordion with no client code.
export function HerbDetails({ herb, productName }: { herb: HerbContent; productName: string }) {
  const name = herb.title.replace(/ Powder$/, '')

  return (
    <section className="px-[5%] pb-10 max-w-[1100px] mx-auto" aria-labelledby="herb-guide">
      <div className="bg-white border border-ivory-3 rounded-2xl p-6 sm:p-10 shadow-soft">
        <div className="eyebrow mb-2">Herb guide</div>
        <h2 id="herb-guide" className="font-serif text-[clamp(1.5rem,2.6vw,2.1rem)] text-ink font-light leading-tight mb-4">
          About {herb.title} ({herb.hindi})
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm">
          <div className="bg-ivory-2 border border-ivory-3 rounded-lg p-3">
            <dt className="text-[.6rem] tracking-[.18em] uppercase text-ink-4 mb-1">Hindi name</dt>
            <dd className="text-ink">{herb.hindi}</dd>
          </div>
          <div className="bg-ivory-2 border border-ivory-3 rounded-lg p-3">
            <dt className="text-[.6rem] tracking-[.18em] uppercase text-ink-4 mb-1">Botanical name</dt>
            <dd className="text-ink italic">{herb.botanical}</dd>
          </div>
          <div className="bg-ivory-2 border border-ivory-3 rounded-lg p-3">
            <dt className="text-[.6rem] tracking-[.18em] uppercase text-ink-4 mb-1">Also known as</dt>
            <dd className="text-ink">{herb.aka.join(', ')}</dd>
          </div>
        </dl>

        <div className="space-y-3 text-[.92rem] text-ink-2 leading-[1.85] mb-8">
          {herb.intro.map(p => <p key={p}>{p}</p>)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">Traditional uses of {name}</h3>
            <ul className="list-disc pl-5 space-y-2 text-[.9rem] text-ink-2 leading-[1.75]">
              {herb.traditionalUses.map(u => <li key={u}>{u}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">How to use {herb.title}</h3>
            <ul className="list-disc pl-5 space-y-2 text-[.9rem] text-ink-2 leading-[1.75]">
              {herb.howToUse.map(u => <li key={u}>{u}</li>)}
            </ul>
            <p className="mt-3 text-[.85rem] text-ink-3 leading-[1.7]">
              <strong className="text-ink font-medium">Typical amount: </strong>{herb.typicalAmount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">Precautions</h3>
            <ul className="list-disc pl-5 space-y-2 text-[.9rem] text-ink-2 leading-[1.75]">
              {herb.precautions.map(u => <li key={u}>{u}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink mb-3">Storage</h3>
            <p className="text-[.9rem] text-ink-2 leading-[1.75]">{herb.storage}</p>
            <h3 className="font-serif text-xl text-ink mt-6 mb-3">Quality</h3>
            <p className="text-[.9rem] text-ink-2 leading-[1.75]">
              Every batch of Mana {productName} is lab tested before packing, packed fresh to order and FSSAI certified.
            </p>
          </div>
        </div>

        <h3 className="font-serif text-xl text-ink mb-3">{herb.title}: frequently asked questions</h3>
        <div className="divide-y divide-ivory-3 border-y border-ivory-3">
          {herb.faqs.map(f => (
            <details key={f.q} className="group py-3">
              <summary className="cursor-pointer list-none flex justify-between gap-4 text-[.92rem] font-medium text-ink">
                {f.q}
                <span className="text-green transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-[.88rem] text-ink-3 leading-[1.75]">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-[.72rem] text-ink-4 leading-[1.6]">
          This information describes traditional use and is not medical advice. It is not intended to diagnose, treat, cure or
          prevent any disease. Consult a qualified practitioner before use, especially if you are pregnant, nursing, taking
          medicine or have a medical condition.
        </p>
      </div>
    </section>
  )
}
