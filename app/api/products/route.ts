import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { matchCatalogProducts } from '@/lib/product-search'
import { extractBadgeConfig } from '@/lib/utils'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { findProductBySlug } from '@/lib/product-lookup'

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
  const isAdmin = isAdminRequest(req)

  // Use supabaseAdmin if searching by id, slug, or admin include_all
  const client = (id || slug || includeAll || isAdmin) ? supabaseAdmin : supabase
  let query = client.from('products').select('*')

  if (id) {
    query = query.eq('id', id)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  // Only filter in_stock for general catalog browsing
  if (!includeAll && !isAdmin && !id && !slug)
    query = query.eq('in_stock', true)

  if (slug) {
    // Exact, then singular/plural, then first-word match (see lib/product-lookup).
    const { product } = await findProductBySlug(client, slug)
    return NextResponse.json(product ? formatProductResponse([product]) : [])
  }

  const fetchLimit = q ? Math.max(200, limit) : limit

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (error)
    return NextResponse.json({ error: (error as any)?.message || 'Database error' }, { status: 500 })

  const formatted = formatProductResponse(data || [])

  if (q) {
    return NextResponse.json(
      matchCatalogProducts(formatted, q, limit).map(match => match.product)
    )
  }

  return NextResponse.json(formatted)
}

async function makeUniqueSlug(baseSlug: string, currentId?: string): Promise<string> {
  if (!baseSlug) return baseSlug
  let uniqueSlug = baseSlug
  let counter = 1
  while (counter <= 50) {
    let query = supabaseAdmin.from('products').select('id').eq('slug', uniqueSlug)
    if (currentId) query = query.neq('id', currentId)
    const { data } = await query.limit(1)
    if (!data || data.length === 0) return uniqueSlug
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
  return `${baseSlug}-${Date.now()}`
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const rawBody = await req.json()
    const payload = prepareProductData(rawBody)
    if (payload.slug) {
      payload.slug = await makeUniqueSlug(payload.slug)
    }
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
  if (!isAdminRequest(req)) return unauthorized()

  try {
    const rawBody = await req.json()
    const { id, ...updates } = rawBody
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 })

    const payload = prepareProductData(updates)
    if (payload.slug) {
      payload.slug = await makeUniqueSlug(payload.slug, id)
    }
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
  if (!isAdminRequest(req)) return unauthorized()

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
