'use client'
import { usePathname } from 'next/navigation'

/** Renders its children everywhere except under the given path prefixes. */
export function HideOnPaths({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const pathname = usePathname() || ''
  if (prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null
  return <>{children}</>
}
