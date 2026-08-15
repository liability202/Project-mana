import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const ap2Manifest = {
    version: '1.0',
    protocol: 'AP2',
    name: 'Mana Dry Fruits Payment Service',
    supported_gateways: ['Razorpay', 'UPI', 'NetBanking', 'COD'],
    currency: 'INR',
    checkout_url: `${SITE_URL}/checkout`,
    create_payment_intent: `${SITE_URL}/api/razorpay/create-order`,
    verify_payment_intent: `${SITE_URL}/api/razorpay/verify-order`,
  }

  return NextResponse.json(ap2Manifest, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
