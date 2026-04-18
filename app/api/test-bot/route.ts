import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/whatsapp/bot'

export async function POST(req: NextRequest) {
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

    console.log('TEST BOT PHONE:', phone)
    console.log('TEST BOT MESSAGE:', message)

    const reply = await handleIncomingMessage(phone, message, {
      transport: {
        async sendMessage() {},
        async sendList() {},
        async sendButtons() {},
      },
    })

    console.log('TEST BOT REPLY:', reply)

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
