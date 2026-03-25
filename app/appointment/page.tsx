'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toaster'

const SLOTS = ['10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:30 PM','5:00 PM','6:30 PM']
const INTERESTS = ['Dry Fruits','Herbs & Ayurveda','Spices','Pansari Items','Kits & Bundles','Bulk / Wholesale']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getCalDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay()
  const days  = new Date(year, month + 1, 0).getDate()
  return { first, days }
}

export default function AppointmentPage() {
  const now   = new Date()
  const [cal, setCal]     = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selDate, setDate]= useState<Date | null>(null)
  const [selSlot, setSlot]= useState<string | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [form, setForm]   = useState({ name: '', phone: '', notes: '', platform: 'whatsapp' })
  const [done, setDone]   = useState(false)
  const [loading, setLoading] = useState(false)

  const today = new Date(); today.setHours(0,0,0,0)
  const { first, days } = getCalDays(cal.year, cal.month)

  const toggleInterest = (v: string) =>
    setInterests(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const selDateStr = selDate
    ? `${SHORT_MONTHS[selDate.getMonth()]} ${selDate.getDate()}, ${selDate.getFullYear()}`
    : null

  const summaryText = selDate && selSlot ? `${selDateStr} at ${selSlot}` : 'No date selected yet'

  const confirm = async () => {
    if (!form.name.trim()) { showToast('Please enter your name'); return }
    if (!form.phone.trim()) { showToast('Please enter your phone number'); return }
    if (!selDate) { showToast('Please select a date'); return }
    if (!selSlot) { showToast('Please select a time slot'); return }
    setLoading(true)
    try {
      await supabase.from('appointments').insert({
        name: form.name, phone: form.phone, notes: form.notes,
        date: selDate.toISOString().split('T')[0],
        time_slot: selSlot, interests, platform: form.platform,
      })
      const msg = `Hi Mana Team! I want to book a video appointment:\n\n`
        + `👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n`
        + `📅 Date: ${selDateStr}\n🕐 Time: ${selSlot}\n`
        + `📱 Platform: ${form.platform === 'whatsapp' ? 'WhatsApp Video' : 'Google Meet'}\n`
        + (interests.length ? `🛍 Interested in: ${interests.join(', ')}\n` : '')
        + (form.notes ? `💬 Note: ${form.notes}\n` : '')
        + '\nPlease confirm. Thank you!'
      window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
      setDone(true)
    } catch (e) { showToast('Error saving appointment. Please try WhatsApp directly.') }
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-[60vh] flex items-center justify-center px-[5%]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-6 border-2 border-green-4 flex items-center justify-center text-2xl text-green mx-auto mb-4">✓</div>
        <h1 className="font-serif text-2xl font-light text-ink mb-2">Appointment Requested!</h1>
        <p className="text-sm text-ink-3 mb-6">Your appointment for {summaryText} has been sent. We'll confirm on WhatsApp within 1 hour.</p>
        <a href="/" className="btn-primary no-underline inline-flex"><span>Back to Home</span></a>
      </div>
    </div>
  )

  return (
    <>
      <div className="bg-green px-[5%] py-12">
        <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] text-ivory font-light">
          Book a <em className="not-italic text-green-4">Video Call</em>
        </h1>
        <p className="text-[.88rem] text-green-4 mt-2">See our products live before you buy — just like a real store visit.</p>
      </div>

      <div className="px-[5%] py-8 max-w-[1100px] mx-auto">
        {/* How it works */}
        <div className="flex items-start gap-3 bg-green-6 border border-green-5 rounded-xl p-5 mb-8 flex-wrap">
          {[['1','Pick a date & time','Choose any available slot below'],['2','Tell us what to show','Which products you want to see'],['3','We call you','WhatsApp video or Google Meet']].map(([n,t,d]) => (
            <div key={n} className="flex items-start gap-3 flex-1 min-w-[180px]">
              <div className="w-7 h-7 rounded-full bg-green text-ivory text-xs flex items-center justify-center flex-shrink-0 font-medium">{n}</div>
              <div>
                <div className="text-sm font-medium text-ink">{t}</div>
                <div className="text-[.76rem] text-ink-3 mt-0.5">{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar + slots */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft">
              <div className="font-serif text-lg text-ink mb-4">Select a Date</div>
              {/* Month nav */}
              <div className="flex justify-between items-center mb-3">
                <button onClick={() => setCal(c => ({ ...c, month: c.month === 0 ? 11 : c.month - 1, year: c.month === 0 ? c.year - 1 : c.year }))}
                  className="w-8 h-8 border border-ivory-3 rounded-md flex items-center justify-center text-green-3 hover:bg-green-6 transition-colors cursor-pointer bg-transparent">‹</button>
                <div className="font-serif text-base text-ink">{MONTHS[cal.month]} {cal.year}</div>
                <button onClick={() => setCal(c => ({ ...c, month: c.month === 11 ? 0 : c.month + 1, year: c.month === 11 ? c.year + 1 : c.year }))}
                  className="w-8 h-8 border border-ivory-3 rounded-md flex items-center justify-center text-green-3 hover:bg-green-6 transition-colors cursor-pointer bg-transparent">›</button>
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 text-center text-[.6rem] tracking-wide uppercase text-ink-4 mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array(first).fill(null).map((_, i) => <div key={i} />)}
                {Array.from({ length: days }, (_, i) => i + 1).map(d => {
                  const dt = new Date(cal.year, cal.month, d)
                  const isPast = dt < today
                  const isSun = dt.getDay() === 0
                  const isSelected = selDate?.getDate() === d && selDate?.getMonth() === cal.month && selDate?.getFullYear() === cal.year
                  const isToday = dt.getTime() === today.getTime()
                  return (
                    <button
                      key={d}
                      disabled={isPast || isSun}
                      onClick={() => { setDate(new Date(cal.year, cal.month, d)); setSlot(null) }}
                      className={`h-8 rounded-md text-sm transition-all cursor-pointer border-none font-sans
                        ${isPast || isSun ? 'text-ivory-4 cursor-not-allowed bg-transparent' : ''}
                        ${!isPast && !isSun && !isSelected ? 'bg-ivory-2 text-ink hover:bg-green-6 hover:text-green' : ''}
                        ${isSelected ? 'bg-green text-ivory' : ''}
                        ${isToday && !isSelected ? 'border border-terra-3 bg-ivory-2' : ''}
                      `}
                    >{d}</button>
                  )
                })}
              </div>
            </div>

            {selDate && (
              <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft">
                <div className="font-serif text-base text-ink mb-3">Available slots — {selDateStr}</div>
                <div className="grid grid-cols-3 gap-2">
                  {SLOTS.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSlot(slot)}
                      className={`py-2 text-sm border rounded-md cursor-pointer font-sans transition-all
                        ${selSlot === slot ? 'bg-green text-ivory border-green' : 'bg-white text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green hover:bg-green-6'}`}
                    >{slot}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white border border-ivory-3 rounded-xl p-5 shadow-soft">
            <div className="font-serif text-lg text-ink mb-4">Your Details</div>
            <div className="bg-green-6 border border-green-5 rounded-lg px-4 py-3 flex items-center gap-2.5 mb-5">
              <span className="text-lg">📅</span>
              <span className="text-sm text-ink-3">{summaryText}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="input" />
              </div>
              <div>
                <label className="text-xs text-ink-3 block mb-1.5">WhatsApp Number *</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" type="tel" className="input" />
              </div>
              <div>
                <label className="text-xs text-ink-3 block mb-1.5">What would you like to see?</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(v => (
                    <button key={v} onClick={() => toggleInterest(v)}
                      className={`px-3 py-1.5 rounded-full text-xs border font-sans cursor-pointer transition-all ${interests.includes(v) ? 'bg-green text-ivory border-green' : 'bg-transparent text-ink-3 border-ivory-3 hover:border-green-4 hover:text-green'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Platform</label>
                <div className="flex gap-2">
                  {[['whatsapp','📱 WhatsApp Video'],['meet','💻 Google Meet']].map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, platform: val }))}
                      className={`px-4 py-2 rounded-lg text-xs border font-sans cursor-pointer transition-all ${form.platform === val ? 'bg-green text-ivory border-green' : 'bg-transparent text-ink-3 border-ivory-3'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-3 block mb-1.5">Questions? <span className="text-ink-4">(optional)</span></label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="e.g. I want to compare Mamra vs Australian almonds…" className="input resize-none" />
              </div>
              <button onClick={confirm} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
                <span>{loading ? 'Booking…' : 'Confirm Appointment'}</span>
              </button>
              <p className="text-xs text-ink-4 text-center">We'll confirm your slot on WhatsApp within 1 hour</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
