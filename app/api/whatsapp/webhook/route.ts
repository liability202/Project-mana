import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/whatsapp/bot'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ status: 'no_message' })
    }

    const phone = message.from || ''
    const msgType = message.type
    let userInput = message.text?.body || ''

    if (msgType === 'interactive') {
      userInput =
        message.interactive?.button_reply?.id ||
        message.interactive?.list_reply?.id ||
        userInput
    }

    if (msgType === 'button') {
      userInput = message.button?.payload || userInput
    }

    handleIncomingMessage(phone, userInput).catch((error) => {
      console.error('WhatsApp bot handler error:', error)
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
