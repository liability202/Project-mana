import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/whatsapp/bot'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'

/**
 * Admin-only bot simulator. It runs the real bot logic for any phone number,
 * so without the admin check anyone could read another customer's orders.
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const body = await req.json()
    const phone = String(body.phone || '').trim()
    const message = String(body.message || '').trim()

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Both phone and message are required.' },
        { status: 400 }
      )
    }

    const reply = await handleIncomingMessage(phone, message, {
      transport: {
        async sendMessage() {},
        async sendList() {},
        async sendButtons() {},
      },
    })

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error: any) {
    console.error('TEST BOT ERROR:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Something went wrong.',
      },
      { status: 500 }
    )
  }
}
