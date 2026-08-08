import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private/transactional surfaces — no SEO value, and we don't want
        // crawl budget or personal order data leaking into the index.
        disallow: [
          '/api/',
          '/admin',
          '/admin/',
          '/creator',
          '/creator/',
          '/profile',
          '/account',
          '/checkout',
          '/test-bot',
          '/ref/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
