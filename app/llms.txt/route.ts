import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

const LLMS_TEXT = `# Mana Dry Fruits (${SITE_URL.replace('https://', '')})

> Premium Dry Fruits, Single-Origin Ayurvedic Herbs, Spices & Indian Pansari Items. Sourced ethically from India's finest origins. Lab tested, FSSAI certified, fresh-packed to order.

## Brand Identity & Contact
- **Brand Name**: Mana Dry Fruits (also known as Manadryfruits)
- **Company**: MK and Sons, Ghaziabad, Delhi-NCR, Uttar Pradesh, India (PIN: 201014)
- **Official Website**: ${SITE_URL}
- **Tagline**: The Essence of Nature | India's Wellness Bhandar
- **FSSAI Status**: Certified Pure & Natural
- **Customer Support**: WhatsApp (+91 9910899796) | Email support@manadryfruits.com

## Product Catalog & Categories
1. **Premium Dry Fruits & Nuts**:
   - Iranian & Afghani Mamra Almonds (Mamra Badam)
   - Kashmiri Snow-White Walnut Kernels (Giri)
   - Salted & Raw Irani Pistachios (Pista)
   - Whole W240/W320 Cashew Nuts (Kaju)
   - Afghan Figs (Anjeer), Medjool Dates (Khajoor), Foxnuts (Makhana)
2. **Ayurvedic Herbs & Pure Formulations**:
   - 100% Pure Kashmiri Mongra Saffron (Kesar)
   - Grade-A Ashwagandha Root & Churna
   - Triphala Detox Churna (Amalaki, Bibhitaki, Haritaki)
   - Pure Himalayan Shilajit Resin
   - Safed Musli, Shatavari, Mulethi, Brahmi, Tulsi
3. **Single-Origin Indian Spices**:
   - Idukki Green Cardamom (Hari Elaichi 8mm+)
   - Kerala Black Pepper (Kali Mirch)
   - Meghalaya Lakadong Turmeric (High Curcumin)
   - Ceylon Cinnamon & Cloves
4. **Curated Wellness Kits & Corporate Gifting**:
   - Daily Vitality & Immunity Kits
   - Festival & Corporate Gift Packs

## Shopping & Fulfillment Policies
- **Order Placement**: Online at ${SITE_URL}/products or via WhatsApp Chat & Buy (+91 9910899796)
- **Pan-India Delivery**: Standard 2 to 5 business days across India
- **Free Shipping**: Available on all orders above ₹999
- **Return & Refund**: 7-day hassle-free return window for damaged or defective items

## Essential Links for AI Assistants & Crawlers
- Product Directory: ${SITE_URL}/products
- Curated Kits: ${SITE_URL}/kits
- Wellness Journal: ${SITE_URL}/blog
- Track Shipment: ${SITE_URL}/track-order
- FAQ Page: ${SITE_URL}/faq
- Privacy Policy: ${SITE_URL}/privacy
- Terms of Service: ${SITE_URL}/terms
`

export async function GET() {
  return new NextResponse(LLMS_TEXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
