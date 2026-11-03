import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getActiveCreatorId } from '@/lib/creator-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const id = await getActiveCreatorId()
    if (!id) {
      return NextResponse.json({ error: 'Please sign in to the creator portal.' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('creators')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Creator profile load failed', err)
    return NextResponse.json({ error: 'Could not load your profile.' }, { status: 500 })
  }
}

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined) return undefined
  const text = String(value ?? '').trim().slice(0, maxLength)
  return text || null
}

export async function PATCH(req: Request) {
  try {
    const id = await getActiveCreatorId()
    if (!id) {
      return NextResponse.json({ error: 'Please sign in to the creator portal.' }, { status: 401 })
    }

    const updates = await req.json()

    // Only these fields are editable by the creator, and payment details are
    // validated so a typo can't send a payout to the wrong place.
    const email = optionalText(updates.email, 120)
    const upiId = optionalText(updates.upi_id, 80)
    const rawAccount = optionalText(updates.bank_account, 30)
    const bankAccount = rawAccount ? rawAccount.replace(/\s/g, '') : rawAccount
    const rawIfsc = optionalText(updates.bank_ifsc, 20)
    const bankIfsc = rawIfsc ? rawIfsc.toUpperCase() : rawIfsc

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (upiId && !/^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(upiId)) {
      return NextResponse.json({ error: 'Please enter a valid UPI ID (like name@bank).' }, { status: 400 })
    }
    if (bankAccount && !/^\d{9,18}$/.test(bankAccount)) {
      return NextResponse.json({ error: 'Bank account number should be 9 to 18 digits.' }, { status: 400 })
    }
    if (bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
      return NextResponse.json({ error: 'Please enter a valid IFSC code (like HDFC0001234).' }, { status: 400 })
    }

    const allowedUpdates: Record<string, string | null> = {}
    if (email !== undefined) allowedUpdates.email = email
    if (updates.instagram_handle !== undefined) allowedUpdates.instagram_handle = optionalText(updates.instagram_handle, 60) ?? null
    if (updates.youtube_handle !== undefined) allowedUpdates.youtube_handle = optionalText(updates.youtube_handle, 100) ?? null
    if (upiId !== undefined) allowedUpdates.upi_id = upiId
    if (bankAccount !== undefined) allowedUpdates.bank_account = bankAccount
    if (bankIfsc !== undefined) allowedUpdates.bank_ifsc = bankIfsc

    const { data, error } = await supabaseAdmin
      .from('creators')
      .update(allowedUpdates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Creator profile update failed', err)
    return NextResponse.json({ error: 'Could not update your profile.' }, { status: 500 })
  }
}
