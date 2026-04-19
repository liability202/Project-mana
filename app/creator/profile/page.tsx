'use client'
import { useState, useEffect } from 'react'
import { User, CreditCard, Save, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CreatorProfilePage() {
  const [creator, setCreator] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    upi_id: '',
    bank_account: '',
    bank_ifsc: '',
    email: '',
    instagram_handle: '',
    youtube_handle: ''
  })
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    const creatorStr = sessionStorage.getItem('mana_creator')
    if (creatorStr) {
      const c = JSON.parse(creatorStr)
      fetchProfile(c.id)
    }
  }, [])

  const fetchProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/creator/profile?id=${id}`)
      const data = await res.json()
      if (res.ok) {
        setCreator(data)
        setFormData({
          upi_id: data.upi_id || '',
          bank_account: data.bank_account || '',
          bank_ifsc: data.bank_ifsc || '',
          email: data.email || '',
          instagram_handle: data.instagram_handle || '',
          youtube_handle: data.youtube_handle || ''
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: creator.id, ...formData })
      })
      if (res.ok) {
        setMessage({ text: 'Settings updated successfully! Your settlements will use these details from now on.', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 5000)
      } else {
        const d = await res.json()
        setMessage({ text: d.error || 'Failed to update settings. Please check your inputs.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Something went wrong. Please check your connection.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 rounded-full border-4 border-ivory-3 border-t-green animate-spin mb-4" />
      <p className="text-ink-3 font-serif italic">Loading your profile details...</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in pb-10">
      <header>
        <h1 className="font-serif text-3xl text-ink mb-1.5 font-light">Account Settings</h1>
        <p className="text-sm text-ink-3 leading-relaxed">Securely manage your personal info and settlement methods. Your bank details are encrypted and private.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Payment Info */}
        <section className="bg-white border border-ivory-3 rounded-[28px] p-8 lg:p-10 shadow-soft">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-ivory-2 flex items-center justify-center text-green shadow-sm">
              <CreditCard size={22} />
            </div>
            <div>
              <h3 className="font-serif text-xl text-ink font-light leading-none">Settlement Method</h3>
              <p className="text-[.62rem] text-ink-4 uppercase tracking-[.2em] font-bold mt-2">Where we send your earnings</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[.72rem] font-black text-ink-3 uppercase tracking-[.18em] block mb-3 ml-1">UPI ID (Recommended ⚡)</label>
              <input 
                type="text" 
                value={formData.upi_id} 
                onChange={e => setFormData({...formData, upi_id: e.target.value.toLowerCase()})}
                placeholder="e.g. yourname@okaxis" 
                className="input h-14 text-base font-medium px-6"
              />
              <p className="text-[.68rem] text-green-3 mt-3 ml-1 font-medium italic select-none">✦ UPI payouts are processed 24 hours faster than bank transfers.</p>
            </div>

            <div className="pt-6 border-t border-ivory-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[.72rem] font-black text-ink-3 uppercase tracking-[.18em] block ml-1">Bank Account Number</label>
                  <input 
                    type="text" 
                    value={formData.bank_account} 
                    onChange={e => setFormData({...formData, bank_account: e.target.value.replace(/\D/g, '')})}
                    placeholder="Enter full account number" 
                    className="input h-14 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[.72rem] font-black text-ink-3 uppercase tracking-[.18em] block ml-1">Bank IFSC Code</label>
                  <input 
                    type="text" 
                    value={formData.bank_ifsc} 
                    onChange={e => setFormData({...formData, bank_ifsc: e.target.value.toUpperCase()})}
                    placeholder="e.g. SBIN0001234" 
                    className="input h-14 text-base uppercase font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Info */}
        <section className="bg-white border border-ivory-3 rounded-[28px] p-8 lg:p-10 shadow-soft">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-ivory-2 flex items-center justify-center text-green shadow-sm">
              <User size={22} />
            </div>
            <div>
              <h3 className="font-serif text-xl text-ink font-light leading-none">Creator Information</h3>
              <p className="text-[.62rem] text-ink-4 uppercase tracking-[.2em] font-bold mt-2">Personal & social details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-3">
              <label className="text-[.72rem] font-black text-ink-3 uppercase tracking-[.18em] block ml-1">Verified Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="input h-14 text-base"
                placeholder="hello@yourdomain.com"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[.72rem] font-black text-ink-3 uppercase tracking-[.18em] block ml-1">Instagram (@handle)</label>
              <input 
                type="text" 
                value={formData.instagram_handle} 
                onChange={e => setFormData({...formData, instagram_handle: e.target.value})}
                className="input h-14 text-base"
                placeholder="e.g. mana_official"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[.72rem] font-black text-ink-3 uppercase tracking-[.18em] block ml-1">YouTube Channel</label>
              <input 
                type="text" 
                value={formData.youtube_handle} 
                onChange={e => setFormData({...formData, youtube_handle: e.target.value})}
                className="input h-14 text-base"
                placeholder="e.g. Mana Wellness Vlogs"
              />
            </div>
          </div>
        </section>

        {message.text && (
          <div className={`p-5 rounded-[18px] text-[.78rem] font-medium flex items-center gap-4 animate-fade-in border shadow-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border-green-100' 
              : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={saving}
          className="bg-green text-ivory w-full h-16 rounded-[20px] text-[.9rem] font-bold shadow-soft hover:shadow-medium hover:bg-green-2 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer"
        >
          {saving ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Security Settings...
            </>
          ) : (
            <>Save Current Profile 🌿</>
          )}
        </button>
      </form>
    </div>
  )
}
