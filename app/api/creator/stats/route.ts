import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { commissionableAmount, estimateCommission, isLiveCommissionStatus } from '@/lib/commissions'
import { bucketByRange, isDateRange, rangeStartISO, type DateRange } from '@/lib/date-ranges'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    }

    // Chart range only — the stat cards stay lifetime/this-month figures.
    const rangeParam = searchParams.get('range')
    const chartRange: DateRange = isDateRange(rangeParam) ? rangeParam : 'month'
    const chartSince = rangeStartISO(chartRange)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch creator profile — need code and commission_pct
    const { data: creatorData } = await supabaseAdmin
      .from('creators')
      .select('total_earned, total_paid, code, commission_pct, name')
      .eq('id', creatorId)
      .maybeSingle()

    const creatorCode = creatorData?.code || ''
    const commissionPct = creatorData?.commission_pct || 10

    // "All time" has no lower bound; every other range is trimmed server-side
    // so a year view doesn't drag the whole ledger over the wire.
    let chartQuery = supabaseAdmin
      .from('commissions')
      .select('created_at')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: true })

    if (chartSince) {
      chartQuery = chartQuery.gte('created_at', chartSince)
    }

    // Fetch commissions + visits in parallel
    // ── Resolve ALL coupon codes linked to this creator ──────────────────────
    // A creator may have multiple coupons assigned by admin via creator_id,
    // or their code may differ from what's stored in the coupons table.
    const { data: linkedCoupons } = await supabaseAdmin
      .from('coupons')
      .select('code, discount_value, commission_rate')
      .eq('creator_id', creatorId)

    // Build a de-duplicated set of all codes to match against orders
    const allCodesSet = new Set<string>()
    if (creatorCode) allCodesSet.add(String(creatorCode).toUpperCase())
    for (const c of (linkedCoupons || [])) {
      if (c.code) allCodesSet.add(String(c.code).toUpperCase())
    }
    const codesArray = Array.from(allCodesSet)

    // ── Fetch commissions + visits + orders in parallel ───────────────────────
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

      chartQuery,

      // Visits — match any of the creator's codes (respecting selected date range)
      codesArray.length > 0
        ? (() => {
            let q = supabaseAdmin
              .from('referral_visits')
              .select('*', { count: 'exact', head: true })
              .in('creator_code', codesArray)
            if (chartSince) q = q.gte('created_at', chartSince)
            return q
          })()
        : Promise.resolve({ count: 0, error: null }),

      // Orders — match any of the creator's coupon codes
      codesArray.length > 0
        ? supabaseAdmin
            .from('orders')
            .select('id, subtotal, total, final_amount, created_at, status, coupon_code')
            .in('coupon_code', codesArray)
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
      // Fallback: derive stats from orders table using all linked coupon codes
      const fallbackOrders = (ordersRes as any).data || []
      const activeOrders = fallbackOrders.filter((o: any) => isLiveCommissionStatus(o.status))

      totalOrders = activeOrders.length

      // Rate comes from the specific coupon that was used, falling back to the
      // creator's default — a creator can own several codes at different rates.
      const getCommissionRate = (usedCode: string) => {
        const matched = (linkedCoupons || []).find(
          c => String(c.code || '').toUpperCase() === String(usedCode || '').toUpperCase()
        )
        return matched?.commission_rate ?? commissionPct
      }

      // The amount and the rounding come from lib/commissions.ts so this agrees
      // with the admin coupon report to the rupee.
      const orderCommission = (o: any) =>
        estimateCommission(commissionableAmount(o), getCommissionRate(o.coupon_code))

      pendingPayout = activeOrders.reduce((sum: number, o: any) => sum + orderCommission(o), 0)
      thisMonthEarnings = activeOrders
        .filter((o: any) => new Date(o.created_at) >= startOfMonth)
        .reduce((sum: number, o: any) => sum + orderCommission(o), 0)
      totalEarnedLifetime = creatorData?.total_earned || pendingPayout
      chartSourceData = activeOrders.map((o: any) => ({ created_at: o.created_at }))
    }

    // Visits — gracefully handle if referral_visits table doesn't exist
    const totalVisits = (visitsRes as any).count || 0

    // Bucket size follows the selected range (3-hourly → yearly).
    const { points: chartData, granularity: chartGranularity } = bucketByRange(
      chartRange,
      chartSourceData.map(c => c.created_at),
      now
    )

    return NextResponse.json({
      totalOrders,
      thisMonthEarnings,
      pendingPayout,
      totalEarnedLifetime,
      totalVisits,
      chartData,
      chartRange,
      chartGranularity,
      codesTracked: codesArray,  // useful for debugging from creator portal
      dataSource: useCommissions ? 'commissions' : 'orders_fallback',
    })
  } catch (err: any) {
    console.error('Creator Stats API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
