import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { BRAND_NAME, SITE_URL } from '@/lib/seo'
import { findProductBySlug } from '@/lib/product-lookup'

// The product page itself is a client component, so it cannot export metadata.
// This server layout wraps it purely to give each product a real <title>,
// description, canonical URL and OG image — without which Google sees every
// product URL as the same untitled shell.
export const revalidate = 3600

type Props = { params: { slug: string } }

type ProductMeta = {
  slug: string
  name: string
  description: string | null
  category: string | null
  images: string[] | null
}

const META_COLUMNS = 'slug, name, description, category, images'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await findProductBySlug<ProductMeta>(supabaseAdmin || supabase, params.slug, META_COLUMNS)

  if (!product) {
    return { title: 'Product Not Found', robots: { index: false } }
  }

  const path = product.category === 'kits' ? `/kits/${product.slug}` : `/products/${product.slug}`
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
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title: `${product.name} | ${BRAND_NAME}`,
      description,
      url: `${SITE_URL}${path}`,
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

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const { product, error } = await findProductBySlug<ProductMeta>(supabaseAdmin || supabase, params.slug, 'slug, category')

  // A database hiccup must not be cached as a 404; let the page handle it.
  if (error) return <>{children}</>
  if (!product) notFound()

  // One URL per product: kits live under /kits (their builder prices them
  // correctly), and near-miss slugs go to the real one.
  if (product.category === 'kits') permanentRedirect(`/kits/${product.slug}`)
  if (product.slug !== params.slug) permanentRedirect(`/products/${product.slug}`)

  return <>{children}</>
}
