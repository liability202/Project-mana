import { supabaseAdmin } from '@/lib/supabase'
import { getWalletSnapshot, normalizePhone } from '@/lib/commerce'
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppMessage } from './sender'
import { getAIAdvice, type AdviceHistoryMessage } from './ai'
import { createRazorpayLink } from './razorpay'

type SessionRecord = {
  phone: string
  state: string
  lang: string
  cart: Record<string, any>
  updated_at?: string
}

type ProductRow = {
  id: string
  name: string
  slug?: string
  category: string
  price: number
  price_per_unit: string
  in_stock: boolean
  tags?: string[] | null
  variants?: Array<{
    id?: string
    name?: string
    description?: string
    price?: number
    quality_tag?: 'basic' | 'popular' | 'best'
  }> | null
}

type CatalogChoice = {
  productId: string
  productName: string
  category: string
  tier: 'basic' | 'popular' | 'best'
  variantId?: string
  variantName: string
  variantDescription?: string
  unitPrice: number
  unitLabel: string
}

type ParsedProductRequest = {
  product: ProductRow
  requestedWeightGrams?: number
  countOnly?: number
}

type SelectedItem = {
  productId: string
  productName: string
  category: string
  requestedWeightGrams: number
  tier: 'basic' | 'popular' | 'best'
  variantId?: string
  variantName: string
  unitPrice: number
  unitLabel: string
  total: number
}

type BotTransport = {
  sendMessage: (phone: string, text: string) => Promise<void>
  sendList: (
    phone: string,
    buttonLabel: string,
    items: { id: string; title: string; description?: string }[],
    bodyText?: string
  ) => Promise<void>
  sendButtons: (
    phone: string,
    bodyText: string,
    buttons: { id: string; title: string }[]
  ) => Promise<void>
}

type ImageInfo = {
  mediaId: string
  mimeType?: string
  caption?: string
}

type HandleIncomingMessageOptions = {
  transport?: BotTransport
  imageInfo?: ImageInfo
  locationInfo?: { latitude?: number; longitude?: number; addressText?: string }
  audioInfo?: { mediaId: string; mimeType?: string }
}

type SupportIssueType = 'order_issue' | 'payment' | 'delivery' | 'damaged' | 'refund' | 'return' | 'other'

const OWNER_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919910899796'

const SMART_TRIGGERS = {
  order: ['order', 'buy', 'purchase', 'kharido', 'chahiye', 'lena', 'order karna'],
  track: ['track', 'tracking', 'kahan', 'status', 'delivery', 'order status'],
  help: ['help', 'support', 'problem', 'issue', 'complaint', 'refund'],
  menu: ['menu', 'home', 'main', '0', 'back', 'start', 'hi', 'hello', 'namaste', 'hey'],
  advice: ['advice', 'suggest', 'recommend', 'kya lun', 'best', 'good for', 'health'],
  account: ['wallet', 'balance', 'cashback', 'account', 'credit', 'points'],
  hair: ['hair', 'baal', 'hairfall', 'hair fall', 'hair kit', 'baalon'],
  almond: ['almond', 'badam', 'mamra'],
  saffron: ['saffron', 'kesar'],
  ashwag: ['ashwagandha', 'ashwaganda', 'shilajit'],
} as const

const PAYMENT_TRIGGERS = {
  paid: ['paid', 'payment done', 'payment successful', 'bhej diya'],
  failed: ['payment failed', 'not working', 'error', 'retry'],
} as const

const DEFAULT_SESSION: SessionRecord = {
  phone: '',
  state: 'GREETING',
  lang: 'English',
  cart: {},
}

const COMMON_ALIASES: Record<string, string[]> = {
  almond: ['almond', 'almonds', 'badam', 'badaam'],
  cashew: ['cashew', 'cashews', 'kaju', 'kaaju'],
  walnut: ['walnut', 'walnuts', 'akhrot'],
  raisin: ['raisin', 'raisins', 'kishmish'],
  date: ['date', 'dates', 'khajoor', 'khajur'],
  pistachio: ['pistachio', 'pistachios', 'pista'],
  chia: ['chia', 'chia seeds'],
  flax: ['flax', 'flax seeds', 'alsi'],
  pumpkin: ['pumpkin seeds', 'pumpkin'],
  ashwagandha: ['ashwagandha'],
  brahmi: ['brahmi'],
  triphala: ['triphala'],
  giloy: ['giloy'],
  mulethi: ['mulethi'],
  shatavari: ['shatavari'],
  turmeric: ['turmeric', 'haldi'],
  saffron: ['saffron', 'kesar'],
  cardamom: ['cardamom', 'elaichi'],
  cinnamon: ['cinnamon', 'dalchini'],
  cumin: ['cumin', 'jeera'],
}

function isHindi(lang: string) {
  return lang === 'Hindi'
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function containsAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function formatMoney(amountPaise: number) {
  return `Rs ${Math.round(amountPaise / 100)}`
}

function formatWeight(grams: number) {
  return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`
}

function parseBaseWeightGrams(label: string) {
  const match = label.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|g)/)
  if (!match) return 500
  const value = Number(match[1])
  return match[2] === 'kg' ? value * 1000 : value
}

function parseWeightGrams(text: string) {
  const match = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|g|gm|grams?)/)
  if (!match) return undefined
  const value = Number(match[1])
  return match[2].startsWith('k') ? Math.round(value * 1000) : Math.round(value)
}

function parseCountOnly(text: string) {
  const hasWeight = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|g|gm|grams?)/i.test(text)
  if (hasWeight) return undefined
  const match = text.trim().match(/^(\d+)\s*[x]?\s*[a-z]/i)
  return match ? Number(match[1]) : undefined
}

function getTierLabel(tier: CatalogChoice['tier']) {
  if (tier === 'basic') return 'Daily Use'
  if (tier === 'best') return 'Premium'
  return 'Best Seller'
}

function mapTierFromInput(input: string): CatalogChoice['tier'] | null {
  const msg = input.toLowerCase()
  if (msg.includes('q_basic') || msg.includes('basic') || msg === '1') return 'basic'
  if (msg.includes('q_top') || msg.includes('top') || msg.includes('premium') || msg === '3') return 'best'
  if (msg.includes('q_mid') || msg.includes('best seller') || msg.includes('popular') || msg === '2') return 'popular'
  return null
}

function parseWhatsAppDetails(input: string) {
  const parts = input.split('|').map((part) => part.trim()).filter(Boolean)
  if (parts.length < 4) return null

  const [customer_name, address, city, pincode] = parts
  if (!/^\d{6}$/.test(pincode)) return null

  return { customer_name, address, city, pincode }
}

function getProductAliases(product: ProductRow) {
  const values = new Set<string>()
  const name = normalize(product.name)
  const slug = normalize(product.slug || '')

  ;[name, slug, ...(product.tags || []).map((tag) => normalize(tag))].forEach((value) => {
    if (!value) return
    values.add(value)
    value.split(' ').forEach((part) => {
      if (part.length > 2) values.add(part)
    })
  })

  Object.entries(COMMON_ALIASES).forEach(([keyword, aliases]) => {
    if (name.includes(keyword) || slug.includes(keyword)) {
      aliases.forEach((alias) => values.add(normalize(alias)))
    }
  })

  return Array.from(values).filter(Boolean).sort((a, b) => b.length - a.length)
}

function splitProductMessage(input: string) {
  return input
    .split(/,|\n|&|\band\b/gi)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

function findProductInChunk(chunk: string, products: ProductRow[]) {
  const normalizedChunk = normalize(chunk)
  let bestMatch: { product: ProductRow; score: number } | null = null

  for (const product of products) {
    for (const alias of getProductAliases(product)) {
      if (!normalizedChunk.includes(alias)) continue
      const score = alias.length
      if (!bestMatch || score > bestMatch.score) bestMatch = { product, score }
    }
  }

  return bestMatch?.product
}

function parseProductRequests(input: string, products: ProductRow[]) {
  const chunks = splitProductMessage(input)
  const parsed: ParsedProductRequest[] = []

  for (const chunk of chunks) {
    const product = findProductInChunk(chunk, products)
    if (!product) continue

    parsed.push({
      product,
      requestedWeightGrams: parseWeightGrams(chunk),
      countOnly: parseCountOnly(chunk),
    })
  }

  return parsed
}

function buildProductContext(products: ProductRow[]) {
  return products
    .slice(0, 30)
    .map((product) => {
      const variants = (product.variants || [])
        .map((variant) => `${variant.name || 'Variant'} (${variant.quality_tag || 'standard'}) ${formatMoney(variant.price || product.price)}`)
        .join(', ')
      return `- ${product.name} | ${product.category} | ${formatMoney(product.price)} ${product.price_per_unit}${variants ? ` | variants: ${variants}` : ''}`
    })
    .join('\n')
}

function chooseVariant(product: ProductRow, tier?: CatalogChoice['tier']): CatalogChoice {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const selectedTier = product.category === 'herbs' ? 'popular' : (tier || 'popular')
  const fallbackOrder = selectedTier === 'best'
    ? ['best', 'popular', 'basic']
    : selectedTier === 'basic'
      ? ['basic', 'popular', 'best']
      : ['popular', 'best', 'basic']

  const variant = fallbackOrder
    .map((quality) => variants.find((item) => item.quality_tag === quality))
    .find(Boolean) || variants[0]

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    tier: (variant?.quality_tag as CatalogChoice['tier']) || selectedTier,
    variantId: variant?.id,
    variantName: variant?.name || product.name,
    variantDescription: variant?.description || product.price_per_unit,
    unitPrice: variant?.price || product.price,
    unitLabel: product.price_per_unit || 'per 500g',
  }
}

function buildSelectedItems(requests: ParsedProductRequest[], tier?: CatalogChoice['tier']) {
  return requests
    .filter((request) => request.requestedWeightGrams)
    .map((request) => {
      const choice = chooseVariant(request.product, request.product.category === 'herbs' ? undefined : tier)
      const baseWeight = parseBaseWeightGrams(choice.unitLabel)
      return {
        productId: choice.productId,
        productName: choice.productName,
        category: choice.category,
        requestedWeightGrams: request.requestedWeightGrams!,
        tier: choice.tier,
        variantId: choice.variantId,
        variantName: choice.variantName,
        unitPrice: choice.unitPrice,
        unitLabel: choice.unitLabel,
        total: Math.round(choice.unitPrice * (request.requestedWeightGrams! / baseWeight)),
      } satisfies SelectedItem
    })
}

function getWeightOptions(category: string) {
  if (category === 'spices') return [100, 250, 500]
  if (category === 'herbs') return [100, 200, 500]
  return [250, 500, 1000]
}

function quantityOptions() {
  return [
    { id: 'qty_1', title: '1 pack' },
    { id: 'qty_2', title: '2 packs' },
    { id: 'qty_3', title: '3 packs' },
  ]
}

function quantityMultiplier(input: string) {
  if (input === 'qty_2' || input.includes('2')) return 2
  if (input === 'qty_3' || input.includes('3')) return 3
  return 1
}

function formatListTranscript(bodyText: string | undefined, items: { title: string; description?: string }[]) {
  const lines = items.map((item, index) => `${index + 1}. ${item.title}${item.description ? ` - ${item.description}` : ''}`)
  return [bodyText || 'Choose an option:', ...lines].join('\n')
}

function formatButtonsTranscript(bodyText: string, buttons: { title: string }[]) {
  const lines = buttons.map((button, index) => `${index + 1}. ${button.title}`)
  return [bodyText, ...lines].join('\n')
}

function createDefaultTransport(): BotTransport {
  return {
    async sendMessage(phone, text) {
      await sendWhatsAppMessage(phone, text)
    },
    async sendList(phone, buttonLabel, items, bodyText) {
      await sendWhatsAppList(phone, buttonLabel, items, bodyText)
    },
    async sendButtons(phone, bodyText, buttons) {
      await sendWhatsAppButtons(phone, bodyText, buttons)
    },
  }
}

function createTranscriptTransport(transcript: string[]): BotTransport {
  return {
    async sendMessage(_phone, text) {
      transcript.push(text)
    },
    async sendList(_phone, _buttonLabel, items, bodyText) {
      transcript.push(formatListTranscript(bodyText, items))
    },
    async sendButtons(_phone, bodyText, buttons) {
      transcript.push(formatButtonsTranscript(bodyText, buttons))
    },
  }
}

function createRuntimeTransport(optionsTransport: BotTransport | undefined, transcript: string[]): BotTransport {
  const activeTransport = optionsTransport || createDefaultTransport()
  const transcriptTransport = createTranscriptTransport(transcript)

  return {
    async sendMessage(phone, text) {
      await activeTransport.sendMessage(phone, text)
      await transcriptTransport.sendMessage(phone, text)
    },
    async sendList(phone, buttonLabel, items, bodyText) {
      await activeTransport.sendList(phone, buttonLabel, items, bodyText)
      await transcriptTransport.sendList(phone, buttonLabel, items, bodyText)
    },
    async sendButtons(phone, bodyText, buttons) {
      await activeTransport.sendButtons(phone, bodyText, buttons)
      await transcriptTransport.sendButtons(phone, bodyText, buttons)
    },
  }
}

async function getSession(phone: string): Promise<SessionRecord> {
  const { data } = await supabaseAdmin
    .from('wa_sessions')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  if (data) return data as SessionRecord

  const fresh = { ...DEFAULT_SESSION, phone }
  await supabaseAdmin.from('wa_sessions').insert(fresh)
  return fresh
}

async function saveSession(phone: string, updates: Partial<SessionRecord>) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  await supabaseAdmin.from('wa_sessions').upsert({ phone, ...payload }, { onConflict: 'phone' })
}

async function fetchCategories() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('category')
    .eq('in_stock', true)
    .order('category', { ascending: true })

  if (error) throw error
  return Array.from(new Set((data || []).map((row) => row.category))).filter(Boolean)
}

async function fetchProductsByCategory(category: string) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id,name,slug,category,price,price_per_unit,in_stock,tags,variants')
    .eq('category', category)
    .eq('in_stock', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as ProductRow[]
}

async function fetchLiveCatalog() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id,name,slug,category,price,price_per_unit,in_stock,tags,variants')
    .eq('in_stock', true)
    .order('name', { ascending: true })
    .limit(50)

  if (error) throw error
  return (data || []) as ProductRow[]
}

async function showMenu(phone: string, lang: string, transport: BotTransport) {
  const body = isHindi(lang)
    ? 'Aaj hum aapki kaise madad karein?'
    : 'How can we help you today?'

  await transport.sendList(
    phone,
    'Options',
    [
      { id: 'menu_order', title: 'Order products' },
      { id: 'menu_track', title: 'Track my order' },
      { id: 'menu_advice', title: 'Get product advice' },
      { id: 'menu_support', title: 'Talk to support' },
    ],
    body
  )
}

async function showCategories(phone: string, lang: string, transport: BotTransport) {
  const categories = await fetchCategories()

  if (!categories.length) {
    await transport.sendMessage(
      phone,
      isHindi(lang)
        ? 'Abhi koi category available nahin hai. Kripya thodi der baad try karein.'
        : 'No categories are available right now. Please try again shortly.'
    )
    return
  }

  await transport.sendList(
    phone,
    'Category',
    categories.map((category, index) => ({
      id: `cat_${index + 1}`,
      title: category,
    })),
    isHindi(lang) ? 'Kripya category chunein:' : 'Please choose a category:'
  )
}

async function showOrderEntry(phone: string, lang: string, transport: BotTransport) {
  const categories = await fetchCategories()
  const rows = categories.slice(0, 8).map((category, index) => ({
    id: `cat_${index + 1}`,
    title: category,
  }))
  rows.push({ id: 'share_products', title: 'Share product names' })

  await transport.sendList(
    phone,
    'Order',
    rows,
    isHindi(lang)
      ? 'Category chunein ya product names bhejein.\n\nAap ek saath multiple products bhi bhej sakte hain.'
      : 'Choose a category or share product names.\n\nYou can also send multiple products at once.'
  )
}

async function showProductsForCategory(
  phone: string,
  lang: string,
  category: string,
  tier: CatalogChoice['tier'] | undefined,
  transport: BotTransport
) {
  const products = await fetchProductsByCategory(category)

  if (!products.length) {
    await transport.sendMessage(
      phone,
      isHindi(lang)
        ? 'Is category mein abhi koi product available nahin hai.'
        : 'No products are available in this category right now.'
    )
    return []
  }

  const choices = products.map((product) => chooseVariant(product, category === 'herbs' ? undefined : tier))
  await transport.sendList(
    phone,
    'Products',
    choices.map((choice) => ({
      id: `prod_${choice.productId}`,
      title: choice.productName,
      description: `${choice.unitLabel} - ${formatMoney(choice.unitPrice)}`,
    })),
    category === 'herbs'
      ? (isHindi(lang) ? 'Herbs selected. Product chunein:' : 'Herbs selected. Choose a product:')
      : (isHindi(lang) ? 'Product chunein:' : 'Please choose a product:')
  )

  return choices
}

async function sendQuote(phone: string, lang: string, items: SelectedItem[], transport: BotTransport) {
  const lines = items.map((item) => {
    const tierText = item.category === 'herbs' ? '' : ` | ${getTierLabel(item.tier)}`
    return `- ${item.productName} | ${formatWeight(item.requestedWeightGrams)}${tierText} | ${formatMoney(item.total)}`
  })
  const total = items.reduce((sum, item) => sum + item.total, 0)

  await transport.sendButtons(
    phone,
    `${isHindi(lang) ? 'Aapke selected products:' : 'Here are your selected products:'}\n\n${lines.join('\n')}\n\nTotal: ${formatMoney(total)}\n\n${isHindi(lang) ? 'Kya main proceed karun?' : 'Would you like to proceed?'}`,
    [
      { id: 'confirm_yes', title: 'Yes' },
      { id: 'confirm_no', title: 'Change' },
    ]
  )
}

function hydratePendingRequests(pending: any[], catalog: ProductRow[]) {
  return pending
    .map((item) => {
      const product = catalog.find((entry) => entry.id === item.productId)
      if (!product) return null
      return {
        product,
        requestedWeightGrams: item.requestedWeightGrams || undefined,
        countOnly: item.countOnly || undefined,
      } satisfies ParsedProductRequest
    })
    .filter(Boolean) as ParsedProductRequest[]
}

async function processSharedProductMessage(
  phone: string,
  lang: string,
  rawInput: string,
  existingCart: Record<string, any>,
  transport: BotTransport
) {
  const catalog = await fetchLiveCatalog()
  const parsed = parseProductRequests(rawInput, catalog)
  if (!parsed.length) return false

  const missingWeights = parsed.filter((item) => !item.requestedWeightGrams)
  if (missingWeights.length) {
    await saveSession(phone, {
      state: 'ORDER_WEIGHT_CLARIFY',
      cart: {
        ...existingCart,
        pending_requests: parsed.map((item) => ({
          productId: item.product.id,
          requestedWeightGrams: item.requestedWeightGrams || null,
          countOnly: item.countOnly || null,
        })),
      },
    })

    await transport.sendMessage(
      phone,
      isHindi(lang)
        ? `In products ke liye weight bhejein: ${missingWeights.map((item) => item.product.name).join(', ')}\n\nExample: Badam 500g, Kaju 250g`
        : `Please share the weight for: ${missingWeights.map((item) => item.product.name).join(', ')}\n\nExample: Almonds 500g, Cashews 250g`
    )
    return true
  }

  const needsQuality = parsed.some((item) => item.product.category !== 'herbs')
  if (needsQuality) {
    await saveSession(phone, {
      state: 'ORDER_QUALITY',
      cart: {
        ...existingCart,
        pending_requests: parsed.map((item) => ({
          productId: item.product.id,
          requestedWeightGrams: item.requestedWeightGrams || null,
        })),
      },
    })

    await transport.sendList(
      phone,
      'Quality',
      [
        { id: 'q_basic', title: 'Daily Use', description: 'Budget-friendly' },
        { id: 'q_mid', title: 'Best Seller', description: 'Most popular' },
        { id: 'q_top', title: 'Premium', description: 'Top quality' },
      ],
      isHindi(lang)
        ? 'Multiple products mile. Non-herbs ke liye quality chunein:'
        : 'Multiple products selected. Please choose a quality for the non-herb items:'
    )
    return true
  }

  const items = buildSelectedItems(parsed)
  await saveSession(phone, {
    state: 'ORDER_CONFIRM',
    cart: {
      ...existingCart,
      selected_items: items,
    },
  })
  await sendQuote(phone, lang, items, transport)
  return true
}

function getAIContext(cart: Record<string, any>): AdviceHistoryMessage[] {
  return Array.isArray(cart?.ai_context) ? cart.ai_context.slice(-10) : []
}

function trimAIContext(messages: AdviceHistoryMessage[]) {
  return messages.slice(-10)
}

function shouldRouteAdviceToOrder(message: string) {
  const normalized = message.toLowerCase()
  return ['order', 'buy', 'kharid', 'purchase'].some((keyword) => normalized.includes(keyword))
}

function buildAdviceIntro() {
  return `🌿 *Mana Product Advisor*

Hi! I'm your personal wellness advisor.
Tell me what you're looking for - a health goal, a specific herb, or just ask anything.

Examples:
- What helps with hair fall?
- Best dry fruits for diabetics
- How to use Triphala?
- Compare Mamra vs Australian almonds
- Herbs for stress and sleep

Type your question below.

Reply "0" to go back.`
}

function detectProductsFromText(text: string, catalog: ProductRow[]) {
  return catalog
    .filter((product) => getProductAliases(product).some((alias) => normalize(text).includes(alias)))
    .slice(0, 3)
}

async function sendAdviceNextSteps(
  phone: string,
  lang: string,
  reply: string,
  catalog: ProductRow[],
  transport: BotTransport
) {
  const matched = detectProductsFromText(reply, catalog)
  if (matched.length) {
    await transport.sendList(
      phone,
      'Next',
      [
        ...matched.map((product, index) => ({
          id: `advice_order_${product.id}`,
          title: `Order ${product.name}`.slice(0, 24),
        })),
        { id: 'advice_more', title: 'Ask another question' },
        { id: 'menu_main', title: 'Main menu' },
      ].slice(0, 5),
      'Interested in ordering?'
    )
    return
  }

  await transport.sendList(
    phone,
    'Next',
    [
      { id: 'advice_more', title: 'Ask another question' },
      { id: 'menu_order', title: 'Order products' },
      { id: 'menu_main', title: 'Main menu' },
    ],
    'Choose the next step:'
  )
}

// ── TRACKING & SUPPORT HELPERS ──────────────────────────────────────

function generateTicketRef(prefix: string = 'TKT') {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${seq}`
}

function isAgentRequest(text: string) {
  const keywords = ['agent', 'human', 'help', 'banda chahiye', 'koi bhejo', 'real person', 'speak to someone', 'insaan']
  return keywords.some((kw) => text.toLowerCase().includes(kw))
}

async function getWhatsAppMediaUrl(mediaId: string): Promise<string | null> {
  const token = process.env.WHATSAPP_TOKEN
  if (!token || !mediaId) return null

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

async function lookupOrderByRef(orderRef: string) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_ref', orderRef.toUpperCase())
    .maybeSingle()
  return data
}

async function lookupOrdersByPhone(phone: string) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

async function lookupOrderByIdOrPhone(input: string, sessionPhone: string) {
  // Try as order ref first
  const normalized = input.trim().toUpperCase()
  if (normalized.startsWith('MANA') || /^[A-Z0-9]{6,}$/.test(normalized)) {
    const order = await lookupOrderByRef(normalized)
    if (order) return { type: 'single' as const, orders: [order] }
  }

  // Try input as phone number
  const phoneInput = input.replace(/[^0-9]/g, '')
  if (phoneInput.length >= 10) {
    const searchPhone = phoneInput.length === 10 ? `91${phoneInput}` : phoneInput
    const orders = await lookupOrdersByPhone(searchPhone)
    if (orders.length === 1) return { type: 'single' as const, orders }
    if (orders.length > 1) return { type: 'multiple' as const, orders }
  }

  // Fallback: look up orders by caller's own WhatsApp number
  if (sessionPhone) {
    const orders = await lookupOrdersByPhone(sessionPhone)
    if (orders.length === 1) return { type: 'single' as const, orders }
    if (orders.length > 1) return { type: 'multiple' as const, orders }
  }

  return { type: 'not_found' as const, orders: [] }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDateShort(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function getStatusEmoji(status: string) {
  switch (status) {
    case 'pending': return '⏳'
    case 'confirmed': return '✅'
    case 'packed': return '📦'
    case 'shipped': return '🚚'
    case 'delivered': return '✅'
    case 'cancelled': return '❌'
    default: return '⭕'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Order Placed'
    case 'confirmed': return 'Confirmed'
    case 'packed': return 'Packed Fresh'
    case 'shipped': return 'Dispatched'
    case 'delivered': return 'Delivered'
    case 'cancelled': return 'Cancelled'
    default: return status
  }
}

function formatTrackingTimeline(order: any) {
  const lines: string[] = []

  lines.push(`📦 *Order #${order.order_ref}*`)
  lines.push('')
  lines.push(`Status: ${getStatusEmoji(order.status)} *${getStatusLabel(order.status)}*`)
  lines.push('━━━━━━━━━━━━━━━━━')

  // Build timeline
  const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']
  const currentIdx = statuses.indexOf(order.status)

  // Order placed
  const placedDone = currentIdx >= 0
  lines.push(`${placedDone ? '✅' : '⭕'} Order placed      – ${formatDate(order.created_at) || 'Pending'}`)

  // Payment
  const payDone = order.payment_status === 'paid'
  lines.push(`${payDone ? '✅' : '⏳'} Payment ${payDone ? 'confirmed' : 'pending'} ${payDone ? '– ' + (formatDate(order.created_at) || '') : ''}`)

  // Packed
  const packDone = currentIdx >= 2
  lines.push(`${packDone ? '✅' : '⭕'} Packed fresh      ${order.packed_at ? '– ' + formatDate(order.packed_at) : ''}`)

  // Dispatched
  const shipDone = currentIdx >= 3
  lines.push(`${shipDone ? '✅' : '⭕'} Dispatched        ${order.shipped_at ? '– ' + formatDate(order.shipped_at) : ''}`)
  if (order.courier_name) lines.push(`   Courier: ${order.courier_name}`)
  if (order.awb_number) lines.push(`   AWB: ${order.awb_number}`)

  // Out for delivery / Delivered
  if (order.status === 'shipped') {
    lines.push(`🚚 Out for delivery  – ${formatDateShort(order.shipped_at) || 'In transit'}`)
    lines.push(`⭕ Delivered         – Expected soon`)
  } else if (order.status === 'delivered') {
    lines.push(`✅ Delivered         – ${formatDate(order.delivered_at) || formatDateShort(order.created_at)}`)
  } else {
    lines.push(`⭕ Out for delivery`)
    lines.push(`⭕ Delivered`)
  }

  lines.push('━━━━━━━━━━━━━━━━━')

  // Tracking link
  if (order.tracking_url) {
    lines.push(`🔗 Live tracking: ${order.tracking_url}`)
  } else if (order.awb_number && order.courier_name) {
    const courierLower = (order.courier_name || '').toLowerCase()
    if (courierLower.includes('delhivery')) {
      lines.push(`🔗 Live tracking: https://www.delhivery.com/track/package/${order.awb_number}`)
    } else if (courierLower.includes('bluedart')) {
      lines.push(`🔗 Live tracking: https://www.bluedart.com/tracking/${order.awb_number}`)
    }
  }

  // Delivery address
  if (order.address || order.city) {
    lines.push(`📍 Delivering to: ${order.city || ''} ${order.pincode || ''}`)
  }

  lines.push('')
  lines.push(`💰 Amount: ${formatMoney(order.total)}`)

  return lines.join('\n')
}

function formatOrderListItem(order: any, index: number) {
  const emoji = getStatusEmoji(order.status)
  const dateStr = formatDateShort(order.created_at) || ''
  return `${index + 1}️⃣  #${order.order_ref} – ${formatMoney(order.total)}\n     ${emoji} ${getStatusLabel(order.status)} – ${dateStr}`
}

function formatOrderSummary(order: any) {
  const items = Array.isArray(order.items)
    ? order.items.map((i: any) => i.product_name || i.name).join(' + ')
    : 'Items'
  return `${items} · ${formatMoney(order.total)} · ${formatDateShort(order.created_at) || ''}`
}

async function createSupportTicket(
  phone: string,
  issueType: SupportIssueType,
  detail: string,
  orderRef?: string,
  imageUrl?: string
) {
  const prefix = issueType === 'refund' ? 'REF' : 'TKT'
  const ticketRef = generateTicketRef(prefix)

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({
      ticket_ref: ticketRef,
      phone,
      order_ref: orderRef || null,
      issue_type: issueType,
      issue_detail: detail,
      image_url: imageUrl || null,
      status: 'open',
    })
    .select('*')
    .single()

  if (error) {
    console.error('Failed to create support ticket:', error)
    return null
  }

  return data
}

async function notifyOwner(
  phone: string,
  ticket: any,
  order: any | null,
  transport: BotTransport
) {
  const lines: string[] = []
  lines.push(`🆘 *SUPPORT TICKET #${ticket.ticket_ref}*`)
  lines.push(`Customer: +${phone}`)
  lines.push(`Issue: ${ticket.issue_type.replace('_', ' ')}`)
  if (ticket.issue_detail) lines.push(`Detail: ${ticket.issue_detail}`)
  if (order?.order_ref) lines.push(`Order: #${order.order_ref}`)
  if (ticket.image_url) lines.push(`Photo: ${ticket.image_url}`)
  lines.push(`Time: ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`)

  await sendWhatsAppMessage(OWNER_PHONE, lines.join('\n'))
}

export async function handleIncomingMessage(phone: string, input: string, options: HandleIncomingMessageOptions = {}) {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) return ''

  const transcript: string[] = []
  const transport = createRuntimeTransport(options.transport, transcript)
  const session = await getSession(normalizedPhone)
  const rawInput = input.trim()
  const msg = rawInput.toLowerCase()

  if (options.audioInfo?.mediaId) {
    await transport.sendMessage(
      normalizedPhone,
      isHindi(session.lang || 'English')
        ? 'Audio mila hai. Abhi audio auto-transcribe enabled nahin hai, please apna message text mein bhej dein.'
        : 'We received your audio. Auto transcription is not enabled yet, so please send the message as text.'
    )
    return transcript.join('\n\n')
  }

  if (options.locationInfo?.addressText) {
    await saveSession(normalizedPhone, {
      cart: {
        ...(session.cart || {}),
        location_address: options.locationInfo.addressText,
        location_latitude: options.locationInfo.latitude || null,
        location_longitude: options.locationInfo.longitude || null,
      },
    })
    await transport.sendMessage(
      normalizedPhone,
      isHindi(session.lang || 'English')
        ? `Location save ho gayi:\n${options.locationInfo.addressText}\n\nAgar yahi delivery address use karna hai toh apna naam aur city bhi bhej dein.`
        : `Location saved:\n${options.locationInfo.addressText}\n\nIf you want to use this as your delivery address, please also send your name and city.`
    )
    return transcript.join('\n\n')
  }

  // Global shortcuts
  if (msg === 'menu' || msg === 'main menu' || msg === 'menu_main') {
    await saveSession(normalizedPhone, { state: 'MENU' })
    await showMenu(normalizedPhone, session.lang || 'English', transport)
    return transcript.join('\n\n')
  }

  if (msg === '0' && session.state !== 'GREETING' && session.state !== 'LANGUAGE' && session.state !== 'MENU') {
    await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
    await showMenu(normalizedPhone, session.lang || 'English', transport)
    return transcript.join('\n\n')
  }

  // Global agent request from any state
  if (isAgentRequest(rawInput) && session.state !== 'SUPPORT_AGENT_HANDOFF') {
    await saveSession(normalizedPhone, { state: 'SUPPORT_AGENT_HANDOFF', cart: { ...(session.cart || {}), flow: 'support' } })
    const ticket = await createSupportTicket(normalizedPhone, 'other', `Agent requested: ${rawInput}`, session.cart?.order_ref)
    if (ticket) {
      await notifyOwner(normalizedPhone, ticket, null, transport)
      await transport.sendMessage(
        normalizedPhone,
        `🙋 *Connecting you to our team...*\n\nOur support hours:\nMon–Sat: 9 AM – 7 PM\nSun: 10 AM – 4 PM\n\n⏳ Current wait: ~5 minutes\n\nYour ticket: *#${ticket.ticket_ref}*\n\nA team member will message you shortly.`
      )
    } else {
      await transport.sendMessage(
        normalizedPhone,
        '🙋 *Connecting you to our team...*\n\nA team member will message you shortly.\n\nYou can also reach us at wa.me/919910899796'
      )
    }
    await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
    return transcript.join('\n\n')
  }

  // ── SMART TRIGGERS ──────────────────────────────────────────────────
  // Intercept messages BEFORE flow routing to allow cross-flow navigation
  const SMART_SUPPRESS = new Set(['GREETING', 'LANGUAGE', 'ORDER_DETAILS', 'ORDER_WEIGHT_CLARIFY', 'SUPPORT_DETAIL'])

  if (!SMART_SUPPRESS.has(session.state) && session.state !== 'MENU') {
    if (containsAnyKeyword(msg, SMART_TRIGGERS.menu)) {
      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang || 'English', transport)
      return transcript.join('\n\n')
    }

    if (containsAnyKeyword(msg, PAYMENT_TRIGGERS.paid) || containsAnyKeyword(msg, PAYMENT_TRIGGERS.failed)) {
      await saveSession(normalizedPhone, {
        state: 'SUPPORT_DETAIL',
        cart: {
          flow: 'support',
          issue_type: 'payment',
          payment_status_hint: containsAnyKeyword(msg, PAYMENT_TRIGGERS.paid) ? 'paid' : 'failed',
        },
      })
      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? 'Payment related message detect hua.\n\nPlease order ID, payment reference, ya screenshot details bhej dein. Team check karke help karegi.'
          : 'We detected a payment-related message.\n\nPlease send your order ID, payment reference, or screenshot details and our team will help.'
      )
      return transcript.join('\n\n')
    }

    if (containsAnyKeyword(msg, SMART_TRIGGERS.account)) {
      const snapshot = await getWalletSnapshot(supabaseAdmin, { phone: normalizedPhone })
      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? `Your Mana account\n\nWallet balance: ${formatMoney(snapshot.wallet.balance || 0)}\nCashback eligible: ${snapshot.profile.is_cashback_eligible ? 'Yes' : 'No'}\n\nOrder history dekhne ke liye "track" bhejein.`
          : `Your Mana account\n\nWallet balance: ${formatMoney(snapshot.wallet.balance || 0)}\nCashback eligible: ${snapshot.profile.is_cashback_eligible ? 'Yes' : 'No'}\n\nReply with "track" to see your order history.`
      )
      return transcript.join('\n\n')
    }

    if (containsAnyKeyword(msg, SMART_TRIGGERS.almond) || containsAnyKeyword(msg, SMART_TRIGGERS.saffron) || containsAnyKeyword(msg, SMART_TRIGGERS.ashwag)) {
      const handled = await processSharedProductMessage(normalizedPhone, session.lang || 'English', rawInput, session.cart || {}, transport)
      if (handled) return transcript.join('\n\n')
    }

    if (containsAnyKeyword(msg, SMART_TRIGGERS.hair)) {
      await saveSession(normalizedPhone, { state: 'ADVICE', cart: { flow: 'ai_advice', step: 'active', ai_context: [] } })
      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? 'Hair concern samajh gaya.\n\nBaal jhadna, dryness, ya growth mein kis cheez ke liye advice chahiye?'
          : 'Got it - this sounds like a hair concern.\n\nDo you want advice for hair fall, dryness, or growth?'
      )
      return transcript.join('\n\n')
    }
    // Greeting words → restart to menu
    const firstWord = msg.split(/\s/)[0]
    const GREETING_WORDS = new Set(['hi', 'hello', 'namaste', 'hey', 'hii', 'hiii', 'start', 'hola'])
    if (GREETING_WORDS.has(firstWord) && msg.split(/\s/).length <= 3) {
      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang || 'English', transport)
      return transcript.join('\n\n')
    }

    // Track triggers (not if already tracking)
    if (!session.state.startsWith('TRACKING') && (
      containsAnyKeyword(msg, SMART_TRIGGERS.track) || msg.includes('kab aayega') || msg.includes('delivery status')
    )) {
      const phoneOrders = await lookupOrdersByPhone(normalizedPhone)
      if (phoneOrders.length === 1) {
        await transport.sendMessage(normalizedPhone, formatTrackingTimeline(phoneOrders[0]))
        await transport.sendButtons(normalizedPhone, isHindi(session.lang) ? 'Kuch aur chahiye?' : 'Need anything else?', [
          { id: 'track_issue', title: '⚠️ Report issue' },
          { id: 'menu_main', title: '🏠 Main menu' },
        ])
        await saveSession(normalizedPhone, { state: 'TRACKING_DONE', cart: { order_ref: phoneOrders[0].order_ref } })
        return transcript.join('\n\n')
      }
      if (phoneOrders.length > 1) {
        const listText = phoneOrders.map((o: any, i: number) => formatOrderListItem(o, i)).join('\n\n')
        await transport.sendMessage(normalizedPhone, `📦 *Your recent orders:*\n\n${listText}\n\n${isHindi(session.lang) ? 'Details ke liye Order ID bhejein.' : 'Reply with the Order ID for details.'}`)
        await saveSession(normalizedPhone, { state: 'TRACKING', cart: { flow: 'tracking' } })
        return transcript.join('\n\n')
      }
      await saveSession(normalizedPhone, { state: 'TRACKING', cart: { flow: 'tracking' } })
      await transport.sendMessage(normalizedPhone, isHindi(session.lang)
        ? '📦 Kripya apna Order ID bhejein (jaise *MANA8X4K2P*)'
        : '📦 Please send your Order ID (e.g. *MANA8X4K2P*)')
      return transcript.join('\n\n')
    }

    // Support triggers (not if already in support)
    if (!session.state.startsWith('SUPPORT') && (
      msg.includes('complaint') || msg.includes('shikayat') ||
      (msg.includes('problem') && !msg.includes('no problem')) ||
      (msg.includes('issue') && !msg.includes('tissue')) ||
      containsAnyKeyword(msg, SMART_TRIGGERS.help)
    )) {
      await saveSession(normalizedPhone, { state: 'SUPPORT_MENU', cart: { flow: 'support', step: 'issue_type' } })
      await transport.sendMessage(normalizedPhone, isHindi(session.lang)
        ? '💬 *Customer Support*\n\nAapko kis cheez mein madad chahiye?\n\n1️⃣  📦  Order mein problem\n2️⃣  💳  Payment problem\n3️⃣  🚚  Delivery nahi mili\n4️⃣  ❌  Galat / damaged product\n5️⃣  💰  Refund request\n6️⃣  🔄  Product return\n7️⃣  ❓  Koi aur sawal'
        : '💬 *Customer Support*\n\nWhat do you need help with?\n\n1️⃣  📦  Issue with my order\n2️⃣  💳  Payment problem\n3️⃣  🚚  Delivery not received\n4️⃣  ❌  Wrong / damaged product\n5️⃣  💰  Refund request\n6️⃣  🔄  Return a product\n7️⃣  ❓  Other question')
      return transcript.join('\n\n')
    }

    // Order triggers (not if already ordering or in advice which has its own order routing)
    if (!session.state.startsWith('ORDER_') && session.state !== 'ADVICE' && session.state !== 'ADVICE_FOLLOWUP' && (
      containsAnyKeyword(msg, SMART_TRIGGERS.order)
    )) {
      await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: {} })
      await showOrderEntry(normalizedPhone, session.lang, transport)
      return transcript.join('\n\n')
    }

    // Advice triggers (not if already in advice or mid-order)
    if (!session.state.startsWith('ADVICE') && !session.state.startsWith('ORDER_') && (
      containsAnyKeyword(msg, SMART_TRIGGERS.advice)
    )) {
      await saveSession(normalizedPhone, { state: 'ADVICE', cart: { flow: 'ai_advice', step: 'active', ai_context: [] } })
      await transport.sendMessage(normalizedPhone, buildAdviceIntro())
      return transcript.join('\n\n')
    }
  }

  switch (session.state) {
    case 'GREETING': {
      await transport.sendMessage(
        normalizedPhone,
        'Namaste. Welcome to MANA - The Essence of Nature.\n\nPlease choose your language.'
      )
      await transport.sendList(
        normalizedPhone,
        'Language',
        [
          { id: 'lang_en', title: 'English' },
          { id: 'lang_hi', title: 'Hindi' },
        ]
      )
      await saveSession(normalizedPhone, { state: 'LANGUAGE', lang: 'English', cart: {} })
      break
    }

    case 'LANGUAGE': {
      const lang = msg.includes('lang_hi') || msg.includes('hindi') ? 'Hindi' : 'English'
      await saveSession(normalizedPhone, { state: 'MENU', lang, cart: {} })
      await showMenu(normalizedPhone, lang, transport)
      break
    }

    case 'MENU': {
      if (msg === '2' || msg.includes('menu_track') || msg.includes('track')) {
        // Auto-lookup orders by caller's phone number
        const phoneOrders = await lookupOrdersByPhone(normalizedPhone)
        if (phoneOrders.length === 1) {
          await transport.sendMessage(normalizedPhone, formatTrackingTimeline(phoneOrders[0]))
          await transport.sendButtons(normalizedPhone, isHindi(session.lang) ? 'Kuch aur chahiye?' : 'Need anything else?', [
            { id: 'track_issue', title: '⚠️ Report issue' },
            { id: 'menu_main', title: '🏠 Main menu' },
          ])
          await saveSession(normalizedPhone, { state: 'TRACKING_DONE', cart: { order_ref: phoneOrders[0].order_ref } })
          break
        }
        if (phoneOrders.length > 1) {
          const listText = phoneOrders.map((o: any, i: number) => formatOrderListItem(o, i)).join('\n\n')
          await transport.sendMessage(
            normalizedPhone,
            `📦 *${isHindi(session.lang) ? 'Aapke recent orders' : 'Your recent orders'}:*\n\n${listText}\n\n${isHindi(session.lang) ? 'Full details ke liye Order ID bhejein.' : 'Reply with the Order ID to see full details.'}`
          )
          await saveSession(normalizedPhone, { state: 'TRACKING', cart: { flow: 'tracking' } })
          break
        }
        await saveSession(normalizedPhone, { state: 'TRACKING', cart: { flow: 'tracking', step: 'ask_order_id' } })
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? '📦 *Order Track Karein*\n\nKripya apna Order ID bhejein (jaise *MANA8X4K2P*) ya registered phone number.'
            : '📦 *Track Your Order*\n\nPlease send your Order ID (e.g. *MANA8X4K2P*) or registered phone number.'
        )
        break
      }

      if (msg === '1' || msg.includes('menu_order') || msg.includes('order')) {
        await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: {} })
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      if (msg === '3' || msg.includes('menu_advice') || msg.includes('advice')) {
        await saveSession(normalizedPhone, {
          state: 'ADVICE',
          cart: { flow: 'ai_advice', step: 'active', ai_context: [] },
        })
        await transport.sendMessage(normalizedPhone, buildAdviceIntro())
        break
      }

      if (msg === '4' || msg.includes('menu_support') || msg.includes('support')) {
        await saveSession(normalizedPhone, { state: 'SUPPORT_MENU', cart: { flow: 'support', step: 'issue_type' } })
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? '💬 *Customer Support*\n\nAapko kis cheez mein madad chahiye?\n\n1️⃣  📦  Order mein problem\n2️⃣  💳  Payment problem\n3️⃣  🚚  Delivery nahi mili\n4️⃣  ❌  Galat / damaged product\n5️⃣  💰  Refund request\n6️⃣  🔄  Product return karna hai\n7️⃣  ❓  Koi aur sawal\n0️⃣  🔙  Main menu'
            : '💬 *Customer Support*\n\nWhat do you need help with?\n\n1️⃣  📦  Issue with my order\n2️⃣  💳  Payment problem\n3️⃣  🚚  Delivery not received\n4️⃣  ❌  Wrong / damaged product\n5️⃣  💰  Refund request\n6️⃣  🔄  Return a product\n7️⃣  ❓  Other question\n0️⃣  🔙  Main menu'
        )
        break
      }

      await showMenu(normalizedPhone, session.lang, transport)
      break
    }

    case 'ORDER_ENTRY': {
      if (msg === 'share_products') {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Product names bhejein.\n\nExample: Badam 500g, Kaju 1kg'
            : 'Please send product names.\n\nExample: Almonds 500g, Cashews 1kg'
        )
        break
      }

      const handled = await processSharedProductMessage(normalizedPhone, session.lang, rawInput, session.cart || {}, transport)
      if (handled) break

      const categories = await fetchCategories()
      const categoryByIndex = categories[Math.max(0, Number.parseInt(msg, 10) - 1)]
      const chosen =
        categoryByIndex ||
        categories.find((category, index) => msg === `cat_${index + 1}`) ||
        categories.find((category) => msg.includes(category.toLowerCase()))

      if (!chosen) {
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      if (chosen === 'herbs') {
        const choices = await showProductsForCategory(normalizedPhone, session.lang, chosen, undefined, transport)
        await saveSession(normalizedPhone, {
          state: 'ORDER_PRODUCT',
          cart: { ...(session.cart || {}), category: chosen, products_cache: choices },
        })
        break
      }

      await saveSession(normalizedPhone, {
        state: 'ORDER_QUALITY',
        cart: { ...(session.cart || {}), category: chosen },
      })

      await transport.sendList(
        normalizedPhone,
        'Quality',
        [
          { id: 'q_basic', title: 'Daily Use', description: 'Budget-friendly' },
          { id: 'q_mid', title: 'Best Seller', description: 'Most popular' },
          { id: 'q_top', title: 'Premium', description: 'Top quality' },
        ],
        isHindi(session.lang)
          ? `${chosen} select hua hai.\nAb quality chunein:`
          : `${chosen} selected.\nPlease choose your preferred quality:`
      )
      break
    }

    case 'ORDER_QUALITY': {
      const tier = mapTierFromInput(msg) || 'popular'
      const category = session.cart?.category
      const pendingRequests = Array.isArray(session.cart?.pending_requests) ? session.cart.pending_requests : null

      if (pendingRequests?.length) {
        const catalog = await fetchLiveCatalog()
        const parsed = hydratePendingRequests(pendingRequests, catalog)
        const items = buildSelectedItems(parsed, tier)

        await saveSession(normalizedPhone, {
          state: 'ORDER_CONFIRM',
          cart: { ...(session.cart || {}), tier, selected_items: items },
        })
        await sendQuote(normalizedPhone, session.lang, items, transport)
        break
      }

      if (!category) {
        await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: {} })
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      const choices = await showProductsForCategory(normalizedPhone, session.lang, category, tier, transport)
      await saveSession(normalizedPhone, {
        state: 'ORDER_PRODUCT',
        cart: { ...(session.cart || {}), tier, products_cache: choices },
      })
      break
    }

    case 'ORDER_PRODUCT': {
      const handled = await processSharedProductMessage(normalizedPhone, session.lang, rawInput, session.cart || {}, transport)
      if (handled) break

      const products = Array.isArray(session.cart?.products_cache) ? session.cart.products_cache : []
      const productId = rawInput.replace('prod_', '')
      const choice = products.find((item: CatalogChoice) => item.productId === productId || normalize(item.productName).includes(normalize(msg)))

      if (!choice) {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Kripya list se product chunein ya directly product names bhejein.'
            : 'Please select a product from the list or send product names directly.'
        )
        break
      }

      const weightRows = getWeightOptions(choice.category).map((weight) => ({
        id: `wt_${weight}`,
        title: formatWeight(weight),
        description: formatMoney(Math.round(choice.unitPrice * (weight / parseBaseWeightGrams(choice.unitLabel)))),
      }))

      await saveSession(normalizedPhone, {
        state: 'ORDER_QTY',
        cart: { ...(session.cart || {}), selected_choice: choice },
      })

      await transport.sendList(
        normalizedPhone,
        'Weight',
        weightRows,
        `${choice.productName}\n${choice.unitLabel} - ${formatMoney(choice.unitPrice)}\n\nPlease choose the weight:`
      )
      break
    }

    case 'ORDER_QTY': {
      const product = session.cart?.selected_choice as CatalogChoice | undefined
      if (!product) {
        await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: {} })
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      const weightFromList = rawInput.startsWith('wt_') ? Number(rawInput.replace('wt_', '')) : undefined
      const weight = weightFromList || parseWeightGrams(rawInput)
      if (!weight) {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Kripya weight bhejein. Example: 500g'
            : 'Please share the weight. Example: 500g'
        )
        break
      }

      const baseWeight = parseBaseWeightGrams(product.unitLabel)
      const item: SelectedItem = {
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        requestedWeightGrams: weight,
        tier: product.tier,
        variantId: product.variantId,
        variantName: product.variantName,
        unitPrice: product.unitPrice,
        unitLabel: product.unitLabel,
        total: Math.round(product.unitPrice * (weight / baseWeight)),
      }

      await saveSession(normalizedPhone, {
        state: 'ORDER_CONFIRM',
        cart: {
          ...(session.cart || {}),
          selected_items: [item],
        },
      })

      await sendQuote(normalizedPhone, session.lang, [item], transport)
      break
    }

    case 'ORDER_WEIGHT_CLARIFY': {
      const catalog = await fetchLiveCatalog()
      const currentPending = hydratePendingRequests(session.cart?.pending_requests || [], catalog)
      const updates = parseProductRequests(rawInput, catalog)

      const merged = currentPending.map((item) => {
        const replacement = updates.find((entry) => entry.product.id === item.product.id && entry.requestedWeightGrams)
        return replacement ? { ...item, requestedWeightGrams: replacement.requestedWeightGrams } : item
      })

      const stillMissing = merged.filter((item) => !item.requestedWeightGrams)
      if (stillMissing.length) {
        await saveSession(normalizedPhone, {
          state: 'ORDER_WEIGHT_CLARIFY',
          cart: {
            ...(session.cart || {}),
            pending_requests: merged.map((item) => ({
              productId: item.product.id,
              requestedWeightGrams: item.requestedWeightGrams || null,
            })),
          },
        })
        await transport.sendMessage(
          normalizedPhone,
          `Please share the remaining weights for: ${stillMissing.map((item) => item.product.name).join(', ')}`
        )
        break
      }

      const needsQuality = merged.some((item) => item.product.category !== 'herbs')
      if (needsQuality) {
        await saveSession(normalizedPhone, {
          state: 'ORDER_QUALITY',
          cart: {
            ...(session.cart || {}),
            pending_requests: merged.map((item) => ({
              productId: item.product.id,
              requestedWeightGrams: item.requestedWeightGrams || null,
            })),
          },
        })
        await transport.sendList(
          normalizedPhone,
          'Quality',
          [
            { id: 'q_basic', title: 'Daily Use', description: 'Budget-friendly' },
            { id: 'q_mid', title: 'Best Seller', description: 'Most popular' },
            { id: 'q_top', title: 'Premium', description: 'Top quality' },
          ],
          'Please choose your preferred quality:'
        )
        break
      }

      const items = buildSelectedItems(merged)
      await saveSession(normalizedPhone, {
        state: 'ORDER_CONFIRM',
        cart: { ...(session.cart || {}), selected_items: items },
      })
      await sendQuote(normalizedPhone, session.lang, items, transport)
      break
    }

    case 'ORDER_CONFIRM': {
      if (msg.includes('confirm_no') || msg.includes('cancel') || msg === '2') {
        await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: {} })
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      await saveSession(normalizedPhone, { state: 'ORDER_DETAILS' })
      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? 'Kripya shipping details ek message mein bhejein:\n\nName | Address | City | Pincode'
          : 'Please share shipping details in one message:\n\nName | Address | City | Pincode'
      )
      break
    }

    case 'ORDER_DETAILS': {
      const details = parseWhatsAppDetails(rawInput)
      if (!details) {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Kripya isi format mein bhejein:\nName | Address | City | Pincode'
            : 'Please use this format:\nName | Address | City | Pincode'
        )
        break
      }

      const selectedItems = Array.isArray(session.cart?.selected_items) ? session.cart.selected_items as SelectedItem[] : []
      const total = selectedItems.reduce((sum, item) => sum + item.total, 0)

      if (!selectedItems.length || total <= 0) {
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        await showMenu(normalizedPhone, session.lang, transport)
        break
      }

      const orderRef = `MANA${Date.now().toString().slice(-6)}`
      const orderItems = selectedItems.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        product_image: '',
        variant_id: item.variantId || null,
        variant_name: item.variantName,
        weight_grams: item.requestedWeightGrams,
        price: item.total,
        quantity: 1,
      }))

      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_name: details.customer_name,
          customer_phone: normalizedPhone,
          address: details.address,
          city: details.city,
          pincode: details.pincode,
          items: orderItems,
          subtotal: total,
          discount: 0,
          discount_amount: 0,
          shipping: 0,
          total,
          final_amount: total,
          payment_status: 'pending',
          status: 'pending',
          notes: 'Created via WhatsApp bot',
          order_ref: orderRef,
        })
        .select('*')
        .single()

      if (error || !order) {
        console.error('WhatsApp order insert error:', error)
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Order create nahin ho paya. Kripya dobara try karein ya support se baat karein.'
            : 'We could not create the order right now. Please try again or talk to support.'
        )
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        break
      }

      const paymentLink = await createRazorpayLink({
        amount: total,
        description: `MANA - ${selectedItems.map((item) => `${item.productName} ${formatWeight(item.requestedWeightGrams)}`).join(', ')}`,
        orderId: order.id,
        phone: normalizedPhone,
      })

      await supabaseAdmin
        .from('orders')
        .update({ razorpay_link: paymentLink })
        .eq('id', order.id)

      await transport.sendMessage(
        normalizedPhone,
        `Order placed.\n\nOrder ID: ${orderRef}\nTotal: ${formatMoney(total)}\n\nPay here:\n${paymentLink}`
      )

      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang, transport)
      break
    }

    case 'TRACKING': {
      const result = await lookupOrderByIdOrPhone(rawInput, normalizedPhone)

      if (result.type === 'not_found') {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? `❌ Order nahin mila. Kripya sahi Order ID bhejein (jaise MANA8X4K2P) ya *menu* likhein.`
            : `❌ Order not found. Please check the Order ID and try again, or type *menu*.`
        )
        break
      }

      if (result.type === 'multiple') {
        const listText = result.orders.map((o: any, i: number) => formatOrderListItem(o, i)).join('\n\n')
        await transport.sendMessage(
          normalizedPhone,
          `📦 *${isHindi(session.lang) ? 'Aapke orders' : 'Your orders'}:*\n\n${listText}\n\n${isHindi(session.lang) ? 'Full details ke liye Order ID bhejein.' : 'Reply with the Order ID to see full details.'}`
        )
        break
      }

      // Single order found — show rich timeline
      const order = result.orders[0]
      await transport.sendMessage(normalizedPhone, formatTrackingTimeline(order))
      await transport.sendButtons(
        normalizedPhone,
        isHindi(session.lang) ? 'Kuch aur chahiye?' : 'Need anything else?',
        [
          { id: 'track_issue', title: '⚠️ Report issue' },
          { id: 'menu_main', title: '🏠 Main menu' },
        ]
      )
      await saveSession(normalizedPhone, { state: 'TRACKING_DONE', cart: { order_ref: order.order_ref } })
      break
    }

    case 'TRACKING_DONE': {
      if (msg.includes('track_issue') || msg.includes('report') || msg.includes('problem')) {
        const orderRef = (session.cart?.order_ref as string) || ''
        await saveSession(normalizedPhone, {
          state: 'SUPPORT_MENU',
          cart: { flow: 'support', step: 'issue_type', order_ref: orderRef },
        })
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? `💬 *Order #${orderRef} ke liye support*\n\nKya problem hai?\n\n1️⃣  📦  Order mein problem\n2️⃣  💳  Payment problem\n3️⃣  🚚  Delivery nahi mili\n4️⃣  ❌  Galat / damaged product\n5️⃣  💰  Refund request\n6️⃣  🔄  Return karna hai\n7️⃣  ❓  Koi aur sawal`
            : `💬 *Support for Order #${orderRef}*\n\nWhat's the issue?\n\n1️⃣  📦  Issue with order\n2️⃣  💳  Payment problem\n3️⃣  🚚  Delivery not received\n4️⃣  ❌  Wrong / damaged product\n5️⃣  💰  Refund request\n6️⃣  🔄  Return a product\n7️⃣  ❓  Other question`
        )
        break
      }

      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang, transport)
      break
    }

    case 'SUPPORT_MENU': {
      const issueMap: Record<string, SupportIssueType> = {
        '1': 'order_issue',
        '2': 'payment',
        '3': 'delivery',
        '4': 'damaged',
        '5': 'refund',
        '6': 'return',
        '7': 'other',
      }

      let issueType: SupportIssueType | null = issueMap[msg.trim()] || null

      if (!issueType) {
        if (msg.includes('order') && !msg.includes('track')) issueType = 'order_issue'
        else if (msg.includes('payment') || msg.includes('pay') || msg.includes('paisa')) issueType = 'payment'
        else if (msg.includes('deliver') || msg.includes('nahi mili') || msg.includes('not received')) issueType = 'delivery'
        else if (msg.includes('damage') || msg.includes('wrong') || msg.includes('broken') || msg.includes('galat')) issueType = 'damaged'
        else if (msg.includes('refund') || msg.includes('paisa wapas')) issueType = 'refund'
        else if (msg.includes('return') || msg.includes('wapas')) issueType = 'return'
        else if (msg.includes('other') || msg.includes('aur')) issueType = 'other'
      }

      if (!issueType) {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Kripya 1-7 mein se ek number bhejein apni issue select karne ke liye.'
            : 'Please reply with a number (1-7) to select your issue type.'
        )
        break
      }

      const issueLabels: Record<SupportIssueType, string> = {
        order_issue: '📦 Order Issue',
        payment: '💳 Payment Problem',
        delivery: '🚚 Delivery Not Received',
        damaged: '❌ Wrong/Damaged Product',
        refund: '💰 Refund Request',
        return: '🔄 Return Request',
        other: '❓ Other',
      }

      await saveSession(normalizedPhone, {
        state: 'SUPPORT_DETAIL',
        cart: { ...(session.cart || {}), issue_type: issueType },
      })

      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? `${issueLabels[issueType]}\n\nKripya apni problem detail mein batayein.\n📸 Photo bhi bhej sakte hain.\n\nOrder se related hai toh Order ID zaroor bhejein (jaise MANA8X4K2P).`
          : `${issueLabels[issueType]}\n\nPlease describe your issue in detail.\n📸 You can also send a photo if relevant.\n\nIf related to an order, include the Order ID (e.g. MANA8X4K2P).`
      )
      break
    }

    case 'SUPPORT_DETAIL': {
      const issueType = (session.cart?.issue_type as SupportIssueType) || 'other'
      let imageUrl: string | null = null

      // Handle image upload
      if (options.imageInfo?.mediaId) {
        imageUrl = await getWhatsAppMediaUrl(options.imageInfo.mediaId) || null
      }

      // Extract order ref from message or use one from tracking flow
      const orderRefMatch = rawInput.match(/MANA[A-Z0-9]{4,}/i)
      const orderRef = orderRefMatch
        ? orderRefMatch[0].toUpperCase()
        : (session.cart?.order_ref as string) || null

      const detail = rawInput === '__IMAGE_RECEIVED__'
        ? (options.imageInfo?.caption || 'Photo uploaded')
        : rawInput

      // Create support ticket
      const ticket = await createSupportTicket(
        normalizedPhone,
        issueType,
        detail,
        orderRef || undefined,
        imageUrl || undefined
      )

      if (!ticket) {
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Maaf kijiye, ticket create nahi ho paya. Kripya dobara try karein ya wa.me/919910899796 par contact karein.'
            : 'Sorry, we could not create your ticket. Please try again or contact wa.me/919910899796'
        )
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        break
      }

      // Look up order for owner notification
      const supportOrder = orderRef ? await lookupOrderByRef(orderRef) : null
      await notifyOwner(normalizedPhone, ticket, supportOrder, transport)

      // Confirm to customer
      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? `✅ *Ticket Created: #${ticket.ticket_ref}*\n\nHumne aapki request receive kar li hai.\nHumari team jald se jald reply karegi.\n\n⏰ Expected response: 2-4 hours\n📞 Support: Mon–Sat 9AM–7PM`
          : `✅ *Ticket Created: #${ticket.ticket_ref}*\n\nWe've received your request and our team will get back to you shortly.\n\n⏰ Expected response: 2-4 hours\n📞 Support hours: Mon–Sat 9AM–7PM`
      )

      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang, transport)
      break
    }

    case 'ADVICE': {
      if (msg === '0') {
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        await showMenu(normalizedPhone, session.lang, transport)
        break
      }

      if (shouldRouteAdviceToOrder(rawInput)) {
        await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: session.cart || {} })
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      const lastUpdated = session.updated_at ? new Date(session.updated_at).getTime() : Date.now()
      if (Date.now() - lastUpdated > 10 * 60 * 1000) {
        await transport.sendMessage(
          normalizedPhone,
          "Still there? Type anything to continue or send '0' for main menu."
        )
      }

      const catalog = await fetchLiveCatalog()
      const aiContext = getAIContext(session.cart || {})
      const reply = await getAIAdvice(rawInput, session.lang, buildProductContext(catalog), aiContext)
      const updatedContext = trimAIContext([
        ...aiContext,
        { role: 'user', content: rawInput },
        { role: 'assistant', content: reply },
      ])

      await transport.sendMessage(normalizedPhone, reply)
      await sendAdviceNextSteps(normalizedPhone, session.lang, reply, catalog, transport)
      await saveSession(normalizedPhone, {
        state: 'ADVICE_FOLLOWUP',
        cart: { ...(session.cart || {}), flow: 'ai_advice', step: 'active', ai_context: updatedContext },
      })
      break
    }

    case 'ADVICE_FOLLOWUP': {
      if (msg === '0' || msg.includes('menu_main')) {
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        await showMenu(normalizedPhone, session.lang, transport)
        break
      }

      if (shouldRouteAdviceToOrder(rawInput) || msg.includes('menu_order') || msg.startsWith('advice_order_')) {
        const selectedProductId = msg.startsWith('advice_order_') ? msg.replace('advice_order_', '') : null
        const nextCart = { ...(session.cart || {}) }

        if (selectedProductId) {
          const catalog = await fetchLiveCatalog()
          const picked = catalog.find((product) => product.id === selectedProductId)
          if (picked) {
            nextCart.pending_requests = [{ productId: picked.id, requestedWeightGrams: null }]
            await saveSession(normalizedPhone, { state: 'ORDER_WEIGHT_CLARIFY', cart: nextCart })
            await transport.sendMessage(
              normalizedPhone,
              `Please share the weight for ${picked.name}.\n\nExample: ${picked.name} 500g`
            )
            break
          }
        }

        await saveSession(normalizedPhone, { state: 'ORDER_ENTRY', cart: nextCart })
        await showOrderEntry(normalizedPhone, session.lang, transport)
        break
      }

      if (msg.includes('advice_more')) {
        await saveSession(normalizedPhone, { state: 'ADVICE', cart: session.cart || {} })
        await transport.sendMessage(
          normalizedPhone,
          isHindi(session.lang) ? 'Apna agla sawal bhejein.' : 'Go ahead - ask your next question.'
        )
        break
      }

      await saveSession(normalizedPhone, { state: 'ADVICE', cart: session.cart || {} })
      await transport.sendMessage(
        normalizedPhone,
        isHindi(session.lang) ? 'Apna agla sawaal bhejein, ya 0 dabayein.' : 'Send your next question, or reply 0 for the main menu.'
      )
      break
    }

    default: {
      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang || 'English', transport)
      break
    }
  }

  return transcript.join('\n\n')
}
