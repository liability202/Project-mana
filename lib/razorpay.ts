import crypto from 'crypto'
import Razorpay from 'razorpay'

const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const key_secret = process.env.RAZORPAY_KEY_SECRET

if (!key_id || !key_secret) {
  console.warn('Razorpay keys are missing. Payments will not work.')
}

export const razorpay = new Razorpay({
  key_id: key_id || 'dummy_key_id',
  key_secret: key_secret || 'dummy_key_secret',
})

function hmacMatches(secret: string, message: string, signature: string) {
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(message).digest('hex'))
  const received = Buffer.from(signature)
  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}

/** Checkout callback: signature over `order_id|payment_id` with the key secret. */
export function isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!key_secret) return false
  return hmacMatches(key_secret, `${orderId}|${paymentId}`, signature)
}

/** Webhooks: signature over the raw request body with the webhook secret. */
export function isValidWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  return hmacMatches(secret, rawBody, signature)
}
