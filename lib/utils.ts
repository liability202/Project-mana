import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format price from paise to ₹ string
export function formatPrice(paise: number): string {
  return '₹' + (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

// Format weight
export function formatWeight(grams: number): string {
  if (grams >= 1000) return (grams / 1000).toFixed(1) + 'kg'
  return grams + 'g'
}

// Calculate price for a given weight
export function calcPrice(basePricePaise: number, baseWeightGrams: number, targetGrams: number): number {
  return Math.round((basePricePaise / baseWeightGrams) * targetGrams)
}

// Free shipping threshold in paise
export const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 999) * 100

export function shippingCost(subtotalPaise: number): number {
  return subtotalPaise >= FREE_SHIPPING_THRESHOLD ? 0 : 6000 // ₹60 shipping
}

// Slugify
export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// WhatsApp message URL
export function whatsappUrl(message: string): string {
  const num = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}
