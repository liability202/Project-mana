import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/supabase'

/**
 * Kit tile for the home page.
 *
 * Deliberately not ProductCard: a kit is a curated bundle, so it sells on
 * what's inside rather than on a weight/price-per-gram and an instant add.
 * The badge sits under the photo instead of over it, the description gets
 * room, and there's no "+ Add" — kits route to their own page where the
 * ritual size is chosen first.
 */
export function KitCard({ kit }: { kit: Product }) {
  const cheapestVariant = kit.variants?.length
    ? Math.min(...kit.variants.map((v: any) => v.price).filter((p: number) => typeof p === 'number'))
    : null
  const price = cheapestVariant ?? kit.price

  const badge = kit.tags?.includes('bestseller')
    ? 'Bestseller'
    : kit.tags?.includes('premium')
      ? 'Premium'
      : kit.tags?.includes('organic')
        ? 'Organic'
        : null

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ivory-3 bg-white no-underline shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-green-4 hover:shadow-medium"
    >
      {/* Kits are shot landscape to fit five packets in a row — see ProductCard
          for the same reasoning behind the wider frame. */}
      <div className="photo-well relative aspect-[9/8] overflow-hidden">
        {kit.images?.[0] ? (
          <Image
            src={kit.images[0]}
            alt={kit.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-4">No image</div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        {badge && (
          <span className="mb-2 sm:mb-3 inline-block self-start rounded bg-green-6 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[.5rem] sm:text-[.58rem] font-medium uppercase tracking-[.12em] sm:tracking-[.14em] text-green-2">
            {badge}
          </span>
        )}

        <h3 className="font-serif text-[1rem] sm:text-[1.15rem] font-normal leading-snug text-ink">{kit.name}</h3>

        {kit.description && (
          <p className="mt-1 sm:mt-2 line-clamp-2 text-[.72rem] sm:text-[.82rem] font-light leading-relaxed text-ink-3">
            {kit.description}
          </p>
        )}

        <div className="mt-auto border-t border-ivory-3 pt-3 sm:pt-4">
          <div className="font-serif text-[1.15rem] sm:text-[1.35rem] leading-none text-green">{formatPrice(price)}</div>
          <div className="mt-1 text-[.58rem] sm:text-[.66rem] text-ink-4">per kit</div>
        </div>
      </div>
    </Link>
  )
}
