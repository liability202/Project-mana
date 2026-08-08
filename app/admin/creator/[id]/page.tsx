'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CreatorInsights } from '@/components/admin/CreatorInsights'

/**
 * Full-page creator dashboard for admins: payout requests and their payment
 * destination, plus the same performance view the creator sees.
 *
 * Auth mirrors /admin — the password lives in localStorage under `mana_admin`
 * and every admin request carries it as a bearer token.
 */
export default function AdminCreatorPage({ params }: { params: { id: string } }) {
  const [creator, setCreator] = useState<any>(null)
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('mana_admin') || ''
    if (!saved) {
      setError('Sign in on the admin panel first.')
      setLoading(false)
      return
    }
    setSecret(saved)

    fetch(`/api/admin/creators?id=${params.id}`, { headers: { authorization: `Bearer ${saved}` } })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Could not load this creator.')
        setCreator(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.id])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-ink-4 hover:text-green no-underline mb-6"
      >
        <ChevronLeft size={14} /> Back to admin
      </Link>

      {loading ? (
        <div className="py-24 text-center text-ink-4 font-serif italic">Loading creator...</div>
      ) : error ? (
        <div className="py-20 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-serif text-xl text-ink mb-2">{error}</h1>
          <Link href="/admin" className="text-sm text-green font-medium">
            Go to the admin panel
          </Link>
        </div>
      ) : (
        creator && (
          <>
            <header className="mb-8 pb-6 border-b border-ivory-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-3xl text-ink font-light">{creator.name}</h1>
                <span
                  className={`px-2 py-0.5 rounded text-[.6rem] font-bold uppercase tracking-widest ${
                    creator.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {creator.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-[.68rem] text-green-3 font-bold uppercase tracking-widest mt-2">
                {creator.code} · {creator.phone}
              </div>
              <div className="text-xs text-ink-4 mt-1.5">
                {creator.commission_pct || 10}% commission
                {creator.tier ? ` · ${creator.tier} tier` : ''}
                {creator.email ? ` · ${creator.email}` : ''}
                {creator.created_at
                  ? ` · joined ${new Date(creator.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ''}
              </div>
            </header>

            <CreatorInsights creator={creator} adminSecret={secret} />
          </>
        )
      )}
    </div>
  )
}
