'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/supabase'

const POPULAR = ['Mamra Almonds', 'Ashwagandha', 'Cashews', 'Saffron', 'Dates', 'Walnuts', 'Pistachios', 'Triphala']

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('in_stock', true)
        .limit(8)
      setResults(data || [])
      setLoading(false)
    }, 260)
  }, [query])

  const highlight = (text: string) => {
    if (!query) return text
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(re, '<mark class="bg-green-6 text-green not-italic rounded-sm px-0.5">$1</mark>')
  }

  return (
    <div className="fixed inset-0 z-[900]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute top-0 left-0 right-0 bg-ivory border-b border-ivory-3 shadow-[0_12px_48px_rgba(26,18,8,0.12)]">
        {/* Search input */}
        <div className="flex items-center gap-4 px-[5%] py-4 border-b border-ivory-3">
          <div className="flex-1 flex items-center gap-3 bg-white border border-ivory-3 rounded-lg px-4 py-2.5 focus-within:border-green-3 transition-colors">
            <Search size={18} className="text-ink-4 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && query) window.location.href = `/search?q=${encodeURIComponent(query)}` }}
              placeholder="Search dry fruits, herbs, spices, kits…"
              className="flex-1 border-none outline-none font-sans text-base text-ink bg-transparent placeholder:text-ink-4"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-0.5 bg-transparent border-none cursor-pointer text-ink-4 hover:text-ink-2">
                <X size={16} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-sm text-ink-3 bg-transparent border-none cursor-pointer hover:text-green whitespace-nowrap">
            Close ✕
          </button>
        </div>

        <div className="px-[5%] py-4 max-h-[65vh] overflow-y-auto">
          {!query && (
            <div>
              <div className="text-[.6rem] tracking-[.28em] uppercase text-ink-4 mb-3">Popular searches</div>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(p => (
                  <button
                    key={p}
                    onClick={() => setQuery(p)}
                    className="px-3.5 py-1.5 rounded-full text-sm border border-ivory-3 bg-white text-ink-3 cursor-pointer hover:border-green-4 hover:text-green hover:bg-green-6 transition-all font-sans"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && loading && (
            <div className="text-sm text-ink-3 py-4">Searching…</div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-ink-3">No results for <strong>"{query}"</strong></p>
              <p className="text-xs text-ink-4 mt-1">Try almonds, ashwagandha, cashews or spices</p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="text-[.6rem] tracking-[.28em] uppercase text-ink-4 mb-3">
                {results.length} result{results.length > 1 ? 's' : ''} for "{query}"
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {results.map(product => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="bg-white border border-ivory-3 rounded-mana overflow-hidden hover:border-green-5 hover:shadow-soft transition-all no-underline group"
                  >
                    <div className="aspect-square overflow-hidden bg-ivory-2">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} width={200} height={200} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-ivory-2" />
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="text-[.55rem] uppercase tracking-wide text-green-3 mb-0.5 font-medium">{product.category}</div>
                      <div
                        className="text-sm text-ink leading-tight mb-1 font-serif"
                        dangerouslySetInnerHTML={{ __html: highlight(product.name) }}
                      />
                      <div className="font-serif text-base text-green">{formatPrice(product.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
