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

export function parseBaseWeightGrams(label?: string | null, fallbackGrams = 500): number {
  const match = String(label || '').toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|g|gm|gram|grams)\b/)
  if (!match) return fallbackGrams

  const value = Number(match[1])
  if (!Number.isFinite(value) || value <= 0) return fallbackGrams

  return match[2].startsWith('kg') || match[2].startsWith('kilo')
    ? Math.round(value * 1000)
    : Math.round(value)
}

// Calculate price for a given weight
export function calcPrice(basePricePaise: number, baseWeightGrams: number, targetGrams: number): number {
  return Math.round((basePricePaise / baseWeightGrams) * targetGrams)
}

export function calcPriceForWeight(basePricePaise: number, pricePerUnit: string | null | undefined, targetGrams: number): number {
  return calcPrice(basePricePaise, parseBaseWeightGrams(pricePerUnit), targetGrams)
}

// Free shipping threshold in paise
export const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 999) * 100

export function shippingCost(subtotalPaise: number, city?: string): number {
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD) return 0
  
  if (city) {
    const c = city.toLowerCase()
    if (c.includes('delhi') || c.includes('noida') || c.includes('ghaziabad') || c.includes('faridabad') || c.includes('gurugram') || c.includes('gurgaon')) {
      return 3900
    }
  }
  
  return 5900
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
