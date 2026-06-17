import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    
  if (error) {
    // If the table doesn't exist yet, return defaults
    return NextResponse.json({
      enable_cashback_earning: true,
      enable_cashback_spending: true
    })
  }

  const settings: Record<string, boolean> = {
    enable_cashback_earning: true,
    enable_cashback_spending: true
  }

  data?.forEach(row => {
    settings[row.key] = row.value
  })

  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
