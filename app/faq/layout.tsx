import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ – Shipping, Returns, Quality & Payments',
  description: 'Answers to common questions about Mana Dry Fruits: shipping times, free delivery, returns, product quality, lab testing and payment options.',
  alternates: { canonical: '/faq' },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
