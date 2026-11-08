'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Candy,
  Check,
  ChefHat,
  Coffee,
  Cookie,
  CookingPot,
  Dumbbell,
  Gift,
  Heart,
  HeartPulse,
  Info,
  Leaf,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  SendHorizontal,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Truck,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { Product } from '@/lib/supabase'
import { useCart } from '@/lib/store'
import { cartLineKey } from '@/lib/pricing'
import { FREE_SHIPPING_THRESHOLD, formatPrice, whatsappUrl } from '@/lib/utils'
import { openCart, useAddMany, useCartSummary, useLineQuantity, useQuickAdd, useSetLineQuantity } from '../_lib/cart'
import { baseGrams, canQuickAdd, cashbackOn, defaultVariant, displayName, gramsLabel, localName, priceAt, productHref, weightChoices } from '../_lib/shared'
import {
  AUDIENCES,
  BUDGETS,
  DISHES,
  FOCUS,
  GIFT_PICKS,
  SNACKS,
  SYNONYMS,
  type Audience,
  type Budget,
  type DishId,
  type FocusId,
  type GuideData,
  type ItemSpec,
  type SnackId,
} from './data'

/* ------------------------------------------------------------------ */
/* Small shared bits                                                   */
/* ------------------------------------------------------------------ */

function useHydrated() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready
}

type Line = { product: Product; grams: number; note?: string }

function Thumb({ product, sizes, className = '' }: { product: Product; sizes: string; className?: string }) {
  const image = product.images?.[0]
  const name = displayName(product.name)
  return image ? (
    <Image src={image} alt={name} fill sizes={sizes} className={`object-cover ${className}`} />
  ) : (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#DDF0EC] p-2 text-center text-[#0F5257]">
      <Leaf size={20} aria-hidden />
      <span className="text-[10px] font-extrabold leading-tight">{name}</span>
    </span>
  )
}

/** Compact product card used inside chat bubbles and the browse row. */
export function AskProductCard({
  product,
  initialGrams,
  className = 'w-[168px] shrink-0 snap-start sm:w-[178px]',
}: {
  product: Product
  initialGrams?: number
  className?: string
}) {
  const choices = weightChoices(product)
  const [grams, setGrams] = useState(initialGrams ?? baseGrams(product))
  const quantity = useLineQuantity(product, grams)
  const add = useQuickAdd()
  const setQuantity = useSetLineQuantity()
  const name = displayName(product.name)
  const sub = defaultVariant(product)?.name || localName(product.name)

  return (
    <article className={`flex flex-col rounded-2xl bg-white p-2 shadow-[0_8px_22px_-16px_rgba(15,82,87,0.55)] ring-1 ring-[#0F5257]/10 ${className}`}>
      <Link href={productHref(product)} className="group relative block aspect-square overflow-hidden rounded-xl bg-[#1E1813]">
        <Thumb product={product} sizes="190px" className="transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-2">
        <Link href={productHref(product)} className="line-clamp-2 min-h-[2.35rem] text-[13.5px] font-extrabold leading-tight text-[#1F2A2B] transition hover:text-[#0F5257]">
          {name}
        </Link>
        <div className="mt-0.5 h-4 truncate text-[11.5px] font-semibold text-[#5B6667]">{sub}</div>
        {choices.length > 1 && (
          <div role="radiogroup" aria-label={`Pack size for ${name}`} className="mt-2 grid grid-cols-3 gap-1">
            {choices.map(choice => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={grams === choice}
                onClick={() => setGrams(choice)}
                className={`h-8 rounded-lg text-[11px] font-extrabold transition ${
                  grams === choice ? 'bg-[#0F5257] text-white' : 'bg-[#F1EEE8] text-[#4A5556] hover:bg-[#DDF0EC]'
                }`}
              >
                {gramsLabel(choice)}
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-2.5">
          <div className="leading-tight">
            <div className="text-[15px] font-black text-[#1F2A2B]">{formatPrice(priceAt(product, grams))}</div>
            <div className="text-[10.5px] font-semibold text-[#5B6667]">{gramsLabel(grams)}</div>
          </div>
          {!canQuickAdd(product) ? (
            <Link href={productHref(product)} className="inline-flex h-10 items-center rounded-full border border-[#0F5257]/25 px-3 text-[12.5px] font-extrabold text-[#0F5257]">
              Options
            </Link>
          ) : quantity > 0 ? (
            <div className="flex h-10 w-[88px] items-center justify-between rounded-full bg-[#0F5257] text-white">
              <button type="button" aria-label={`Remove one ${name}`} onClick={() => setQuantity(product, grams, quantity - 1)} className="flex h-10 w-8 items-center justify-center rounded-l-full transition hover:bg-[#0B3F43]">
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="text-sm font-black tabular-nums" aria-live="polite">{quantity}</span>
              <button type="button" aria-label={`Add one more ${name}`} onClick={() => setQuantity(product, grams, quantity + 1)} className="flex h-10 w-8 items-center justify-center rounded-r-full transition hover:bg-[#0B3F43]">
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add(product, { grams })}
              aria-label={`Add ${name}, ${gramsLabel(grams)}`}
              className="inline-flex h-10 items-center gap-1 rounded-full bg-[#F59E4C] px-3.5 text-[13px] font-black text-[#1F2A2B] transition hover:bg-[#F08A2C] active:scale-[0.97]"
            >
              <Plus size={14} strokeWidth={3} aria-hidden /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/** Kits are customised on their own page (powder or whole, quantities), so we link there. */
function KitCard({ kit }: { kit: Product }) {
  const name = displayName(kit.name)
  const variants = (kit.variants || []) as { price?: number; items?: { name?: string }[] }[]
  const prices = variants.map(variant => Number(variant?.price) || 0).filter(price => price > 0)
  const from = prices.length ? Math.min(...prices) : kit.price
  const names = (variants[0]?.items || [])
    .map(item => displayName(String(item?.name || '')).replace(/\s*\([^)]*\)/g, '').trim())
    .filter(Boolean)
  const inside = names.length > 3 ? `${names.slice(0, 3).join(', ')} & ${names.length - 3} more` : names.join(', ')

  return (
    <article className="flex w-[232px] shrink-0 snap-start flex-col rounded-2xl bg-white p-2 shadow-[0_8px_22px_-16px_rgba(15,82,87,0.55)] ring-1 ring-[#0F5257]/10">
      <Link href={productHref(kit)} className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-[#1E1813]">
        <Thumb product={kit} sizes="232px" className="transition duration-500 group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded-full bg-[#F59E4C] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#1F2A2B]">Kit</span>
      </Link>
      <div className="flex flex-1 flex-col px-1 pt-2">
        <div className="text-[14px] font-extrabold leading-tight text-[#1F2A2B]">{name}</div>
        {inside && <div className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-[#5B6667]">Inside: {inside}</div>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="text-[11px] font-semibold leading-tight text-[#5B6667]">
            from
            <span className="block text-[15px] font-black text-[#1F2A2B]">{formatPrice(from)}</span>
          </div>
          <Link href={productHref(kit)} className="inline-flex h-10 items-center gap-1 rounded-full bg-[#0F5257] px-3.5 text-[12.5px] font-black text-white transition hover:bg-[#0B3F43]">
            Choose <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** A gift set: several pouches added to the cart in one tap. */
function SetCard({ name, line, lines }: { name: string; line?: string; lines: Line[] }) {
  const addMany = useAddMany()
  const [added, setAdded] = useState(false)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const total = lines.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0)
  const tiles = lines.slice(0, 4)
  const extra = lines.length - 4

  return (
    <article className="flex w-[214px] shrink-0 snap-start flex-col rounded-2xl bg-white p-2 shadow-[0_8px_22px_-16px_rgba(15,82,87,0.55)] ring-1 ring-[#0F5257]/10">
      <div className={`grid aspect-[4/3] gap-1 overflow-hidden rounded-xl bg-[#1E1813] ${tiles.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
        {tiles.map((item, index) => (
          <Link
            key={item.product.id}
            href={productHref(item.product)}
            className={`relative block overflow-hidden ${tiles.length === 3 && index === 0 ? 'row-span-2' : ''}`}
          >
            <Thumb product={item.product} sizes="120px" />
            {index === 3 && extra > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[15px] font-black text-white">+{extra}</span>
            )}
          </Link>
        ))}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-2">
        <div className="text-[14px] font-extrabold leading-tight text-[#1F2A2B]">{name}</div>
        {line && <div className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-[#5B6667]">{line}</div>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="leading-tight">
            <div className="text-[16px] font-black text-[#1F2A2B]">{formatPrice(total)}</div>
            {total >= FREE_SHIPPING_THRESHOLD ? (
              <div className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#0F7A47]">
                <Truck size={11} aria-hidden /> Free delivery
              </div>
            ) : (
              <div className="text-[10.5px] font-semibold text-[#5B6667]">{lines.length} pouches</div>
            )}
          </div>
          <button
            type="button"
            aria-label={`Add ${name} to cart`}
            onClick={() => {
              addMany(lines, { message: `Added ${name} to your cart` })
              setAdded(true)
              window.clearTimeout(timer.current)
              timer.current = window.setTimeout(() => setAdded(false), 2400)
            }}
            className={`inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[13px] font-black transition active:scale-[0.97] ${
              added ? 'bg-[#0F5257] text-white' : 'bg-[#F59E4C] text-[#1F2A2B] hover:bg-[#F08A2C]'
            }`}
          >
            {added ? (
              <>
                <Check size={14} strokeWidth={3} aria-hidden /> Added
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={3} aria-hidden /> Add set
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

/** Every Mana ingredient for a dish, ticked by default; one tap adds the ticked ones. */
function RecipeCard({ dish, lines }: { dish: DishId; lines: Line[] }) {
  const info = DISHES[dish]
  const addMany = useAddMany()
  const [checked, setChecked] = useState<boolean[]>(() => lines.map(() => true))
  const [added, setAdded] = useState(false)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const chosen = lines.filter((_, index) => checked[index])
  const total = chosen.reduce((sum, item) => sum + priceAt(item.product, item.grams), 0)

  return (
    <div className="mt-2 w-full max-w-[540px] rounded-2xl bg-white shadow-[0_8px_22px_-16px_rgba(15,82,87,0.55)] ring-1 ring-[#0F5257]/10">
      <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-[#FFF1E2] px-4 py-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9A4A0B]">Recipe</div>
          <div className="text-[17px] font-black leading-tight text-[#1F2A2B]">{info.name}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {info.meta.map(item => (
            <span key={item} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#4A5556]">
              {item}
            </span>
          ))}
        </div>
      </div>
      <ul className="px-2 py-1">
        {lines.map((item, index) => (
          <li key={item.product.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[#F6F3EE]">
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() => setChecked(list => list.map((value, i) => (i === index ? !value : value)))}
                className="h-5 w-5 shrink-0 accent-[#0F5257]"
              />
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#1E1813]">
                <Thumb product={item.product} sizes="40px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`line-clamp-2 block text-[14px] font-bold leading-tight ${checked[index] ? 'text-[#1F2A2B]' : 'text-[#8A9394] line-through'}`}>
                  {displayName(item.product.name)}
                </span>
                <span className="block text-[11.5px] text-[#5B6667]">
                  {gramsLabel(item.grams)}
                  {item.note ? ` · ${item.note}` : ''}
                </span>
              </span>
              <span className="text-[14px] font-extrabold tabular-nums text-[#1F2A2B]">{formatPrice(priceAt(item.product, item.grams))}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="px-4 text-[12.5px] leading-relaxed text-[#5B6667]">
        <b className="font-extrabold text-[#3B4748]">From your kitchen:</b> {info.kitchen}
      </div>
      <details className="group px-4 pt-1 text-[13px] leading-relaxed text-[#3B4748]">
        <summary className="cursor-pointer list-none py-1.5 font-extrabold text-[#0F5257] [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">How to make it ▾</span>
          <span className="hidden group-open:inline">Hide the steps ▴</span>
        </summary>
        <ol className="list-decimal space-y-1 pb-1 pl-5">
          {info.steps.map(step => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
      <div className="sticky -bottom-4 z-10 rounded-b-2xl bg-white p-3 pt-2 shadow-[0_-10px_18px_-16px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          disabled={!chosen.length}
          onClick={() => {
            addMany(chosen, { message: `Added ingredients for ${info.name}` })
            setAdded(true)
            window.clearTimeout(timer.current)
            timer.current = window.setTimeout(() => setAdded(false), 2400)
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0F5257] px-4 text-[15px] font-black text-white transition hover:bg-[#0B3F43] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {added ? (
            <>
              <Check size={17} strokeWidth={3} aria-hidden /> Added to your cart
            </>
          ) : (
            <>
              Add {chosen.length} ingredient{chosen.length === 1 ? '' : 's'} · {formatPrice(total)}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function ContactButtons() {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <a
        href={whatsappUrl('Hi Mana! I need some help choosing.')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-[14px] font-extrabold text-[#0B3B22] transition hover:brightness-95"
      >
        <MessageCircle size={17} aria-hidden /> Chat on WhatsApp
      </a>
      <Link
        href="/appointment"
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#0F5257] bg-white px-4 text-[14px] font-extrabold text-[#0F5257] transition hover:bg-[#DDF0EC]"
      >
        <Video size={17} aria-hidden /> Book a free video call
      </Link>
    </div>
  )
}

function Avatar({ logo }: { logo: string }) {
  return (
    <span className="relative block h-8 w-8 overflow-hidden rounded-full bg-white ring-2 ring-[#DDF0EC]">
      <Image src={logo} alt="" fill sizes="32px" className="object-contain p-0.5" />
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* The guide                                                            */
/* ------------------------------------------------------------------ */

type Step = 'start' | 'gift-who' | 'gift-budget' | 'health' | 'snacks' | 'cooking' | 'after'
type Flow = 'gift' | 'health' | 'snacks' | 'cooking' | 'best' | 'person' | 'search' | null
type Card = { type: 'product'; id: string; grams?: number } | { type: 'kit'; id: string } | { type: 'set'; pickId: string }
type BotReply = {
  text?: string
  cards?: Card[]
  dish?: DishId
  contact?: boolean
  note?: { text: string; cta?: { label: string; href: string } }
}
type Message = ({ from: 'user'; text: string } | ({ from: 'bot' } & BotReply)) & { id: number }
type Chip = { id: string; label: string; icon?: LucideIcon; href?: string }

const INITIAL: Message[] = [
  { id: 1, from: 'bot', text: 'Namaste! I’m Mana’s shopping guide.' },
  { id: 2, from: 'bot', text: 'Tell me what you’re shopping for and I’ll pick from our shop. You can add things right here in the chat.' },
]

const START_CHIPS: Chip[] = [
  { id: 'gift', label: 'A gift', icon: Gift },
  { id: 'health', label: 'Health & wellness', icon: Leaf },
  { id: 'snacks', label: 'Healthy snacks', icon: Cookie },
  { id: 'cooking', label: 'Cooking', icon: CookingPot },
  { id: 'best', label: 'Show bestsellers', icon: Star },
  { id: 'person', label: 'Talk to a person', icon: MessageCircle },
]

const STEP_CHIPS: Record<Exclude<Step, 'after'>, Chip[]> = {
  start: START_CHIPS,
  'gift-who': [
    { id: 'family', label: AUDIENCES.family.label, icon: Heart },
    { id: 'friends', label: AUDIENCES.friends.label, icon: Sparkles },
    { id: 'team', label: AUDIENCES.team.label, icon: Users },
  ],
  'gift-budget': (Object.keys(BUDGETS) as Budget[]).map(id => ({ id, label: BUDGETS[id].label })),
  health: [
    { id: 'hair', label: FOCUS.hair.label, icon: Sparkles },
    { id: 'strength', label: FOCUS.strength.label, icon: Dumbbell },
    { id: 'digestion', label: FOCUS.digestion.label, icon: Sprout },
    { id: 'winter', label: FOCUS.winter.label, icon: Snowflake },
    { id: 'sugar', label: FOCUS.sugar.label, icon: HeartPulse },
    { id: 'summer', label: FOCUS.summer.label, icon: Sun },
  ],
  snacks: [
    { id: 'sweet', label: SNACKS.sweet.label, icon: Candy },
    { id: 'savoury', label: SNACKS.savoury.label, icon: Cookie },
    { id: 'protein', label: SNACKS.protein.label, icon: Dumbbell },
  ],
  cooking: [
    { id: 'kheer', label: DISHES.kheer.label, icon: CookingPot },
    { id: 'chai', label: DISHES.chai.label, icon: Coffee },
    { id: 'laddoo', label: DISHES.laddoo.label, icon: Cookie },
    { id: 'biryani', label: DISHES.biryani.label, icon: ChefHat },
  ],
}

const AGAIN: Partial<Record<NonNullable<Flow>, Chip>> = {
  gift: { id: 'again', label: 'Another budget', icon: Gift },
  health: { id: 'again', label: 'Another focus', icon: Leaf },
  snacks: { id: 'again', label: 'Another kind of snack', icon: Cookie },
  cooking: { id: 'again', label: 'Another dish', icon: CookingPot },
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six']

/** Shown before the first question, to show you can also just type. */
const EXAMPLES = ['Gift for my brother under ₹1,000', 'Something for hair care', 'Ingredients for kheer', 'Do you have badam?']

const STOP_WORDS = new Set([
  'i', 'want', 'need', 'some', 'for', 'a', 'an', 'the', 'me', 'show', 'buy', 'please', 'do', 'you', 'have', 'of', 'and', 'to', 'with',
  'my', 'is', 'any', 'get', 'looking', 'something', 'good', 'pure', 'online', 'price', 'kg', 'g', 'gm', 'gram', 'grams', 'hai', 'chahiye',
])

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function detectAudience(text: string): Audience | null {
  if (/\b(team|office|colleagues?|staff|employees?|clients?|corporate|boss)\b/.test(text)) return 'team'
  if (/\b(friends?|dost|bestie)\b/.test(text)) return 'friends'
  if (/\b(family|parents?|mom|mum|maa|mother|dad|papa|father|sister|brother|bhai|bhaiya|didi|behen|relatives?|in-?laws?|grand(?:ma|pa|parents?)|nani|dadi)\b/.test(text)) return 'family'
  return null
}

function detectBudget(text: string): Budget | null {
  const match = text.match(/(?:under|below|upto|up to|within|budget|around|about|₹|rs\.?|inr)\s*(\d[\d,]*)\s*(k)?/)
  if (!match) return null
  const value = Number(match[1].replace(/,/g, '')) * (match[2] ? 1000 : 1)
  if (!value) return null
  if (value <= 500) return 'under'
  if (value <= 1000) return 'mid'
  return 'high'
}

const DISH_PATTERNS: [DishId, RegExp][] = [
  ['kheer', /\bkheer\b/],
  ['chai', /\b(chai|tea)\b/],
  ['laddoo', /\b(laddoo|ladoo|laddu|ladu|laddus|laddoos)\b/],
  ['biryani', /\b(biryani|biriyani|pulao)\b/],
]

const FOCUS_PATTERNS: [FocusId, RegExp][] = [
  ['hair', /\bhair\b/],
  ['sugar', /\b(sugar|diabet\w*)\b/],
  ['digestion', /\b(digest\w*|gut|constipation|acidity|stomach)\b/],
  ['winter', /\b(winter|cold|cough|kadha|sardi)\b/],
  ['summer', /\b(summer|cooling|heat)\b/],
  ['strength', /\b(gym|strength|stamina|energy|workout|ashwagandha)\b/],
]

export function AskChat({ data, logo }: { data: GuideData; logo: string }) {
  const { count } = useCartSummary()
  const [messages, setMessages] = useState<Message[]>(INITIAL)
  const [step, setStep] = useState<Step>('start')
  const [flow, setFlow] = useState<Flow>(null)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const memory = useRef<{ who?: Audience; budget?: Budget }>({})
  const nextId = useRef(10)
  const timers = useRef<number[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const lastUserId = useRef<number | null>(null)
  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pending = timers.current
    return () => pending.forEach(timer => window.clearTimeout(timer))
  }, [])

  // Keep the conversation readable: the newest question sits at the top of the chat window,
  // with the answer below it. Only the chat panel scrolls, never the page.
  useEffect(() => {
    const list = listRef.current
    if (!list || lastUserId.current === null) return
    const bubble = list.querySelector<HTMLElement>(`[data-msg="${lastUserId.current}"]`)
    if (!bubble) return
    const top = Math.max(0, Math.min(bubble.offsetTop - 12, list.scrollHeight - list.clientHeight))
    list.scrollTo({ top, behavior: reduceMotion.current ? 'auto' : 'smooth' })
  }, [messages, typing, step])

  /* ---------- catalogue lookups ---------- */
  const productFor = (keyword: string) => {
    const id = data.ids[keyword]
    return id ? data.products[id] : undefined
  }
  const linesFor = (items: ItemSpec[]) =>
    items.map((item): Line | null => {
      const product = productFor(item.keyword)
      return product && canQuickAdd(product) ? { product, grams: item.grams, note: item.note } : null
    })

  function giftPicks(who: Audience, budget: Budget) {
    const range = BUDGETS[budget]
    const priced = GIFT_PICKS.flatMap(pick => {
      const lines = linesFor(pick.items)
      if (lines.some(line => !line)) return []
      const total = (lines as Line[]).reduce((sum, line) => sum + priceAt(line.product, line.grams), 0)
      return total >= range.min && total <= range.max ? [{ pick, lines: lines as Line[], total }] : []
    })
    priced.sort(
      (a, b) =>
        Number(!a.pick.audiences.includes(who)) - Number(!b.pick.audiences.includes(who)) ||
        Math.abs(a.total - range.target) - Math.abs(b.total - range.target)
    )
    return priced.slice(0, 3)
  }

  function searchProducts(text: string) {
    const tokens = normalise(text)
      .split(' ')
      .filter(token => token.length > 1 && !STOP_WORDS.has(token))
      .map(token => SYNONYMS[token] ?? token)
    if (!tokens.length) return []
    const scored = Object.values(data.products).map(product => {
      const name = normalise(`${product.name} ${product.slug.replace(/-/g, ' ')} ${localName(product.name)}`)
      const extra = normalise(`${product.category.replace(/-/g, ' ')} ${(product.tags || []).filter(tag => !String(tag).startsWith('badge:')).join(' ')}`)
      let score = 0
      for (const token of tokens) {
        const stem = token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token
        if (name.includes(token) || name.includes(stem)) score += 3
        else if (extra.includes(token) || extra.includes(stem)) score += 1
      }
      return { product, score }
    })
    return scored
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score || Number(!a.product.images?.[0]) - Number(!b.product.images?.[0]))
      .slice(0, 6)
      .map(entry => entry.product)
  }

  /* ---------- conversation ---------- */
  function say(userText: string | null, replies: BotReply[], next: Step, nextFlow?: Flow) {
    timers.current.forEach(timer => window.clearTimeout(timer))
    timers.current = []
    if (userText) {
      const id = nextId.current++
      lastUserId.current = id
      setMessages(list => [...list, { id, from: 'user', text: userText }])
    }
    if (nextFlow !== undefined) setFlow(nextFlow)
    const deliver = (reply: BotReply) => {
      const id = nextId.current++
      setMessages(list => [...list, { id, from: 'bot', ...reply }])
    }
    if (reduceMotion.current || !replies.length) {
      replies.forEach(deliver)
      setTyping(false)
      setStep(next)
      return
    }
    setTyping(true)
    replies.forEach((reply, index) => {
      const timer = window.setTimeout(() => {
        deliver(reply)
        if (index === replies.length - 1) {
          setTyping(false)
          setStep(next)
        }
      }, 480 + index * 620)
      timers.current.push(timer)
    })
  }

  function showGift(label: string | null, who: Audience, budget: Budget) {
    const picks = giftPicks(who, budget)
    const audience = AUDIENCES[who]
    const hamper =
      who === 'team'
        ? {
            text: 'Gifting a whole team or your clients? Tell us the headcount and budget. We put together custom hampers and handle bulk orders.',
            cta: { label: 'Plan it on WhatsApp', href: whatsappUrl('Hi Mana, corporate gifting enquiry: __ people, budget ₹__ each.') },
          }
        : {
            text: 'Want it in a gift box with a note? Message us. We make custom hampers.',
            cta: { label: 'Ask about a hamper', href: whatsappUrl('Hi Mana! I would like a custom gift hamper.') },
          }
    if (!picks.length) {
      say(label, [{ text: `I couldn’t find a good match ${BUDGETS[budget].phrase}. Our team can put something together for you:`, contact: true }], 'after', 'gift')
      return
    }
    const cards: Card[] = picks.map(({ pick, lines }) =>
      lines.length === 1 ? { type: 'product', id: lines[0].product.id, grams: lines[0].grams } : { type: 'set', pickId: pick.id }
    )
    say(
      label,
      [
        { text: `Here ${picks.length === 1 ? 'is one idea' : `are ${NUMBER_WORDS[picks.length]} ideas`} for ${audience.phrase}, ${BUDGETS[budget].phrase}:`, cards },
        { note: hamper },
      ],
      'after',
      'gift'
    )
  }

  function showHealth(label: string | null, focusId: FocusId) {
    const focus = FOCUS[focusId]
    const cards: Card[] = []
    const kit = focus.kit ? productFor(focus.kit) : undefined
    if (kit) cards.push({ type: 'kit', id: kit.id })
    for (const keyword of focus.picks) {
      const product = productFor(keyword)
      if (product) cards.push({ type: 'product', id: product.id })
    }
    say(label, [{ text: focus.intro, cards }, { note: { text: `${focus.note} General information, not medical advice.` } }], 'after', 'health')
  }

  function showSnacks(label: string | null, snackId: SnackId) {
    const snack = SNACKS[snackId]
    const cards: Card[] = snack.keywords.flatMap(keyword => {
      const product = productFor(keyword)
      return product ? [{ type: 'product' as const, id: product.id }] : []
    })
    say(label, [{ text: snack.intro, cards }], 'after', 'snacks')
  }

  function showDish(label: string | null, dishId: DishId) {
    say(label, [{ text: DISHES[dishId].intro, dish: dishId }], 'after', 'cooking')
  }

  function showBest(label: string | null) {
    say(label, [{ text: 'These are the ones people re-order most:', cards: data.bestsellers.map(id => ({ type: 'product' as const, id })) }], 'after', 'best')
  }

  function showPerson(label: string | null) {
    say(
      label,
      [{ text: 'Of course. Our team is happy to help. Message us on WhatsApp, or book a free video call and we’ll show you the products live (no obligation).', contact: true }],
      'after',
      'person'
    )
  }

  function choose(chip: Chip) {
    if (typing) return
    const label = chip.label
    switch (chip.id) {
      case 'gift':
        memory.current = {}
        return say(label, [{ text: 'Lovely! Who is it for?' }], 'gift-who', 'gift')
      case 'health':
        return say(label, [{ text: 'Happy to help. What would you like to focus on?' }], 'health', 'health')
      case 'snacks':
        return say(label, [{ text: 'Nice! What kind of snack are you in the mood for?' }], 'snacks', 'snacks')
      case 'cooking':
        return say(label, [{ text: 'What are you making?' }], 'cooking', 'cooking')
      case 'best':
        return showBest(label)
      case 'person':
        return showPerson(label)
      case 'restart':
        return say(label, [{ text: 'Sure! What else can I help you find?' }], 'start', null)
      case 'cart':
        openCart()
        return
      case 'again':
        if (flow === 'gift') {
          memory.current.budget = undefined
          return say(label, [{ text: 'Sure. What budget should I look at?' }], 'gift-budget')
        }
        if (flow === 'health') return say(label, [{ text: 'Of course. What would you like to focus on?' }], 'health')
        if (flow === 'snacks') return say(label, [{ text: 'Sure. What kind of snack?' }], 'snacks')
        return say(label, [{ text: 'What else are you making?' }], 'cooking')
    }
    if (step === 'gift-who') {
      const who = chip.id as Audience
      memory.current.who = who
      if (memory.current.budget) return showGift(label, who, memory.current.budget)
      return say(label, [{ text: 'And roughly how much per gift?' }], 'gift-budget', 'gift')
    }
    if (step === 'gift-budget') {
      const budget = chip.id as Budget
      memory.current.budget = budget
      return showGift(label, memory.current.who || 'family', budget)
    }
    if (step === 'health') return showHealth(label, chip.id as FocusId)
    if (step === 'snacks') return showSnacks(label, chip.id as SnackId)
    if (step === 'cooking') return showDish(label, chip.id as DishId)
  }

  /** Free text: understand a few intents, otherwise search the catalogue. */
  function route(text: string) {
    const lower = text.toLowerCase()
    for (const [dishId, pattern] of DISH_PATTERNS) if (pattern.test(lower)) return showDish(text, dishId)
    const who = detectAudience(lower)
    const budget = detectBudget(lower)
    if (/\b(gifts?|gifting|hampers?|shagun|diwali|bhai ?dooj|wedding|present)\b/.test(lower) || (who && budget)) {
      memory.current = { who: who ?? undefined, budget: budget ?? undefined }
      if (who && budget) return showGift(text, who, budget)
      if (who) return say(text, [{ text: 'Lovely! And roughly how much per gift?' }], 'gift-budget', 'gift')
      return say(text, [{ text: budget ? `Got it, ${BUDGETS[budget].phrase}. Who is it for?` : 'Lovely! Who is it for?' }], 'gift-who', 'gift')
    }
    if (/\b(human|person|people|call|talk|agent|whatsapp|someone|help)\b/.test(lower)) return showPerson(text)
    for (const [focusId, pattern] of FOCUS_PATTERNS) if (pattern.test(lower)) return showHealth(text, focusId)
    if (/\bprotein\b/.test(lower)) return showSnacks(text, 'protein')
    if (/\bsweet\b/.test(lower)) return showSnacks(text, 'sweet')
    if (/\b(snacks?|munch\w*|crunchy)\b/.test(lower)) return say(text, [{ text: 'Nice! What kind of snack are you in the mood for?' }], 'snacks', 'snacks')
    if (/\b(cook\w*|recipes?)\b/.test(lower)) return say(text, [{ text: 'What are you making?' }], 'cooking', 'cooking')
    if (/\b(best ?sellers?|popular|top|trending)\b/.test(lower)) return showBest(text)
    const results = searchProducts(text)
    if (results.length) {
      const cards: Card[] = results.map(product => (product.category === 'kits' ? { type: 'kit', id: product.id } : { type: 'product', id: product.id }))
      return say(text, [{ text: results.length === 1 ? 'Found it:' : `Here’s what I found for “${text}”:`, cards }], 'after', 'search')
    }
    say(text, [{ text: `I couldn’t find “${text}” in our shop. Try another word, or ask our team. They’ll gladly help.`, contact: true }], 'after', 'search')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || typing) return
    setDraft('')
    route(text.slice(0, 80))
  }

  function restart() {
    timers.current.forEach(timer => window.clearTimeout(timer))
    timers.current = []
    memory.current = {}
    lastUserId.current = null
    setTyping(false)
    setFlow(null)
    setStep('start')
    setMessages(INITIAL)
    listRef.current?.scrollTo({ top: 0 })
  }

  const chips: Chip[] =
    step === 'after'
      ? [
          ...(flow && AGAIN[flow] ? [AGAIN[flow] as Chip] : []),
          { id: 'restart', label: 'Something else', icon: Sparkles },
          ...(count > 0
            ? [
                { id: 'cart', label: 'View cart', icon: ShoppingBag },
                { id: 'checkout', label: 'Checkout', icon: ArrowRight, href: '/checkout' },
              ]
            : []),
        ]
      : STEP_CHIPS[step]

  /* ---------- rendering ---------- */
  function renderCard(card: Card, key: string) {
    if (card.type === 'set') {
      const pick = GIFT_PICKS.find(item => item.id === card.pickId)
      if (!pick) return null
      const lines = linesFor(pick.items)
      if (lines.some(line => !line)) return null
      return <SetCard key={key} name={pick.name} line={pick.line} lines={lines as Line[]} />
    }
    const product = data.products[card.id]
    if (!product) return null
    if (card.type === 'kit') return <KitCard key={key} kit={product} />
    return <AskProductCard key={key} product={product} initialGrams={card.grams} />
  }

  return (
    <div
      id="ask-chat"
      className="flex h-[calc(100svh-15.75rem)] max-h-[680px] min-h-[480px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_70px_-34px_rgba(15,82,87,0.55)] ring-1 ring-black/5 lg:h-[660px]"
    >
      {/* Chat header */}
      <div className="flex items-center gap-3 bg-[#0F5257] px-4 py-3 text-white sm:px-5">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[#DDF0EC]">
          <Image src={logo} alt="" fill sizes="40px" className="object-contain p-1" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[16px] font-black">Mana guide</div>
          <div className="truncate text-[12px] font-semibold text-white/75">
            <span className="sm:hidden">Instant answers · no sign-up</span>
            <span className="hidden sm:inline">Quick guide · instant answers · no sign-up</span>
          </div>
        </div>
        <a
          href={whatsappUrl('Hi Mana! I need some help choosing.')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12.5px] font-bold transition hover:bg-white/20"
        >
          <MessageCircle size={15} aria-hidden /> <span className="hidden sm:inline">Talk to a person</span>
          <span className="sm:hidden">Person</span>
        </a>
      </div>

      {/* Conversation */}
      <div
        ref={listRef}
        role="log"
        aria-label="Conversation with the Mana guide"
        className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#FBF8F3] bg-[radial-gradient(rgba(15,82,87,0.07)_1px,transparent_1px)] px-3 py-4 [background-size:18px_18px] sm:px-5"
      >
        {messages.map((message, index) => {
          if (message.from === 'user') {
            return (
              <div key={message.id} data-msg={message.id} className="ask-in flex justify-end pl-12">
                <div className="rounded-2xl rounded-tr-md bg-[#0F5257] px-4 py-2.5 text-[15px] font-bold leading-snug text-white shadow-sm">{message.text}</div>
              </div>
            )
          }
          const firstOfGroup = index === 0 || messages[index - 1].from !== 'bot'
          return (
            <div key={message.id} data-msg={message.id} className="ask-in flex gap-2">
              <div className="w-8 shrink-0">{firstOfGroup && <Avatar logo={logo} />}</div>
              <div className="min-w-0 flex-1">
                {message.text && (
                  <div className="inline-block max-w-[94%] rounded-2xl rounded-tl-md bg-[#DDF0EC] px-4 py-2.5 text-[15px] leading-relaxed text-[#1F2A2B]">
                    {message.text}
                  </div>
                )}
                {message.cards && message.cards.length > 0 && (
                  <div className="-mr-3 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-3 [scrollbar-width:thin] sm:-mr-5 sm:pr-5">
                    {message.cards.map((card, cardIndex) => renderCard(card, `${message.id}-${cardIndex}`))}
                  </div>
                )}
                {message.dish && <RecipeCard dish={message.dish} lines={linesFor(DISHES[message.dish].items).filter((line): line is Line => Boolean(line))} />}
                {message.contact && <ContactButtons />}
                {message.note && (
                  <div className="mt-1 flex max-w-[94%] gap-2.5 rounded-2xl border border-[#0F5257]/15 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#3B4748]">
                    <Info size={16} className="mt-0.5 shrink-0 text-[#0F5257]" aria-hidden />
                    <div>
                      {message.note.text}
                      {message.note.cta && (
                        <a
                          href={message.note.cta.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-[13px] font-extrabold text-[#0B3B22] transition hover:brightness-95"
                        >
                          <MessageCircle size={15} aria-hidden /> {message.note.cta.label}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {typing && (
          <div className="flex gap-2" aria-label="The guide is typing">
            <div className="w-8 shrink-0">
              <Avatar logo={logo} />
            </div>
            <div className="flex h-10 items-center gap-1 rounded-2xl rounded-tl-md bg-[#DDF0EC] px-4">
              {[0, 160, 320].map(delay => (
                <span key={delay} className="h-2 w-2 rounded-full bg-[#0F5257]/60 motion-safe:animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}

        {!typing && chips.length > 0 && (
          <div role="group" aria-label="Quick replies" className="ask-in flex flex-wrap gap-2 pl-10 pt-1">
            {chips.map(chip => {
              const Icon = chip.icon
              const look =
                'inline-flex h-10 items-center gap-1.5 rounded-full border border-[#0F5257]/25 bg-white px-3.5 text-[14px] font-extrabold text-[#0F5257] shadow-[0_2px_6px_-3px_rgba(15,82,87,0.4)] transition hover:border-[#0F5257] hover:bg-[#DDF0EC] active:scale-[0.98]'
              return chip.href ? (
                <Link key={chip.id} href={chip.href} className={look}>
                  {Icon && <Icon size={16} aria-hidden />}
                  {chip.label}
                </Link>
              ) : (
                <button key={chip.id} type="button" onClick={() => choose(chip)} className={look}>
                  {Icon && <Icon size={16} aria-hidden />}
                  {chip.label}
                </button>
              )
            })}
          </div>
        )}

        {!typing && step === 'start' && messages.length === INITIAL.length && (
          <div className="ask-in hidden pl-10 pt-4 sm:block">
            <div className="text-[11.5px] font-black uppercase tracking-[0.14em] text-[#5B6667]">Or ask in your own words</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map(example => (
                <button
                  key={example}
                  type="button"
                  onClick={() => route(example)}
                  className="rounded-full border border-dashed border-[#0F5257]/40 bg-white/70 px-3.5 py-2 text-[13.5px] font-semibold text-[#2F3B3C] transition hover:border-solid hover:border-[#0F5257] hover:bg-white"
                >
                  “{example}”
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form id="ask-composer" onSubmit={submit} className="flex items-center gap-2 border-t border-[#0F5257]/10 bg-white p-2.5 sm:p-3">
        <button
          type="button"
          onClick={restart}
          aria-label="Start over"
          title="Start over"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#5B6667] transition hover:bg-[#F1EEE8] hover:text-[#0F5257]"
        >
          <RotateCcw size={18} />
        </button>
        <label htmlFor="ask-input" className="sr-only">
          Type what you are looking for
        </label>
        <input
          id="ask-input"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={80}
          placeholder="Try “kaju” or “gift”"
          className="h-11 min-w-0 flex-1 rounded-full bg-[#F3EFE8] px-4 text-[16px] font-semibold text-[#1F2A2B] outline-none placeholder:font-medium placeholder:text-[#77817F] focus-visible:ring-2 focus-visible:ring-[#0F5257]"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F5257] text-white transition hover:bg-[#0B3F43] disabled:opacity-40"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Basket                                                              */
/* ------------------------------------------------------------------ */

function DeliveryMeter({ total, tone = 'light' }: { total: number; tone?: 'light' | 'dark' }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))
  const dark = tone === 'dark'
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${dark ? 'text-white/85' : 'text-[#3B4748]'}`}>
        <Truck size={14} aria-hidden className={dark ? 'text-[#F59E4C]' : 'text-[#0F5257]'} />
        {total === 0 ? (
          <span>Free delivery on orders above {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
        ) : remaining > 0 ? (
          <span>
            Add <b className="font-black">{formatPrice(remaining)}</b> more for free delivery
          </span>
        ) : (
          <span>
            <b className="font-black">Free delivery</b> unlocked
          </span>
        )}
      </div>
      <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${dark ? 'bg-white/20' : 'bg-[#EDE8E0]'}`}>
        <div className="h-full rounded-full bg-[#F59E4C] transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

/** Live view of the real cart, beside the chat on larger screens. */
export function AskBasket() {
  const items = useCart(state => state.items)
  const updateQty = useCart(state => state.updateQty)
  const lines = useHydrated() ? items : []
  const count = lines.reduce((sum, item) => sum + item.quantity, 0)
  const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_70px_-40px_rgba(15,82,87,0.5)] ring-1 ring-black/5">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h2 className="text-[18px] font-black text-[#1F2A2B]">Your basket</h2>
        <span className="rounded-full bg-[#DDF0EC] px-2.5 py-0.5 text-[12px] font-extrabold text-[#0F5257]">
          {count} item{count === 1 ? '' : 's'}
        </span>
      </div>

      {lines.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
          <svg viewBox="0 0 120 96" className="h-24 w-28" aria-hidden>
            <ellipse cx="60" cy="86" rx="44" ry="6" fill="#EDE8E0" />
            <path d="M20 38h80l-9 40a8 8 0 0 1-8 6H37a8 8 0 0 1-8-6z" fill="#DDF0EC" stroke="#0F5257" strokeWidth="3" strokeLinejoin="round" />
            <path d="M40 38c0-14 9-24 20-24s20 10 20 24" fill="none" stroke="#0F5257" strokeWidth="3" strokeLinecap="round" />
            <circle cx="47" cy="30" r="7" fill="#F59E4C" />
            <circle cx="62" cy="27" r="6" fill="#C98A4B" />
            <circle cx="75" cy="31" r="6.5" fill="#8B5E34" />
            <path d="M44 54v16M60 54v16M76 54v16" stroke="#0F5257" strokeWidth="3" strokeLinecap="round" opacity=".35" />
          </svg>
          <p className="mt-3 text-[15px] font-extrabold text-[#1F2A2B]">Your picks will show up here</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#5B6667]">Add anything from the chat and it goes straight into your cart.</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2">
          {lines.map(item => (
            <li key={cartLineKey(item)} className="flex items-center gap-3 rounded-2xl bg-[#FBF8F3] p-2">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#1E1813]">
                {item.product_image ? <Image src={item.product_image} alt="" fill sizes="48px" className="object-cover" /> : null}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13.5px] font-extrabold text-[#1F2A2B]">{displayName(item.product_name)}</span>
                <span className="block truncate text-[11.5px] text-[#5B6667]">
                  {[item.variant_name, item.weight_grams ? gramsLabel(Number(item.weight_grams)) : ''].filter(Boolean).join(' · ')}
                </span>
                <span className="mt-0.5 block text-[13px] font-black text-[#1F2A2B]">{formatPrice(item.price * item.quantity)}</span>
              </span>
              <span className="flex h-8 items-center rounded-full bg-white ring-1 ring-[#0F5257]/15">
                <button
                  type="button"
                  aria-label={`Remove one ${displayName(item.product_name)}`}
                  onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1, item.weight_grams)}
                  className="flex h-8 w-7 items-center justify-center rounded-l-full text-[#0F5257] hover:bg-[#DDF0EC]"
                >
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className="w-5 text-center text-[13px] font-black tabular-nums">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Add one more ${displayName(item.product_name)}`}
                  onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1, item.weight_grams)}
                  className="flex h-8 w-7 items-center justify-center rounded-r-full text-[#0F5257] hover:bg-[#DDF0EC]"
                >
                  <Plus size={13} strokeWidth={3} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-black/5 p-4">
        <DeliveryMeter total={total} />
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-[#5B6667]">Subtotal</span>
          <span className="text-[20px] font-black text-[#1F2A2B]">{formatPrice(total)}</span>
        </div>
        {total > 0 && (
          <p className="-mt-1.5 text-[12px] font-semibold text-[#0F7A47]">You’ll get {formatPrice(cashbackOn(total))} back as wallet cashback after delivery.</p>
        )}
        <div className="flex gap-2">
          <Link
            href="/checkout"
            aria-disabled={!count}
            className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-[15px] font-black transition ${
              count ? 'bg-[#0F5257] text-white hover:bg-[#0B3F43]' : 'pointer-events-none bg-[#E6E1D8] text-[#8A9394]'
            }`}
          >
            Checkout <ArrowRight size={16} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="h-12 rounded-full border border-[#0F5257]/25 px-4 text-[13.5px] font-extrabold text-[#0F5257] transition hover:bg-[#DDF0EC]"
          >
            Full cart
          </button>
        </div>
      </div>
    </div>
  )
}

export function AskCartButton() {
  const { count, total } = useCartSummary()
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart (${count} item${count === 1 ? '' : 's'})`}
      className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#0F5257] px-3.5 text-white transition hover:bg-[#0B3F43]"
    >
      <ShoppingBag size={18} aria-hidden />
      <span className="hidden text-[14px] font-extrabold sm:inline">{count > 0 ? formatPrice(total) : 'Cart'}</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F59E4C] px-1 text-[11px] font-black text-[#1F2A2B] ring-2 ring-[#FAF6EF]">
          {count}
        </span>
      )}
    </button>
  )
}

/** Phone-only basket bar: shows once something is in the cart and the chat's composer is off screen. */
export function AskMobileBar() {
  const { count, total } = useCartSummary()
  const [composerVisible, setComposerVisible] = useState(true)

  useEffect(() => {
    const composer = document.getElementById('ask-composer')
    if (!composer || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setComposerVisible(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(composer)
    return () => observer.disconnect()
  }, [])

  if (!count) return null
  return (
    <>
      <div aria-hidden className="h-24 lg:hidden" />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition duration-300 lg:hidden ${
          composerVisible ? 'pointer-events-none translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={openCart}
          tabIndex={composerVisible ? -1 : 0}
          className="w-full rounded-2xl bg-[#0F5257] px-4 pb-3 pt-2.5 text-left text-white shadow-[0_16px_40px_-12px_rgba(15,82,87,0.7)]"
        >
          <DeliveryMeter total={total} tone="dark" />
          <span className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <ShoppingBag size={18} aria-hidden />
              <span className="leading-tight">
                <span className="block text-[11.5px] text-white/80">
                  {count} item{count === 1 ? '' : 's'}
                </span>
                <span className="block text-[15px] font-black">{formatPrice(total)}</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[14px] font-extrabold">
              View basket <ArrowRight size={16} aria-hidden />
            </span>
          </span>
        </button>
      </div>
    </>
  )
}
