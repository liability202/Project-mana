import type { Metadata } from 'next'
import type { Product } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'
import { getInStockCatalog, toCardProduct } from '@/lib/catalog'
import { getHerbContent } from '@/lib/herb-content'
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo'

// The herb hub: one crawlable page that lists every herb under all the names
// people search for, and links to each herb page. It is the canonical page
// for the herbs category (/products?category=herbs points here).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ayurvedic Herbs A–Z – Buy Jadi Booti & Herbal Powders Online',
  description: 'Buy Ayurvedic herbs and jadi booti online — Ashwagandha, Shatavari, Brahmi, Triphala, Moringa, Arjun Chal, Mulethi and more. A–Z with Hindi names. Lab tested, packed fresh.',
  alternates: { canonical: '/ayurvedic-herbs' },
}

function cleanName(name: string) {
  return name.replace(/\s+/g, ' ').trim()
}

async function getHerbs(): Promise<Product[]> {
  const data = (await getInStockCatalog().catch(() => [] as Product[])).filter(p => p.category === 'herbs')
  const seen = new Set<string>()
  return data
    // Drop accidental duplicates (same name listed twice).
    .filter(p => {
      const key = cleanName(p.name).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => cleanName(a.name).localeCompare(cleanName(b.name)))
}

export default async function AyurvedicHerbsPage() {
  const herbs = await getHerbs()

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ayurvedic herbs',
    itemListElement: herbs.map((h, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/products/${h.slug}`,
      name: cleanName(h.name),
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Ayurvedic herbs', path: '/ayurvedic-herbs' },
          ])),
        }}
      />

      <div className="bg-green px-[5%] py-12">
        <div className="text-[.62rem] tracking-[.2em] uppercase text-green-4 mb-2">Jadi booti · Herbal powders</div>
        <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] text-ivory font-light">
          Ayurvedic <em className="not-italic text-green-4">Herbs A–Z</em>
        </h1>
        <p className="text-[.9rem] text-green-4 mt-3 max-w-[720px] leading-[1.8]">
          Traditional Ayurvedic herbs and jadi booti — whole and powdered — listed with their Hindi and English names.
          Every batch is lab tested and packed fresh to order. {herbs.length} herbs.
        </p>
      </div>

      {/* All herbs, A–Z. The line under each card carries the Hindi and
          botanical names, so this page matches those searches too. */}
      <div className="px-[5%] py-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {herbs.map(p => {
            const guide = getHerbContent(p.slug)
            return (
              <div key={p.id} className="flex flex-col">
                <ProductCard product={toCardProduct(p)} />
                {guide && (
                  <p className="mt-1.5 px-1 text-[.68rem] text-ink-4 leading-snug">
                    {guide.hindi} · <span className="italic">{guide.botanical}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
