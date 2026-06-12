import { randomUUID } from 'crypto'

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2025-01-01'

function getCashfreeBaseUrl() {
  const mode = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase()
  return mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
}

function getCashfreeHeaders(requestId: string) {
  const clientId = process.env.CASHFREE_APP_ID
  const clientSecret = process.env.CASHFREE_SECRET_KEY
  const mode = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase()

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured.')
  }
  if (mode !== 'production' && clientSecret.includes('_prod_')) {
    throw new Error('Cashfree is set to sandbox, but production credentials are configured. Use sandbox keys or set CASHFREE_ENV and NEXT_PUBLIC_CASHFREE_ENV to production.')
  }
  if (mode === 'production' && clientSecret.includes('_test_')) {
    throw new Error('Cashfree is set to production, but sandbox credentials are configured. Use production keys or set CASHFREE_ENV and NEXT_PUBLIC_CASHFREE_ENV to sandbox.')
  }

  return {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
    'x-request-id': requestId,
    'x-idempotency-key': requestId,
  }
}

async function parseCashfreeResponse(response: Response, fallback: unknown) {
  const text = await response.text().catch(() => '')
  if (!text) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function cashfreeError(data: any, status: number, requestId: string, fallback: string) {
  const message = data?.message || data?.error_description || data?.error || fallback
  return new Error(`${message} (Cashfree ${status}, request ${requestId})`)
}

export async function createCashfreeOrder(payload: Record<string, unknown>) {
  const requestId = randomUUID()
  const response = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: 'POST',
    headers: getCashfreeHeaders(requestId),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const data = await parseCashfreeResponse(response, {})
  if (!response.ok) {
    throw cashfreeError(data, response.status, requestId, 'Cashfree create order failed')
  }

  return data
}

export async function fetchCashfreeOrder(orderId: string) {
  const requestId = randomUUID()
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
    method: 'GET',
    headers: getCashfreeHeaders(requestId),
    cache: 'no-store',
  })

  const data = await parseCashfreeResponse(response, {})
  if (!response.ok) {
    throw cashfreeError(data, response.status, requestId, 'Cashfree fetch order failed')
  }

  return data
}

export async function fetchCashfreePayments(orderId: string) {
  const requestId = randomUUID()
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}/payments`, {
    method: 'GET',
    headers: getCashfreeHeaders(requestId),
    cache: 'no-store',
  })

  const data = await parseCashfreeResponse(response, [])
  if (!response.ok) {
    throw cashfreeError(data, response.status, requestId, 'Cashfree fetch payments failed')
  }

  return Array.isArray(data) ? data : []
}
