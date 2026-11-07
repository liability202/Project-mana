import { supabase, supabaseAdmin, type Product } from '@/lib/supabase'
import { parseBaseWeightGrams } from '@/lib/utils'
import { basePrice, displayName } from './shared'

/**
 * Real catalogue data for the design prototypes. Everything shown on a
 * prototype comes from the live products and reviews tables — no invented
 * products, prices, counts or testimonials.
 */

export type CatalogProduct = Product

export type PublicReview = {
  id: string
  customer_name: string
  rating: number
  title: string | null
  body: string
  product_slug: string
  product_name: string | null
}

const TAG_LABELS: Record<string, string> = {
  bestseller: 'Bestseller',
  premium: 'Premium',
  organic: 'Organic',
  handpicked: 'Handpicked',
  superfood: 'Superfood',
  'hair care': 'Hair care',
  'hair-care': 'Hair care',
  'heart care': 'Heart care',
  'protien rich': 'Protein rich',
  'protein rich': 'Protein rich',
  'soft-shell': 'Soft shell',
  'new-crop': 'New crop',
  'fiber-rich': 'Fibre rich',
  soft: 'Soft & juicy',
  blend: 'Blend',
}

/** Short, human tags for a product card (drops layout tags like badge:x:y). */
export function productLabels(product: Product, max = 2) {
  const labels = (product.tags || [])
    .map(tag => TAG_LABELS[String(tag).trim().toLowerCase()])
    .filter((label): label is string => Boolean(label))
  return Array.from(new Set(labels)).slice(0, max)
}

const HIGHLIGHTS = new Set(['Bestseller', 'New crop', 'Superfood', 'Premium'])

/** One eye-catching badge for the image, plus one quieter tag for the text. */
export function cardLabels(product: Product) {
  const labels = productLabels(product, 4)
  return {
    badge: labels.find(label => HIGHLIGHTS.has(label)),
    tag: labels.find(label => !HIGHLIGHTS.has(label)),
  }
}

/** Client components only need what a card shows; drop the long description. */
export function lean(product: Product): Product {
  return { ...product, description: '' }
}

/** What goes into a kit's first (smallest) option, from the kit's own recipe. */
export function kitContents(kit: Product) {
  const variant = (kit.variants || [])[0] as { grams_each?: number; items?: { name?: string; grams?: number }[] } | undefined
  return (variant?.items || [])
    .filter(item => item?.name)
    .map(item => ({ name: displayName(String(item.name)), grams: Number(item.grams) || Number(variant?.grams_each) || 0 }))
}

/** "Pumpkin Seeds, Sunflower Seeds & 3 more" — a one-line summary of a kit's contents. */
export function kitInsideLine(kit: Product, show = 2) {
  const names = kitContents(kit).map(item => item.name.replace(/\s*\([^)]*\)/g, '').trim())
  if (!names.length) return ''
  const rest = names.length - show
  return rest > 0 ? `${names.slice(0, show).join(', ')} & ${rest} more` : names.join(', ').replace(/, ([^,]*)$/, ' & $1')
}

/** Kit benefit lines live in tags as full sentences. */
export function kitBenefits(product: Product, max = 3) {
  return (product.tags || [])
    .filter(tag => String(tag).length > 24)
    .slice(0, max)
}

export { displayName, productHref } from './shared'

/** Price shown on cards: the default (in-stock) option at the product's base pack size. */
export function cardPrice(product: Product) {
  const unit = String(product.price_per_unit || '').replace(/^per\s+/i, '').trim()
  return { price: basePrice(product), unit, grams: parseBaseWeightGrams(product.price_per_unit) }
}

/** Lowest price across a product's options (kits come in sizes). */
export function fromPrice(product: Product) {
  const prices = (product.variants || []).map(variant => Number(variant?.price) || 0).filter(price => price > 0)
  return prices.length ? Math.min(...prices) : product.price
}

export async function getCatalog() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(200)
  const all = (data || []) as Product[]

  const matches = (product: Product, keyword: string) =>
    `${product.name} ${product.slug}`.toLowerCase().includes(keyword.toLowerCase())

  /** First product matching each keyword, in order, without repeats (photographed products only). */
  const pick = (keywords: string[], pool: Product[] = all.filter(product => product.images?.[0])) => {
    const chosen: Product[] = []
    for (const keyword of keywords) {
      const found = pool.find(product => matches(product, keyword) && !chosen.includes(product))
      if (found) chosen.push(found)
    }
    return chosen
  }

  const fill = (list: Product[], pool: Product[], count: number) => {
    const result = [...list]
    for (const product of pool) {
      if (result.length >= count) break
      if (!result.includes(product)) result.push(product)
    }
    return result.slice(0, count)
  }

  const kits = all.filter(product => product.category === 'kits')
  const dryFruits = all.filter(product => product.category === 'dry-fruits')
  const herbs = all.filter(product => product.category === 'herbs')
  const spices = all.filter(product => product.category === 'spices')
  const nonKits = all.filter(product => product.category !== 'kits')

  const bestsellers = fill(
    pick(['cashew', 'walnut kernel', 'makhana', 'dates', 'anjeer', 'blue berry', 'chia', 'moringa', 'cardamom']),
    nonKits.filter(product => (product.tags || []).includes('bestseller')),
    8
  )

  const underTwoHundred = nonKits
    .filter(product => cardPrice(product).price < 20000)
    .sort((a, b) => cardPrice(a).price - cardPrice(b).price)
    .slice(0, 8)

  return {
    all,
    count: all.length,
    kits,
    dryFruits,
    herbs,
    spices,
    bestsellers,
    underTwoHundred,
    pick,
  }
}

export async function getPublicReviews(products: Product[], limit = 9): Promise<PublicReview[]> {
  // Explicit columns only: reviews are public, phone numbers are not.
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('id, customer_name, rating, title, body, product_slug')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  const names = new Map(products.map(product => [product.slug, displayName(product.name)]))
  return data.map(review => ({
    ...review,
    title: review.title ? calmCase(review.title) : null,
    body: calmCase(review.body || ''),
    product_name: names.get(review.product_slug) || null,
  })) as PublicReview[]
}

/** Reviews typed in ALL CAPS read as shouting; show them in sentence case (same words). */
function calmCase(text: string) {
  const letters = text.replace(/[^A-Za-z]/g, '')
  const upper = letters.replace(/[^A-Z]/g, '').length
  if (letters.length < 12 || upper / letters.length < 0.8) return text
  return text
    .toLowerCase()
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, start, letter) => start + letter.toUpperCase())
    .replace(/\bi\b/g, 'I')
}

/** "priya SHARMA" → "Priya S." */
export function reviewerName(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Verified buyer'
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase()
  return [first, ...parts.slice(1).map(part => `${part[0].toUpperCase()}.`)].join(' ')
}

export const BRAND = {
  logo: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/MORTAR%20LOGO.png',
  hero: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/hero%20banner.png',
  categories: {
    'dry-fruits': 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/ChatGPT%20Image%20Aug%208,%202026,%2001_17_56%20PM%20copy.png',
    herbs: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/herbs%20category.png',
    spices: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/Spices%20category.png',
    pansari: 'https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/Pansari%20category.png',
  } as Record<string, string>,
}

/** True promises only — each of these is how the store actually works today. */
export const PROMISES = {
  freeShipping: 'Free delivery above ₹999',
  cod: 'Cash on delivery',
  cashback: '5% cashback on every order',
  fresh: 'Packed fresh to order',
  whatsapp: 'Order on WhatsApp',
}
