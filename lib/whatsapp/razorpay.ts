export async function createRazorpayLink({
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
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured.')
  }

  const normalizedPhone = phone.replace(/\D/g, '')
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    amount: Math.max(100, Math.round(amount)),
    currency: 'INR',
    description,
    reference_id: orderId,
    customer: normalizedPhone ? { contact: normalizedPhone } : {},
    notify: { sms: false, email: false },
    reminder_enable: false,
    expire_by: Math.floor(Date.now() / 1000) + 86400,
    notes: {
      order_id: orderId,
      channel: 'whatsapp',
    },
  })
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Razorpay payment link error (${response.status}): ${details}`)
  }

  const data = (await response.json()) as { short_url?: string }
  if (!data.short_url) throw new Error('Razorpay payment link was created without a short URL.')
  return data.short_url
}
