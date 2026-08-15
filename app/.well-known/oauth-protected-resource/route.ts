import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const resourceSpec = {
    resource: SITE_URL,
    scopes_supported: ['read:products', 'write:cart', 'read:orders'],
    bearer_methods_supported: ['header'],
    auth_server: SITE_URL,
  }

  return NextResponse.json(resourceSpec, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
