/**
 * Image helpers shared by the shop and the admin.
 *
 * Descriptions come from file names: upload `ashwagandha-powder-texture.jpg`
 * and its alt text becomes "Ashwagandha Powder – texture". Words that just
 * repeat the product name or are filler (mana, packet, img, numbers…) are
 * dropped, so old names like "MANA PISTA PACKET.png" fall back to the plain
 * product name.
 */

/** Products and variants with fewer photos than this get flagged in admin. */
export const MIN_PRODUCT_IMAGES = 3

const FILLER = new Set([
  'mana', 'packet', 'pack', 'image', 'img', 'photo', 'pic', 'picture', 'pasted', 'final', 'copy', 'new',
  'edited', 'edit', 'scaled', 'resized', 'compressed', 'whatsapp', 'screenshot', 'dsc', 'jpg', 'jpeg', 'png', 'webp',
])

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/\(|\)/g, ' ')
    .split(/[^a-z0-9ऀ-ॿ]+/)
    .filter(Boolean)
}

/** The descriptive part of an image URL's file name, or '' if there is none. */
export function imageDescriptor(url: string, productName = ''): string {
  let file = ''
  try {
    file = decodeURIComponent((url || '').split('?')[0].split('/').pop() || '')
  } catch {
    file = (url || '').split('?')[0].split('/').pop() || ''
  }
  const base = file
    .replace(/\.[a-z0-9]{2,5}$/i, '') // extension
    .replace(/^\d{10,}[-_]?/, '') // upload timestamp prefix
  // Compare singular forms so "almond" in a file name matches "Almonds".
  const stem = (w: string) => w.replace(/(es|s)$/, '')
  const nameWords = new Set(words(productName).map(stem))
  return words(base)
    .filter(w => !FILLER.has(w) && !nameWords.has(stem(w)) && !/^\d+$/.test(w) && !/^(img|dsc|pxl|wa)\d/.test(w))
    .join(' ')
    .trim()
}

/** Alt text for the Nth image of a product. */
export function imageAlt(productName: string, url: string, index = 0): string {
  const name = productName.replace(/\s+/g, ' ').trim()
  const descriptor = imageDescriptor(url, name)
  if (descriptor) return `${name} – ${descriptor}`
  return index === 0 ? name : `${name} – photo ${index + 1}`
}

type WithImages = {
  images?: string[] | null
  variants?: Array<{ name?: string; images?: string[] | null }> | null
}

/** Photo status for the admin list: how many photos, and which variants have none of their own. */
export function photoStatus(product: WithImages) {
  const count = (product.images || []).filter(Boolean).length
  const variants = product.variants || []
  const variantsWithoutPhotos = variants.length > 1
    ? variants.filter(v => !(v.images || []).filter(Boolean).length).map(v => v.name || 'Unnamed')
    : []
  return {
    count,
    needsMore: count < MIN_PRODUCT_IMAGES,
    variantsWithoutPhotos,
  }
}
