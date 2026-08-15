import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

const AUTH_MD = `# Mana Dry Fruits Authentication & Access Spec

## Overview
Mana Dry Fruits (${SITE_URL}) supports open agent access for browsing, searching, and adding items to cart without mandatory authentication.

## Authentication Mechanisms

1. **Guest Checkout & Browsing (No Auth Required)**:
   - Search catalog: GET /api/products
   - View product details: GET /api/products?slug={slug}
   - Check pincode serviceability: POST /api/shipping/serviceability
   - Validate coupon: POST /api/coupons/validate

2. **Customer OTP Authentication (Mobile Phone)**:
   - Send OTP: POST /api/auth/otp/send (Body: { phone: "9876543210" })
   - Verify OTP: POST /api/auth/otp/verify (Body: { phone: "9876543210", code: "123456" })

3. **Agent / Bot Access Token**:
   - Headers: \`Authorization: Bearer <agent_token>\` or Anonymous Public Access.
`

export async function GET() {
  return new NextResponse(AUTH_MD, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
