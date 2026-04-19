'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  BarChart3, 
  ShoppingBag, 
  CircleDollarSign, 
  Link as LinkIcon, 
  UserCircle, 
  LogOut 
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/creator/dashboard', icon: BarChart3 },
  { label: 'Orders', href: '/creator/orders', icon: ShoppingBag },
  { label: 'Earnings', href: '/creator/earnings', icon: CircleDollarSign },
  { label: 'My Code', href: '/creator/code', icon: LinkIcon },
  { label: 'Profile', href: '/creator/profile', icon: UserCircle },
]

export function CreatorNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [creator, setCreator] = useState<any>(null)
  
  useEffect(() => {
    const creatorStr = sessionStorage.getItem('mana_creator')
    if (creatorStr) {
      setCreator(JSON.parse(creatorStr))
    } else if (pathname.startsWith('/creator') && pathname !== '/creator') {
      router.push('/creator')
    }
  }, [pathname, router])

  const handleLogout = () => {
    sessionStorage.removeItem('mana_creator')
    setCreator(null)
    router.push('/creator')
  }

  // Hide nav on login page or if not logged in
  if (pathname === '/creator' || (!creator && pathname.startsWith('/creator'))) return null

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-ivory-3 h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-ivory-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green text-ivory flex items-center justify-center font-serif text-lg flex-shrink-0">
              {creator?.name?.[0] || 'C'}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-ink text-sm truncate">{creator?.name || 'Creator'}</div>
              <div className="text-[.6rem] text-green-3 font-bold uppercase tracking-widest mt-0.5 truncate">{creator?.code || 'NO-CODE'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all no-underline ${
                  active 
                    ? 'bg-green text-ivory font-medium shadow-soft' 
                    : 'text-ink-3 hover:bg-ivory-2 hover:text-green'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-ivory-3">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-ink-3 hover:bg-red-50 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-ivory-3 flex justify-around p-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg no-underline min-w-[64px] transition-colors ${
                active ? 'text-green' : 'text-ink-4'
              }`}
            >
              <Icon size={20} />
              <span className="text-[.62rem] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16" />
    </>
  )
}
