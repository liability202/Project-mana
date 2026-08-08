import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Track your Mana Dry Fruits order in real time with your order number and phone number.',
  alternates: { canonical: '/track-order' },
  robots: { index: false, follow: true },
}

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
