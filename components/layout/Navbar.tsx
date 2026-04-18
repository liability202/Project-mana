'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Search, ShoppingBag, X, User } from 'lucide-react'
import { useCart } from '@/lib/store'
import { SearchOverlay } from '@/components/ui/SearchOverlay'

const NAV_LINKS = [
  { label: 'Dry Fruits', href: '/products?category=dry-fruits' },
  { label: 'Herbs', href: '/products?category=herbs' },
  { label: 'Spices', href: '/products?category=spices' },
  { label: 'Kits', href: '/kits' },
  { label: 'About Us', href: '/about' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const hydrated = useCart((s) => s.hydrated)
  const count = useCart((s) => s.count())
  const safeCount = hydrated ? count : 0

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !searchOpen) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchOpen])

  return (
    <>
      <nav className={`sticky top-0 z-50 flex h-[62px] items-center justify-between border-b border-ivory-3 bg-ivory/96 px-[5%] backdrop-blur-lg transition-shadow duration-300 ${scrolled ? 'shadow-soft' : ''}`}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="h-9 w-9 flex-shrink-0">
            <Image
              src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/MORTAR%20LOGO.png"
              alt="Mana Logo"
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <div className="font-serif text-2xl font-normal leading-none tracking-wide text-green">MANA</div>
            <div className="mt-0.5 hidden text-[.42rem] uppercase tracking-[.4em] text-ink-3 sm:block">The Essence of Nature</div>
          </div>
        </Link>

        <ul className="hidden list-none items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-[.76rem] font-normal tracking-wide text-ink-2 transition-colors hover:text-green no-underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="cursor-pointer border-none bg-transparent p-1.5 text-ink-2 transition-colors hover:text-green"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Mana!%20I%20need%20help.`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md border border-green-3 px-4 py-1.5 text-[.72rem] tracking-wide text-green transition-colors hover:bg-green-6 no-underline sm:block"
          >
            Chat & Buy
          </a>

          <Link href="/profile" className="flex items-center justify-center p-1.5 text-ink-2 transition-colors hover:text-green" aria-label="My Account">
            <User size={19} />
          </Link>

          <CartButton count={safeCount} />

          <button
            className="flex cursor-pointer flex-col gap-1 border-none bg-transparent p-1 lg:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} className="text-ink-2" /> : <Menu size={20} className="text-ink-2" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed left-0 right-0 top-[62px] z-40 border-b border-ivory-3 bg-ivory shadow-soft lg:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-ivory-3 px-[5%] py-4 text-sm text-ink-2 transition-colors hover:bg-ivory-2 hover:text-green no-underline"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-[5%] py-4 text-sm text-green no-underline"
            >
              Chat & Buy on WhatsApp
            </a>
          </div>
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

function CartButton({ count }: { count: number }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  return (
    <button
      onClick={handleClick}
      className="relative cursor-pointer border-none bg-transparent p-1.5 text-ink-2 transition-colors hover:text-green"
      aria-label={`Cart (${count} items)`}
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-terra text-[.5rem] font-medium text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
