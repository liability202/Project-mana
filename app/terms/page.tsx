import Link from 'next/link'

const LAST_UPDATED = 'April 14, 2026'

const sections = [
  {
    title: '1. Introduction & Acceptance',
    body: [
      'These Terms & Conditions govern your access to and use of the Mana website operated by MK and Sons, Ghaziabad, Uttar Pradesh. By browsing, placing an order, creating an account, or using any feature on this website, you agree to be bound by these Terms.',
      'Mana, also known as "The Essence of Nature" and "India\'s Wellness Bhandar", sells food and wellness products directly to consumers across India. If you do not agree with these Terms, please discontinue use of the website.'
    ]
  },
  {
    title: '2. Products & Descriptions',
    body: [
      'We offer dry fruits, Ayurvedic herbs, spices, seeds, millets, traditional papads, and other pansari items. We make reasonable efforts to display accurate product descriptions, pack sizes, ingredients, and images.',
      'As many of our foods are natural agricultural products, colour, texture, aroma, and size may vary slightly from batch to batch. Certain herbs, spices, and powders may be ground or packed fresh to order for better aroma and freshness.',
      'All products are sold subject to availability. We reserve the right to discontinue, replace, or revise any product at any time without prior notice.',
      'NOTE:THE PHYSICAL PRODUCT MAY DIFFER FROM THE IMAGE ON WEBSITE AND ALL THE IMAGES USED ARE FOR ILLUSTRATIVE PURPOSES.'
    ]
  },
  {
    title: '3. Pricing & Payment',
    body: [
      'All prices on the website are listed in Indian Rupees and are inclusive or exclusive of taxes as indicated at checkout. Prices may change without notice, but confirmed orders will be billed at the price shown at the time of purchase.',
      'Online payments are processed through Razorpay and may include UPI, debit cards, credit cards, net banking, wallets, and other supported methods. Cash on Delivery may be available on eligible orders and pincodes, and a COD handling surcharge may apply.',
      'If a payment is declined, flagged, or reversed, we may place the order on hold, request alternate payment, or cancel the order.'
    ]
  },
  {
    title: '4. Shipping & Delivery',
    body: [
      'Orders are fulfilled and shipped across India using Shiprocket and its courier partners. Standard delivery timelines are generally 5 to 7 business days from dispatch, subject to serviceability, weather, public holidays, and courier conditions.',
      'We may offer free shipping on prepaid orders above Rs 999 unless otherwise stated on the website. Delivery timelines are estimates and not guaranteed, especially for remote or high-demand service zones.',
      'Risk in the products passes to you upon successful delivery at the address provided during checkout.'
    ]
  },
  {
    title: '5. Returns & Refunds',
    body: [
      'Returns or replacement requests must generally be raised within 7 days of delivery. Due to food safety and hygiene regulations, opened, consumed, tampered, or improperly stored food products may not be eligible for return or refund.',
      'If you receive a damaged, wrong, defective, or expired item, please contact us with clear photos, the order number, and opening video or evidence where available. Approved refunds, replacements, or store credits will be processed after verification.',
      'Refund timelines depend on the original payment method and banking partner. COD refunds may be issued to a bank account, UPI ID, or wallet credit as applicable.'
    ]
  },
  {
    title: '6. Cashback & Wallet Credits',
    body: [
      'Where a cashback or wallet credit program is offered, eligible orders may receive up to 5% cashback or such percentage as shown in the relevant promotion. Cashback and wallet credits are promotional in nature and do not constitute cash deposits.',
      'Cashback is typically released within 48 hours after successful delivery, provided the order is not cancelled, returned, refunded, or marked disputed. We reserve the right to reverse credits obtained through misuse, abuse, duplicate accounts, or fraudulent activity.',
      'Wallet credits may have validity, minimum order value, or category restrictions as notified on the website or the campaign terms.'
    ]
  },
  {
    title: '7. Coupon Codes & Discounts',
    body: [
      'Coupon codes, offers, bundle prices, and discounts are subject to campaign-specific conditions, validity periods, and stock availability. Only one promotion may apply unless expressly stated otherwise.',
      'Coupons cannot be redeemed for cash, transferred, or applied after an order is placed. Orders found to be using invalid, expired, manipulated, or unauthorised promotional benefits may be cancelled or adjusted.'
    ]
  },
  {
    title: '8. User Accounts & Data',
    body: [
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities carried out using your account. Please ensure that the information you provide is accurate, current, and complete.',
      'We may collect and process personal information in accordance with our Privacy Policy, including information required for order fulfilment, payment verification, delivery, support, and compliance.'
    ]
  },
  {
    title: '9. Intellectual Property',
    body: [
      'All content on this website, including the Mana name, logo, product copy, graphics, icons, layout, text, design elements, and other brand assets, are the property of MK and Sons or its licensors and are protected under applicable intellectual property laws.',
      'You may not reproduce, copy, distribute, modify, publish, or commercially exploit any content from the website without prior written permission.'
    ]
  },
  {
    title: '10. Limitation of Liability',
    body: [
      'To the maximum extent permitted by applicable law, MK and Sons shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of the website, delay in delivery, third-party payment or courier issues, or product misuse after delivery.',
      'Our aggregate liability, if any, shall not exceed the value actually paid by you for the relevant order. Product usage advice on the website is general in nature and should not be treated as medical advice.'
    ]
  },
  {
    title: '11. Governing Law',
    body: [
      'These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms, the website, or any order shall be subject to the exclusive jurisdiction of the competent courts at Ghaziabad, Uttar Pradesh.'
    ]
  },
  {
    title: '12. Contact Us',
    body: [
      'If you have any questions about these Terms & Conditions, your order, returns, or support requests, please contact Mana by MK and Sons.',
      'WhatsApp: +91 9910899796',
      
    ]
  }
]

export default function TermsPage() {
  return (
    <>
      <header className="bg-green px-[5%] py-16 md:py-20">
        <div className="mx-auto max-w-[820px]">
          <nav aria-label="Breadcrumb" className="mb-5 text-[0.72rem] text-green-4">
            <Link href="/" className="transition-colors hover:text-ivory">
              Home
            </Link>
            <span className="px-2 text-green-5/60">›</span>
            <span className="text-green-4">Terms &amp; Conditions</span>
          </nav>
          <p className="mb-3 text-[0.72rem] uppercase tracking-[0.24em] text-green-4">Company Policies</p>
          <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-light leading-[1.05] tracking-tight text-ivory">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 max-w-[650px] text-[0.95rem] leading-[1.85] text-green-4">
            These terms apply to all purchases and use of Mana, operated by MK and Sons,
            a FSSAI licensed food business based in Delhi-NCR.
          </p>
        </div>
      </header>

      <main className="bg-ivory px-[5%] py-12 md:py-16">
        <div className="mx-auto max-w-[820px] rounded-[28px] border border-ivory-3 bg-white px-6 py-7 shadow-soft md:px-10 md:py-10">
          <div className="mb-8 border-b border-ivory-3 pb-5">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ink-3">Last updated</p>
            <p className="mt-2 text-[0.9rem] leading-7 text-ink-2">{LAST_UPDATED}</p>
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
