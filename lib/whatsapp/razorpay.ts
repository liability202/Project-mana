import { razorpay } from '@/lib/razorpay'

const LINK_LIFETIME_SECONDS = 24 * 60 * 60

export async function createRazorpayPaymentLink({
  amount,
  description,
  orderId,
  orderRef,
  phone,
}: {
  amount: number
  description: string
  orderId: string
  orderRef?: string
  phone: string
}) {
  try {
    const normalizedPhone = phone.replace(/\D/g, '')

    const paymentLink = await razorpay.paymentLink.create({
      amount: amount, // amount in paise
      currency: 'INR',
      accept_partial: false,
      description: description.slice(0, 2048),
      // Links expire so a stale one can't be paid long after the order is gone.
      expire_by: Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS,
      ...(orderRef ? { reference_id: orderRef } : {}),
      customer: {
        contact: normalizedPhone,
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
      notes: {
        order_id: orderId,
        channel: 'whatsapp',
      },
    })

    if (!paymentLink.short_url) {
      throw new Error('Razorpay payment link was created without a short URL.')
    }

    return paymentLink.short_url
  } catch (error: any) {
    throw new Error(`Razorpay payment link error: ${error.message || 'Unknown error'}`)
  }
}
