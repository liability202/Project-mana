import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const ucpManifest = {
    ucp_version: '1.0',
    merchant: {
      name: 'Mana Dry Fruits',
      legal_name: 'MK and Sons',
      domain: SITE_URL,
      country: 'IN',
      currency: 'INR',
    },
    capabilities: {
      catalog_search: true,
      cart_checkout: true,
      instant_payment: true,
      delivery_estimation: true,
    },
    endpoints: {
      catalog: `${SITE_URL}/api/products`,
      checkout: `${SITE_URL}/checkout`,
      payment_gateway: 'Razorpay / UPI / Cash on Delivery',
      serviceability: `${SITE_URL}/api/shipping/serviceability`,
    },
    shipping: {
      free_shipping_threshold: 999,
      currency: 'INR',
      delivery_days_min: 2,
      delivery_days_max: 5,
    },
  }

  return NextResponse.json(ucpManifest, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
