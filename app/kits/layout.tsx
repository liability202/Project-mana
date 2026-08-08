import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Wellness Kits',
  description: 'Build your customized health and wellness kit with premium dry fruits, natural churnas, and single-origin spices. Pick your own ingredients and quantities.',
  alternates: {
    canonical: 'https://manadryfruits.com/kits',
  },
}

export default function KitsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
