'use client'
import { useState, useEffect } from 'react'
import { Copy, Instagram, MessageCircle, Youtube } from 'lucide-react'

export default function CreatorCodePage() {
  const [creator, setCreator] = useState<any>(null)

  useEffect(() => {
    const creatorStr = sessionStorage.getItem('mana_creator')
    if (creatorStr) {
      setCreator(JSON.parse(creatorStr))
    }
  }, [])

  const trackingLink = `https://mana.in/?ref=${creator?.code}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const ASSETS = [
    {
      platform: 'Instagram',
      icon: Instagram,
      label: 'Post Caption',
      text: `Guys I've been ordering from Mana for my herbs and dry fruits — quality is unreal! Use my code ${creator?.code} for 10% off 🌿 Link in bio`
    },
    {
      platform: 'WhatsApp',
      icon: MessageCircle,
      label: 'Status/Message',
      text: `Hey! Check out Mana for premium dry fruits & herbs. Use ${creator?.code} for 10% off! Shop: ${trackingLink}`
    },
    {
      platform: 'YouTube',
      icon: Youtube,
      label: 'Description Line',
      text: `Get 10% off on Mana (Premium Herbs & Dry Fruits) using code ${creator?.code}: ${trackingLink}`
    }
  ]

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <header>
        <h1 className="font-serif text-3xl text-ink mb-1.5 font-light">Promo Assets</h1>
        <p className="text-sm text-ink-3 leading-relaxed">Your unique promotion codes and ready-to-use marketing tools to share with your audience.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Code Card */}
        <div className="bg-white border border-ivory-3 rounded-[28px] p-8 lg:p-12 shadow-soft flex flex-col items-center text-center relative overflow-hidden group hover:border-green-5 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-5/30" />
            <div className="w-16 h-16 rounded-3xl bg-green-6 text-green text-3xl flex items-center justify-center mb-8 shadow-sm">🏷️</div>
            <h2 className="text-[.7rem] font-bold text-ink-4 uppercase tracking-[.3em] mb-4">Your Referral Code</h2>
            <div className="bg-ivory-2 border-2 border-dashed border-green-5 rounded-2xl px-12 py-7 mb-8">
                <div className="font-serif text-4xl text-green mb-1.5 tracking-tight font-light">{creator?.code}</div>
                <div className="text-[.62rem] text-green-3 font-bold uppercase tracking-[.25em]">10% Off for your audience</div>
            </div>
            <button 
                onClick={() => copyToClipboard(creator?.code)}
                className="bg-green text-ivory px-10 py-4 rounded-2xl text-[.82rem] font-bold flex items-center gap-3 no-underline hover:bg-green-2 transition-all transform active:scale-95 shadow-soft shadow-green/10"
            >
                <Copy size={16} /> Copy Discount Code
            </button>
            <p className="text-[.7rem] text-ink-4 mt-8 leading-relaxed max-w-[240px]">Share this code with your friends and followers manually for 10% instant discount.</p>
        </div>

        {/* Tracking Link Card */}
        <div className="bg-white border border-ivory-3 rounded-[28px] p-8 lg:p-12 shadow-soft flex flex-col items-center text-center relative overflow-hidden group hover:border-terra-3 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-terra-4" />
            <div className="w-16 h-16 rounded-3xl bg-terra-4 text-terra text-3xl flex items-center justify-center mb-8 shadow-sm">🔗</div>
            <h2 className="text-[.7rem] font-bold text-ink-4 uppercase tracking-[.3em] mb-4">Your Tracking Link</h2>
            <div className="bg-ivory-2 border border-ivory-3 rounded-2xl px-6 py-6 mb-8 w-full max-w-sm truncate text-ink-2 font-medium text-[.82rem] shadow-inner font-mono">
                {trackingLink}
            </div>
            <button 
                onClick={() => copyToClipboard(trackingLink)}
                className="bg-white border border-ivory-3 px-10 py-4 rounded-2xl text-[.82rem] font-bold text-ink-2 flex items-center gap-3 no-underline hover:bg-ivory-3 transition-all transform active:scale-95 shadow-soft"
            >
                <Copy size={16} className="text-terra" /> Copy Unique Link
            </button>
            <p className="text-[.7rem] text-ink-4 mt-8 leading-relaxed max-w-[240px]">
                When people click this link, we'll automatically track their orders even if they forget to enter your code.
            </p>
        </div>
      </div>

      <div className="bg-white border border-ivory-3 rounded-[32px] p-8 lg:p-12 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h3 className="font-serif text-2xl text-ink font-light">Copy-Paste Captions</h3>
            <p className="text-xs text-ink-4 mt-1 font-medium italic">High-converting outreach templates for your social channels.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ASSETS.map((asset, i) => {
                const Icon = asset.icon
                return (
                    <div key={i} className="border border-ivory-3 rounded-[24px] p-7 lg:p-10 hover:bg-ivory-2/20 transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-ivory-3 text-ink-2 flex items-center justify-center transition-colors group-hover:bg-green group-hover:text-ivory">
                                <Icon size={22} />
                            </div>
                            <div>
                                <h4 className="text-[.75rem] font-black text-ink-2 uppercase tracking-[.15em]">{asset.platform}</h4>
                                <p className="text-[.65rem] text-ink-4 font-bold uppercase tracking-widest">{asset.label}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-ivory-3 rounded-2xl p-6 relative group/inner shadow-sm">
                            <p className="text-[.85rem] text-ink-2 leading-relaxed pr-8 italic font-medium">
                                "{asset.text}"
                                <span className="text-green-3"> 🌿</span>
                            </p>
                            <button 
                                onClick={() => copyToClipboard(asset.text)}
                                className="absolute right-4 bottom-4 w-10 h-10 rounded-xl bg-ivory-2 text-ink-3 hover:bg-green hover:text-ivory transition-all shadow-sm flex items-center justify-center border-none cursor-pointer"
                                title="Copy"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  )
}
