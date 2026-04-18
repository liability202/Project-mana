import Link from 'next/link'

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
]

export function Footer() {
  return (
    <footer className="bg-green pt-14 pb-7 px-[5%]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        {/* Brand */}
        <div>
          <div className="font-serif text-[1.7rem] text-ivory tracking-wide font-normal">MANA</div>
          <div className="text-[.44rem] tracking-[.38em] uppercase text-green-4 mt-1 mb-4">The Essence of Nature</div>
          <p className="text-[.76rem] text-green-5/50 leading-[1.8] mb-4">
            Premium dry fruits, Ayurvedic herbs, spices and pansari items — sourced ethically from India's finest origins. MK and Sons, Ghaziabad.
          </p>
          <div className="flex gap-2.5">
            <SocialBtn href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} label="WhatsApp">💬</SocialBtn>
            <SocialBtn href="#" label="Instagram">📷</SocialBtn>
            <SocialBtn href="#" label="YouTube">▶</SocialBtn>
          </div>
        </div>

        {/* Shop */}
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

        {/* Services */}
        <div>
          <div className="text-[.56rem] tracking-[.25em] uppercase text-green-4 mb-3.5 font-normal">Services</div>
          <ul className="list-none flex flex-col gap-2">
            {SERVICE_LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                   className="text-[.76rem] text-green-5/40 hover:text-ivory transition-colors no-underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
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
          © {new Date().getFullYear()} Mana – MK and Sons, Ghaziabad
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
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-full border border-green-5/25 flex items-center justify-center text-[.72rem] text-green-4 hover:border-ivory hover:text-ivory transition-all no-underline"
    >
      {children}
    </a>
  )
}
