import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildQuote, publicQuote } from '@/lib/checkout'
import { getSessionPhone } from '@/lib/session'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Authoritative price for a cart: unit prices from the catalogue, coupon rules,
 * fees, wallet and totals. Read-only — nothing is reserved or written.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`quote:${clientIp(req)}`, 120, 60 * 1000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })

  try {
    const body = await req.json()
    const phone = getSessionPhone()
    const quote = await buildQuote(supabaseAdmin, {
      items: body.items,
      couponCode: typeof body.coupon_code === 'string' ? body.coupon_code : null,
      paymentMethod: body.payment_method === 'cod' ? 'cod' : 'online',
      useWallet: Boolean(body.use_wallet),
      city: typeof body.city === 'string' ? body.city : '',
      state: typeof body.state === 'string' ? body.state : '',
      pincode: typeof body.pincode === 'string' ? body.pincode : '',
    }, phone)

    return NextResponse.json({ ...publicQuote(quote), authenticated: Boolean(phone) })
  } catch (error) {
    console.error('Checkout quote failed', error)
    return NextResponse.json({ error: 'Could not calculate your order total. Please try again.' }, { status: 500 })
  }
}
