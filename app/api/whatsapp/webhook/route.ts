import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { handleIncoming, type IncomingKind } from '@/lib/whatsapp/agent'
import { recordInbound, updateMessageStatus, whatsappOutbox } from '@/lib/whatsapp/inbox'

export const dynamic = 'force-dynamic'
// The assistant may make several model + database calls for one message.
export const maxDuration = 120

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
 * this check anyone could post fake messages "from" any customer's number —
 * and the assistant can create orders — so unsigned requests are rejected
 * once WHATSAPP_APP_SECRET is set (Meta app → Settings → Basic → App secret).
 */
function hasValidSignature(rawBody: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) {
    console.error('[whatsapp] WHATSAPP_APP_SECRET is not set; webhook messages are not verified.')
    return true
  }
  const expected = Buffer.from(`sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`)
  const received = Buffer.from(header || '')
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

type Parsed = { kind: IncomingKind; text: string; display: string; payload?: unknown }

function parseMessage(message: any): Parsed {
  switch (message.type) {
    case 'text':
      return { kind: 'text', text: message.text?.body || '', display: message.text?.body || '' }
    case 'interactive': {
      const reply = message.interactive?.button_reply || message.interactive?.list_reply
      return { kind: 'button', text: reply?.id || '', display: reply?.title || reply?.id || '', payload: message.interactive }
    }
    case 'button':
      return { kind: 'button', text: message.button?.payload || message.button?.text || '', display: message.button?.text || '' }
    case 'image':
      return { kind: 'image', text: message.image?.caption || '', display: `📷 Photo${message.image?.caption ? `: ${message.image.caption}` : ''}`, payload: message.image }
    case 'audio':
      return { kind: 'audio', text: '', display: '🎤 Voice note', payload: message.audio }
    case 'location': {
      const l = message.location || {}
      const text = [l.name, l.address, l.latitude && l.longitude ? `(${l.latitude}, ${l.longitude})` : ''].filter(Boolean).join(', ')
      return { kind: 'location', text: `My location: ${text}`, display: `📍 ${text}`, payload: l }
    }
    default:
      return { kind: 'other', text: '', display: `[${message.type || 'unsupported'} message]`, payload: message }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!hasValidSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ status: 'bad_json' })
  }

  const work: Promise<unknown>[] = []
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {}

      // Delivery receipts for our messages: sent → delivered → read.
      for (const status of value.statuses || []) {
        work.push(updateMessageStatus(status.id, status.status).catch(() => {}))
      }

      const names: Record<string, string> = {}
      for (const contact of value.contacts || []) names[contact.wa_id] = contact.profile?.name

      for (const message of value.messages || []) {
        const phone = String(message.from || '')
        if (!phone) continue
        const parsed = parseMessage(message)
        work.push((async () => {
          const isNew = await recordInbound({
            phone,
            waMessageId: message.id,
            type: message.type,
            body: parsed.display,
            payload: parsed.payload,
            name: names[phone] || null,
          })
          if (!isNew) return // Meta re-delivered a message we already handled
          const kind = parsed.kind === 'location' ? 'text' : parsed.kind
          await handleIncoming(phone, kind, parsed.text || parsed.display, whatsappOutbox)
        })().catch(error => console.error('[whatsapp] failed to handle message', message.id, error)))
      }
    }
  }

  // Answer Meta straight away (it retries slow webhooks) and finish the reply
  // in the background.
  waitUntil(Promise.all(work))
  return NextResponse.json({ status: 'ok' })
}
