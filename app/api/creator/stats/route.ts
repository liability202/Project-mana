import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const creatorId = searchParams.get('creatorId')

    if (!creatorId) {
      return NextResponse.json({ error: 'Creator ID is required.' }, { status: 400 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [statsRes, monthlyRes, chartRes, creatorRes] = await Promise.all([
      // Total sessions/orders stats
      supabaseAdmin
        .from('commissions')
        .select('commission_amount, status')
        .eq('creator_id', creatorId),
      
      // This month earnings
      supabaseAdmin
        .from('commissions')
        .select('commission_amount')
        .eq('creator_id', creatorId)
        .gte('created_at', startOfMonth.toISOString())
        .in('status', ['confirmed', 'paid']),
      
      // Last 8 weeks chart data
      supabaseAdmin
        .from('commissions')
        .select('created_at')
        .eq('creator_id', creatorId)
        .gte('created_at', new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),

      // Creator profile totals
      supabaseAdmin
        .from('creators')
        .select('total_earned, total_paid')
        .eq('id', creatorId)
        .maybeSingle()
    ])

    const allCommissions = statsRes.data || []
    const totalOrders = allCommissions.filter(c => c.status !== 'cancelled').length
    
    const pendingPayout = allCommissions
      .filter(c => c.status === 'confirmed')
      .reduce((sum, c) => sum + c.commission_amount, 0)
    
    const thisMonthEarnings = (monthlyRes.data || [])
      .reduce((sum, c) => sum + c.commission_amount, 0)

    const totalEarnedLifetime = creatorRes.data?.total_earned || 0

    // Process chart data for last 8 weeks
    const chartData = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - (i * 7))
      
      // Set to start of that week (Sunday)
      const startOfWeek = new Date(d)
      startOfWeek.setHours(0, 0, 0, 0)
      startOfWeek.setDate(d.getDate() - d.getDay())
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      const weekOrders = (chartRes.data || []).filter(c => {
        const cDate = new Date(c.created_at)
        return cDate >= startOfWeek && cDate < endOfWeek
      }).length

      chartData.push({
        name: startOfWeek.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        orders: weekOrders
      })
    }

    return NextResponse.json({
      totalOrders,
      thisMonthEarnings,
      pendingPayout,
      totalEarnedLifetime,
      chartData
    })
  } catch (err: any) {
    console.error('Creator Stats API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
