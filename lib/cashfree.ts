const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2025-01-01'

function getCashfreeBaseUrl() {
  const mode = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase()
  return mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
}

function getCashfreeHeaders() {
  const clientId = process.env.CASHFREE_APP_ID
  const clientSecret = process.env.CASHFREE_SECRET_KEY

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured.')
  }

  return {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
  }
}

export async function createCashfreeOrder(payload: Record<string, unknown>) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: 'POST',
    headers: getCashfreeHeaders(),
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Cashfree create order failed (${response.status})`)
  }

  return data
}

export async function fetchCashfreeOrder(orderId: string) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
    method: 'GET',
    headers: getCashfreeHeaders(),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Cashfree fetch order failed (${response.status})`)
  }

  return data
}

export async function fetchCashfreePayments(orderId: string) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}/payments`, {
    method: 'GET',
    headers: getCashfreeHeaders(),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(`Cashfree fetch payments failed (${response.status})`)
  }

  return Array.isArray(data) ? data : []
}
