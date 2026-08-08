import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Video Appointment – See Products Live Before You Buy',
  description: 'Book a free video appointment with a Mana expert. See dry fruits, herbs and spices live on camera before you order.',
  alternates: { canonical: '/appointment' },
}

export default function AppointmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
