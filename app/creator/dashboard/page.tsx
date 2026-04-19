'use client'
import { useState, useEffect } from 'react'
import { StatCard } from '@/components/creator/StatCard'
import { 
  ShoppingBag, 
  CircleDollarSign, 
  Clock, 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  MessageCircle 
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { formatPrice } from '@/lib/utils'

export default function CreatorDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creator, setCreator] = useState<any>(null)

  useEffect(() => {
    const creatorStr = sessionStorage.getItem('mana_creator')
    if (creatorStr) {
      const c = JSON.parse(creatorStr)
      setCreator(c)
      fetchStats(c.id)
    }
  }, [])

  const fetchStats = async (id: string) => {
    try {
      const res = await fetch(`/api/creator/stats?creatorId=${id}`)
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-12 h-12 rounded-full border-4 border-ivory-3 border-t-green animate-spin mb-4" />
      <p className="text-ink-3 font-serif italic">Curating your latest performance...</p>
    </div>
  )
  
  if (!stats) return (
    <div className="py-20 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="font-serif text-xl text-ink">Failed to load stats</h2>
      <p className="text-sm text-ink-3 mb-6">We couldn't retrieve your dashboard data right now.</p>
      <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
    </div>
  )

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-1.5 font-light">Welcome back, {creator?.name}</h1>
          <p className="text-sm text-ink-3 leading-relaxed max-w-md">Here's a snapshot of your referral impact and reward milestones for this month.</p>
        </div>
        <div className="flex gap-2.5">
           <button 
              onClick={() => copyToClipboard(creator?.code || '')}
              className="bg-white border border-ivory-3 px-4 py-2.5 rounded-xl text-xs font-bold text-ink-2 flex items-center gap-2 hover:bg-ivory-2 transition-colors shadow-soft"
           >
             <Copy size={15} className="text-green-3" /> {creator?.code}
           </button>
           <a 
              href={`https://wa.me/?text=Check%20out%20Mana%20for%20premium%20dry%20fruits%20%26%20herbs.%20Use%20code%20${creator?.code}%20for%2010%25%20off!%20Shop%20at%20https://mana.in/?ref=${creator?.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-ivory px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 no-underline hover:bg-green-2 transition-transform active:scale-95 shadow-soft"
           >
             <MessageCircle size={15} /> Share on WhatsApp
           </a>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Orders" 
          value={stats.totalOrders} 
          icon={<ShoppingBag size={18} />} 
          subtitle="Orders placed using your code"
        />
        <StatCard 
          label="Earnings this month" 
          value={formatPrice(stats.thisMonthEarnings)} 
          icon={<TrendingUp size={18} />} 
          subtitle="Current month performance" 
        />
        <StatCard 
          label="Pending Payout" 
          value={formatPrice(stats.pendingPayout)} 
          icon={<Clock size={18} />} 
          subtitle="Ready for next settlement"
        />
        <StatCard 
          label="Total Earned" 
          value={formatPrice(stats.totalEarnedLifetime)} 
          icon={<CircleDollarSign size={18} />} 
          subtitle="Lifetime referral rewards"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="xl:col-span-2 bg-white border border-ivory-3 rounded-2xl p-6 lg:p-8 shadow-soft">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-serif text-xl text-ink font-light">Weekly Performance</h3>
              <p className="text-[.68rem] text-ink-4 uppercase tracking-wider mt-1">Last 8 weeks order volume</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F5F0E8" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#8A7860', fontWeight: 500 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#8A7860', fontWeight: 500 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#FDF0E8', radius: 4 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #EDE5D6',
                    boxShadow: '0 8px 24px rgba(26,18,8,0.08)',
                    fontSize: '11px',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 700, color: '#1C3D2E' }}
                />
                <Bar 
                  dataKey="orders" 
                  fill="#1C3D2E" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="flex flex-col gap-6">
          <div className="bg-green text-ivory rounded-2xl p-6 shadow-soft relative overflow-hidden group">
            <div className="absolute top-[-30px] right-[-30px] w-32 h-32 bg-green-2 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-10 h-10 rounded-full bg-green-2/40 flex items-center justify-center text-xl mb-4">🌿</div>
              <h3 className="font-serif text-xl mb-2 font-light">Pro Tip for Growth</h3>
              <p className="text-xs text-green-5/80 leading-relaxed mb-6">
                Creators who place their unique referral link in their Instagram Bio see **3x higher conversion** than those who only share the text code.
              </p>
              <button 
                 onClick={() => copyToClipboard(`https://mana.in/?ref=${creator?.code}`)}
                 className="mt-auto bg-ivory text-green border-none px-6 py-3 rounded-xl text-[.68rem] font-bold uppercase tracking-[.15em] cursor-pointer hover:bg-white transition-all transform active:scale-95 shadow-soft"
              >
                Copy My Tracking Link
              </button>
            </div>
          </div>

          <div className="bg-white border border-ivory-3 rounded-2xl p-6 shadow-soft">
            <h3 className="font-serif text-sm text-ink mb-5 uppercase tracking-widest font-bold">Community Support</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-ivory-2 text-ink-2 no-underline hover:bg-ivory-3 transition-all group">
                <span className="text-[.72rem] font-bold uppercase tracking-wide">Brand Assets Library</span>
                <ExternalLink size={14} className="text-ink-4 group-hover:text-green transition-colors" />
              </a>
              <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-ivory-2 text-ink-2 no-underline hover:bg-ivory-3 transition-all group">
                <span className="text-[.72rem] font-bold uppercase tracking-wide">Influencer WhatsApp Group</span>
                <MessageCircle size={14} className="text-ink-4 group-hover:text-green transition-colors" />
              </a>
            </div>
            <p className="text-[.6rem] text-ink-4 mt-6 text-center italic">Need help? WhatsApp your manager 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}
