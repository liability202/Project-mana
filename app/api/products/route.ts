import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { matchCatalogProducts } from '@/lib/product-search'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const slug = searchParams.get('slug') // ADD THIS
  const limit = parseInt(searchParams.get('limit') || '24')
  const id = searchParams.get('id')

  const includeAll = searchParams.get('include_all') === '1'
  const auth = req.headers.get('authorization')
  const isAdmin = auth === `Bearer ${process.env.ADMIN_SECRET}`

  let query = supabase.from('products').select('*')

  if (!(includeAll && isAdmin))
    query = query.eq('in_stock', true)

  if (id)
    query = query.eq('id', id)

  if (slug)
    query = query.eq('slug', slug) // ADD THIS

  if (category)
    query = query.eq('category', category)

  if (tag)
    query = query.contains('tags', [tag])

  const fetchLimit = q ? Math.max(200, limit) : limit

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  if (q) {
    return NextResponse.json(
      matchCatalogProducts(data || [], q, limit).map(match => match.product)
    )
  }

  return NextResponse.json(data)
}