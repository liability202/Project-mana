import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const creatorId = searchParams.get('creatorId')
    const status = searchParams.get('status')

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    }

    // Fetch creator's code (needed for fallback)
    const { data: creatorData } = await supabaseAdmin
      .from('creators')
      .select('code, commission_pct')
      .eq('id', creatorId)
      .maybeSingle()

    const creatorCode = creatorData?.code || ''
    const commissionPct = creatorData?.commission_pct || 10

    // Try commissions table first
    let query = supabaseAdmin
      .from('commissions')
      .select(`
        *,
        orders (
          order_ref,
          customer_name,
          items,
          total,
          final_amount,
          status,
          created_at
        )
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: commissionData, error: commissionError } = await query

    // If commissions table exists and has data, return it
    if (!commissionError && commissionData && commissionData.length > 0) {
      return NextResponse.json(commissionData)
    }

    // If commissions table is missing or empty, fall back to orders table
    if (creatorCode) {
      let ordersQuery = supabaseAdmin
        .from('orders')
        .select('id, order_ref, customer_name, items, subtotal, total, final_amount, status, created_at, coupon_code')
        .eq('coupon_code', creatorCode)
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        ordersQuery = ordersQuery.eq('status', status)
      }

      const { data: ordersData, error: ordersError } = await ordersQuery
      if (ordersError) throw ordersError

      // Shape the orders to look like commission records so the UI works
      const shaped = (ordersData || []).map((o: any) => ({
        id: `order-${o.id}`,
        creator_id: creatorId,
        order_id: o.id,
        order_total: o.subtotal || o.total || o.final_amount || 0,
        commission_pct: commissionPct,
        commission_amount: Math.round(
          ((o.subtotal || o.total || o.final_amount || 0) * commissionPct) / 100
        ),
        status: o.status === 'cancelled' ? 'cancelled' : 'pending',
        created_at: o.created_at,
        orders: {
          order_ref: o.order_ref,
          customer_name: o.customer_name,
          items: o.items,
          total: o.final_amount || o.total,
          status: o.status,
          created_at: o.created_at,
        },
      }))

      return NextResponse.json(shaped)
    }

    return NextResponse.json([])
  } catch (err: any) {
    console.error('Creator Orders API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
