'use client'
import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Browser view of the signed-in customer. The source of truth is the httpOnly
 * session cookie set by /api/auth/otp/verify; this store just mirrors
 * /api/auth/session so pages can render "verified" states.
 */

type CustomerType = 'new' | 'returning' | null

type SessionStore = {
  status: 'loading' | 'authenticated' | 'anonymous'
  phone: string
  customerType: CustomerType
  load: (force?: boolean) => Promise<void>
  signIn: (phone: string, customerType: CustomerType) => void
  signOut: () => Promise<void>
}

const LEGACY_PHONE_KEY = 'mana_account_phone'
let inflight: Promise<void> | null = null

export const useSession = create<SessionStore>()((set, get) => ({
  status: 'loading',
  phone: '',
  customerType: null,

  load: (force = false) => {
    if (!force && get().status !== 'loading') return Promise.resolve()
    if (inflight && !force) return inflight

    try {
      // Older builds "remembered" a typed phone here; it proves nothing now.
      localStorage.removeItem(LEGACY_PHONE_KEY)
    } catch {}

    inflight = fetch('/api/auth/session', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { authenticated: false }))
      .then(data => {
        if (data?.authenticated && data.phone) {
          set({ status: 'authenticated', phone: data.phone, customerType: data.customer_type || null })
        } else {
          set({ status: 'anonymous', phone: '', customerType: null })
        }
      })
      .catch(() => set({ status: 'anonymous', phone: '', customerType: null }))
      .finally(() => {
        inflight = null
      })
    return inflight
  },

  signIn: (phone, customerType) => set({ status: 'authenticated', phone, customerType }),

  signOut: async () => {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
    set({ status: 'anonymous', phone: '', customerType: null })
  },
}))

/** Loads the session once for the component that calls it. */
export function useSessionLoader() {
  useEffect(() => {
    void useSession.getState().load()
  }, [])
  return useSession()
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.')
  return data
}

export function requestOtp(phone: string) {
  return postJson('/api/auth/otp/send', { phone })
}

/** Verifies the code; on success the server has set the session cookie. */
export async function confirmOtp(phone: string, otp: string) {
  const data = await postJson('/api/auth/otp/verify', { phone, otp })
  useSession.getState().signIn(data.phone, data.customer_type || null)
  return data as { phone: string; customer_type: 'new' | 'returning'; user_id: string | null }
}
