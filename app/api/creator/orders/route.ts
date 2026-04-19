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

    let query = supabaseAdmin
      .from('commissions')
      .select(`
        *,
        orders (
          order_ref,
          customer_name,
          items,
          total,
          status,
          created_at
        )
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('Supabase Query Error:', error)
      throw error
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('Creator Orders API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
