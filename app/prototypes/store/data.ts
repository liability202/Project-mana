import type { Product } from '@/lib/supabase'
import { displayName, localName } from '../_lib/shared'

/**
 * Pure helpers for the simple store prototype, shared by the server page and
 * the client parts (no server-only imports in here).
 */

export type ShelfKey = 'dry-fruits' | 'seeds' | 'herbs' | 'spices' | 'kits'

/** A catalogue product plus the tidy labels a store card shows. */
export type StoreProduct = Product & {
  title: string
  sub: string
  shelf: ShelfKey
  badge: string | null
}

export type StoreVariant = {
  id: string
  name: string
  price: number
  in_stock?: boolean
  grams_each?: number
  items?: { grams?: number }[]
}

export const SHELVES: { key: ShelfKey; label: string; blurb: string }[] = [
  { key: 'dry-fruits', label: 'Dry fruits', blurb: 'Almonds, cashews, dates & more' },
  { key: 'seeds', label: 'Seeds & mixes', blurb: 'Chia, flax, pumpkin & more' },
  { key: 'herbs', label: 'Herbs & powders', blurb: 'Ashwagandha, moringa & more' },
  { key: 'spices', label: 'Whole spices', blurb: 'Cardamom, clove, pepper & more' },
  { key: 'kits', label: 'Kits & combos', blurb: 'Ready-made packs' },
]

const SEED_WORDS = /seed|mix|muesli|protien|protein|booster/i

/** The store keeps seeds and breakfast mixes on their own shelf; the database files them under dry fruits. */
export function shelfOf(product: Product): ShelfKey {
  if (product.category === 'kits') return 'kits'
  if (product.category === 'herbs') return 'herbs'
  if (product.category === 'spices') return 'spices'
  return SEED_WORDS.test(product.name) ? 'seeds' : 'dry-fruits'
}

/** Shelf order: everyday staples first. Anything not listed follows, and products without a photo go last. */
const ORDER: Record<ShelfKey, string[]> = {
  'dry-fruits': ['almond', 'cashew', 'pista', 'walnut kernel', 'makhana', 'dates (', 'anjeer', 'raisin', 'munnaka', 'walnuts(', 'blue berry', 'craneberry', 'medjool', 'black current'],
  seeds: ['chia', 'flex', 'pumpkin', 'sunflower', 'sabja', 'muskmelon', 'seeds n nuts', 'muesli', 'protien beans', 'booster'],
  herbs: ['ashwagandha', 'moringa', 'triphala', 'amla', 'satavari', 'bhrami', 'safed musli', 'mulethi', 'gond katira', 'arjun', 'reetha', 'shikakai', 'rosemary', 'hibiscus (gudhal) powder', 'hibiscus (gudhal) flower', 'indigo', 'neem', 'rose petals'],
  spices: ['cardamom', 'clove', 'black pepper', 'javitri', 'star', 'pepali'],
  kits: ['super seeds', 'cool summer', 'hair care', 'sugar', 'gym'],
}

function rank(product: Product) {
  const name = String(product.name || '').toLowerCase().replace(/\s+/g, ' ')
  const index = ORDER[shelfOf(product)].findIndex(keyword => name.includes(keyword))
  const unphotographed = product.images?.[0] ? 0 : 1000
  return unphotographed + (index < 0 ? 500 : index)
}

export function sortShelf<T extends Product>(products: T[]): T[] {
  return [...products].sort((a, b) => rank(a) - rank(b))
}

/** Display-only spelling fixes (the admin should fix the names too, so the cart matches). */
const SPELLING: [RegExp, string][] = [
  [/protien/gi, 'Protein'],
  [/craneberry/gi, 'Cranberry'],
  [/\bflex\b/gi, 'Flax'],
  [/black current/gi, 'Black Currant'],
  [/star anais/gi, 'Star Anise'],
  [/\bpepali\b/gi, 'Pippali'],
  [/\bbhrami\b/gi, 'Brahmi'],
  [/\bsatavari\b/gi, 'Shatavari'],
  [/blue berry/gi, 'Blueberry'],
  [/managment/gi, 'Management'],
  [/seeds n nuts/gi, 'Seeds & Nuts'],
  [/munnaka/gi, 'Munakka'],
]

/** Where the catalogue name doesn't say enough on a small card. */
const OVERRIDES: { match: RegExp; title?: string; local?: string }[] = [
  { match: /^walnuts\s*\(/i, title: 'Walnuts in Shell', local: 'Kagzi Akhrot' },
  { match: /^clove/i, local: 'Laung' },
  { match: /^makhana/i, local: 'Fox Nuts' },
]

const SMALL_WORDS = new Set(['and', 'of', 'in', 'the'])

function titleCase(text: string) {
  return text
    .split(' ')
    .filter(Boolean)
    .map((word, index) => (index > 0 && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

/** "Almonds (Badaam)" → { title: "Almonds", local: "Badaam" }; "Clove/ Long" → { title: "Clove", local: "Laung" }. */
export function storeName(rawName: string) {
  let name = displayName(rawName)
  for (const [pattern, fix] of SPELLING) name = name.replace(pattern, fix)
  const override = OVERRIDES.find(entry => entry.match.test(String(rawName || '').trim()))
  const plain = name.replace(/\s*\([^)]*\)\s*/g, ' ').split(' / ')[0].replace(/\s+/g, ' ').trim()
  return {
    title: override?.title || titleCase(plain),
    local: override?.local ?? titleCase(localName(name)),
  }
}

/** The quiet second line on a card: the everyday Hindi name, or how powders are made. */
export function subLine(product: Product, local: string) {
  if (local) return local
  if (/powder/i.test(product.name)) return 'Ground to order'
  return ''
}

export function badgeFor(product: Product) {
  const tags = (product.tags || []).map(tag => String(tag).trim().toLowerCase())
  if (tags.includes('bestseller')) return 'Bestseller'
  if (tags.includes('new-crop')) return 'New crop'
  return null
}

export function inStockVariants(product: Product): StoreVariant[] {
  return ((product.variants || []) as StoreVariant[]).filter(variant => variant && variant.id && variant.in_stock !== false)
}

const TYPE_FIXES: Record<string, string> = {
  chillian: 'Chilean',
  'jumbo chillian': 'Jumbo Chilean',
  ajwa: 'Ajwa',
  medjoul: 'Medjool',
  regular: 'Regular',
  'mamra afgani': 'Mamra Afghani',
}

/** Option names as typed in the admin ("Chillian", "AJWA") tidied for display. */
export function typeLabel(name: string) {
  const clean = String(name || '').trim()
  return TYPE_FIXES[clean.toLowerCase()] || clean.charAt(0).toUpperCase() + clean.slice(1)
}

/** A kit's shipping weight, worked out the same way the checkout does. */
export function kitGrams(variant: StoreVariant | null) {
  const total = (variant?.items || []).reduce((sum, item) => sum + (Number(item?.grams) || Number(variant?.grams_each) || 100), 0)
  return total || 1000
}

/** Every answer below matches the store's FAQ page and how checkout actually charges. */
export const FAQS: { q: string; a: string }[] = [
  {
    q: 'How long does delivery take?',
    a: 'Usually 2–3 days within Delhi-NCR and 5–7 days across India, depending on your pincode. We send your tracking link on WhatsApp as soon as the order ships.',
  },
  {
    q: 'When is delivery free?',
    a: 'Delivery is free on orders above ₹999. Below that it is ₹39 within Delhi-NCR and ₹59 elsewhere, and orders under ₹500 have a ₹19 handling fee.',
  },
  {
    q: 'Can I pay cash on delivery?',
    a: 'Yes, cash on delivery is available across India, with a small COD fee shown at checkout. You can also pay by UPI, card or net banking through Razorpay.',
  },
  {
    q: 'How fresh is it?',
    a: 'We pack to order. Powders and churnas are ground after you order, which can add 24–48 hours before dispatch, and we never add preservatives.',
  },
  {
    q: 'What if something arrives damaged?',
    a: 'WhatsApp us a clear photo within 24 hours of delivery and we will help with the next steps. Food can be returned if the wrong item was sent or it arrived damaged.',
  },
  {
    q: 'How does the 5% cashback work?',
    a: '5% of your order value is added to your Mana wallet after delivery, usually within 48 hours. Use it on your next order; it stays valid for 6 months.',
  },
]
