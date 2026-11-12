import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createCreatorToken, createSessionToken, phoneVariants, readCreatorToken, readSessionToken } from '../lib/session'

process.env.SESSION_SECRET = 'test-secret-for-unit-tests'

describe('customer session tokens', () => {
  it('round-trips a verified phone', () => {
    assert.deepEqual(readSessionToken(createSessionToken('9876543210')), { phone: '9876543210' })
  })

  it('rejects tampered payloads and signatures', () => {
    const token = createSessionToken('9876543210')
    const [version, payload, signature] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ p: '9123456789', iat: 0, exp: 9999999999 })).toString('base64url')
    assert.equal(readSessionToken(`${version}.${forged}.${signature}`), null)
    assert.equal(readSessionToken(`${version}.${payload}.${signature.slice(0, -2)}xx`), null)
    assert.equal(readSessionToken(`${version}.${payload}`), null)
    assert.equal(readSessionToken('garbage'), null)
    assert.equal(readSessionToken(''), null)
  })

  it('expires', () => {
    const issued = Date.UTC(2026, 0, 1)
    const token = createSessionToken('9876543210', issued)
    assert.ok(readSessionToken(token, issued + 1000))
    assert.equal(readSessionToken(token, issued + 181 * 24 * 60 * 60 * 1000), null)
  })

  it('is invalidated by rotating the secret', () => {
    const token = createSessionToken('9876543210')
    process.env.SESSION_SECRET = 'rotated-secret'
    assert.equal(readSessionToken(token), null)
    process.env.SESSION_SECRET = 'test-secret-for-unit-tests'
    assert.ok(readSessionToken(token))
  })
})

describe('creator session tokens', () => {
  it('round-trips a creator id', () => {
    assert.deepEqual(readCreatorToken(createCreatorToken('creator-uuid')), { creatorId: 'creator-uuid' })
  })

  it('cannot be swapped with customer tokens', () => {
    assert.equal(readCreatorToken(createSessionToken('9876543210')), null)
    assert.equal(readSessionToken(createCreatorToken('creator-uuid')), null)
  })
})

describe('phone variants', () => {
  it('matches website (10-digit) and WhatsApp (91-prefixed) forms', () => {
    assert.deepEqual(phoneVariants('9876543210').sort(), ['919876543210', '9876543210'].sort())
    assert.deepEqual(phoneVariants('919876543210').sort(), ['919876543210', '9876543210'].sort())
  })
})
