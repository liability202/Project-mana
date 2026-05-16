'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const WHATSAPP_NUMBER = '919910899796'

const faqGroups = [
  {
    title: 'Orders & Payments',
    pillClass: 'bg-terra/10 text-terra border border-terra/20',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept UPI, all major debit and credit cards, net banking, and Cash on Delivery. All online payments are powered securely by Cashfree.'
      },
      {
        q: 'Is it safe to pay on your website?',
        a: 'Yes. Payments are processed through Cashfree, which is PCI-DSS compliant. We never store your card details on our servers.'
      },
      {
        q: 'Can I place a COD order?',
        a: 'Yes, COD is available pan-India on eligible orders. A flat Rs 40 COD handling charge applies.'
      },
      {
        q: 'How do I apply a coupon code?',
        a: 'At checkout, enter your coupon code in the promo field and click Apply. The discount will reflect instantly if the code is valid.'
      },
      {
        q: 'Can I modify or cancel my order?',
        a: 'Yes, usually within 2 hours of placing the order. Please WhatsApp us immediately so our team can catch it before packing or dispatch.'
      }
    ]
  },
  {
    title: 'Freshness & Quality',
    pillClass: 'bg-green-6 text-green border border-green-5',
    items: [
      {
        q: 'Are your powders really ground after the order?',
        a: 'Yes. Our churnas and powders are ground fresh after the order is placed. This may add around 24 to 48 hours to dispatch, but it gives you far better aroma and potency.'
      },
      {
        q: 'What does "lab tested" mean?',
        a: 'It means every batch is checked for purity and basic quality parameters before dispatch so you receive clean, reliable products.'
      },
      {
        q: 'Where do you source your products from?',
        a: 'We source directly from trusted farmers and producing regions across Kashmir, Kerala, Madhya Pradesh, Rajasthan, and other parts of India depending on the product.'
      },
      {
        q: 'Are your products FSSAI certified?',
        a: 'Yes. Mana is operated by MK and Sons, an FSSAI licensed food business.'
      },
      {
        q: 'Do you add preservatives?',
        a: 'Never. Because we pack fresh and move batches quickly, we do not rely on artificial preservatives.'
      }
    ]
  },
  {
    title: 'Shipping & Delivery',
    pillClass: 'bg-ivory-2 text-green border border-ivory-3',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Typical delivery is 5 to 7 days across India and around 2 to 3 days within NCR, subject to courier timelines and pincode serviceability.'
      },
      {
        q: 'What is the free shipping threshold?',
        a: 'We offer free shipping on eligible prepaid orders above Rs 999 unless a special campaign states otherwise.'
      },
      {
        q: 'Do you deliver across India?',
        a: 'Yes. We serve customers across India via NimbusPost and its courier network, subject to pincode coverage.'
      },
      {
        q: 'How do I track my order?',
        a: 'Once your order is dispatched, we send the tracking link on WhatsApp so you can follow it easily.'
      },
      {
        q: 'What if my package is damaged?',
        a: 'Please WhatsApp us with a clear photo within 24 hours of delivery. We will review it quickly and help with the next steps.'
      }
    ]
  },
  {
    title: 'Returns & Refunds',
    pillClass: 'bg-terra/10 text-terra border border-terra/20',
    items: [
      {
        q: 'What is your return policy?',
        a: 'Returns are generally accepted within 7 days from delivery, provided the item is unused and in original packaging.'
      },
      {
        q: 'Can I return food products?',
        a: 'Food items can usually be returned only if the wrong product was sent or the package arrived damaged, due to food safety rules.'
      },
      {
        q: 'How long do refunds take?',
        a: 'Approved refunds are usually processed within 5 to 7 business days to the original payment method, depending on the bank or payment partner.'
      }
    ]
  },
  {
    title: 'Cashback & Wallet',
    pillClass: 'bg-green-6 text-green border border-green-5',
    items: [
      {
        q: 'How does cashback work?',
        a: 'You receive 5% of the order value as wallet credit, usually released within 48 hours after successful delivery.'
      },
      {
        q: 'When can I use my cashback?',
        a: 'You can use it from your next order onward. There is no minimum order requirement unless a campaign specifically says otherwise.'
      },
      {
        q: 'Where do I see my wallet balance?',
        a: 'You can check it on the /account page after entering your WhatsApp number.'
      },
      {
        q: 'Do cashback credits expire?',
        a: 'Yes. Cashback credits are valid for 6 months from the date they are credited.'
      }
    ]
  },
  {
    title: 'Kits & Custom Orders',
    pillClass: 'bg-ivory-2 text-green border border-ivory-3',
    items: [
      {
        q: 'Can I customise a kit?',
        a: 'Yes. Visit the /kits page to build your own kit with the exact items and quantities you want.'
      },
      {
        q: 'Do you do bulk or wholesale orders?',
        a: 'Yes, we do. Please WhatsApp us for pricing, quantity planning, and dispatch timelines.'
      },
      {
        q: 'Can I order corporate gifts?',
        a: 'Yes. We create custom gifting kits and hampers for Diwali, events, teams, and brand-led gifting requirements.'
      }
    ]
  },
  {
    title: 'Video Appointments',
    pillClass: 'bg-terra/10 text-terra border border-terra/20',
    items: [
      {
        q: 'What is a video appointment?',
        a: 'It is a live video call with our team where we can show you products, explain options, and help you choose before you buy.'
      },
      {
        q: 'How do I book one?',
        a: 'Go to the /appointment page, pick your preferred date and time, and confirm the booking.'
      },
      {
        q: 'Is there a charge?',
        a: 'No. Video appointments are free and there is no obligation to purchase.'
      }
    ]
  }
]

export default function FAQPage() {
  const [query, setQuery] = useState('')
  const [openByCategory, setOpenByCategory] = useState<Record<string, string | null>>({})

  const normalizedQuery = query.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    return faqGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!normalizedQuery) return true
          return `${item.q} ${item.a}`.toLowerCase().includes(normalizedQuery)
        })
      }))
      .filter((group) => group.items.length > 0)
  }, [normalizedQuery])

  const totalResults = filteredGroups.reduce((sum, group) => sum + group.items.length, 0)

  function toggleItem(category: string, question: string) {
    setOpenByCategory((prev) => ({
      ...prev,
      [category]: prev[category] === question ? null : question
    }))
  }

  return (
    <>
      <header className="bg-green px-[5%] py-16 md:py-20">
        <div className="mx-auto max-w-[980px]">
          <nav aria-label="Breadcrumb" className="mb-5 text-[0.72rem] text-green-4">
            <Link href="/" className="transition-colors hover:text-ivory">
              Home
            </Link>
            <span className="px-2 text-green-5/60">›</span>
            <span className="text-green-4">FAQ</span>
          </nav>
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.24em] text-green-4">Support</p>
          <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-light leading-[1.05] tracking-tight text-ivory">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-[640px] text-[0.95rem] leading-[1.85] text-green-4">
            Quick answers on orders, freshness, delivery, returns, cashback, kits, and video appointments for Mana.
          </p>
        </div>
      </header>

      <main className="bg-ivory px-[5%] py-12 md:py-16">
        <div className="mx-auto max-w-[980px]">
          <div className="rounded-[26px] border border-ivory-3 bg-white p-5 shadow-soft md:p-7">
            <label htmlFor="faq-search" className="mb-2 block text-[0.72rem] font-medium uppercase tracking-[0.18em] text-ink-3">
              Search FAQs
            </label>
            <input
              id="faq-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders, delivery, refunds, powders, cashback..."
              className="w-full rounded-[14px] border border-ivory-3 bg-ivory px-4 py-3 text-[0.95rem] text-ink outline-none transition focus:border-green-3"
            />
          </div>

          {totalResults === 0 ? (
            <div className="mt-8 rounded-[26px] border border-dashed border-ivory-4 bg-white px-6 py-12 text-center shadow-soft">
              <h2 className="font-serif text-[1.75rem] text-green">No results found</h2>
              <p className="mt-3 text-[0.95rem] leading-7 text-ink-2">
                No results for <span className="font-medium text-ink">&quot;{query}&quot;</span> — WhatsApp us your question.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Mana, I couldn't find an FAQ answer for: ${query}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-terra px-6 py-3 text-[0.9rem] font-medium text-white transition hover:bg-terra-2"
              >
                Ask on WhatsApp
              </a>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {filteredGroups.map((group) => (
                <section key={group.title} className="rounded-[28px] border border-ivory-3 bg-white p-5 shadow-soft md:p-7">
                  <div className={`inline-flex rounded-full px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] ${group.pillClass}`}>
                    {group.title}
                  </div>
                  <div className="mt-5 divide-y divide-ivory-3">
                    {group.items.map((item) => {
                      const isOpen = openByCategory[group.title] === item.q
                      return (
                        <div key={item.q} className="py-1">
                          <button
                            type="button"
                            onClick={() => toggleItem(group.title, item.q)}
                            className="flex w-full items-start gap-4 py-4 text-left"
                          >
                            <span className="flex-1 pr-2 font-serif text-[1.08rem] leading-7 text-green md:text-[1.16rem]">
                              {item.q}
                            </span>
                            <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-6 text-lg text-green">
                              {isOpen ? '−' : '+'}
                            </span>
                          </button>
                          <div
                            className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          >
                            <div className="overflow-hidden">
                              <p className="pb-4 pr-12 text-[0.94rem] leading-7 text-ink-2">{item.a}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-[28px] bg-green px-6 py-8 text-center md:px-10">
            <h2 className="font-serif text-[1.85rem] font-light text-ivory">Still have a question?</h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-7 text-green-4">
              Our team can help with order updates, product guidance, bulk quotes, or custom gifting requirements.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-ivory px-6 py-3 text-[0.92rem] font-medium text-green transition hover:bg-green-6"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
