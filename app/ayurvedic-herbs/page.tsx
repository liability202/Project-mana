import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'
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
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category', 'herbs')
    .eq('in_stock', true)
    .limit(500)
  const seen = new Set<string>()
  return (data || [])
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

  const groups = new Map<string, Product[]>()
  for (const herb of herbs) {
    const letter = cleanName(herb.name)[0]?.toUpperCase() || '#'
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(herb)
  }

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

      {/* A–Z index: every herb with the names people search by */}
      <nav aria-label="Herbs A to Z" className="px-[5%] py-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
          {Array.from(groups.entries()).map(([letter, list]) => (
            <div key={letter}>
              <div className="font-serif text-2xl text-green mb-2">{letter}</div>
              <ul className="space-y-2">
                {list.map(h => {
                  const guide = getHerbContent(h.slug)
                  return (
                    <li key={h.id}>
                      <Link href={`/products/${h.slug}`} className="text-[.92rem] text-ink hover:text-green no-underline">
                        {cleanName(h.name)}
                      </Link>
                      {guide && (
                        <div className="text-[.72rem] text-ink-4 leading-snug">
                          {guide.hindi} · <span className="italic">{guide.botanical}</span> · {guide.aka.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="px-[5%] pb-12 max-w-[1400px] mx-auto">
        <h2 className="font-serif text-2xl text-ink font-light mb-4">Shop all herbs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {herbs.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </>
  )
}
