import { permanentRedirect } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { findProductBySlug } from '@/lib/product-lookup'
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from '@/lib/seo'
import { getKitContent } from '@/lib/kit-content'
import { getInStockCatalog } from '@/lib/catalog'
import { KitDetails, type KitDetailItem } from '@/components/product/KitDetails'
import KitView, { type KitProduct } from './KitView'

// Same hourly ISR as the layout.
export const revalidate = 3600

type Props = { params: { slug: string } }

/** Pre-build every kit page at deploy time (see app/products/[slug]/page.tsx). */
export async function generateStaticParams() {
  try {
    const { data } = await (supabaseAdmin || supabase).from('products').select('slug').eq('category', 'kits')
    return (data || []).filter(k => k.slug).map(k => ({ slug: k.slug as string }))
  } catch {
    return []
  }
}

/**
 * Server half of the kit page: puts the kit's name, contents and Product
 * schema in the HTML, which AI crawlers (they don't run JavaScript) and
 * Google's first-pass indexing need. KitView renders the interactive builder.
 */
export default async function KitPage({ params }: Props) {
  const { product } = await findProductBySlug<KitProduct>(supabaseAdmin || supabase, params.slug)
  const kit = product && product.category === 'kits' ? product : null

  if (!kit) return <KitView slug={params.slug} initialKit={null} />
  // One URL per kit: old or misspelled slugs go to the current one.
  if (kit.slug !== params.slug) permanentRedirect(`/kits/${kit.slug}`)

  const variants = kit.variants?.length ? kit.variants : []
  // Lowest price across sizes — what "from ₹X" means in the schema offer.
  const offerPrice = variants.reduce((lowest, variant) => {
    const variantPrice = variant.price || kit.price
    return lowest > 0 && lowest < variantPrice ? lowest : variantPrice
  }, kit.price || variants[0]?.price || 0)
  const images = Array.from(new Set([
    ...(kit.images || []),
    ...variants.flatMap(variant => variant.tier_images || []),
    ...variants.flatMap(variant => (variant.items || []).map(item => item.image).filter((image): image is string => Boolean(image))),
  ]))

  const guide = getKitContent(kit.slug)
  // What's inside, once per product, with current names/slugs from the
  // catalogue (the kit stores its own copy, which can lag behind renames).
  const catalog = await getInStockCatalog().catch(() => [])
  const byId = new Map(catalog.map(p => [p.id, p]))
  const seen = new Set<string>()
  const items: KitDetailItem[] = []
  for (const item of variants.flatMap(variant => variant.items || [])) {
    if (!item?.id || seen.has(item.id)) continue
    seen.add(item.id)
    const product = byId.get(item.id)
    items.push({ name: (product?.name || item.name || '').trim(), slug: product?.slug || item.slug, category: product?.category || item.category })
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd({
            product: (guide ? { ...kit, description: guide.description } : kit) as any,
            path: `/kits/${kit.slug}`,
            price: offerPrice,
            images,
            alternateName: guide?.aka,
          })),
        }}
      />
      {guide && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(guide.faqs)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Kits', path: '/kits' },
            { name: kit.name, path: `/kits/${kit.slug}` },
          ])),
        }}
      />
      <KitView slug={params.slug} initialKit={kit} details={guide ? <KitDetails kit={guide} items={items} /> : undefined} />
    </>
  )
}
