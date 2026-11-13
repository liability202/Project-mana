import type { Product } from '@/lib/supabase'
import { shippingCost } from '@/lib/utils'

// Vercel serves the site on www (the bare domain redirects there), so every
// canonical, sitemap and schema URL must use www too, or Google sees each page
// pointing at an address that redirects away.
export const SITE_URL = 'https://www.manadryfruits.com'
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
  /** Other names the product is known by (Hindi, regional, botanical). */
  alternateName?: string[]
}

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

function priceInRupees(priceInPaise: number) {
  const value = Number.isFinite(priceInPaise) && priceInPaise > 0 ? priceInPaise / 100 : 0
  return value.toFixed(2)
}

export function productJsonLd({ product, path, price, images, aggregateRating, alternateName }: ProductSchemaInput) {
  const productImages = (images?.length ? images : product.images || []).filter(Boolean).map(absoluteUrl)
  const url = absoluteUrl(path)
  const offerPrice = typeof price === 'number' ? price : product.price

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(alternateName?.length ? { alternateName } : {}),
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
        '@type': ['Organization', 'OnlineStore', 'Store'],
        name: BRAND_NAME,
        url: SITE_URL,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          // Same rule as checkout: free above the threshold, otherwise the
          // standard (non-NCR) rate. NCR is cheaper, so this never understates.
          value: priceInRupees(shippingCost(offerPrice)),
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
        },
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

export function faqJsonLd(faqs: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
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
