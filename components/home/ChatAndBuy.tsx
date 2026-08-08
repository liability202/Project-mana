import Image from 'next/image'

// Prefilled WhatsApp message, per the brief. Encoded once here so the two
// entry points below can't drift apart.
const WHATSAPP_MESSAGE = 'Hey I want to order can I more info about this'

const STEPS = [
  { n: 1, title: 'Upload your list', desc: 'Image, PDF or text — whatever works for you' },
  { n: 2, title: 'Choose a preference', desc: 'Highest quality, most popular, or best price' },
  { n: 3, title: 'Pay a small advance', desc: '10–20% to confirm your order' },
  { n: 4, title: 'Remaining at dispatch', desc: 'Or pay in full anytime before delivery' },
]

const PREFERENCE_CHIPS = [
  { icon: '⭐', label: 'Highest Quality' },
  { icon: '🔥', label: 'Most Selling' },
  { icon: '💰', label: 'Best Price' },
]

/**
 * "Chat & Buy" pitch section.
 *
 * The chat panel on the left is a static mock-up — it illustrates the flow and
 * is intentionally non-interactive. The only live element is the CTA, which
 * opens WhatsApp with a prefilled message.
 */
export function ChatAndBuy() {
  const whatsappHref = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <section className="fade-in bg-green-6 px-[5%] py-10 sm:py-12">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ── Mock conversation (decorative) ── */}
        <div
          className="mx-auto w-full max-w-[520px] rounded-2xl border border-ivory-3 bg-white p-4 sm:p-6 shadow-medium"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3 border-b border-ivory-3 pb-4">
            <Image
              src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/MORTAR%20LOGO.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div className="text-sm font-medium text-ink">Mana Assistant</div>
              <div className="flex items-center gap-1.5 text-[.68rem] text-ink-4">
                <span className="h-1.5 w-1.5 rounded-full bg-green-4" />
                Online · Instant Reply
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-5">
            <div className="max-w-[85%] self-start rounded-xl rounded-tl-sm bg-ivory-2 px-4 py-3 text-[.82rem] text-ink-2">
              Namaste! 🙏 Share your list or tell me what you need.
            </div>

            <div className="max-w-[85%] self-end rounded-xl rounded-br-sm bg-green px-4 py-3 text-[.82rem] text-ivory">
              Almonds, ashwagandha and tulsi for this month
            </div>

            <div className="rounded-xl bg-ivory-2 px-4 py-3.5">
              <div className="mb-2.5 text-[.82rem] font-medium text-ink">How should I pick them?</div>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_CHIPS.map(chip => (
                  <span
                    key={chip.label}
                    className="rounded-full border border-ivory-4 bg-white px-3 py-1.5 text-[.72rem] text-ink-2"
                  >
                    {chip.icon} {chip.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 rounded-xl bg-ivory-2 p-2 pl-4">
              <span className="flex-1 text-[.8rem] text-ink-4">Type or upload your list…</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green text-ivory">↑</span>
            </div>
          </div>
        </div>

        {/* ── Copy + CTA ── */}
        <div>
          <div className="eyebrow text-[.5rem] sm:text-[.56rem]">Chat &amp; Buy</div>
          <h2 className="mb-6 sm:mb-8 font-serif text-[1.6rem] sm:text-[2rem] md:text-[2.8rem] font-light leading-tight text-ink">
            Tell us what you need,<br />we do the rest.
          </h2>

          <ol className="mb-7 sm:mb-9 flex list-none flex-col gap-4 sm:gap-5 p-0">
            {STEPS.map(step => (
              <li key={step.n} className="flex items-start gap-4">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full border border-green-5 text-[.68rem] sm:text-[.78rem] font-medium text-green">
                  {step.n}
                </span>
                <span>
                  <span className="block text-[.8rem] sm:text-[.92rem] font-medium text-ink">{step.title}</span>
                  <span className="mt-0.5 block text-[.72rem] sm:text-[.82rem] font-light text-ink-3">{step.desc}</span>
                </span>
              </li>
            ))}
          </ol>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary no-underline px-6 sm:px-9 py-3 sm:py-4 text-[.9rem] sm:text-[1.05rem] inline-block"
          >
            Start Chat &amp; Buy →
          </a>
        </div>
      </div>
    </section>
  )
}
