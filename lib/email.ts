import { Resend } from 'resend'
import { OrderConfirmationEmail } from '@/emails/OrderConfirmation'
import { OrderShippedEmail } from '@/emails/OrderShipped'
import { CashbackCreditedEmail } from '@/emails/CashbackCredited'

// Setup:
// 1. Go to resend.com -> sign up free -> create API key
// 2. Add to .env.local: RESEND_API_KEY=re_xxxxxxxxxx
// 3. Add your domain in Resend -> add DNS records -> verify
// 4. From address: orders@yourdomain.com

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const fromEmail = process.env.RESEND_FROM_EMAIL || 'orders@yourdomain.com'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

function getWhatsappUrl(message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}

export async function sendOrderConfirmation(params: {
  customerEmail?: string | null
  customerName: string
  orderId: string
  items: any[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  address: string
  city: string
  state?: string | null
  pincode: string
}) {
  if (!resend || !params.customerEmail) return

  await resend.emails.send({
    from: fromEmail,
    to: params.customerEmail,
    subject: `Your Mana order is confirmed \u2713 | Order #${params.orderId.slice(0, 8).toUpperCase()}`,
    react: OrderConfirmationEmail({
      customerName: params.customerName,
      orderId: params.orderId.slice(0, 8).toUpperCase(),
      items: params.items,
      subtotal: params.subtotal,
      shipping: params.shipping,
      discount: params.discount,
      total: params.total,
      address: params.address,
      city: params.city,
      state: params.state || undefined,
      pincode: params.pincode,
      whatsappUrl: getWhatsappUrl(`Hi Mana! I have a question about order #${params.orderId.slice(0, 8).toUpperCase()}.`),
    }),
  })
}

export async function sendOrderShipped(params: {
  customerEmail?: string | null
  customerName: string
  orderId: string
  trackingNumber?: string
  courierName?: string
  trackingLink?: string
  expectedDelivery?: string
  items: any[]
}) {
  if (!resend || !params.customerEmail) return

  await resend.emails.send({
    from: fromEmail,
    to: params.customerEmail,
    subject: 'Your Mana order is on its way! \u{1F69A}',
    react: OrderShippedEmail({
      customerName: params.customerName,
      orderId: params.orderId.slice(0, 8).toUpperCase(),
      trackingNumber: params.trackingNumber,
      courierName: params.courierName,
      trackingLink: params.trackingLink,
      expectedDelivery: params.expectedDelivery,
      items: params.items,
      whatsappUrl: getWhatsappUrl(`Hi Mana! I have a shipping question about order #${params.orderId.slice(0, 8).toUpperCase()}.`),
    }),
  })
}

export async function sendCashbackCredited(params: {
  customerEmail?: string | null
  customerName: string
  cashbackAmount: number
  walletBalance: number
}) {
  if (!resend || !params.customerEmail) return

  await resend.emails.send({
    from: fromEmail,
    to: params.customerEmail,
    subject: `\u20B9${(params.cashbackAmount / 100).toLocaleString('en-IN')} cashback has been added to your Mana wallet \u{1F4B0}`,
    react: CashbackCreditedEmail({
      customerName: params.customerName,
      cashbackAmount: params.cashbackAmount,
      walletBalance: params.walletBalance,
      shopUrl: siteUrl,
    }),
  })
}
