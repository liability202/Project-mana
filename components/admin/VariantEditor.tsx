'use client'

import { useState } from 'react'

export type AdminVariant = {
  id: string
  name: string
  description?: string
  price: number          // stored in paise (integer)
  quality_tag?: 'best' | 'popular' | 'basic' | ''
  images?: string[]
  in_stock?: boolean     // undefined / true = in stock, false = OOS
}

const QUALITY_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'popular', label: 'Most Selling' },
  { value: 'best', label: 'Best Quality' },
  { value: 'basic', label: 'Basic' },
]

function genId() {
  return `v${Date.now().toString(36)}`
}

interface Props {
  value: AdminVariant[]
  onChange: (variants: AdminVariant[]) => void
}

export function VariantEditor({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(value[0]?.id ?? null)

  const update = (id: string, patch: Partial<AdminVariant>) => {
    onChange(value.map(v => v.id === id ? { ...v, ...patch } : v))
  }

  const remove = (id: string) => {
    const next = value.filter(v => v.id !== id)
    onChange(next)
    if (expanded === id) setExpanded(next[0]?.id ?? null)
  }

  const add = () => {
    const newVar: AdminVariant = {
      id: genId(),
      name: 'New Variant',
      description: '',
      price: 0,
      quality_tag: '',
      images: [],
      in_stock: true,
    }
    onChange([...value, newVar])
    setExpanded(newVar.id)
  }

  const priceToRupees = (paise: number) => (paise / 100).toFixed(0)
  const rupeesToPaise = (s: string) => Math.round(Number(s || '0') * 100)

  return (
    <div className="space-y-2">
      {value.map((v) => {
        const isOOS = v.in_stock === false
        const isOpen = expanded === v.id
        return (
          <div
            key={v.id}
            className={`border rounded-xl overflow-hidden transition-all ${isOOS ? 'border-ink-4/40 bg-ivory-2' : 'border-ivory-3 bg-white'}`}
          >
            {/* Header / collapsed row */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() => setExpanded(isOpen ? null : v.id)}
            >
              <span className="text-ink-4 text-sm leading-none">☰</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isOOS ? 'text-ink-3 line-through' : 'text-ink'}`}>
                  {v.name || 'Untitled'}
                </div>
                <div className="text-xs text-ink-4">
                  ₹{priceToRupees(v.price)}
                  {isOOS && (
                    <span className="ml-2 text-[.6rem] font-semibold uppercase tracking-wider text-terra bg-terra/10 px-1.5 py-0.5 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Quick-toggle stock pill */}
              <button
                type="button"
                title={isOOS ? 'Mark In Stock' : 'Mark Out of Stock'}
                onClick={e => { e.stopPropagation(); update(v.id, { in_stock: !isOOS }) }}
                className={`flex-shrink-0 text-[.6rem] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isOOS
                    ? 'bg-terra/10 border-terra/30 text-terra hover:bg-terra/20'
                    : 'bg-green-6 border-green-4 text-green hover:bg-green-5'
                }`}
              >
                {isOOS ? 'OOS' : 'In Stock'}
              </button>

              <span className={`text-ink-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </div>

            {/* Expanded fields */}
            {isOpen && (
              <div className="border-t border-ivory-3 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-3 block mb-1">Name</label>
                  <input
                    value={v.name}
                    onChange={e => update(v.id, { name: e.target.value })}
                    className="input text-sm"
                    placeholder="e.g. Chillian, Kashmiri"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1">Price (₹)</label>
                  <input
                    value={priceToRupees(v.price)}
                    onChange={e => update(v.id, { price: rupeesToPaise(e.target.value) })}
                    className="input text-sm"
                    inputMode="decimal"
                    placeholder="485"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1">Description</label>
                  <input
                    value={v.description ?? ''}
                    onChange={e => update(v.id, { description: e.target.value })}
                    className="input text-sm"
                    placeholder="Naturally sweet, oil-rich, bright color"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-3 block mb-1">Quality Tag</label>
                  <select
                    value={v.quality_tag ?? ''}
                    onChange={e => update(v.id, { quality_tag: e.target.value as AdminVariant['quality_tag'] })}
                    className="input text-sm"
                  >
                    {QUALITY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-ink-3 block mb-1">Stock Status</label>
                    <select
                      value={isOOS ? 'oos' : 'in'}
                      onChange={e => update(v.id, { in_stock: e.target.value === 'in' })}
                      className="input text-sm"
                    >
                      <option value="in">✅ In Stock</option>
                      <option value="oos">❌ Out of Stock</option>
                    </select>
                  </div>
                  {value.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(v.id)}
                      className="mb-0.5 text-xs text-terra hover:text-terra-2 border border-terra/30 hover:border-terra px-3 py-2 rounded-md transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-ink-3 block mb-1">
                    Variant Images <span className="text-ink-4">(one URL per line)</span>
                  </label>
                  <textarea
                    value={(v.images ?? []).join('\n')}
                    onChange={e => update(v.id, { images: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                    className="input text-xs font-mono min-h-[72px]"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-green-4 text-green text-sm py-2.5 rounded-xl hover:bg-green-6 transition-colors cursor-pointer"
      >
        + Add Variant
      </button>
    </div>
  )
}
