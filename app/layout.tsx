import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Toaster } from '@/components/ui/Toaster'
import { ScrollObserver } from '@/components/ScrollObserver'
import { ThemeProvider } from '@/components/ThemeProvider'

import { SITE_URL } from '@/lib/seo'

const siteUrl = SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // The brand name leads, so a "manadryfruits" query has an exact-ish match
    // in the title — the strongest single signal for a navigational search.
    default: 'Mana Dry Fruits (Manadryfruits) – Premium Dry Fruits, Herbs & Spices Online',
    template: '%s | Mana Dry Fruits',
  },
  description: 'Mana Dry Fruits (manadryfruits.com) by MK and Sons — buy premium dry fruits, Ayurvedic herbs, single-origin spices and pansari staples online. Lab tested, FSSAI certified, packed fresh to order. Free shipping above ₹999.',
  applicationName: 'Mana Dry Fruits',
  keywords: [
    'manadryfruits', 'mana dry fruits', 'manadryfruits.com', 'Mana dryfruits',
    'buy dry fruits online', 'premium dry fruits', 'Mamra almonds online', 'Kashmiri saffron',
    'Ayurvedic herbs', 'Ashwagandha', 'single origin spices', 'pansari items',
    'lab tested dry fruits', 'FSSAI certified', 'fresh packed dry fruits', 'MK and Sons',
    'dry fruits Ghaziabad', 'herbs and spices Delhi NCR',
  ],
  // Set GOOGLE_SITE_VERIFICATION in your env to verify the domain in Search
  // Console — required before you can submit the sitemap.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
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
  // og:image / twitter:image come from app/opengraph-image.tsx, which is
  // generated at build time — the old /og-image.png was a 404.
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Mana Dry Fruits',
    title: 'Mana Dry Fruits – Premium Dry Fruits, Herbs & Spices',
    description: 'Lab tested, FSSAI certified dry fruits, Ayurvedic herbs and spices. Packed fresh to order. Free shipping above ₹999.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mana Dry Fruits – Premium Dry Fruits, Herbs & Spices',
    description: 'Lab tested, FSSAI certified dry fruits, Ayurvedic herbs and spices. Packed fresh to order.',
  },
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFAF4' },
    { media: '(prefers-color-scheme: dark)', color: '#101613' },
  ],
}

// Site-wide Organization + WebSite JSON-LD.
// `Store` (a subtype of LocalBusiness + Organization) is what earns the brand
// knowledge panel for a navigational query like "manadryfruits".
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  '@id': `${siteUrl}/#organization`,
  name: 'Mana Dry Fruits',
  alternateName: ['Manadryfruits', 'Mana', 'MK and Sons'],
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
  image: `${siteUrl}/opengraph-image`,
  description: 'Premium dry fruits, Ayurvedic herbs, single-origin spices and pansari staples. Lab tested, FSSAI certified, packed fresh to order.',
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  telephone: '+91-9910899796',
  areaServed: 'IN',
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
  // Add your real Instagram / Facebook / Google Business Profile URLs here —
  // Google leans on these to connect the domain to the brand name.
  sameAs: [],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  name: 'Mana Dry Fruits',
  alternateName: 'Manadryfruits',
  url: siteUrl,
  publisher: { '@id': `${siteUrl}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

// Runs before first paint so the saved theme is applied without a flash of the
// wrong palette. Kept in sync with components/ui/ThemeToggle.tsx.
const themeScript = `(function(){try{var t=localStorage.getItem('mana_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Warm up the image CDN before the hero image request is discovered. */}
        <link rel="preconnect" href="https://dktkyiwuegyievucnoxc.supabase.co" />
        <link rel="dns-prefetch" href="https://dktkyiwuegyievucnoxc.supabase.co" />
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
