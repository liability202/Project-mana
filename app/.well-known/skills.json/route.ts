import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const skillsRegistry = {
    $schema: 'https://agentskills.io/schemas/skills.json',
    name: 'Mana Dry Fruits Agent Skills',
    version: '1.0.0',
    skills: [
      {
        id: 'search-dry-fruits',
        name: 'Search Dry Fruits & Nuts Catalog',
        description: 'Query products by category, tags, or search string.',
        endpoint: `${SITE_URL}/api/products`,
        method: 'GET',
      },
      {
        id: 'calculate-shipping',
        name: 'Check Pincode Serviceability & Delivery Time',
        description: 'Verify if shipping is available to a given 6-digit Indian PIN code.',
        endpoint: `${SITE_URL}/api/shipping/serviceability`,
        method: 'POST',
      },
      {
        id: 'validate-coupon',
        name: 'Validate Coupon Code',
        description: 'Validate discount coupon and calculate net payable price.',
        endpoint: `${SITE_URL}/api/coupons/validate`,
        method: 'POST',
      },
      {
        id: 'track-order',
        name: 'Track Shipment Status',
        description: 'Check real-time order tracking status by Order ID.',
        endpoint: `${SITE_URL}/api/shipping/track`,
        method: 'POST',
      },
    ],
  }

  return NextResponse.json(skillsRegistry, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
