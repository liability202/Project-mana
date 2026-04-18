import Link from 'next/link'

const LAST_UPDATED = 'April 14, 2026'

const sections = [
  {
    title: '1. Introduction',
    body: [
      'This Privacy Policy explains how MK and Sons, Ghaziabad, Uttar Pradesh, collects, uses, stores, and protects your information when you use Mana – The Essence of Nature. It is designed in line with the Indian IT Act, 2000, the IT (Amendment) Act, 2008, and basic GDPR-style privacy principles of notice, fairness, purpose limitation, and user control.',
      'By using the Mana website, placing an order, or contacting us through website forms or WhatsApp, you agree to the practices described in this Privacy Policy.'
    ]
  },
  {
    title: '2. What Data We Collect',
    body: [
      'We may collect your name, phone number linked to WhatsApp, optional email address, delivery address, and your order history when you place an order or create an account.',
      'We may also collect limited technical information such as device type, browser type, IP address, session information, and basic website usage data to support security, troubleshooting, and website performance.'
    ]
  },
  {
    title: '3. How We Use Your Data',
    body: [
      'We use your data to fulfil orders, process deliveries, send order and dispatch updates, support returns and refunds, maintain your cashback wallet, and respond to support queries.',
      'We may also use limited account and usage information for fraud prevention, payment risk review, account recovery, and improving website reliability and customer experience.'
    ]
  },
  {
    title: '4. Who We Share Data With',
    body: [
      'We share only necessary information with Razorpay for payment processing and with Shiprocket and its delivery partners for order fulfilment. This may include your name, phone number, address, and order-level shipment details.',
      'We do not sell your data. We do not share your data with third-party advertisers. We do not run ad-tech profiling. Mana products are ad-free.'
    ]
  },
  {
    title: '5. Data Storage & Security',
    body: [
      'Customer and order information is stored using Supabase infrastructure hosted on AWS or associated cloud environments. We use reasonable administrative, technical, and access-control safeguards to protect the information we store.',
      'Payment card information is not stored by us. Razorpay handles payment credentials on its secure infrastructure. We never sell your data, and we do not disclose it beyond the limited service providers needed to run the business.'
    ]
  },
  {
    title: '6. Cookies',
    body: [
      'We use minimal cookies and similar technologies only where necessary for core website functions such as cart continuity, session handling, basic sign-in state, and essential security.',
      'We do not use third-party advertising cookies and we do not track you across unrelated websites for ad targeting.'
    ]
  },
  {
    title: '7. Your Rights',
    body: [
      'Subject to applicable law, you may request access to your personal data, ask for corrections to inaccurate information, or request deletion of data that is no longer required for legitimate business or legal purposes.',
      'To make a privacy request, please contact us on WhatsApp or email and we will respond within a reasonable time, subject to order, tax, fraud-prevention, and record-keeping obligations.'
    ]
  },
  {
    title: "8. Children's Privacy",
    body: [
      'Mana does not knowingly create accounts for or market directly to children under 18 years of age. If we learn that personal data of a minor has been collected without appropriate authority, we will take reasonable steps to delete it.'
    ]
  },
  {
    title: '9. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time to reflect changes in law, technology, logistics, payments, or website operations. The latest version will always be posted on this page with the updated date shown at the top.'
    ]
  },
  {
    title: '10. Contact Us',
    body: [
      'If you have any privacy-related questions, access requests, correction requests, or deletion requests, please contact MK and Sons through Mana support.',
      'WhatsApp: +91 9910899796',
      'Email: care@manafoods.in'
    ]
  }
]

export default function PrivacyPage() {
  return (
    <>
      <header className="bg-green px-[5%] py-16 md:py-20">
        <div className="mx-auto max-w-[820px]">
          <nav aria-label="Breadcrumb" className="mb-5 text-[0.72rem] text-green-4">
            <Link href="/" className="transition-colors hover:text-ivory">
              Home
            </Link>
            <span className="px-2 text-green-5/60">›</span>
            <span className="text-green-4">Privacy Policy</span>
          </nav>
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.24em] text-green-4">Company Policies</p>
          <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-light leading-[1.05] tracking-tight text-ivory">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-[650px] text-[0.95rem] leading-[1.85] text-green-4">
            We never sell your data. We never show you ads. Mana products are ad-free.
          </p>
        </div>
      </header>

      <main className="bg-ivory px-[5%] py-12 md:py-16">
        <div className="mx-auto max-w-[820px] rounded-[28px] border border-ivory-3 bg-white px-6 py-7 shadow-soft md:px-10 md:py-10">
          <div className="mb-8 border-b border-ivory-3 pb-5">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ink-3">Last updated</p>
            <p className="mt-2 text-[0.9rem] leading-7 text-ink-2">{LAST_UPDATED}</p>
          </div>

          <div className="mb-8 rounded-[22px] border border-terra/20 bg-terra/10 px-5 py-5">
            <p className="font-serif text-[1.35rem] text-green">Our simple privacy promise</p>
            <p className="mt-2 text-[0.92rem] leading-7 text-ink-2">
              We collect only what we need to deliver your orders, support your account, and run cashback and service updates.
              We do not sell data, we do not share data with advertisers, and we do not use ad-tech tracking.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-[1.4rem] font-normal leading-tight text-green md:text-[1.55rem]">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-[0.92rem] leading-7 text-ink-2">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
