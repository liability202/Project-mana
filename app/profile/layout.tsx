import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your profile, check your cashback wallet balance, track shipment status, and access one-click reordering.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
