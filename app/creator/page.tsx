'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CreatorLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const creator = sessionStorage.getItem('mana_creator')
    if (creator) {
      router.push('/creator/dashboard')
    }
  }, [router])

  const handleSendOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/creator/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, type: 'send' })
      })
      const data = await res.json()
      if (res.ok) {
        setStep('otp')
      } else {
        setError(data.error || 'Failed to send OTP. Please ensure your number is registered.')
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
      const res = await fetch('/api/creator/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, type: 'verify' })
      })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.setItem('mana_creator', JSON.stringify(data.creator))
        router.push('/creator/dashboard')
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto px-4">
      <div className="bg-white border border-ivory-3 rounded-2xl p-8 w-full shadow-medium">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-5 border-[3px] border-ivory-2 shadow-soft">
             <Image 
                src="https://dktkyiwuegyievucnoxc.supabase.co/storage/v1/object/public/product%20image/MORTAR%20LOGO.png" 
                alt="Mana Logo" 
                width={80} 
                height={80} 
                className="object-cover"
             />
          </div>
          <h1 className="font-serif text-2xl text-green mb-1 text-center font-light">MANA Creator Portal</h1>
          <p className="text-[.65rem] text-ink-3 text-center uppercase tracking-[.25em] font-medium">Track your earnings & orders</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl leading-relaxed animate-fade-in">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <label className="text-[.68rem] font-bold text-ink-3 uppercase tracking-wider block ml-1">Phone Number</label>
                <div className="flex gap-2.5">
                  <div className="flex items-center justify-center bg-ivory-2 border border-ivory-3 rounded-xl px-4 text-ink-2 text-sm font-semibold select-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && phone.length === 10 && handleSendOtp()}
                    className="input flex-1 text-base h-14"
                    placeholder="Enter 10 digit number"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              <button 
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                className="btn-primary w-full justify-center py-4 h-14 text-sm font-medium shadow-soft hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : 'Send OTP on WhatsApp'}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <label className="text-[.68rem] font-bold text-ink-3 uppercase tracking-wider block mb-1">Verify OTP</label>
                <p className="text-[.65rem] text-ink-4 mb-4">Sent to +91 {phone}</p>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                  className="input text-center text-3xl tracking-[0.4em] font-serif h-16 w-full"
                  placeholder="000000"
                  disabled={loading}
                  autoFocus
                />
                <button 
                  onClick={() => setStep('phone')} 
                  className="text-[.6rem] text-green-3 font-semibold uppercase tracking-widest mt-4 hover:text-green inline-block border-none bg-transparent cursor-pointer"
                >
                  ← Change phone number
                </button>
              </div>
              <button 
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="btn-primary w-full justify-center py-4 h-14 text-sm font-medium shadow-soft hover:shadow-medium disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify & Enter Portal'}
              </button>
            </>
          )}

          <div className="pt-8 mt-4 border-t border-ivory-2 text-center">
            <p className="text-[.7rem] text-ink-4 mb-3 italic">Not a Mana creator yet?</p>
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi!%20I'm%20interested%20in%20becoming%20a%20Mana%20creator.`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-green hover:underline flex items-center justify-center gap-2 no-underline uppercase tracking-widest"
            >
              Apply via WhatsApp 🌿
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
