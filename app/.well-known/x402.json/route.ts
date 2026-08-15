import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const x402Manifest = {
    x402_version: '1.0',
    title: 'Mana Dry Fruits x402 HTTP Payment Endpoint',
    merchant: 'Mana Dry Fruits',
    currency: 'INR',
    accepts: ['fiat-inr', 'razorpay', 'upi'],
    checkout: `${SITE_URL}/checkout`,
    order_api: `${SITE_URL}/api/orders`,
  }

  return NextResponse.json(x402Manifest, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
