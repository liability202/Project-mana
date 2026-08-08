import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // `theme-light` opts the console out of dark mode — it's an internal tool
  // with its own chrome and a lot of hard-coded status colours.
  return <div className="theme-light">{children}</div>
}
