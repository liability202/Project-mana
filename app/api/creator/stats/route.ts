import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { commissionableAmount, estimateCommission, isLiveCommissionStatus } from '@/lib/commissions'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const eightWeeksAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Fetch creator profile first — we need the code for fallback queries
    const { data: creatorData } = await supabaseAdmin
      .from('creators')
      .select('total_earned, total_paid, code, commission_pct')
      .eq('id', creatorId)
      .maybeSingle()

    const creatorCode = creatorData?.code || ''
    const commissionPct = creatorData?.commission_pct || 10

    // Fetch commissions + visits in parallel
    const [statsRes, monthlyRes, chartRes, visitsRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from('commissions')
        .select('commission_amount, status, created_at')
        .eq('creator_id', creatorId),

      supabaseAdmin
        .from('commissions')
        .select('commission_amount')
        .eq('creator_id', creatorId)
        .gte('created_at', startOfMonth.toISOString())
        .in('status', ['confirmed', 'paid']),

      supabaseAdmin
        .from('commissions')
        .select('created_at')
        .eq('creator_id', creatorId)
        .gte('created_at', eightWeeksAgo.toISOString())
        .order('created_at', { ascending: true }),

      // Visits count from referral_visits (may not exist — handled below)
      creatorCode
        ? supabaseAdmin
            .from('referral_visits')
            .select('*', { count: 'exact', head: true })
            .eq('creator_code', creatorCode)
        : Promise.resolve({ count: 0, error: null }),

      // Fallback: orders placed using creator's coupon code
      creatorCode
        ? supabaseAdmin
            .from('orders')
            .select('id, subtotal, total, final_amount, created_at, status')
            .eq('coupon_code', creatorCode)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ])

    const allCommissions = statsRes.data || []
    const useCommissions = allCommissions.length > 0

    let totalOrders: number
    let pendingPayout: number
    let thisMonthEarnings: number
    let totalEarnedLifetime: number
    let chartSourceData: { created_at: string }[]

    if (useCommissions) {
      // Use commissions table (preferred — accurate commission amounts)
      totalOrders = allCommissions.filter(c => isLiveCommissionStatus(c.status)).length
      pendingPayout = allCommissions
        .filter(c => c.status === 'confirmed')
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0)
      thisMonthEarnings = (monthlyRes.data || [])
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0)
      totalEarnedLifetime = creatorData?.total_earned ||
        allCommissions
          .filter(c => ['confirmed', 'paid'].includes(c.status))
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0)
      chartSourceData = chartRes.data || []
    } else {
      // Fallback: derive stats from orders table by coupon_code
      const fallbackOrders = (ordersRes as any).data || []
      const activeOrders = fallbackOrders.filter((o: any) => isLiveCommissionStatus(o.status))

      totalOrders = activeOrders.length

      // Estimate commission from order subtotals — same rules the admin coupon
      // report uses, so the two views always agree.
      const orderCommission = (o: any) => estimateCommission(commissionableAmount(o), commissionPct)

      pendingPayout = activeOrders.reduce((sum: number, o: any) => sum + orderCommission(o), 0)
      thisMonthEarnings = activeOrders
        .filter((o: any) => new Date(o.created_at) >= startOfMonth)
        .reduce((sum: number, o: any) => sum + orderCommission(o), 0)
      totalEarnedLifetime = creatorData?.total_earned || pendingPayout
      chartSourceData = activeOrders.map((o: any) => ({ created_at: o.created_at }))
    }

    // Visits — gracefully handle if referral_visits table doesn't exist
    const totalVisits = (visitsRes as any).count || 0

    // Build weekly chart for last 8 weeks
    const chartData = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)

      const startOfWeek = new Date(d)
      startOfWeek.setHours(0, 0, 0, 0)
      startOfWeek.setDate(d.getDate() - d.getDay())

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      const weekOrders = chartSourceData.filter(c => {
        const cDate = new Date(c.created_at)
        return cDate >= startOfWeek && cDate < endOfWeek
      }).length

      chartData.push({
        name: startOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        orders: weekOrders,
      })
    }

    return NextResponse.json({
      totalOrders,
      thisMonthEarnings,
      pendingPayout,
      totalEarnedLifetime,
      totalVisits,
      chartData,
      dataSource: useCommissions ? 'commissions' : 'orders_fallback',
    })
  } catch (err: any) {
    console.error('Creator Stats API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
