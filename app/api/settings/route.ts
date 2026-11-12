export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'

const DEFAULTS: Record<string, boolean> = {
  enable_cashback_earning: true,
  enable_cashback_spending: true,
}

async function ensureTable() {
  try {
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        create table if not exists site_settings (
          key text primary key,
          value boolean default true,
          updated_at timestamptz default now()
        );
      `
    })
  } catch {
    // ignore - table likely already exists
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')

  if (error) {
    // Table may not exist - return defaults so the site keeps working
    return NextResponse.json(DEFAULTS)
  }

  const settings: Record<string, boolean> = { ...DEFAULTS }
  data?.forEach(row => {
    settings[row.key] = row.value
  })

  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  try {
    if (!isAdminRequest(req)) return unauthorized()

    const body = await req.json()
    const { key, value } = body

    if (!key || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Key and boolean value are required' }, { status: 400 })
    }

    // First attempt the upsert
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) {
      // Table might not exist — try to create it then retry
      await ensureTable()

      const { error: retryError } = await supabaseAdmin
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

      if (retryError) throw retryError
    }

    return NextResponse.json({ success: true, key, value })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
