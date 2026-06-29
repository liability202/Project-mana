'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReferralClient({ creator }: { creator: any }) {
  const router = useRouter()

  useEffect(() => {
    let active = true

    const initializeReferral = async () => {
      try {
        // Record the visit for the creator's stats. We use a dummy phone since we don't ask for it anymore.
        await fetch('/api/creator/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorCode: creator.code, phone: 'anonymous_visit' })
        })
      } catch (err) {
        // Ignore errors
      }

      if (active) {
        // Save referral cookie
        document.cookie = `mana_ref=${creator.code}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        // Redirect to home page
        router.push('/')
      }
    }

    initializeReferral()

    return () => {
      active = false
    }
  }, [creator, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto px-4 animate-fade-in">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-ivory-3 border-t-green rounded-full animate-spin" />
        <p className="text-sm font-medium text-ink-3">Activating {creator.name}'s discount...</p>
      </div>
    </div>
  )
}
