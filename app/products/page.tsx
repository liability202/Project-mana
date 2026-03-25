import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'
import { SortSelect } from '@/components/product/SortSelect'
import type { Product } from '@/lib/supabase'

export const revalidate = 60

type Props = { searchParams: { category?: string; tag?: string; sort?: string; q?: string } }

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'dry-fruits', label: 'Dry Fruits' },
  { value: 'herbs', label: 'Herbs & Ayurveda' },
  { value: 'spices', label: 'Spices' },
  { value: 'pansari', label: 'Pansari Items' },
]

const TAGS = ['All', 'Bestseller', 'Organic', 'Premium']

async function getProducts(params: Props['searchParams']): Promise<Product[]> {
  let query = supabase.from('products').select('*').eq('in_stock', true)
  if (params.category) query = query.eq('category', params.category)
  if (params.tag && params.tag !== 'All') query = query.contains('tags', [params.tag.toLowerCase()])
  if (params.q) query = query.ilike('name', `%${params.q}%`)
  if (params.sort === 'price-asc') query = query.order('price', { ascending: true })
  else if (params.sort === 'price-desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })
  const { data } = await query.limit(24)
  return data || []
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
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  )
}
