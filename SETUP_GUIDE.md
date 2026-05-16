# Mana Website — Setup Guide

## What's built
- Next.js 14 fullstack app (frontend + API routes)
- Supabase database (products, orders, appointments)
- Cashfree payments (UPI, cards, net banking, COD)
- Vercel hosting (free)
- Admin panel at /admin

---

## Step 1 — Install Node.js

Download from nodejs.org → install version 18 or higher.

---

## Step 2 — Set up Supabase (free database)

1. Go to supabase.com → create account → New Project
2. Name it "mana-web", choose a password, pick region: South Asia (Mumbai)
3. Wait ~2 min for project to start
4. Go to SQL Editor → paste the entire contents of `lib/supabase-schema.sql` → Run
   - This creates all tables AND adds 6 sample products automatically
5. Go to Settings → API → copy:
   - Project URL → paste into .env.local as NEXT_PUBLIC_SUPABASE_URL
   - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE_KEY

---

## Step 3 — Set up Cashfree

1. Go to cashfree.com → create a merchant account
2. Complete merchant activation / KYC in the Cashfree dashboard
3. In Cashfree Dashboard → Developers → API Keys:
   - copy App ID → CASHFREE_APP_ID
   - copy Secret Key → CASHFREE_SECRET_KEY
4. In Cashfree Dashboard → Developers → Domain Whitelisting:
   - add http://localhost:3000 for local testing
   - add your live site domain later, for example https://your-site.vercel.app
5. Choose mode:
   - testing → CASHFREE_ENV=sandbox
   - live → CASHFREE_ENV=production
6. When you are ready to go live, replace sandbox credentials with production credentials and keep the live domain whitelisted

---

## Step 4 — Fill in .env.local

Open `.env.local` and replace all placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox
CASHFREE_API_VERSION=2025-01-01
NEXT_PUBLIC_CASHFREE_ENV=sandbox
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210   ← your number, no + or spaces
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=999
ADMIN_SECRET=pick-a-strong-password
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
WHATSAPP_TOKEN=your_meta_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WEBHOOK_VERIFY_TOKEN=choose-a-random-secret
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Step 5 — Run locally

```bash
cd mana-web
npm install
npm run dev
```

Open http://localhost:3000 — your site is live!

---

## Step 6 — Deploy to Vercel (free hosting)

1. Push your code to GitHub (create a repo, push all files)
2. Go to vercel.com → Import Project → select your GitHub repo
3. Vercel auto-detects Next.js
4. Add all your .env.local variables in Vercel → Settings → Environment Variables
5. Click Deploy — takes 2 minutes
6. Your site is live at yourproject.vercel.app

### Connect your domain:
1. Vercel → Settings → Domains → Add your domain
2. Go to your domain registrar → update DNS to point to Vercel
3. Done — SSL/HTTPS is automatic

---

## Step 7 — Add your real products

Option A — Through Admin panel:
1. Go to yoursite.com/admin
2. Login with your ADMIN_SECRET password
3. Products tab → Add Product

Option B — Through Supabase dashboard:
1. supabase.com → your project → Table Editor → products
2. Click Insert Row → fill in details

### Product fields to fill:
- **name**: e.g. "Mamra Almonds"
- **slug**: e.g. "mamra-almonds" (URL-friendly, no spaces)
- **description**: your product description
- **category**: dry-fruits / herbs / spices / pansari / kits
- **price**: in paise (₹1 = 100 paise, so ₹1200 = 120000)
- **images**: Supabase Storage URLs (upload in Storage → product-images bucket)
- **tags**: ["bestseller","organic"] etc.
- **vendor**: origin e.g. "Kashmir, India"
- **variants**: JSON array of variant objects

### Upload product images:
1. Supabase → Storage → Create bucket "product-images" (set to public)
2. Upload your JPG/PNG photos
3. Copy the public URL → paste into product images array

---

## Pages available

| URL | Page |
|-----|------|
| / | Homepage |
| /products | All products |
| /products?category=dry-fruits | Category filter |
| /products/mamra-almonds | Product detail |
| /kits | Kit builder |
| /cart | Cart (auto-opens drawer) |
| /checkout | Checkout + Cashfree |
| /about | About Us |
| /appointment | Video booking |
| /search?q=almonds | Search results |
| /admin | Admin panel |

---

## Customise your content

### Change hero text:
Open `app/page.tsx` → find the hero section → edit the text directly.

### Change colors:
Open `app/globals.css` → edit the CSS variables at the top.
Or open `tailwind.config.js` → edit the colors object.

### Change WhatsApp number:
Edit `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local`

### Add coupon codes:
Open `lib/store.ts` → find the COUPONS object → add your codes.

### Change footer links:
Open `components/layout/Footer.tsx` → edit the link arrays at top.

---

## Tech stack summary

| Part | Technology | Cost |
|------|-----------|------|
| Frontend | Next.js 14 (React) | Free |
| Styling | Tailwind CSS | Free |
| Database | Supabase | Free (500MB) |
| Auth | Supabase Auth | Free |
| Images | Supabase Storage | Free (1GB) |
| Payments | Cashfree | As per your Cashfree plan |
| Hosting | Vercel | Free |
| Domain | Your existing domain | Already have |
| **Total** | | **₹0 + 2% transaction fee** |

Upgrade path when you scale:
- Supabase Pro: ~₹1,700/month (8GB DB, more storage)
- Vercel Pro: ~₹1,700/month (more bandwidth)
- Total at scale: ~₹3,400/month — within your ₹5,000/yr budget with the free tier lasting a long time

