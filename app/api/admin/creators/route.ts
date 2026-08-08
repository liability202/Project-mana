import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.split(' ')[1]
  if (secret !== process.env.NEXT_PUBLIC_ADMIN_HINT && secret?.length! <= 6) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ?id= returns the single creator object, for the insights page.
    const id = new URL(req.url).searchParams.get('id')

    if (id) {
      const { data: creator, error: oneError } = await supabaseAdmin
        .from('creators')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (oneError) throw oneError
      if (!creator) return NextResponse.json({ error: 'Creator not found.' }, { status: 404 })
      return NextResponse.json(creator)
    }

    const { data: creators, error } = await supabaseAdmin
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(creators || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get('authorization')?.split(' ')[1]
  if (secret !== process.env.NEXT_PUBLIC_ADMIN_HINT && secret?.length! <= 6) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('creators')
      .insert(body)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
