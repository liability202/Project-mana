import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { Toaster } from '@/components/ui/Toaster'
import { ScrollObserver } from '@/components/ScrollObserver'

export const metadata: Metadata = {
  title: 'Mana – The Essence of Nature',
  description: 'Premium dry fruits, Ayurvedic herbs, hand-picked spices and pansari staples from MK and Sons, Ghaziabad. Lab tested, packed fresh to order.',
  keywords: 'dry fruits online, Mamra almonds, Ashwagandha, spices, herbs, Ghaziabad',
  openGraph: {
    title: 'Mana – The Essence of Nature',
    description: 'Premium dry fruits, Ayurvedic herbs and spices. Packed fresh to order.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ScrollObserver />
        <Navbar />
        <CartDrawer />
        <main id="main-content">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
        <Toaster />
      </body>
    </html>
  )
}
