import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wellness Kits – Curated Dry Fruit, Herb & Spice Boxes',
  description: 'Shop curated Mana wellness kits — ready-made boxes of premium dry fruits, Ayurvedic herbs and spices. Lab tested, FSSAI certified and packed fresh to order.',
  alternates: { canonical: '/kits' },
}

export default function KitsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
