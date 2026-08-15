import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const mppManifest = {
    version: '1.0',
    protocol: 'MPP',
    name: 'Mana Dry Fruits Machine Payment Protocol',
    merchant_id: 'mana-mk-sons',
    settlement_currency: 'INR',
    supported_methods: ['razorpay_order_id', 'upi_intent', 'cod'],
    create_intent: `${SITE_URL}/api/razorpay/create-order`,
  }

  return NextResponse.json(mppManifest, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
