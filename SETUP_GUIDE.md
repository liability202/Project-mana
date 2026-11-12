# Mana Website — Setup Guide

## What's built
- Next.js 14 app (storefront, checkout, admin at `/admin`, creator portal at `/creator`)
- Supabase database
- Razorpay online payments + Cash on Delivery
- WhatsApp Cloud API: OTP sign-in, order updates and a shopping/support bot
- NimbusPost shipping, Resend email
- Hosted on Vercel

All money values in the code and database are **paise** (₹1 = 100).

---

## 1. Install and run locally

Node.js 18.17 or newer.

```bash
npm install
cp .env.example .env.local   # then fill it in (see step 3)
npm run dev                  # http://localhost:3000
npm test                     # pricing tests
```

---

## 2. Supabase

1. Create a project (region: Mumbai).
2. SQL Editor → run these files from `lib/`, in order:
   1. `supabase-schema.sql` (tables + sample products)
   2. `orders-schema-patch.sql`, `razorpay-schema-patch.sql`, `coupons-schema-patch.sql`,
      `creator-schema.sql`, `referral-visits-schema.sql`, `invoices-schema-patch.sql`,
      `supabase-whatsapp-schema.sql`, `support-tickets-schema.sql`, `products-badge-schema-patch.sql`
   3. `security-hardening-patch.sql` — **required**: removes public access to orders,
      coupons and reviewer phone numbers
   4. `checkout-hardening-patch.sql`
3. Settings → API → copy the URL, anon key and service-role key into `.env.local`.

The service-role key can read and change everything. It belongs only in `.env.local`
(never committed) and in Vercel's environment variables.

---

## 3. Environment variables

`.env.example` lists every variable with comments. The ones people miss:

| Variable | Why |
|---|---|
| `SESSION_SECRET`, `OTP_SECRET`, `ADMIN_SECRET` | Three different long random strings (`openssl rand -hex 32`). |
| `RAZORPAY_WEBHOOK_SECRET` | Confirms payments even if the customer closes the tab. |
| `WHATSAPP_APP_SECRET` | Lets the bot reject fake webhook calls. |
| `SUPPORT_ALERT_PHONE` | A staffed number for support-ticket alerts. |
| `RESEND_FROM_EMAIL` | Emails are skipped until this is set to a verified domain. |

---

## 4. Razorpay

1. Dashboard → API Keys → `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
2. Dashboard → Settings → Webhooks → add `https://<your-site>/api/razorpay/webhook`
   with events **order.paid**, **payment.captured** and **payment_link.paid**, and a
   secret → `RAZORPAY_WEBHOOK_SECRET`.

How checkout works: the server prices the cart, saves the order as an unpaid attempt
(shown as *payment not completed* in the admin), and opens a Razorpay order for exactly
that amount. The order becomes *pending / paid* only after the payment signature is
verified (by the checkout page or the webhook). Prices, coupons and fees sent by the
browser are never trusted.

Refunds for cancelled online orders are done by hand in the Razorpay dashboard; the
admin panel tells you when one is needed.

---

## 5. WhatsApp (Meta Cloud API)

1. `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` from the Meta app.
2. An approved authentication template for OTPs → `WHATSAPP_OTP_TEMPLATE_NAME`.
3. Webhook URL `https://<your-site>/api/whatsapp/webhook`, verify token =
   `WEBHOOK_VERIFY_TOKEN`; app secret → `WHATSAPP_APP_SECRET`.

Customers and creators sign in with a WhatsApp OTP; the site then keeps them signed in
with a secure cookie (180 days for customers, 30 for creators).

---

## 6. Deploy on Vercel

1. Import the GitHub repo; add every variable from `.env.example` under
   Settings → Environment Variables (Production and Preview).
2. Deploy. Pushing to `main` deploys to the live site.

---

## 7. Day to day

- **Products:** `/admin` → Products, or Supabase Table Editor → `products`.
  Product images go in the public `product-images` storage bucket.
- **Coupons:** `/admin` → Coupons. Fixed discounts are entered in rupees.
  A coupon linked to a creator pays that creator commission.
- **Orders:** delivered and cancelled are final. Delivering credits 5% cashback
  and confirms creator commission; cancelling returns any wallet credit used.
- **Creators:** add them in `/admin` → Creators; they sign in at `/creator`.
