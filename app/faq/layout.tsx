import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ)',
  description: 'Find quick answers to questions about orders, secure payments, COD terms, shipping times, fresh packing practices, wallet cashback, and video consultations.',
  alternates: {
    canonical: 'https://manadryfruits.com/faq',
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
