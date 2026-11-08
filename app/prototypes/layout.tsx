import type { Metadata } from 'next'
import { PrototypeBar } from './_lib/PrototypeBar'

// Design explorations: never indexed.
export const metadata: Metadata = {
  title: 'Design prototypes',
  robots: { index: false, follow: false },
}

export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PrototypeBar />
      {children}
    </>
  )
}
