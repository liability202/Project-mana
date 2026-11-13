import { supabase, supabaseAdmin } from '@/lib/supabase'
import { findProductBySlug } from '@/lib/product-lookup'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo'
import KitView, { type KitProduct } from './KitView'

// Same hourly ISR as the layout.
export const revalidate = 3600

type Props = { params: { slug: string } }

/**
 * Server half of the kit page: puts the kit's name, contents and Product
 * schema in the HTML, which AI crawlers (they don't run JavaScript) and
 * Google's first-pass indexing need. KitView renders the interactive builder.
 */
export default async function KitPage({ params }: Props) {
  const { product } = await findProductBySlug<KitProduct>(supabaseAdmin || supabase, params.slug)
  const kit = product && product.category === 'kits' ? product : null

  if (!kit) return <KitView slug={params.slug} initialKit={null} />

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd({
            product: kit as any,
            path: `/kits/${kit.slug}`,
            price: offerPrice,
            images,
          })),
        }}
      />
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
      <KitView slug={params.slug} initialKit={kit} />
    </>
  )
}
