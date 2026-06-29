'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { showToast } from '@/components/ui/Toaster'

export default function ReferralClient({ creator }: { creator: any }) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const discount = creator.discount_pct || 10

  const handleSendOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (res.ok) {
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      })
      const data = await res.json()
      if (res.ok) {
        // Record the visit for the creator's stats
        await fetch('/api/creator/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorCode: creator.code, phone })
        }).catch(() => {})

        // Save session
        localStorage.setItem('mana_account_phone', phone)
        document.cookie = `mana_account_phone=${phone}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
        
        // Save referral cookie
        document.cookie = `mana_ref=${creator.code}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

        showToast('Discount unlocked successfully!')
        router.push('/kits')
      } else {
        setError(data.error || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto px-4 animate-fade-in">
      <div className="bg-white border border-ivory-3 rounded-[32px] p-8 w-full shadow-soft relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-5" />
        
        <div className="flex flex-col items-center mb-8 text-center mt-2">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-green-6 text-green-2 text-[.65rem] font-bold uppercase tracking-widest mb-6 border border-green-5">
            Special Invitation
          </div>
          
          <h1 className="font-serif text-3xl text-ink mb-3 font-light">
            {creator.name} sent you <span className="text-green font-medium">{discount}% off</span>
          </h1>
          <p className="text-[.85rem] text-ink-3 leading-relaxed px-4">
            Verify your phone number to automatically unlock {creator.name}'s discount on your first order.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-2xl leading-relaxed animate-fade-in">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex items-center justify-center bg-ivory-2 border border-ivory-3 rounded-2xl px-5 text-ink-2 text-sm font-semibold select-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && phone.length === 10 && handleSendOtp()}
                    className="input flex-1 text-base h-14 rounded-2xl border-ivory-3 focus:border-green-4 focus:ring-4 focus:ring-green-5/30 transition-all outline-none px-4"
                    placeholder="Enter phone number"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              <button 
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                className="w-full bg-green text-ivory rounded-2xl py-4 font-bold text-[.85rem] tracking-wide hover:bg-green-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-soft flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : 'Unlock My Discount'}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <p className="text-[.7rem] text-ink-4 mb-4">OTP sent to +91 {phone}</p>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                  className="input text-center text-3xl tracking-[0.4em] font-serif h-16 w-full rounded-2xl border-ivory-3 focus:border-green-4 focus:ring-4 focus:ring-green-5/30 transition-all outline-none"
                  placeholder="000000"
                  disabled={loading}
                  autoFocus
                />
                <button 
                  onClick={() => setStep('phone')} 
                  className="text-[.65rem] text-green-3 font-bold uppercase tracking-widest mt-4 hover:text-green transition-colors border-none bg-transparent cursor-pointer"
                >
                  Change phone number
                </button>
              </div>
              <button 
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full bg-green text-ivory rounded-2xl py-4 font-bold text-[.85rem] tracking-wide hover:bg-green-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-soft flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
