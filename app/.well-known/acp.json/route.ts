import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const acpManifest = {
    acp_version: '1.0',
    agent_id: 'mana-dry-fruits-agent',
    merchant_name: 'Mana Dry Fruits',
    url: SITE_URL,
    features: [
      'product-discovery',
      'cart-assembly',
      'pincode-check',
      'order-creation',
    ],
    currency: 'INR',
    payment_methods: ['Razorpay', 'UPI', 'Cards', 'COD'],
    apis: {
      products: `${SITE_URL}/api/products`,
      checkout: `${SITE_URL}/checkout`,
      shipping: `${SITE_URL}/api/shipping/serviceability`,
    },
  }

  return NextResponse.json(acpManifest, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
