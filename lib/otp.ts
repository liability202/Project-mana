import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureUserProfile, normalizePhone } from '@/lib/commerce'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

const OTP_EXPIRY_MINUTES = 10
const OTP_RESEND_SECONDS = 30
const OTP_MAX_ATTEMPTS = 5

type OtpRecord = {
  phone: string
  otp_hash: string
  expires_at: string
  resend_available_at: string
  attempts: number
  delivery_channels?: string[] | null
  verified_at?: string | null
}

function getOtpSecret() {
  return process.env.OTP_SECRET || process.env.ADMIN_SECRET || 'mana-otp-secret'
}

function hashOtp(phone: string, otp: string) {
  return crypto
    .createHmac('sha256', getOtpSecret())
    .update(`${phone}:${otp}`)
    .digest('hex')
}

function isMissingSchemaError(error: any) {
  const message = String(error?.message || '')
  return (
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes("Could not find the table 'public.checkout_otps'")
  )
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999))
}

function getOtpMessage(code: string) {
  return `Your MANA checkout OTP is ${code}. It is valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`
}

async function readFallbackOtp(client: SupabaseClient, phone: string): Promise<OtpRecord | null> {
  const { data, error } = await client
    .from('wa_sessions')
    .select('cart')
    .eq('phone', phone)
    .maybeSingle()

  if (error) throw error
  const payload = data?.cart?.checkout_otp
  return payload || null
}

async function writeFallbackOtp(client: SupabaseClient, record: OtpRecord) {
  const { data: existing, error: lookupError } = await client
    .from('wa_sessions')
    .select('cart, state, lang')
    .eq('phone', record.phone)
    .maybeSingle()

  if (lookupError) throw lookupError

  const nextCart = {
    ...(existing?.cart || {}),
    checkout_otp: record,
  }

  const { error } = await client.from('wa_sessions').upsert({
    phone: record.phone,
    state: existing?.state || 'CHECKOUT_OTP',
    lang: existing?.lang || 'English',
    cart: nextCart,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

async function clearFallbackOtp(client: SupabaseClient, phone: string) {
  const { data: existing, error: lookupError } = await client
    .from('wa_sessions')
    .select('cart')
    .eq('phone', phone)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (!existing?.cart) return

  const nextCart = { ...existing.cart }
  delete nextCart.checkout_otp

  const { error } = await client
    .from('wa_sessions')
    .update({ cart: nextCart, updated_at: new Date().toISOString() })
    .eq('phone', phone)

  if (error) throw error
}

export async function getOtpRecord(client: SupabaseClient, phone: string): Promise<OtpRecord | null> {
  const normalized = normalizePhone(phone)

  const { data, error } = await client
    .from('checkout_otps')
    .select('*')
    .eq('phone', normalized)
    .maybeSingle()

  if (!error) return data as OtpRecord | null
  if (!isMissingSchemaError(error)) throw error
  return readFallbackOtp(client, normalized)
}

export async function saveOtpRecord(client: SupabaseClient, record: OtpRecord) {
  const normalized = normalizePhone(record.phone)
  const payload = { ...record, phone: normalized }

  const { error } = await client.from('checkout_otps').upsert(payload)
  if (!error) return
  if (!isMissingSchemaError(error)) throw error
  await writeFallbackOtp(client, payload)
}

export async function clearOtpRecord(client: SupabaseClient, phone: string) {
  const normalized = normalizePhone(phone)

  const { error } = await client.from('checkout_otps').delete().eq('phone', normalized)
  if (!error) return
  if (!isMissingSchemaError(error)) throw error
  await clearFallbackOtp(client, normalized)
}

async function sendSmsOtp(phone: string, code: string) {
  const authKey = process.env.MSG91_AUTH_KEY
  
  if (!authKey) {
    return false
  }

  const res = await fetch("https://api.msg91.com/api/v2/sendsms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      sender: "TESTIN", // temporary sender
      route: "4", // transactional
      country: "91",
      sms: [
        {
          message: `Your MANA checkout OTP is ${code}`,
          to: [phone],
        },
      ],
    }),
  })

  if (!res.ok) {
    const details = await res.text()
    throw new Error(`SMS delivery failed: ${details}`)
  }

  const data = await res.json()
  if (data.type === 'error') {
    throw new Error(`MSG91 Error: ${data.message}`)
  }

  return true
}

export async function deliverOtp(phone: string, code: string) {
  const channels: string[] = []
  const errors: string[] = []

  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      await sendWhatsAppMessage(`91${phone}`, getOtpMessage(code))
      channels.push('whatsapp')
    } catch (error: any) {
      errors.push(error.message || 'WhatsApp delivery failed')
    }
  }

  try {
    const smsSent = await sendSmsOtp(phone, code)
    if (smsSent) channels.push('sms')
  } catch (error: any) {
    errors.push(error.message || 'SMS delivery failed')
  }

  if (channels.length === 0 && process.env.NODE_ENV !== 'production') {
    channels.push('dev')
  }

  if (channels.length === 0) {
    throw new Error(errors[0] || 'No OTP delivery channel is configured.')
  }

  return {
    channels,
    devOtp: channels.includes('dev') ? code : null,
  }
}

export async function createAndSendOtp(client: SupabaseClient, phone: string) {
  const normalized = normalizePhone(phone)
  const existing = await getOtpRecord(client, normalized)
  const now = Date.now()

  if (existing?.resend_available_at && new Date(existing.resend_available_at).getTime() > now) {
    const retryAfter = Math.max(1, Math.ceil((new Date(existing.resend_available_at).getTime() - now) / 1000))
    throw new Error(`Please wait ${retryAfter}s before requesting another OTP.`)
  }

  const code = generateOtp()
  const delivery = await deliverOtp(normalized, code)
  const record: OtpRecord = {
    phone: normalized,
    otp_hash: hashOtp(normalized, code),
    attempts: 0,
    expires_at: new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    resend_available_at: new Date(now + OTP_RESEND_SECONDS * 1000).toISOString(),
    delivery_channels: delivery.channels,
    verified_at: null,
  }

  await saveOtpRecord(client, record)

  return {
    channels: delivery.channels,
    devOtp: delivery.devOtp,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  }
}

export async function verifyOtpCode(
  client: SupabaseClient,
  params: { phone: string; otp: string; name?: string | null; email?: string | null }
) {
  const normalized = normalizePhone(params.phone)
  const record = await getOtpRecord(client, normalized)

  if (!record) throw new Error('No OTP request found for this number. Please request a new OTP.')
  if (record.verified_at) throw new Error('This OTP has already been used. Please request a new one.')
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await clearOtpRecord(client, normalized)
    throw new Error('This OTP has expired. Please request a new one.')
  }
  if ((record.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    throw new Error('Too many invalid attempts. Please request a new OTP.')
  }

  const isTestOtp = process.env.NODE_ENV !== 'production' && params.otp === '111111'

  if (!isTestOtp) {
    if (hashOtp(normalized, params.otp) !== record.otp_hash) {
      await saveOtpRecord(client, {
        ...record,
        attempts: (record.attempts || 0) + 1,
      })
      throw new Error('Invalid OTP. Please check and try again.')
    }
  }

  await clearOtpRecord(client, normalized)

  const profile = await ensureUserProfile(client, {
    phone: normalized,
    userId: null,
    name: params.name || null,
    email: params.email || null,
  })

  const { data: latestOrder, error } = await client
    .from('orders')
    .select('*')
    .eq('customer_phone', normalized)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && !isMissingSchemaError(error)) throw error

  return {
    phone: normalized,
    profile,
    customerType: latestOrder ? 'returning' : 'new',
    latestOrder: latestOrder || null,
  }
}
