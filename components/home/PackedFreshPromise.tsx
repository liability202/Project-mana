const CHECKLIST = [
  'Ashwagandha powder — ground after order',
  'Triphala churna — blended to order',
  'Ground spices — never pre-ground in bulk',
  'All powders sealed immediately after grinding',
]

const PILLARS = [
  { icon: '🌿', title: '100% Natural', desc: 'No additives, fillers or preservatives. Ever.' },
  { icon: '🔬', title: 'Lab Tested', desc: 'Every batch quality checked before dispatch.' },
  { icon: '📦', title: 'Packed Fresh', desc: 'Ground and packed to order, not to stock.' },
  { icon: '🤝', title: 'Direct Sourcing', desc: 'Straight from farmers to your home.' },
]

/**
 * Deep-green promise band that sits directly under the kits grid.
 *
 * It uses `bg-green` rather than a token that inverts, so it stays a filled
 * brand surface in dark mode too — the ivory text on it is pinned to match.
 */
export function PackedFreshPromise() {
  return (
    <section className="fade-in bg-green px-[5%] py-10 sm:py-12">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="eyebrow text-green-4 before:bg-green-4 text-[.5rem] sm:text-[.56rem]">Our Promise</div>
          <h2 className="mb-4 sm:mb-5 font-serif text-[1.6rem] sm:text-[2rem] md:text-[2.5rem] font-light leading-tight text-ivory">
            Ground and packed <em className="not-italic text-green-4">after your order.</em>
          </h2>
          <p className="mb-6 sm:mb-7 max-w-[520px] text-[.8rem] sm:text-[.92rem] font-light leading-[1.7] sm:leading-[1.85] text-green-5/80">
            For all powders, churnas and ground spices — we do not pre-grind in bulk. Your order
            triggers the grinding. The difference in freshness and potency is immediate.
          </p>

          <ul className="flex list-none flex-col gap-3.5 p-0">
            {CHECKLIST.map(item => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-green-5/25 bg-green-5/10 text-xs text-green-4">
                  ✓
                </span>
                <span className="text-[.76rem] sm:text-[.84rem] text-green-4">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          {PILLARS.map(pillar => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-green-5/15 bg-white/[0.06] p-4 sm:p-6 transition-colors hover:border-green-5/30"
            >
              <div className="mb-2 sm:mb-3 text-xl sm:text-2xl">{pillar.icon}</div>
              <h3 className="mb-1 sm:mb-1.5 font-serif text-[.95rem] sm:text-[1.05rem] font-normal text-ivory">{pillar.title}</h3>
              <p className="text-[.72rem] sm:text-[.8rem] leading-relaxed text-green-5/65">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
