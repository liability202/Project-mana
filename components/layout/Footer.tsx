import Link from 'next/link'
import { CalendarDays, Instagram } from 'lucide-react'

const SHOP_LINKS = [
  { label: 'Dry Fruits', href: '/products?category=dry-fruits' },
  { label: 'Herbs & Ayurveda', href: '/products?category=herbs' },
  { label: 'Spices', href: '/products?category=spices' },
  { label: 'Pansari Items', href: '/products?category=pansari' },
  { label: 'Kits', href: '/kits' },
]

const SERVICE_LINKS = [
  { label: 'Chat & Buy', href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}` },
  { label: 'Video Appointment', href: '/appointment' },
  { label: 'Bulk Orders', href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=I%20want%20to%20place%20a%20bulk%20order` },
  { label: 'Corporate Gifting', href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Corporate%20gifting%20enquiry` },
]

const COMPANY_LINKS = [
  { label: 'About Mana', href: '/about' },
  { label: 'Refer & Earn', href: '/referral' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Return Policy', href: '/returns' },
  { label: 'Creator Portal', href: '/creator' },
]

export function Footer() {
  return (
    <footer className="bg-green pt-14 pb-7 px-[5%]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <div>
          <div className="font-serif text-[1.7rem] text-ivory tracking-wide font-normal">MANA</div>
          <div className="text-[.44rem] tracking-[.38em] uppercase text-green-4 mt-1 mb-4">The Essence of Nature</div>
          <p className="text-[.76rem] text-green-5/50 leading-[1.8] mb-4">
            Premium dry fruits, Ayurvedic herbs, spices and pansari items - sourced ethically from India's finest origins. MK and Sons, Delhi-ncr.
          </p>
          <div className="flex gap-2.5">
            <SocialBtn href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} label="WhatsApp">
              <WhatsAppIcon />
            </SocialBtn>
            <SocialBtn href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#'} label="Instagram">
              <Instagram size={15} strokeWidth={1.8} />
            </SocialBtn>
            <SocialBtn href="/appointment" label="Book Appointment">
              <CalendarDays size={15} strokeWidth={1.8} />
            </SocialBtn>
          </div>
        </div>

        <div>
          <div className="text-[.56rem] tracking-[.25em] uppercase text-green-4 mb-3.5 font-normal">Shop</div>
          <ul className="list-none flex flex-col gap-2">
            {SHOP_LINKS.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[.76rem] text-green-5/40 hover:text-ivory transition-colors no-underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[.56rem] tracking-[.25em] uppercase text-green-4 mb-3.5 font-normal">Services</div>
          <ul className="list-none flex flex-col gap-2">
            {SERVICE_LINKS.map(l => {
              const external = l.href.startsWith('http')
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="text-[.76rem] text-green-5/40 hover:text-ivory transition-colors no-underline"
                  >
                    {l.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <div className="text-[.56rem] tracking-[.25em] uppercase text-green-4 mb-3.5 font-normal">Company</div>
          <ul className="list-none flex flex-col gap-2">
            {COMPANY_LINKS.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[.76rem] text-green-5/40 hover:text-ivory transition-colors no-underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center pt-5 border-t border-white/5 flex-wrap gap-2">
        <span className="text-[.63rem] text-green-5/25">
          © {new Date().getFullYear()} Mana - MK and Sons, Delhi-ncr
        </span>
        <div className="flex gap-2.5">
          {['FSSAI', 'Lab Tested', 'Secure Pay'].map(b => (
            <span key={b} className="text-[.54rem] px-2 py-0.5 border border-green-5/18 text-green-5/35 uppercase tracking-widest rounded-sm">
              {b}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

function SocialBtn({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const external = href.startsWith('http')

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={label}
      className="w-8 h-8 rounded-full border border-green-5/25 flex items-center justify-center text-green-4 hover:border-ivory hover:text-ivory transition-all no-underline"
    >
      {children}
    </a>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.84 11.84 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.9 11.9 0 0 0 5.82 1.48h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.18-3.49-8.43ZM12.08 21.82h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.71.97.99-3.62-.23-.37a9.89 9.89 0 0 1-1.52-5.28c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.89-9.94 9.89Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.46-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  )
}
