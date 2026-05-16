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

export async function createCashfreePaymentLink({
  amount,
  description,
  orderId,
  phone,
}: {
  amount: number
  description: string
  orderId: string
  phone: string
}) {
  const normalizedPhone = phone.replace(/\D/g, '')

  const response = await fetch(`${getCashfreeBaseUrl()}/links`, {
    method: 'POST',
    headers: getCashfreeHeaders(),
    body: JSON.stringify({
      link_id: `mana_${orderId.slice(0, 18)}`,
      link_amount: Number((Math.max(100, amount) / 100).toFixed(2)),
      link_currency: 'INR',
      link_purpose: description,
      link_auto_reminders: false,
      customer_details: {
        customer_phone: normalizedPhone,
      },
      link_notify: {
        send_sms: false,
        send_email: false,
      },
      link_meta: {
        return_url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/checkout` : undefined,
      },
      link_notes: {
        order_id: orderId,
        channel: 'whatsapp',
      },
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`Cashfree payment link error (${response.status}): ${data?.message || data?.error || 'Unknown error'}`)
  }

  if (!data.link_url) {
    throw new Error('Cashfree payment link was created without a link URL.')
  }

  return data.link_url as string
}
