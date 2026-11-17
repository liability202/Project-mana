import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { botControlsStatus, connectBotControls, orderAlertText, recentTelegramChats, sendTelegramMessage, telegramStatus } from '@/lib/telegram'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

/** Setup status: keys present, chats that messaged the bot, and whether bot controls are connected. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()
  const status = telegramStatus()
  if (!status.tokenSet) return NextResponse.json({ ...status, chats: [], controls: { connected: false } })
  try {
    const [chats, controls] = await Promise.all([
      status.chatIdSet ? Promise.resolve([]) : recentTelegramChats(),
      botControlsStatus().catch(() => ({ connected: false })),
    ])
    return NextResponse.json({ ...status, chats, controls })
  } catch (error: any) {
    return NextResponse.json({ ...status, chats: [], controls: { connected: false }, error: error?.message || 'Could not reach Telegram.' })
  }
}

/** action "test": send a sample alert. action "connect": turn on bot commands and buttons. */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()
  const status = telegramStatus()
  if (!status.tokenSet || !status.chatIdSet) {
    return NextResponse.json({ error: 'Order alerts are not set up yet: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are both needed.' }, { status: 400 })
  }
  const body = await req.json().catch(() => ({}))

  if (body?.action === 'connect') {
    try {
      await connectBotControls(SITE_URL)
      await sendTelegramMessage('🤖 <b>Bot controls are on.</b>\nNew orders now arrive with buttons, and you can manage the shop from here. Send /help to see everything.')
      return NextResponse.json({ ok: true })
    } catch (error: any) {
      return NextResponse.json({ error: error?.message || 'Could not connect the bot.' }, { status: 502 })
    }
  }

  const sample = {
    order_ref: 'TEST1234',
    created_at: new Date().toISOString(),
    subtotal: 70500,
    shipping: 0,
    cod_charge: 2900,
    discount_amount: 7050,
    coupon_code: 'SAMPLE10',
    final_amount: 66350,
    payment_status: 'pending',
    notes: 'Cash on Delivery',
    customer_name: 'Test Customer',
    customer_phone: '9999999999',
    address: 'House 1, Sample Street',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    pincode: '201014',
    items: [
      { product_name: 'Almonds (Badaam)', variant_name: 'Australian', weight_grams: 500, quantity: 1, line_total: 68000 },
      { product_name: 'Flax Seeds', weight_grams: 250, quantity: 1, line_total: 2500 },
    ],
  }
  try {
    await sendTelegramMessage(orderAlertText(sample, { heading: '🧪 <b>Test alert</b> — real orders will look like this (with buttons)', previousOrders: 2 }))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Telegram did not accept the message.' }, { status: 502 })
  }
}
