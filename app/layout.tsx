import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Toaster } from '@/components/ui/Toaster'
import { ScrollObserver } from '@/components/ScrollObserver'
import { ThemeProvider } from '@/components/ThemeProvider'

const siteUrl = 'https://manadryfruits.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Mana – Premium Dry Fruits, Herbs & Spices | MK and Sons',
    template: '%s | Mana Dry Fruits',
  },
  description: 'Buy premium dry fruits, Ayurvedic herbs, single-origin spices and pansari staples online. Lab tested, FSSAI certified, packed fresh to order. Free shipping on orders above ₹999.',
  keywords: [
    'buy dry fruits online', 'premium dry fruits', 'Mamra almonds online', 'Kashmiri saffron',
    'Ayurvedic herbs', 'Ashwagandha', 'single origin spices', 'pansari items',
    'lab tested dry fruits', 'FSSAI certified', 'fresh packed dry fruits', 'MK and Sons',
    'dry fruits Ghaziabad', 'herbs and spices Delhi NCR',
  ],
  authors: [{ name: 'MK and Sons', url: siteUrl }],
  creator: 'MK and Sons',
  publisher: 'MK and Sons',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Mana Dry Fruits',
    title: 'Mana – Premium Dry Fruits, Herbs & Spices',
    description: 'Lab tested, FSSAI certified dry fruits, Ayurvedic herbs and spices. Packed fresh to order. Free shipping above ₹999.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Mana – Premium Dry Fruits & Herbs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mana – Premium Dry Fruits, Herbs & Spices',
    description: 'Lab tested, FSSAI certified dry fruits, Ayurvedic herbs and spices. Packed fresh to order.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
}

// Site-wide Organization + WebSite JSON-LD
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Mana Dry Fruits',
  alternateName: 'MK and Sons',
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9910899796',
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'MK and Sons',
    addressLocality: 'Ghaziabad',
    addressRegion: 'Uttar Pradesh',
    postalCode: '201014',
    addressCountry: 'IN',
  },
  sameAs: [],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mana Dry Fruits',
  alternateName: ['manadryfruits', 'Mana', 'manadryfruits.com'],
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ScrollObserver />
          <Navbar />
          <CartDrawer />
          <main id="main-content">
            {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
