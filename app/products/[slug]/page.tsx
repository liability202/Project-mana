import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Product, Variant } from '@/lib/supabase'
import { findProductBySlug } from '@/lib/product-lookup'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo'
import { calcPriceForWeight, extractBadgeConfig } from '@/lib/utils'
import ProductView, { type RatingSummary } from './ProductView'
import { getDefaultWeight } from './weights'

// Same hourly ISR as the layout. ProductView refetches on mount, so shoppers
// still get live price and stock; this render is what crawlers read.
export const revalidate = 3600

type Props = { params: { slug: string } }

async function loadRating(slug: string): Promise<RatingSummary | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_slug', slug)
      .eq('approved', true)
      .limit(200)
    if (error || !data?.length) return null
    const avg = data.reduce((sum, r: any) => sum + Number(r.rating || 0), 0) / data.length
    return { avg: Math.round(avg * 10) / 10, count: data.length }
  } catch {
    return null
  }
}

/**
 * Server half of the product page. AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot) don't run JavaScript, and Google indexes JS-rendered pages
 * late and patchily — so the name, description, price and Product schema must
 * be in the HTML itself, not fetched after load.
 */
export default async function ProductPage({ params }: Props) {
  const { product: raw } = await findProductBySlug<Product>(supabaseAdmin || supabase, params.slug)

  // On a database hiccup render the client-only page, which fetches for itself.
  if (!raw) return <ProductView slug={params.slug} initialProduct={null} initialRating={null} />

  const product = { ...raw, ...extractBadgeConfig(raw.tags, raw) } as Product
  const rating = await loadRating(product.slug)

  const defaultVariant = product.variants?.find((v: Variant) => v.in_stock !== false) || product.variants?.[0] || null
  const defaultPrice = calcPriceForWeight(defaultVariant?.price || product.price, product.price_per_unit, getDefaultWeight(product.category))
  const images = defaultVariant?.images?.length ? defaultVariant.images : product.images
  const category = String(product.category || '')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd({
            product,
            path: `/products/${product.slug}`,
            price: defaultPrice,
            images,
            aggregateRating: rating ? { ratingValue: rating.avg, reviewCount: rating.count } : null,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: category.replace(/-/g, ' '), path: `/products?category=${category}` },
            { name: product.name, path: `/products/${product.slug}` },
          ])),
        }}
      />
      <ProductView slug={params.slug} initialProduct={product} initialRating={rating} />
    </>
  )
}
