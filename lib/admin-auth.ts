import crypto from 'crypto'
import { NextResponse } from 'next/server'

/**
 * True when the request carries `Authorization: Bearer <ADMIN_SECRET>`.
 *
 * Fails closed: with ADMIN_SECRET unset, the old inline check accepted the
 * literal header "Bearer undefined". Compares digests so the check takes the
 * same time whether the guess is close or not.
 */
export function isAdminRequest(req: Request) {
  return isAdminToken((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''))
}

/** For routes that also accept the secret in a form field or x-admin-secret header. */
export function isAdminToken(token: string | null | undefined) {
  const secret = (process.env.ADMIN_SECRET || '').trim()
  if (!secret) return false

  const received = crypto.createHash('sha256').update((token || '').trim()).digest()
  const expected = crypto.createHash('sha256').update(secret).digest()
  return crypto.timingSafeEqual(received, expected)
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
