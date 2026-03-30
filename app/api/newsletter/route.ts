import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function isMissingTableError(error: any) {
  const message = String(error?.message || '')
  return message.includes('schema cache') || message.includes('does not exist')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert({ email }, { onConflict: 'email' })

    if (error && !isMissingTableError(error)) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Thanks for subscribing to the Mana inbox.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not subscribe right now.' }, { status: 500 })
  }
}
