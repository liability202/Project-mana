import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { matchCatalogProducts } from '@/lib/product-search'
import { extractBadgeConfig } from '@/lib/utils'

function prepareProductData(payload: any) {
  const { badge_x, badge_y, badge_scale, badge_size, ...cleanData } = payload

  let tags: string[] = Array.isArray(cleanData.tags) ? cleanData.tags.filter((t: string) => typeof t === 'string' && !t.startsWith('badge:')) : []

  if (badge_x !== undefined && badge_y !== undefined) {
    const scale = badge_scale ?? badge_size ?? 1
    tags.push(`badge:${badge_x}:${badge_y}:${scale}`)
  }

  cleanData.tags = tags
  return cleanData
}

function formatProductResponse(product: any) {
  if (!product) return product
  if (Array.isArray(product)) return product.map(p => ({ ...p, ...extractBadgeConfig(p.tags, p) }))
  return { ...product, ...extractBadgeConfig(product.tags, product) }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const slug = searchParams.get('slug')
  const limit = parseInt(searchParams.get('limit') || '24')
  const id = searchParams.get('id')

  const includeAll = searchParams.get('include_all') === '1'
  const auth = req.headers.get('authorization')
  const isAdmin = auth === `Bearer ${process.env.ADMIN_SECRET}`

  // Use supabaseAdmin if searching by id, slug, or admin include_all
  const client = (id || slug || includeAll || isAdmin) ? supabaseAdmin : supabase
  let query = client.from('products').select('*')

  // Only filter in_stock for general catalog browsing
  if (!includeAll && !isAdmin && !id && !slug)
    query = query.eq('in_stock', true)

  if (slug) {
    // 1. Try exact/ilike slug match
    const { data: exactMatch } = await client.from('products').select('*').ilike('slug', slug).limit(1)
    if (exactMatch && exactMatch.length > 0) {
      return NextResponse.json(formatProductResponse(exactMatch))
    }

    // 2. Try singular/plural fallback (e.g. walnut-kernels -> walnut-kernel)
    const altSlug = slug.endsWith('s') ? slug.slice(0, -1) : `${slug}s`
    const { data: altMatch } = await client.from('products').select('*').ilike('slug', altSlug).limit(1)
    if (altMatch && altMatch.length > 0) {
      return NextResponse.json(formatProductResponse(altMatch))
    }

    // 3. Try key word match on name or slug (e.g. "walnut" in name/slug)
    const keyword = slug.split('-')[0]
    if (keyword && keyword.length >= 3) {
      const { data: kwMatch } = await client.from('products').select('*').or(`slug.ilike.%${keyword}%,name.ilike.%${keyword}%`).limit(1)
      if (kwMatch && kwMatch.length > 0) {
        return NextResponse.json(formatProductResponse(kwMatch))
      }
    }

    return NextResponse.json([])
  const fetchLimit = q ? Math.max(200, limit) : limit

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  const formatted = formatProductResponse(data || [])

  if (q) {
    return NextResponse.json(
      matchCatalogProducts(formatted, q, limit).map(match => match.product)
    )
  }

  return NextResponse.json(formatted)
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await req.json()
    const payload = prepareProductData(rawBody)
    const { data, error } = await supabaseAdmin.from('products').insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProductResponse(data))
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Invalid product payload',
    }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await req.json()
    const { id, ...updates } = rawBody
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 })

    const payload = prepareProductData(updates)
    const { data, error } = await supabaseAdmin.from('products').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(formatProductResponse(data))
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Invalid product payload',
    }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Invalid delete payload',
    }, { status: 400 })
  }
}
