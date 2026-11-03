import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

/**
 * Customer sessions.
 *
 * After a WhatsApp OTP is verified we set an httpOnly cookie holding the phone
 * number plus an HMAC signature. Routes that expose a customer's orders, wallet
 * or loyalty status read the phone from here — never from the request — so a
 * phone number typed into a URL or saved in localStorage proves nothing.
 *
 * Sessions are stateless; rotating SESSION_SECRET logs everyone out.
 */

export const SESSION_COOKIE = 'mana_session'
export const CREATOR_SESSION_COOKIE = 'mana_creator_session'
const LEGACY_PHONE_COOKIE = 'mana_account_phone'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // matches the old "remember me" cookie
const CREATOR_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function getSessionKey(purpose: string) {
  const secret = process.env.SESSION_SECRET || process.env.OTP_SECRET || process.env.ADMIN_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is not configured.')
    }
    return crypto.createHash('sha256').update(`mana-local-dev-${purpose}`).digest()
  }
  // A dedicated key per purpose: a customer token can't pass as a creator
  // token, and neither can double as an OTP hash.
  return crypto.createHmac('sha256', secret).update(`mana-${purpose}-v1`).digest()
}

function sign(payload: string, purpose = 'session') {
  return crypto.createHmac('sha256', getSessionKey(purpose)).update(payload).digest('base64url')
}

function verifySignature(payload: string, signature: string, purpose: string) {
  const expected = Buffer.from(sign(payload, purpose))
  const received = Buffer.from(signature)
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

export function createSessionToken(phone: string, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000)
  const payload = Buffer.from(JSON.stringify({
    p: phone,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
  })).toString('base64url')
  return `v1.${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | null | undefined, now = Date.now()): { phone: string } | null {
  if (!token) return null
  const [version, payload, signature] = token.split('.')
  if (version !== 'v1' || !payload || !signature) return null
  if (!verifySignature(payload, signature, 'session')) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data?.p !== 'string' || !/^\d{10}$/.test(data.p)) return null
    if (typeof data.exp !== 'number' || data.exp * 1000 < now) return null
    return { phone: data.p }
  } catch {
    return null
  }
}

/** The verified phone for this request, or null. Route handlers only. */
export function getSessionPhone() {
  return readSessionToken(cookies().get(SESSION_COOKIE)?.value)?.phone || null
}

export function setSessionCookie(response: NextResponse, phone: string) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(phone), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  // The old client-readable phone cookie was never proof of anything.
  response.cookies.set(LEGACY_PHONE_COOKIE, '', { path: '/', maxAge: 0 })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  response.cookies.set(LEGACY_PHONE_COOKIE, '', { path: '/', maxAge: 0 })
}

// ── CREATOR PORTAL ──
// Creators sign in with the same WhatsApp OTP, but get their own cookie that
// names the creator row. Creator APIs read the id from here only.

export function createCreatorToken(creatorId: string, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000)
  const payload = Buffer.from(JSON.stringify({
    c: creatorId,
    iat: issuedAt,
    exp: issuedAt + CREATOR_SESSION_MAX_AGE_SECONDS,
  })).toString('base64url')
  return `v1.${payload}.${sign(payload, 'creator-session')}`
}

export function readCreatorToken(token: string | null | undefined, now = Date.now()): { creatorId: string } | null {
  if (!token) return null
  const [version, payload, signature] = token.split('.')
  if (version !== 'v1' || !payload || !signature) return null
  if (!verifySignature(payload, signature, 'creator-session')) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof data?.c !== 'string' || !data.c) return null
    if (typeof data.exp !== 'number' || data.exp * 1000 < now) return null
    return { creatorId: data.c }
  } catch {
    return null
  }
}

/** The signed-in creator's id for this request, or null. Route handlers only. */
export function getCreatorSessionId() {
  return readCreatorToken(cookies().get(CREATOR_SESSION_COOKIE)?.value)?.creatorId || null
}

export function setCreatorSessionCookie(response: NextResponse, creatorId: string) {
  response.cookies.set(CREATOR_SESSION_COOKIE, createCreatorToken(creatorId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CREATOR_SESSION_MAX_AGE_SECONDS,
  })
}

export function clearCreatorSessionCookie(response: NextResponse) {
  response.cookies.set(CREATOR_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Website orders store a 10-digit phone; WhatsApp-bot orders store it with the
 * 91 country code. Match both when looking up a customer's own records.
 */
export function phoneVariants(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const local = digits.length > 10 ? digits.slice(-10) : digits
  return Array.from(new Set([local, `91${local}`]))
}
