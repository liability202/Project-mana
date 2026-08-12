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

export function shippingCost(subtotalPaise: number, city?: string, state?: string, pincode?: string): number {
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD) return 0
  
  const pin = (pincode || '').trim()
  // Delhi NCR pincode prefixes: 110 (Delhi), 201 (Noida/Ghaziabad), 121 (Faridabad), 122 (Gurugram)
  if (/^(110|201|121|122)\d{3}$/.test(pin)) {
    return 3900
  }

  const c = (city || '').toLowerCase()
  const s = (state || '').toLowerCase()

  if (s.includes('delhi') || s.includes('nct') || s.includes('ncr')) {
    return 3900
  }

  const ncrKeywords = [
    'delhi', 'noida', 'ghaziabad', 'faridabad', 'gurugram', 'gurgaon',
    'gautam', 'buddha', 'budh', 'gb nagar', 'g.b. nagar', 'ncr'
  ]

  if (ncrKeywords.some(k => c.includes(k))) {
    return 3900
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

// Extract dynamic badge config from tags or direct attributes
export function extractBadgeConfig(tags?: string[] | null, rawProduct?: any) {
  let badge_x = rawProduct?.badge_x !== undefined && rawProduct?.badge_x !== null ? Number(rawProduct.badge_x) : 49
  let badge_y = rawProduct?.badge_y !== undefined && rawProduct?.badge_y !== null ? Number(rawProduct.badge_y) : 88
  let badge_scale = rawProduct?.badge_scale !== undefined && rawProduct?.badge_scale !== null
    ? Number(rawProduct.badge_scale)
    : (rawProduct?.badge_size !== undefined && rawProduct?.badge_size !== null ? Number(rawProduct.badge_size) : 0.9)

  if (tags && Array.isArray(tags)) {
    const found = tags.find(t => typeof t === 'string' && t.startsWith('badge:'))
    if (found) {
      const parts = found.split(':')
      if (parts.length >= 3) {
        badge_x = Number(parts[1]) ?? 49
        badge_y = Number(parts[2]) ?? 88
        if (parts[3] !== undefined && parts[3] !== '') badge_scale = Number(parts[3]) ?? 0.9
      }
    }
  }

  return { 
    badge_x: Number.isFinite(badge_x) ? badge_x : 49, 
    badge_y: Number.isFinite(badge_y) ? badge_y : 88, 
    badge_scale: Number.isFinite(badge_scale) ? badge_scale : 0.9 
  }
}
