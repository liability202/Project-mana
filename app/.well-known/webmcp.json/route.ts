import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const webmcp = {
    version: '1.0',
    name: 'Mana Dry Fruits WebMCP',
    description: 'Web Model Context Protocol manifest for browser-embedded agentic commerce.',
    siteUrl: SITE_URL,
    actions: [
      { name: 'search', selector: 'button[aria-label="Search"]', endpoint: `${SITE_URL}/api/products` },
      { name: 'cart', selector: 'button[aria-label="Shopping Cart"]', endpoint: `${SITE_URL}/cart` },
      { name: 'checkout', selector: 'a[href="/checkout"]', endpoint: `${SITE_URL}/checkout` },
    ],
  }

  return NextResponse.json(webmcp, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
