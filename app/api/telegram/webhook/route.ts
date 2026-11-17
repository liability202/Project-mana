import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { ownerChatId, telegramStatus, webhookSecret } from '@/lib/telegram'
import { handleCallback, handleMessage } from '@/lib/telegram-bot'

export const dynamic = 'force-dynamic'

// Telegram re-sends an update it thinks failed; remember recent ones so an
// action never runs twice on the same instance.
const seen = new Set<number>()

/** Updates from Telegram for the owner's control bot. */
export async function POST(req: Request) {
  const status = telegramStatus()
  if (!status.tokenSet || !status.chatIdSet) return NextResponse.json({ ok: true })

  // Only Telegram knows the secret it was given in setWebhook.
  const got = Buffer.from(req.headers.get('x-telegram-bot-api-secret-token') || '')
  const want = Buffer.from(webhookSecret())
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update: any = await req.json().catch(() => null)
  if (!update || seen.has(update.update_id)) return NextResponse.json({ ok: true })
  seen.add(update.update_id)
  if (seen.size > 500) seen.delete(seen.values().next().value as number)

  // Only ever obey the owner.
  const from = update.callback_query?.from?.id ?? update.message?.from?.id
  const chat = update.callback_query?.message?.chat?.id ?? update.message?.chat?.id
  if (String(from) !== ownerChatId() || String(chat) !== ownerChatId()) return NextResponse.json({ ok: true })

  const origin = new URL(req.url).origin
  // Reply to Telegram straight away and do the work afterwards, so a slow
  // action (booking a courier) is never retried by Telegram.
  waitUntil((async () => {
    try {
      if (update.callback_query) await handleCallback(origin, update.callback_query)
      else if (update.message?.text) await handleMessage(origin, update.message)
    } catch (error) {
      console.error('[telegram] update failed', error)
    }
  })())
  return NextResponse.json({ ok: true })
}
