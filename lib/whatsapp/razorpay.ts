import { razorpay } from '@/lib/razorpay'

export async function createRazorpayPaymentLink({
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
  try {
    const normalizedPhone = phone.replace(/\D/g, '')

    const paymentLink = await razorpay.paymentLink.create({
      amount: amount, // amount in paise
      currency: 'INR',
      accept_partial: false,
      description: description,
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
