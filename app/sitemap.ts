import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/seo'

// Regenerate the sitemap hourly so newly published products get discovered.
export const revalidate = 3600

const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/products', changeFrequency: 'daily', priority: 0.9 },
  { path: '/kits', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/products?category=dry-fruits', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/products?category=herbs', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/products?category=spices', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/products?category=pansari', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/appointment', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/track-order', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(route => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // A build must never fail because Supabase is unreachable — a static-only
  // sitemap is far better than no sitemap at all.
  try {
    const { data } = await supabase
      .from('products')
      .select('slug, category, created_at')
      .eq('in_stock', true)
      .limit(2000)

    for (const product of data || []) {
      if (!product.slug) continue
      const base = product.category === 'kits' ? '/kits' : '/products'
      entries.push({
        url: `${SITE_URL}${base}/${product.slug}`,
        lastModified: product.created_at ? new Date(product.created_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    /* keep the static entries */
  }

  return entries
}
