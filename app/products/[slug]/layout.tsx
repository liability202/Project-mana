import type { Metadata } from 'next'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { BRAND_NAME, SITE_URL } from '@/lib/seo'

// The product page itself is a client component, so it cannot export metadata.
// This server layout wraps it purely to give each product a real <title>,
// description, canonical URL and OG image — without which Google sees every
// product URL as the same untitled shell.
export const revalidate = 3600

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const client = supabaseAdmin || supabase
  const { data: product } = await client
    .from('products')
    .select('name, description, category, images, price, in_stock')
    .ilike('slug', params.slug)
    .maybeSingle()

  if (!product) {
    return {
      title: 'Product Not Found',
      alternates: { canonical: `/products/${params.slug}` },
    }
  }

  const category = String(product.category || '').replace(/-/g, ' ')
  const title = `Buy ${product.name} Online${category ? ` – Premium ${category}` : ''}`
  const description = (product.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155)
    || `Buy ${product.name} online from ${BRAND_NAME}. Lab tested, FSSAI certified and packed fresh to order. Free shipping on orders above ₹999.`

  const image = product.images?.[0]

  return {
    title,
    description,
    alternates: { canonical: `/products/${params.slug}` },
    openGraph: {
      type: 'website',
      title: `${product.name} | ${BRAND_NAME}`,
      description,
      url: `${SITE_URL}/products/${params.slug}`,
      siteName: BRAND_NAME,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | ${BRAND_NAME}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
