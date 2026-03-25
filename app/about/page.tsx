import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="bg-green px-[5%] py-20 relative overflow-hidden">
        <div className="absolute right-[-100px] top-[-100px] w-[500px] h-[500px] rounded-full bg-green-5/8 pointer-events-none" />
        <div className="max-w-[760px] relative z-10">
          <div className="eyebrow" style={{ color: 'var(--green4)' }}>Our Story</div>
          <h1 className="font-serif text-[clamp(2.4rem,5vw,4.8rem)] text-ivory font-light leading-[1.06] tracking-tight mb-5">
            We started because we <em className="not-italic text-green-4">couldn't find</em> what we were looking for.
          </h1>
          <p className="text-[1.05rem] leading-[1.9]" style={{ color: 'rgba(194,224,206,0.72)' }}>
            As a family that has been in the dry fruits and spices trade for decades in Ghaziabad, we knew exactly what premium meant — and what was missing from everything being sold online.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="section bg-ivory-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-[1200px] mx-auto">
          <div>
            <div className="eyebrow">Who We Are</div>
            <h2 className="section-title mb-5">MK and Sons — <em className="not-italic text-green">generations</em> of expertise</h2>
            <p className="text-[.96rem] text-ink-3 leading-[1.9] mb-4">
              MK and Sons is a family-run dry fruits, herbs and spices business based in Ghaziabad. We have spent decades building relationships directly with farmers, orchards and growers across Kashmir, Kerala, Madhya Pradesh and beyond.
            </p>
            <p className="text-[.96rem] text-ink-3 leading-[1.9]">
              Mana is our online face — bringing the same handpicked quality we have always offered our local customers to every family across India. No middlemen. No compromise. Just nature's finest, straight to your door.
            </p>
            <div className="flex gap-10 mt-8 pt-7 border-t border-ivory-3 flex-wrap">
              {[['20+','Years in trade'], ['200+','Products'], ['48K+','Families served']].map(([n,l]) => (
                <div key={l}>
                  <div className="font-serif text-3xl text-green leading-none">{n}</div>
                  <div className="text-[.65rem] tracking-[.12em] uppercase text-ink-3 mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-medium border-[3px] border-white">
            <Image src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=85" alt="Our Market" width={700} height={500} className="object-cover w-full h-[420px]" />
          </div>
        </div>
      </section>

      {/* Quality Promise */}
      <section className="section bg-white">
        <div className="text-center mb-14">
          <div className="eyebrow justify-center">Our Quality Promise</div>
          <h2 className="section-title">Every product is <em className="not-italic text-green">handpicked.</em><br />No exceptions.</h2>
          <p className="text-[.92rem] text-ink-3 mt-2 max-w-[580px] mx-auto">We don't buy by the tonne and sell by the bag. Every variety is personally evaluated before it reaches you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {[
            ['🌿', 'Sourced directly', 'We work directly with farmers and orchards — no wholesale intermediaries. What you get is exactly what we selected at source.'],
            ['👁', 'Visually graded', 'Every batch is manually sorted by our team. Undersized or off-colour pieces never make it into a Mana pack.'],
            ['🔬', 'Lab tested', 'All batches undergo quality testing before dispatch. We are FSSAI licensed and maintain documentation for every product.'],
          ].map(([ico, t, d]) => (
            <div key={t} className="bg-ivory-2 border border-ivory-3 rounded-xl p-7">
              <div className="w-12 h-12 rounded-xl bg-green-6 border border-green-5 flex items-center justify-center text-2xl mb-4">{ico}</div>
              <div className="font-serif text-[1.18rem] text-ink mb-2">{t}</div>
              <p className="text-[.83rem] text-ink-3 leading-[1.72]">{d}</p>
            </div>
          ))}
        </div>

        {/* Packed fresh block */}
        <div className="bg-green rounded-2xl p-12 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="eyebrow" style={{ color: 'var(--green4)' }}>Packed Fresh — Always</div>
            <h3 className="font-serif text-[clamp(1.7rem,2.8vw,2.5rem)] text-ivory font-light leading-tight mb-4">
              Ground and packed <em className="not-italic text-green-4">after your order.</em> Not before.
            </h3>
            <p className="text-[.92rem] leading-[1.85] mb-5" style={{ color: 'rgba(194,224,206,0.72)' }}>
              For all powders, churnas and ground spices — we do not pre-grind in bulk and store. Your order triggers the grinding. The difference in aroma, colour and potency is immediate and unmistakable.
            </p>
            <div className="flex flex-col gap-3">
              {['Ashwagandha powder — ground after order','Triphala churna — blended to order','Ground spices — never pre-ground in bulk','All powders sealed immediately after grinding'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-green-5/25 bg-green-5/10 flex items-center justify-center text-green-4 text-xs flex-shrink-0">✓</div>
                  <span className="text-[.84rem] text-green-4">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[['⏱','Order to dispatch','Powders and churnas processed within 24–48 hours of your order. Whole products dispatched same day.'],
              ['🌱','No preservatives. Ever.','Because we pack fresh to order, we never need artificial preservatives. Natural shelf life is enough when packed right.']
            ].map(([ico, t, d]) => (
              <div key={t} className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(194,224,206,0.15)' }}>
                <div className="text-2xl mb-2">{ico}</div>
                <div className="font-serif text-ivory text-base mb-1">{t}</div>
                <div className="text-[.82rem] leading-relaxed" style={{ color: 'rgba(194,224,206,0.65)' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <div className="bg-ivory-2 px-[5%] py-10 border-t border-b border-ivory-3">
        <div className="flex items-center justify-center gap-10 flex-wrap max-w-[1000px] mx-auto">
          {[['🏅','FSSAI Licensed','Food safety certified'],['🔬','Lab Tested','Every batch verified'],['📦','Packed Fresh','To order, not to stock'],['🌿','No Additives','100% pure always'],['🤝','Direct Sourcing','Farm to your home']].map(([ico,t,d], i) => (
            <div key={t} className="text-center">
              <div className="text-3xl mb-1.5">{ico}</div>
              <div className="text-[.72rem] font-medium text-ink-2 tracking-wide uppercase">{t}</div>
              <div className="text-[.65rem] text-ink-4 mt-0.5">{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="section bg-white text-center">
        <h2 className="section-title mb-2">Ready to experience the <em className="not-italic text-green">difference?</em></h2>
        <p className="text-[.92rem] text-ink-3 max-w-[500px] mx-auto mb-8">Everything we've described shows up in every single order. Try it once — you'll taste the difference.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/products" className="btn-primary no-underline"><span>Shop Now</span></Link>
          <Link href="/appointment" className="btn-outline no-underline">Book a Video Call →</Link>
        </div>
      </section>
    </>
  )
}
