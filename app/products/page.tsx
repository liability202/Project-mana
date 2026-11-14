import type { Metadata } from 'next'
import { ProductCard } from '@/components/product/ProductCard'
import { getInStockCatalog, toCardProduct } from '@/lib/catalog'
import { SortSelect } from '@/components/product/SortSelect'
import { matchCatalogProducts } from '@/lib/product-search'
import type { Product } from '@/lib/supabase'

export const revalidate = 60

type Props = { searchParams: { category?: string; tag?: string; sort?: string; q?: string } }

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  'dry-fruits': {
    title: 'Buy Premium Dry Fruits Online – Almonds, Cashews, Pistachios',
    description: 'Shop premium dry fruits online — Mamra almonds, cashews, pistachios, walnuts and more. Lab tested, FSSAI certified, packed fresh to order. Free shipping above ₹999.',
  },
  herbs: {
    title: 'Buy Ayurvedic Herbs Online – Ashwagandha, Shilajit & More',
    description: 'Authentic Ayurvedic herbs online — Ashwagandha, Shilajit, Triphala, Brahmi and more. Single origin, lab tested for purity, packed fresh to order.',
  },
  spices: {
    title: 'Buy Single-Origin Spices Online – Kashmiri Saffron & More',
    description: 'Single-origin Indian spices online — Kashmiri saffron, cardamom, black pepper, cinnamon and more. Lab tested, FSSAI certified, freshly packed.',
  },
  pansari: {
    title: 'Buy Pansari Items Online – Traditional Kirana Staples',
    description: 'Traditional pansari and kirana staples online. Sourced direct, lab tested and packed fresh to order by Mana Dry Fruits.',
  },
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const meta = CATEGORY_META[searchParams?.category || '']

  // Filtered/searched listings canonicalise to the clean category (or root)
  // URL so Google doesn't index dozens of near-duplicate permutations.
  // The herbs filter's canonical page is the /ayurvedic-herbs A–Z hub.
  const canonical = searchParams?.category === 'herbs'
    ? '/ayurvedic-herbs'
    : searchParams?.category
      ? `/products?category=${searchParams.category}`
      : '/products'

  return {
    title: meta?.title || 'Shop All Products – Dry Fruits, Herbs & Spices',
    description:
      meta?.description ||
      'Browse the full Mana Dry Fruits catalogue — premium dry fruits, Ayurvedic herbs, single-origin spices and pansari staples. Lab tested, FSSAI certified, packed fresh to order.',
    alternates: { canonical },
    robots: searchParams?.q ? { index: false, follow: true } : undefined,
  }
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'dry-fruits', label: 'Dry Fruits' },
  { value: 'herbs', label: 'Herbs & Ayurveda' },
  { value: 'spices', label: 'Spices' },
  { value: 'pansari', label: 'Pansari Items' },
]

const TAGS = ['All', 'Bestseller', 'Organic', 'Premium']

// Filters and sorts the cached catalogue in memory (lib/catalog.ts): this page
// is rendered per request because it reads ?category=/?sort=, and querying the
// database each time made every shop visit wait on a round trip.
async function getProducts(params: Props['searchParams']): Promise<Product[]> {
  let products = await getInStockCatalog().catch(() => [] as Product[])
  if (params.category) products = products.filter(p => p.category === params.category)
  if (params.tag && params.tag !== 'All') {
    const tag = params.tag.toLowerCase()
    products = products.filter(p => p.tags?.includes(tag))
  }
  if (params.sort === 'price-asc') products = [...products].sort((a, b) => a.price - b.price)
  else if (params.sort === 'price-desc') products = [...products].sort((a, b) => b.price - a.price)
  // (default order — newest first — is the catalogue's own order)
  if (params.q) return matchCatalogProducts(products, params.q, 48).map(match => match.product)
  return products
}

export default async function ProductsPage({ searchParams }: Props) {
  const products = await getProducts(searchParams)
  const activeCategory = searchParams.category || ''
  const activeTag = searchParams.tag || 'All'
  const catTitle = CATEGORIES.find(c => c.value === activeCategory)?.label || 'All Products'

  return (
    <>
      {/* Hero */}
      <div className="bg-green px-[5%] py-12 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] text-ivory font-light">
            {catTitle.split(' ')[0]}{' '}
            <em className="not-italic text-green-4">{catTitle.split(' ').slice(1).join(' ')}</em>
          </h1>
          <p className="text-[.88rem] text-green-4 mt-2">{products.length} products</p>
        </div>
        {/* ← extracted to client component */}
        <SortSelect defaultValue={searchParams.sort || ''} />
      </div>

      {/* Filters */}
      <div className="bg-ivory-2 px-[5%] py-3.5 flex gap-2.5 items-center flex-wrap border-b border-ivory-3">
        <span className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mr-1">Category:</span>
        {CATEGORIES.map(cat => (
          <a
            key={cat.value}
            href={cat.value ? `/products?category=${cat.value}` : '/products'}
            className={`px-4 py-1.5 rounded-full text-[.68rem] border transition-all no-underline ${
              activeCategory === cat.value
                ? 'bg-green text-ivory border-green'
                : 'bg-transparent text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'
            }`}
          >
            {cat.label}
          </a>
        ))}
        <span className="text-ink-4 mx-1">|</span>
        <span className="text-[.62rem] tracking-[.2em] uppercase text-ink-4 mr-1">Filter:</span>
        {TAGS.map(tag => (
          <a
            key={tag}
            href={`/products?${activeCategory ? `category=${activeCategory}&` : ''}tag=${tag}`}
            className={`px-4 py-1.5 rounded-full text-[.68rem] border transition-all no-underline ${
              activeTag === tag
                ? 'bg-green text-ivory border-green'
                : 'bg-transparent text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'
            }`}
          >
            {tag}
          </a>
        ))}
      </div>

      {/* Grid */}
      <div className="px-[5%] py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-ink-3 text-base">No products found</p>
            <a href="/products" className="btn-outline mt-4 inline-flex no-underline text-sm py-2 px-5">
              View All Products
            </a>np
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={toCardProduct(p)} />)}
          </div>
        )}
      </div>
    </>
  )
}
