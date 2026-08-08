import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/creator/codes?creatorId=xxx
 *
 * Returns all coupon codes associated with this creator:
 *  1. The creator's own code from the creators table
 *  2. Any codes in the coupons table that have creator_id = this creator
 *
 * This is what the creator portal uses to show all codes and
 * what the stats API uses to aggregate order data correctly.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 })
    }

    // Fetch creator's own code
    const { data: creator } = await supabaseAdmin
      .from('creators')
      .select('code')
      .eq('id', creatorId)
      .maybeSingle()

    // Fetch all coupons assigned to this creator in the admin panel
    const { data: coupons } = await supabaseAdmin
      .from('coupons')
      .select('code, discount_type, discount_value, commission_rate, is_active')
      .eq('creator_id', creatorId)

    const allCodes = new Set<string>()
    if (creator?.code) allCodes.add(String(creator.code).toUpperCase())
    for (const c of (coupons || [])) {
      if (c.code) allCodes.add(String(c.code).toUpperCase())
    }

    return NextResponse.json(Array.from(allCodes))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
