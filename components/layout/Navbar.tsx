'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Search, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/store'
import { SearchOverlay } from '@/components/ui/SearchOverlay'
import Image from "next/image"
const NAV_LINKS = [
  { label: 'Dry Fruits', href: '/products?category=dry-fruits' },
  { label: 'Herbs',      href: '/products?category=herbs' },
  { label: 'Spices',     href: '/products?category=spices' },
  { label: 'Kits',       href: '/kits' },
  { label: 'About Us',   href: '/about' },
]

export function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const count = useCart(s => s.count())

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
      <nav className={`sticky top-0 z-50 bg-ivory/96 backdrop-blur-lg border-b border-ivory-3 h-[62px] flex items-center justify-between px-[5%] transition-shadow duration-300 ${scrolled ? 'shadow-soft' : ''}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
  <div className="w-9 h-9 flex-shrink-0">
    <Image
      src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/MORTAR%20LOGO.png"
      alt="Mana Logo"
      width={36}
      height={36}
      className="rounded-full object-cover"
    />
  </div>

  <div>
    <div className="font-serif text-2xl text-green tracking-wide leading-none font-normal">
      MANA
    </div>
    <div className="text-[.42rem] tracking-[.4em] uppercase text-ink-3 mt-0.5">
      The Essence of Nature
    </div>
  </div>
</Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-7 list-none">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-[.76rem] text-ink-2 tracking-wide transition-colors hover:text-green no-underline font-normal"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 bg-transparent border-none cursor-pointer text-ink-2 hover:text-green transition-colors"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Mana!%20I%20need%20help.`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block text-[.72rem] px-4 py-1.5 border border-green-3 text-green rounded-md hover:bg-green-6 transition-colors no-underline tracking-wide"
          >
            💬 Chat & Buy
          </a>

          {/* ✅ Pass count — CartButton handles hydration internally */}
          <CartButton count={count} />

          <button
            className="lg:hidden flex flex-col gap-1 bg-transparent border-none cursor-pointer p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} className="text-ink-2" /> : <Menu size={20} className="text-ink-2" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed top-[62px] left-0 right-0 bg-ivory border-b border-ivory-3 z-40 shadow-soft">
          <div className="flex flex-col">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-4 px-[5%] text-sm text-ink-2 border-b border-ivory-3 hover:bg-ivory-2 hover:text-green transition-colors no-underline"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-4 px-[5%] text-sm text-green no-underline"
            >
              💬 Chat & Buy on WhatsApp
            </a>
          </div>
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

function CartButton({ count }: { count: number }) {
  const [mounted, setMounted] = useState(false)

  // ✅ Only show cart count after client hydration
  useEffect(() => { setMounted(true) }, [])

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('mana:open-cart'))
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-1.5 bg-transparent border-none cursor-pointer text-ink-2 hover:text-green transition-colors"
      aria-label={`Cart (${count} items)`}
    >
      <ShoppingBag size={20} />
      {/* ✅ Only render badge after mount — prevents hydration mismatch */}
      {mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-1 w-4 h-4 rounded-full bg-terra text-white text-[.5rem] flex items-center justify-center font-medium">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}
