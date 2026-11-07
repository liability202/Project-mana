import type { Metadata } from 'next'

// Design explorations: never indexed.
export const metadata: Metadata = {
  title: 'Design prototypes',
  robots: { index: false, follow: false },
}

export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
