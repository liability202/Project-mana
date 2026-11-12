import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Finds a product for a URL slug: exact match first, then singular/plural,
 * then the first product whose slug or name contains the slug's first word
 * (old links and typos). Callers should redirect to `product.slug` when it
 * differs, so every product has exactly one URL.
 *
 * The slug is validated before it reaches PostgREST: it is interpolated into
 * filter strings, where `%`, `_`, `,` or `.` would change the query.
 */
export async function findProductBySlug<T extends { slug: string } = any>(
  client: SupabaseClient,
  rawSlug: string,
  columns = '*'
): Promise<{ product: T | null; error: boolean }> {
  const slug = String(rawSlug || '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) return { product: null, error: false }

  const select = columns === '*' ? '*' : Array.from(new Set(['slug', ...columns.split(',').map(c => c.trim())])).join(', ')

  const exact = await client.from('products').select(select).ilike('slug', slug).limit(1)
  if (exact.error) return { product: null, error: true }
  if (exact.data?.length) return { product: exact.data[0] as unknown as T, error: false }

  const altSlug = slug.endsWith('s') ? slug.slice(0, -1) : `${slug}s`
  const alt = await client.from('products').select(select).ilike('slug', altSlug).limit(1)
  if (alt.error) return { product: null, error: true }
  if (alt.data?.length) return { product: alt.data[0] as unknown as T, error: false }

  const keyword = slug.split('-')[0]
  if (keyword.length >= 3) {
    const fuzzy = await client
      .from('products')
      .select(select)
      .or(`slug.ilike.%${keyword}%,name.ilike.%${keyword}%`)
      .limit(1)
    if (fuzzy.error) return { product: null, error: true }
    if (fuzzy.data?.length) return { product: fuzzy.data[0] as unknown as T, error: false }
  }

  return { product: null, error: false }
}
