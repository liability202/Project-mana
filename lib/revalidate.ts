import { revalidatePath, revalidateTag } from 'next/cache'

/** Cache tag on every cached catalogue query (see lib/catalog.ts). */
export const CATALOG_TAG = 'products'

/**
 * Product and kit pages are cached (built at deploy, refreshed hourly). Call
 * this after any admin change so shoppers see it immediately instead of after
 * the hour: it refreshes the changed product's own page(s) plus every listing
 * that shows products.
 */
export function revalidateCatalog(slugs: Array<string | null | undefined> = []) {
  try {
    revalidateTag(CATALOG_TAG)
    for (const path of ['/', '/products', '/ayurvedic-herbs', '/kits', '/sitemap.xml']) revalidatePath(path)
    for (const slug of Array.from(new Set(slugs.filter(Boolean) as string[]))) {
      revalidatePath(`/products/${slug}`)
      revalidatePath(`/kits/${slug}`)
    }
  } catch (error) {
    // Never fail an admin save because a cache refresh failed; the hourly
    // refresh still catches up.
    console.error('Cache refresh failed', error)
  }
}
