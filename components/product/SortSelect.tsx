'use client'

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={e => {
        const url = new URL(window.location.href)
        url.searchParams.set('sort', e.target.value)
        window.location.href = url.toString()
      }}
      className="px-4 py-2 border border-green-5/30 bg-transparent text-ivory font-sans text-sm rounded-md outline-none cursor-pointer"
    >
      <option value="">Sort: Featured</option>
      <option value="price-asc">Price: Low–High</option>
      <option value="price-desc">Price: High–Low</option>
    </select>
  )
}
