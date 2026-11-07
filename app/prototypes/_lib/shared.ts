import type { Product } from '@/lib/supabase'
import { calcPrice, parseBaseWeightGrams } from '@/lib/utils'

/**
 * Pure helpers shared by the server pages and the client buttons of the
 * design prototypes (no server-only imports in here).
 */

type ProductVariant = { id: string; name: string; price: number; in_stock?: boolean }

/** The option a quick "Add" puts in the cart: the first one that is in stock. */
export function defaultVariant(product: Product): ProductVariant | null {
  const variants = (product.variants || []) as ProductVariant[]
  return variants.find(variant => variant && variant.in_stock !== false) || null
}

/** Products whose every option is sold out must be opened, not quick-added. */
export function canQuickAdd(product: Product) {
  return !(product.variants || []).length || Boolean(defaultVariant(product))
}

/** Price of the default option at the product's base pack size. */
export function basePrice(product: Product) {
  return defaultVariant(product)?.price || product.price
}

export function baseGrams(product: Product) {
  return parseBaseWeightGrams(product.price_per_unit)
}

export function priceAt(product: Product, grams: number) {
  return calcPrice(basePrice(product), baseGrams(product), grams)
}

/** Three pack sizes around the base size, matching the product page's options. */
export function weightChoices(product: Product) {
  const options = product.category === 'herbs' || product.category === 'spices' ? [100, 200, 500, 1000] : [100, 250, 500, 1000]
  const base = baseGrams(product)
  if (!options.includes(base)) return [base]
  const start = Math.max(0, Math.min(options.indexOf(base), options.length - 3))
  return options.slice(start, start + 3)
}

export function productHref(product: Product) {
  return product.category === 'kits' ? `/kits/${product.slug}` : `/products/${product.slug}`
}

export function gramsLabel(grams: number) {
  return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`
}

/** Tidy names typed in different styles ("SUPER SEEDS COMBO PACK", "walnut kernels", "Dates ( Khajoor)"). */
export function displayName(name: string) {
  const clean = String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/(\S)\(/g, '$1 (')
    .trim()
  const lettersOnly = clean.replace(/[^A-Za-z]/g, '')
  const shouty = lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()
  const quiet = lettersOnly === lettersOnly.toLowerCase()
  if (!shouty && !quiet) return clean.charAt(0).toUpperCase() + clean.slice(1)
  return clean.toLowerCase().replace(/(^|[\s(\/-])([a-z])/g, (_m, start, letter) => start + letter.toUpperCase())
}
