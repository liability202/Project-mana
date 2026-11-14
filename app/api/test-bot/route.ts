import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { handleIncoming } from '@/lib/whatsapp/agent'
import { captureOutbox, recordInbound } from '@/lib/whatsapp/inbox'
import { CHANGE_ORDER_ID, CONFIRM_ORDER_ID } from '@/lib/whatsapp/tools'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Admin-only assistant simulator: runs the real WhatsApp assistant without
 * sending anything to a phone. Test mode never creates orders, payment links
 * or owner alerts. Type "confirm" or "change" to press the order buttons.
 * Test chats appear in the inbox too, so you can see how they look there.
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const body = await req.json()
    const phone = String(body.phone || '').replace(/\D/g, '')
    const message = String(body.message || '').trim()
    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'Both phone and message are required.' }, { status: 400 })
    }

    const lower = message.toLowerCase()
    const button = lower === 'confirm' || message === CONFIRM_ORDER_ID ? CONFIRM_ORDER_ID : lower === 'change' || message === CHANGE_ORDER_ID ? CHANGE_ORDER_ID : null
    await recordInbound({
      phone,
      waMessageId: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: button ? 'interactive' : 'text',
      body: button === CONFIRM_ORDER_ID ? 'Confirm & pay' : button === CHANGE_ORDER_ID ? 'Change something' : message,
      name: 'Test chat',
    })

    const transcript: string[] = []
    await handleIncoming(phone, button ? 'button' : 'text', button || message, captureOutbox(transcript))
    const separator = '\n\n———\n\n'
    return NextResponse.json({ success: true, reply: transcript.join(separator) || '(No reply — the assistant may be paused for this chat in the inbox.)' })
  } catch (error: any) {
    console.error('TEST BOT ERROR:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Something went wrong.' }, { status: 500 })
  }
}
