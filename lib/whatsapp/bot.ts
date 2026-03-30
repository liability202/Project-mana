import { supabaseAdmin } from '@/lib/supabase'
import { normalizePhone } from '@/lib/commerce'
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppMessage } from './sender'
import { getAIAdvice } from './ai'
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

const DEFAULT_SESSION: SessionRecord = {
  phone: '',
  state: 'GREETING',
  lang: 'English',
  cart: {},
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

function isHindi(lang: string) {
  return lang === 'Hindi'
}

function formatMoney(amountPaise: number) {
  return `₹${Math.round(amountPaise / 100)}`
}

function getTierLabel(tier: CatalogChoice['tier'], lang: string) {
  if (tier === 'basic') return isHindi(lang) ? 'Daily Use' : 'Daily Use'
  if (tier === 'best') return isHindi(lang) ? 'Premium' : 'Premium'
  return isHindi(lang) ? 'Best Seller' : 'Best Seller'
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

function chooseVariant(product: ProductRow, tier: CatalogChoice['tier']): CatalogChoice {
  const variants = Array.isArray(product.variants) ? product.variants : []
  const desiredQuality = tier
  const fallbackOrder = desiredQuality === 'best'
    ? ['best', 'popular', 'basic']
    : desiredQuality === 'basic'
      ? ['basic', 'popular', 'best']
      : ['popular', 'best', 'basic']

  const variant = fallbackOrder
    .map((quality) => variants.find((item) => item.quality_tag === quality))
    .find(Boolean) || variants[0]

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    tier: (variant?.quality_tag as CatalogChoice['tier']) || tier,
    variantId: variant?.id,
    variantName: variant?.name || product.name,
    variantDescription: variant?.description || product.price_per_unit,
    unitPrice: variant?.price || product.price,
    unitLabel: product.price_per_unit || 'per unit',
  }
}

function quantityOptions(lang: string) {
  return [
    { id: 'qty_1', title: isHindi(lang) ? '1 pack' : '1 pack' },
    { id: 'qty_2', title: isHindi(lang) ? '2 packs' : '2 packs' },
    { id: 'qty_3', title: isHindi(lang) ? '3 packs' : '3 packs' },
  ]
}

function quantityMultiplier(input: string) {
  if (input === 'qty_2' || input.includes('2')) return 2
  if (input === 'qty_3' || input.includes('3')) return 3
  return 1
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
    .select('id,name,category,price,price_per_unit,in_stock,tags,variants')
    .eq('category', category)
    .eq('in_stock', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as ProductRow[]
}

async function fetchLiveCatalog() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id,name,category,price,price_per_unit,in_stock,tags,variants')
    .eq('in_stock', true)
    .order('name', { ascending: true })
    .limit(30)

  if (error) throw error
  return (data || []) as ProductRow[]
}

async function showMenu(phone: string, lang: string) {
  const body = isHindi(lang)
    ? 'आज हम आपकी कैसे मदद करें?'
    : 'How can we help you today?'

  await sendWhatsAppList(
    phone,
    isHindi(lang) ? 'विकल्प' : 'Options',
    [
      { id: 'menu_order', title: 'Order products' },
      { id: 'menu_track', title: 'Track my order' },
      { id: 'menu_advice', title: 'Get product advice' },
      { id: 'menu_support', title: 'Talk to support' },
    ],
    body
  )
}

async function showCategories(phone: string, lang: string) {
  const categories = await fetchCategories()

  if (!categories.length) {
    await sendWhatsAppMessage(
      phone,
      isHindi(lang)
        ? 'अभी कोई category available नहीं है। कृपया थोड़ी देर बाद try करें।'
        : 'No categories are available right now. Please try again shortly.'
    )
    return
  }

  await sendWhatsAppList(
    phone,
    isHindi(lang) ? 'Category' : 'Category',
    categories.map((category, index) => ({
      id: `cat_${index + 1}`,
      title: category,
    })),
    isHindi(lang) ? 'कृपया category चुनें:' : 'Please choose a category:'
  )
}

export async function handleIncomingMessage(phone: string, input: string) {
  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) return

  const session = await getSession(normalizedPhone)
  const rawInput = input.trim()
  const msg = rawInput.toLowerCase()

  if (msg === 'menu' || msg === 'main menu' || msg === 'menu_main') {
    await saveSession(normalizedPhone, { state: 'MENU' })
    await showMenu(normalizedPhone, session.lang || 'English')
    return
  }

  switch (session.state) {
    case 'GREETING': {
      await sendWhatsAppMessage(
        normalizedPhone,
        'Namaste 🙏 Welcome to MANA - The Essence of Nature.\n\nPlease choose your language.'
      )
      await sendWhatsAppList(
        normalizedPhone,
        'Language',
        [
          { id: 'lang_en', title: 'English' },
          { id: 'lang_hi', title: 'हिंदी' },
        ]
      )
      await saveSession(normalizedPhone, { state: 'LANGUAGE', lang: 'English', cart: {} })
      break
    }

    case 'LANGUAGE': {
      const lang = msg.includes('lang_hi') || msg.includes('हिं') || msg.includes('hindi') ? 'Hindi' : 'English'
      await saveSession(normalizedPhone, { state: 'MENU', lang, cart: {} })
      await showMenu(normalizedPhone, lang)
      break
    }

    case 'MENU': {
      if (msg === '1' || msg.includes('menu_order') || msg.includes('order')) {
        await saveSession(normalizedPhone, { state: 'ORDER_CATEGORY', cart: {} })
        await showCategories(normalizedPhone, session.lang)
        break
      }

      if (msg === '2' || msg.includes('menu_track') || msg.includes('track')) {
        await saveSession(normalizedPhone, { state: 'TRACKING' })
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'कृपया अपना Order ID भेजें.\n\nउदाहरण: MANA12345'
            : 'Please enter your Order ID.\n\nExample: MANA12345'
        )
        break
      }

      if (msg === '3' || msg.includes('menu_advice') || msg.includes('advice')) {
        await saveSession(normalizedPhone, { state: 'ADVICE' })
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'अपना goal या concern बताइए.\n\nउदाहरण:\n• stress के लिए कौन सी herb?\n• daily healthy eating के लिए क्या लें?'
            : 'Tell us your goal or concern.\n\nExamples:\n• Which herb helps with stress?\n• What is good for daily healthy eating?'
        )
        break
      }

      if (msg === '4' || msg.includes('menu_support') || msg.includes('support')) {
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'हमारी टीम आपसे जल्द जुड़ेगी.\n\nआप सीधे 9910899796 पर भी call या WhatsApp कर सकते हैं.'
            : 'Connecting you to our team.\n\nYou can also call or WhatsApp us directly at 9910899796.'
        )
        await showMenu(normalizedPhone, session.lang)
        break
      }

      await showMenu(normalizedPhone, session.lang)
      break
    }

    case 'ORDER_CATEGORY': {
      const categories = await fetchCategories()
      const categoryByIndex = categories[Math.max(0, Number.parseInt(msg, 10) - 1)]
      const chosen =
        categoryByIndex ||
        categories.find((category, index) => msg === `cat_${index + 1}`) ||
        categories.find((category) => msg.includes(category.toLowerCase()))

      if (!chosen) {
        await showCategories(normalizedPhone, session.lang)
        break
      }

      await saveSession(normalizedPhone, {
        state: 'ORDER_QUALITY',
        cart: { ...(session.cart || {}), category: chosen },
      })

      await sendWhatsAppList(
        normalizedPhone,
        isHindi(session.lang) ? 'Quality' : 'Quality',
        [
          { id: 'q_basic', title: 'Daily Use', description: 'Budget-friendly' },
          { id: 'q_mid', title: 'Best Seller', description: 'Most popular' },
          { id: 'q_top', title: 'Premium', description: 'Top quality' },
        ],
        isHindi(session.lang)
          ? `आपने ${chosen} चुना है.\nअब quality चुनें:`
          : `${chosen} selected.\nPlease choose your preferred quality:`
      )
      break
    }

    case 'ORDER_QUALITY': {
      const tier = mapTierFromInput(msg) || 'popular'
      const category = session.cart?.category

      if (!category) {
        await saveSession(normalizedPhone, { state: 'ORDER_CATEGORY', cart: {} })
        await showCategories(normalizedPhone, session.lang)
        break
      }

      const products = await fetchProductsByCategory(category)
      if (!products.length) {
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'इस category में अभी कोई product available नहीं है।'
            : 'No products are available in this category right now.'
        )
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        await showMenu(normalizedPhone, session.lang)
        break
      }

      const choices = products.map((product) => chooseVariant(product, tier))
      await saveSession(normalizedPhone, {
        state: 'ORDER_PRODUCT',
        cart: { ...(session.cart || {}), tier, products_cache: choices },
      })

      await sendWhatsAppList(
        normalizedPhone,
        isHindi(session.lang) ? 'Products' : 'Products',
        choices.map((choice) => ({
          id: `prod_${choice.productId}`,
          title: choice.productName,
          description: `${getTierLabel(choice.tier, session.lang)} - ${formatMoney(choice.unitPrice)}`,
        })),
        isHindi(session.lang)
          ? 'कृपया product चुनें:'
          : 'Please choose a product:'
      )
      break
    }

    case 'ORDER_PRODUCT': {
      const products = Array.isArray(session.cart?.products_cache) ? session.cart.products_cache : []
      const productId = rawInput.replace('prod_', '')
      const choice = products.find((item: CatalogChoice) => item.productId === productId || item.productName.toLowerCase().includes(msg))

      if (!choice) {
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'कृपया list से product चुनें।'
            : 'Please select a product from the list.'
        )
        break
      }

      await saveSession(normalizedPhone, {
        state: 'ORDER_QTY',
        cart: { ...(session.cart || {}), product: choice },
      })

      await sendWhatsAppList(
        normalizedPhone,
        isHindi(session.lang) ? 'Quantity' : 'Quantity',
        quantityOptions(session.lang),
        isHindi(session.lang)
          ? `${choice.productName} selected.\nकितने packs चाहिए?`
          : `${choice.productName} selected.\nHow many packs would you like?`
      )
      break
    }

    case 'ORDER_QTY': {
      const product = session.cart?.product as CatalogChoice | undefined
      if (!product) {
        await saveSession(normalizedPhone, { state: 'ORDER_CATEGORY', cart: {} })
        await showCategories(normalizedPhone, session.lang)
        break
      }

      const packs = quantityMultiplier(rawInput)
      const total = product.unitPrice * packs

      await saveSession(normalizedPhone, {
        state: 'ORDER_CONFIRM',
        cart: {
          ...(session.cart || {}),
          quantity: packs,
          total,
        },
      })

      await sendWhatsAppButtons(
        normalizedPhone,
        `${product.productName}\n${getTierLabel(product.tier, session.lang)}\n${packs} pack${packs > 1 ? 's' : ''}\n${formatMoney(total)}\n\n${isHindi(session.lang) ? 'क्या मैं order आगे बढ़ाऊँ?' : 'Would you like to proceed?'}`,
        [
          { id: 'confirm_yes', title: 'Yes' },
          { id: 'confirm_no', title: 'Cancel' },
        ]
      )
      break
    }

    case 'ORDER_CONFIRM': {
      if (msg.includes('confirm_no') || msg.includes('cancel') || msg === '2') {
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang) ? 'Order cancel कर दिया गया।' : 'Order cancelled.'
        )
        await showMenu(normalizedPhone, session.lang)
        break
      }

      await saveSession(normalizedPhone, { state: 'ORDER_DETAILS' })
      await sendWhatsAppMessage(
        normalizedPhone,
        isHindi(session.lang)
          ? 'कृपया shipping details एक message में भेजें:\n\nName | Address | City | Pincode'
          : 'Please share shipping details in one message:\n\nName | Address | City | Pincode'
      )
      break
    }

    case 'ORDER_DETAILS': {
      const details = parseWhatsAppDetails(rawInput)
      if (!details) {
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'कृपया इसी format में भेजें:\nName | Address | City | Pincode'
            : 'Please use this format:\nName | Address | City | Pincode'
        )
        break
      }

      const product = session.cart?.product as CatalogChoice | undefined
      const total = Number(session.cart?.total || 0)
      const quantity = Number(session.cart?.quantity || 1)

      if (!product || total <= 0) {
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        await showMenu(normalizedPhone, session.lang)
        break
      }

      const orderRef = `MANA${Date.now().toString().slice(-6)}`
      const orderItems = [
        {
          product_id: product.productId,
          product_name: product.productName,
          product_image: '',
          variant_id: product.variantId || null,
          variant_name: product.variantName,
          weight_grams: 0,
          price: product.unitPrice,
          quantity,
        },
      ]

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
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? 'Order create नहीं हो पाया। कृपया दोबारा try करें या support से बात करें।'
            : 'We could not create the order right now. Please try again or talk to support.'
        )
        await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
        break
      }

      const paymentLink = await createRazorpayLink({
        amount: total,
        description: `MANA - ${product.productName} (${quantity} pack${quantity > 1 ? 's' : ''})`,
        orderId: order.id,
        phone: normalizedPhone,
      })

      await supabaseAdmin
        .from('orders')
        .update({ razorpay_link: paymentLink })
        .eq('id', order.id)

      await sendWhatsAppMessage(
        normalizedPhone,
        `${isHindi(session.lang) ? 'Order placed' : 'Order placed'} ✅\n\nOrder ID: ${orderRef}\n${product.productName} x ${quantity}\nTotal: ${formatMoney(total)}\n\nPay here:\n${paymentLink}`
      )

      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang)
      break
    }

    case 'TRACKING': {
      const orderId = rawInput.trim().toUpperCase()
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('order_ref,status,payment_status,total,created_at')
        .eq('order_ref', orderId)
        .eq('customer_phone', normalizedPhone)
        .maybeSingle()

      if (!order) {
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang)
            ? `Order ${orderId} नहीं मिला। कृपया ID check करें या menu लिखें।`
            : `Order ${orderId} was not found. Please check the ID or type menu.`
        )
        break
      }

      const statusMap: Record<string, string> = {
        pending: 'Pending confirmation',
        confirmed: 'Confirmed',
        packed: 'Packed',
        shipped: 'Dispatched',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      }

      await sendWhatsAppMessage(
        normalizedPhone,
        `Order: ${order.order_ref}\nStatus: ${statusMap[order.status] || order.status}\nPayment: ${order.payment_status === 'paid' ? 'Paid' : 'Pending'}\nAmount: ${formatMoney(order.total)}\nPlaced: ${new Date(order.created_at).toLocaleDateString('en-IN')}`
      )
      await saveSession(normalizedPhone, { state: 'MENU' })
      break
    }

    case 'ADVICE': {
      const catalog = await fetchLiveCatalog()
      const reply = await getAIAdvice(rawInput, session.lang, buildProductContext(catalog))

      await sendWhatsAppMessage(normalizedPhone, reply)
      await sendWhatsAppList(
        normalizedPhone,
        isHindi(session.lang) ? 'Next' : 'Next',
        [
          { id: 'menu_order', title: 'Order products' },
          { id: 'advice_more', title: 'Ask another question' },
          { id: 'menu_main', title: 'Main menu' },
        ]
      )
      await saveSession(normalizedPhone, { state: 'ADVICE_FOLLOWUP' })
      break
    }

    case 'ADVICE_FOLLOWUP': {
      if (msg.includes('advice_more')) {
        await saveSession(normalizedPhone, { state: 'ADVICE' })
        await sendWhatsAppMessage(
          normalizedPhone,
          isHindi(session.lang) ? 'अपना अगला सवाल भेजें।' : 'Go ahead - ask your next question.'
        )
        break
      }

      if (msg.includes('menu_order') || msg.includes('order')) {
        await saveSession(normalizedPhone, { state: 'ORDER_CATEGORY', cart: {} })
        await showCategories(normalizedPhone, session.lang)
        break
      }

      await saveSession(normalizedPhone, { state: 'MENU' })
      await showMenu(normalizedPhone, session.lang)
      break
    }

    default: {
      await saveSession(normalizedPhone, { state: 'MENU', cart: {} })
      await showMenu(normalizedPhone, session.lang || 'English')
      break
    }
  }
}
