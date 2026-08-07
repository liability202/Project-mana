import type { Product } from '@/lib/supabase'

export const SITE_URL = 'https://manadryfruits.com'
export const BRAND_NAME = 'Mana Dry Fruits'

type ProductSchemaInput = {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'category' | 'price' | 'images' | 'tags' | 'in_stock' | 'vendor'>
  path: string
  price?: number
  images?: string[]
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  } | null
}

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

function priceInRupees(priceInPaise: number) {
  const value = Number.isFinite(priceInPaise) && priceInPaise > 0 ? priceInPaise / 100 : 0
  return value.toFixed(2)
}

export function productJsonLd({ product, path, price, images, aggregateRating }: ProductSchemaInput) {
  const productImages = (images?.length ? images : product.images || []).filter(Boolean).map(absoluteUrl)
  const url = absoluteUrl(path)
  const offerPrice = typeof price === 'number' ? price : product.price

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: productImages,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    sku: product.id,
    mpn: product.slug,
    category: product.category,
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: priceInRupees(offerPrice),
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
    },
    ...(aggregateRating && aggregateRating.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toFixed(1),
        reviewCount: aggregateRating.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
    ...(product.tags?.includes('organic') ? {
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Organic', value: 'Yes' },
      ],
    } : {}),
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
