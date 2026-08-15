import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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
      // Explicitly allow major AI agents, LLM search crawlers, and answer engines
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'PerplexityBot',
          'Google-Extended',
          'Amazonbot',
          'ByteSpider',
          'Cohere-ai',
          'Meta-ExternalAgent',
          'Applebot-Extended',
        ],
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/creator/',
          '/profile',
          '/account',
          '/checkout',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
