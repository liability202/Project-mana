import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { BRAND_NAME, SITE_URL } from '@/lib/seo'

// See app/products/[slug]/layout.tsx — same reason: the kit page is a client
// component and needs a server layout to emit per-kit metadata.
export const revalidate = 3600

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: kit } = await supabase
    .from('products')
    .select('name, description, images')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!kit) {
    return {
      title: 'Kit Not Found',
      alternates: { canonical: `/kits/${params.slug}` },
    }
  }

  const title = `${kit.name} – Curated Wellness Kit`
  const description = (kit.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155)
    || `Shop the ${kit.name} from ${BRAND_NAME}. A curated kit of lab-tested dry fruits, herbs and spices, packed fresh to order.`

  const image = kit.images?.[0]

  return {
    title,
    description,
    alternates: { canonical: `/kits/${params.slug}` },
    openGraph: {
      type: 'website',
      title: `${kit.name} | ${BRAND_NAME}`,
      description,
      url: `${SITE_URL}/kits/${params.slug}`,
      siteName: BRAND_NAME,
      ...(image ? { images: [{ url: image, alt: kit.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${kit.name} | ${BRAND_NAME}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function KitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
