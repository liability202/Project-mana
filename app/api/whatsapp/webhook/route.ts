import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/whatsapp/bot'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && process.env.WEBHOOK_VERIFY_TOKEN && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * Meta signs each delivery with the app secret (X-Hub-Signature-256). Without
 * this check anyone could post fake messages "from" any customer's number.
 * Set WHATSAPP_APP_SECRET (Meta app → Settings → Basic → App secret).
 */
function hasValidSignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) {
    // Deliberately fail open until the secret is configured: failing closed
    // would silently stop the bot replying to every customer.
    console.error('[whatsapp] WHATSAPP_APP_SECRET is not set; anyone can post fake messages to this webhook.')
    return true
  }
  const expected = Buffer.from(`sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`)
  const received = Buffer.from(header || '')
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    if (!hasValidSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    const body = JSON.parse(rawBody)
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
    let imageInfo: { mediaId: string; mimeType?: string; caption?: string } | undefined
    let locationInfo: { latitude?: number; longitude?: number; addressText?: string } | undefined
    let audioInfo: { mediaId: string; mimeType?: string } | undefined

    if (msgType === 'interactive') {
      userInput =
        message.interactive?.button_reply?.id ||
        message.interactive?.list_reply?.id ||
        userInput
    }

    if (msgType === 'button') {
      userInput = message.button?.payload || userInput
    }

    if (msgType === 'image') {
      imageInfo = {
        mediaId: message.image?.id || '',
        mimeType: message.image?.mime_type,
        caption: message.image?.caption,
      }
      userInput = message.image?.caption || '__IMAGE_RECEIVED__'
    }

    if (msgType === 'location') {
      const lat = message.location?.latitude
      const lng = message.location?.longitude
      const name = message.location?.name
      const address = message.location?.address
      locationInfo = {
        latitude: lat,
        longitude: lng,
        addressText: [name, address, lat && lng ? `${lat}, ${lng}` : ''].filter(Boolean).join(', '),
      }
      userInput = locationInfo.addressText || '__LOCATION_RECEIVED__'
    }

    if (msgType === 'audio') {
      audioInfo = {
        mediaId: message.audio?.id || '',
        mimeType: message.audio?.mime_type,
      }
      userInput = '__AUDIO_RECEIVED__'
    }

    console.log('PHONE:', phone)
    console.log('MESSAGE:', userInput)
    if (imageInfo) console.log('IMAGE:', imageInfo.mediaId)

    try {
      await handleIncomingMessage(phone, userInput, { imageInfo, locationInfo, audioInfo })
    } catch (error) {
      console.error('WhatsApp bot handler error:', error)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
