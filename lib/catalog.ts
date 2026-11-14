import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/supabase'
import { CATALOG_TAG } from '@/lib/revalidate'

/**
 * The in-stock catalogue, cached on the server for 5 minutes and refreshed
 * immediately when the admin saves a product (revalidateTag). Listing pages
 * filter and sort this in memory instead of querying the database on every
 * request — /products is dynamic (it reads ?category= etc.), so without this
 * every shop visit was a database round trip.
 */
export const getInStockCatalog = unstable_cache(
  async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    return (data || []) as Product[]
  },
  ['catalog-in-stock'],
  { revalidate: 300, tags: [CATALOG_TAG] }
)

/**
 * Only what ProductCard shows. Cards are client components, so everything
 * passed to them is embedded in the page's HTML: full descriptions and every
 * variant made /products ~360 KB for a grid of names, photos and prices.
 */
export function toCardProduct(p: Product): Product {
  const firstVariant = p.variants?.[0]
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    price: p.price,
    compare_price: p.compare_price,
    price_per_unit: p.price_per_unit,
    images: (p.images || []).slice(0, 1),
    tags: (p.tags || []).filter(tag => typeof tag === 'string' && !tag.startsWith('badge:')),
    in_stock: p.in_stock,
    vendor: p.vendor,
    variants: firstVariant ? [{ id: firstVariant.id, name: firstVariant.name, price: firstVariant.price } as any] : [],
  } as Product
}
