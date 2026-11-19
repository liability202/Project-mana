import type { Order } from '@/lib/supabase'

// NimbusPost setup (API docs: documenter.getpostman.com/view/9692837/TW6wHnoz):
// NIMBUSPOST_EMAIL=            login for the API token
// NIMBUSPOST_PASSWORD=
// NIMBUSPOST_PICKUP_LOCATION=  warehouse name as saved in NimbusPost (max 20 chars)
// NIMBUSPOST_PICKUP_POSTCODE=
// Needed to book shipments (NimbusPost wants the full pickup address each time):
// NIMBUSPOST_PICKUP_NAME=      contact person / business name
// NIMBUSPOST_PICKUP_ADDRESS=
// NIMBUSPOST_PICKUP_ADDRESS_2= (optional)
// NIMBUSPOST_PICKUP_CITY=
// NIMBUSPOST_PICKUP_STATE=
// NIMBUSPOST_PICKUP_PHONE=     10 digits
// Optional:
// NIMBUSPOST_API_KEY=          a ready-made bearer token instead of email/password
// NIMBUSPOST_BASE_URL=https://api.nimbuspost.com/v1

const NIMBUSPOST_BASE_URL = (process.env.NIMBUSPOST_BASE_URL || 'https://api.nimbuspost.com/v1').replace(/\/+$/, '')
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
const siteUrl = (rawSiteUrl && !rawSiteUrl.includes('localhost')) ? rawSiteUrl : 'https://manadryfruits.com'

const PATHS = {
  auth: process.env.NIMBUSPOST_AUTH_PATH || '/users/login',
  serviceability: process.env.NIMBUSPOST_SERVICEABILITY_PATH || '/courier/serviceability',
  createShipment: process.env.NIMBUSPOST_CREATE_SHIPMENT_PATH || '/shipments',
  tracking: process.env.NIMBUSPOST_TRACKING_PATH || '/shipments/track/:awb',
}

let cachedToken: { token: string; expiresAt: number } | null = null

function normalizeMoney(amountPaise: number) {
  return Number((amountPaise / 100).toFixed(2))
}

function calculateOrderWeightGrams(items: any[] = []) {
  const total = items.reduce((sum, item) => {
    const qty = Math.max(1, Number(item?.quantity || 1))
    const weight = Math.max(0, Number(item?.weight_grams || 0))
    return sum + weight * qty
  }, 0)

  return total || 500
}

// Returns YYYY-MM-DD. Date-only strings are taken as written (no Date object,
// so no timezone shift — the old "+1 day" fudge made every date a day late);
// timestamps become the calendar date in India. Plain numbers are ETD day
// counts, not dates, and are left to parseEtdDays.
function normalizeDateOnly(value?: unknown) {
  if (value === null || value === undefined || value === '' || typeof value === 'number') return null
  const text = String(value).trim()
  const dayFirst = text.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (dayFirst) return `${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  if (/^\d+$/.test(text)) return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date)
}

function sanitizeCode(value: string) {
  return value.replace(/[^A-Z0-9-]/gi, '').toUpperCase()
}

function joinUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${NIMBUSPOST_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function withAwb(pathTemplate: string, awb: string) {
  return pathTemplate.includes(':awb')
    ? pathTemplate.replace(':awb', encodeURIComponent(awb))
    : `${pathTemplate.replace(/\/+$/, '')}/${encodeURIComponent(awb)}`
}

function extractErrorMessage(data: any, fallback: string) {
  return (
    data?.message ||
    data?.error ||
    data?.data?.message ||
    data?.meta?.message ||
    data?.errors?.[0]?.message ||
    fallback
  )
}

function getCourierOptions(data: any): any[] {
  if (Array.isArray(data?.data?.available_courier_companies)) return data.data.available_courier_companies
  if (Array.isArray(data?.available_courier_companies)) return data.available_courier_companies
  if (Array.isArray(data?.data?.couriers)) return data.data.couriers
  if (Array.isArray(data?.couriers)) return data.couriers
  if (Array.isArray(data?.data?.options)) return data.data.options
  if (Array.isArray(data?.options)) return data.options
  if (Array.isArray(data?.data)) return data.data
  return []
}

export function hasNimbusPostConfig() {
  return Boolean(
    (process.env.NIMBUSPOST_API_KEY || (process.env.NIMBUSPOST_EMAIL && process.env.NIMBUSPOST_PASSWORD)) &&
    process.env.NIMBUSPOST_PICKUP_POSTCODE &&
    process.env.NIMBUSPOST_PICKUP_LOCATION
  )
}

export function getPublicTrackingUrl(orderRef: string, phone: string, awb?: string | null) {
  if (awb) {
    return `https://ship.nimbuspost.com/shipping/tracking/${awb}`
  }
  const params = new URLSearchParams({ orderRef, phone })
  return `${siteUrl}/track-order?${params.toString()}`
}

async function getNimbusToken() {
  const directToken = process.env.NIMBUSPOST_API_KEY
  if (directToken) return directToken

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  const email = process.env.NIMBUSPOST_EMAIL
  const password = process.env.NIMBUSPOST_PASSWORD
  if (!email || !password) {
    throw new Error('NimbusPost credentials are missing.')
  }

  const response = await fetch(joinUrl(PATHS.auth), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  const token = typeof data?.data === 'string' ? data.data : (data?.token || data?.access_token || data?.data?.token || data?.data?.access_token)
  if (!response.ok || !token) {
    throw new Error(extractErrorMessage(data, 'NimbusPost authentication failed.'))
  }

  cachedToken = {
    token,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  }

  return token as string
}

async function nimbusFetch(path: string, init: RequestInit = {}) {
  const token = await getNimbusToken()
  const response = await fetch(joinUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-api-key': process.env.NIMBUSPOST_API_KEY || token,
      'api-key': process.env.NIMBUSPOST_API_KEY || token,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, `NimbusPost request failed: ${response.status}`))
  }

  return data
}

// ── rates ──

/** One courier NimbusPost offers for a parcel, with its price in rupees. */
export type CourierRate = {
  id: string
  name: string
  freight: number
  codCharge: number
  total: number
  /** YYYY-MM-DD */
  deliveryDate: string | null
  minWeightGrams: number | null
  chargeableWeightGrams: number | null
}

function toNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toCourierRate(raw: any): CourierRate | null {
  const id = String(raw?.id ?? raw?.courier_id ?? '').trim()
  if (!id) return null
  const freight = toNumber(raw?.freight_charges) ?? 0
  const codCharge = toNumber(raw?.cod_charges) ?? 0
  return {
    id,
    name: String(raw?.name || raw?.courier_name || 'Courier').trim(),
    freight,
    codCharge,
    total: toNumber(raw?.total_charges) ?? freight + codCharge,
    deliveryDate: normalizeDateOnly(raw?.edd ?? raw?.etd ?? raw?.expected_delivery_date),
    minWeightGrams: toNumber(raw?.min_weight),
    chargeableWeightGrams: toNumber(raw?.chargeable_weight),
  }
}

const byPriceThenDate = (a: CourierRate, b: CourierRate) =>
  a.total - b.total || (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999')

export type ParcelSize = { weightGrams: number; lengthCm?: number; breadthCm?: number; heightCm?: number }

/** Every courier that can take this parcel, cheapest first. Books nothing. */
export async function getNimbusCourierRates(params: ParcelSize & {
  deliveryPincode: string
  cod: boolean
  orderAmountPaise?: number
}): Promise<{ rates: CourierRate[]; message: string | null }> {
  const data = await nimbusFetch(PATHS.serviceability, {
    method: 'POST',
    body: JSON.stringify({
      origin: process.env.NIMBUSPOST_PICKUP_POSTCODE || '',
      destination: params.deliveryPincode,
      payment_type: params.cod ? 'cod' : 'prepaid',
      order_amount: params.orderAmountPaise ? normalizeMoney(params.orderAmountPaise) : 500,
      weight: Math.max(1, Math.round(params.weightGrams)),
      length: Math.max(1, Math.round(Number(params.lengthCm) || 10)),
      breadth: Math.max(1, Math.round(Number(params.breadthCm) || 10)),
      height: Math.max(1, Math.round(Number(params.heightCm) || 10)),
    }),
  })

  const rates = getCourierOptions(data)
    .map(toCourierRate)
    .filter((r): r is CourierRate => Boolean(r))
    .sort(byPriceThenDate)
  return {
    rates,
    message: rates.length ? null : extractErrorMessage(data, 'No courier delivers to this pincode.'),
  }
}

type ServiceabilityResult = {
  configured: boolean
  serviceable: boolean | null
  courierName: string | null
  courierId: string | null
  etdDays: number | null
  estimatedDeliveryDate: string | null
  availableCourierCount: number
  codAvailable: boolean | null
  freightCharge: number | null
  message?: string
}

/** The customer-facing pincode check: can we deliver, and by when. */
export async function getNimbusPostServiceability(params: {
  deliveryPincode: string
  weightGrams: number
  cod: boolean
}): Promise<ServiceabilityResult> {
  const empty = {
    courierName: null,
    courierId: null,
    etdDays: null,
    estimatedDeliveryDate: null,
    availableCourierCount: 0,
    freightCharge: null,
  }
  if (!hasNimbusPostConfig()) {
    return { ...empty, configured: false, serviceable: null, codAvailable: null, message: 'NimbusPost is not configured yet.' }
  }

  const { rates, message } = await getNimbusCourierRates(params)
  if (!rates.length) {
    return {
      ...empty,
      configured: true,
      serviceable: false,
      codAvailable: params.cod ? false : true,
      message: message || 'Delivery is not available on this pincode.',
    }
  }

  // Quote the earliest date any courier offers, priced by the cheapest one on that date.
  const fastest = [...rates].sort(
    (a, b) => (a.deliveryDate || '9999').localeCompare(b.deliveryDate || '9999') || a.total - b.total
  )[0]
  const etdDays = fastest.deliveryDate
    ? Math.max(0, Math.round((Date.parse(`${fastest.deliveryDate}T00:00:00+05:30`) - Date.now()) / 86_400_000))
    : null

  return {
    configured: true,
    serviceable: true,
    courierName: fastest.name,
    courierId: fastest.id,
    etdDays,
    estimatedDeliveryDate: fastest.deliveryDate,
    availableCourierCount: rates.length,
    codAvailable: params.cod,
    freightCharge: fastest.total,
    message: rates.length > 1 ? `${rates.length} courier options available.` : 'Delivery is available.',
  }
}

// ── booking ──

const digits10 = (value: unknown) => String(value || '').replace(/\D/g, '').slice(-10)

/** Settings NimbusPost needs for the pickup address that aren't filled in yet. */
export function missingPickupSettings() {
  const required: Record<string, string | undefined> = {
    NIMBUSPOST_PICKUP_LOCATION: process.env.NIMBUSPOST_PICKUP_LOCATION,
    NIMBUSPOST_PICKUP_NAME: process.env.NIMBUSPOST_PICKUP_NAME,
    NIMBUSPOST_PICKUP_ADDRESS: process.env.NIMBUSPOST_PICKUP_ADDRESS,
    NIMBUSPOST_PICKUP_CITY: process.env.NIMBUSPOST_PICKUP_CITY,
    NIMBUSPOST_PICKUP_STATE: process.env.NIMBUSPOST_PICKUP_STATE,
    NIMBUSPOST_PICKUP_POSTCODE: process.env.NIMBUSPOST_PICKUP_POSTCODE,
  }
  const missing = Object.entries(required)
    .filter(([, v]) => !String(v || '').trim())
    .map(([k]) => k)
  if (digits10(process.env.NIMBUSPOST_PICKUP_PHONE).length !== 10) missing.push('NIMBUSPOST_PICKUP_PHONE')
  return missing
}

function pickupAddress() {
  const missing = missingPickupSettings()
  if (missing.length) {
    throw new Error(`The pickup address is not set up yet (${missing.join(', ')}). Nothing was booked.`)
  }
  const env = process.env
  return {
    warehouse_name: String(env.NIMBUSPOST_PICKUP_LOCATION).slice(0, 20),
    name: String(env.NIMBUSPOST_PICKUP_NAME).slice(0, 200),
    address: String(env.NIMBUSPOST_PICKUP_ADDRESS).slice(0, 200),
    address_2: String(env.NIMBUSPOST_PICKUP_ADDRESS_2 || '').slice(0, 200),
    city: String(env.NIMBUSPOST_PICKUP_CITY).slice(0, 40),
    state: String(env.NIMBUSPOST_PICKUP_STATE).slice(0, 40),
    pincode: String(env.NIMBUSPOST_PICKUP_POSTCODE),
    phone: digits10(env.NIMBUSPOST_PICKUP_PHONE),
  }
}

/** Splits a long address over NimbusPost's two 200-character lines. */
function splitAddress(address: string) {
  const text = address.replace(/\s+/g, ' ').trim()
  if (text.length <= 200) return { address: text, address_2: '' }
  const space = text.lastIndexOf(' ', 200)
  const cut = space > 120 ? space : 200
  return { address: text.slice(0, cut).trim(), address_2: text.slice(cut).trim().slice(0, 200) }
}

/** "Ashwagandha Powder", not "Ashwagandha Powder - Powder". */
function itemName(item: any, index: number) {
  const base = String(item.product_name || item.name || `Item ${index + 1}`).trim()
  const variant = String(item.variant_name || '').trim()
  return (variant && !base.toLowerCase().includes(variant.toLowerCase()) ? `${base} - ${variant}` : base).slice(0, 200)
}

export function isCodOrder(order: { payment_status?: string | null }) {
  return order.payment_status !== 'paid'
}

export type NimbusParcelInput = {
  weightGrams?: number
  lengthCm?: number
  breadthCm?: number
  heightCm?: number
  /** A courier id from getNimbusCourierRates. Empty means the cheapest one. */
  courierId?: string | null
  generatePickup?: boolean
}

export type NimbusBooking = {
  orderId: string | null
  shipmentId: string | null
  awb: string | null
  courierId: string | null
  courierName: string | null
  label: string | null
  manifest: string | null
}

/** Books the parcel with NimbusPost and returns the AWB. This costs money. */
export async function createNimbusShipment(
  order: Order,
  parcel: NimbusParcelInput & { courierId: string }
): Promise<NimbusBooking> {
  const orderCode = (order.order_ref || sanitizeCode(order.id.slice(0, 8))).slice(0, 20)
  const weightGrams = Math.max(100, Math.round(Number(parcel.weightGrams || 0) || calculateOrderWeightGrams(order.items)))
  const consigneePhone = digits10(order.customer_phone)
  if (consigneePhone.length !== 10) {
    throw new Error('The customer phone number is not a valid 10-digit number. Nothing was booked.')
  }
  if (!/^\d{6}$/.test(String(order.pincode || ''))) {
    throw new Error('The delivery pincode is not 6 digits. Nothing was booked.')
  }

  const payload = {
    order_number: orderCode,
    payment_type: isCodOrder(order) ? 'cod' : 'prepaid',
    // What the courier collects on a COD order, so it must be the customer's final total.
    order_amount: normalizeMoney(order.final_amount || order.total),
    package_weight: weightGrams,
    package_length: Math.max(1, Math.round(Number(parcel.lengthCm) || 20)),
    package_breadth: Math.max(1, Math.round(Number(parcel.breadthCm) || 15)),
    package_height: Math.max(1, Math.round(Number(parcel.heightCm) || 12)),
    request_auto_pickup: parcel.generatePickup === false ? 'no' : 'yes',
    consignee: {
      name: String(order.customer_name || 'Customer').slice(0, 200),
      ...splitAddress(String(order.address || '')),
      city: String(order.city || '').slice(0, 40),
      state: String(order.state || order.city || '').slice(0, 40),
      pincode: String(order.pincode),
      phone: consigneePhone,
    },
    pickup: pickupAddress(),
    order_items: (order.items || []).map((item: any, index: number) => ({
      name: itemName(item, index),
      qty: String(Math.max(1, Number(item.quantity || 1))),
      price: String(normalizeMoney(Number(item.price || 0))),
      sku: sanitizeCode(String(item.product_id || `${orderCode}-${index + 1}`)).slice(0, 40),
    })),
    courier_id: parcel.courierId,
    is_insurance: '0',
    tags: 'manadryfruits.com',
  }

  const data = await nimbusFetch(PATHS.createShipment, { method: 'POST', body: JSON.stringify(payload) })
  if (data?.status === false || !data?.data) {
    throw new Error(`NimbusPost refused the booking: ${extractErrorMessage(data, 'no reason given')}. Nothing was booked.`)
  }
  const d = data.data
  const text = (v: unknown) => (v === null || v === undefined || v === '' ? null : String(v))
  return {
    orderId: text(d.order_id),
    shipmentId: text(d.shipment_id),
    awb: text(d.awb_number),
    courierId: text(d.courier_id),
    courierName: text(d.courier_name),
    label: text(d.label),
    manifest: text(d.manifest),
  }
}

// ── tracking ──

export async function trackNimbusAwb(awbCode: string) {
  const data = await nimbusFetch(withAwb(PATHS.tracking, awbCode), {
    method: 'GET',
  })

  const trackingData = data?.tracking_data || data?.data || data
  const shipmentTrack = Array.isArray(trackingData?.history)
    ? trackingData.history
    : Array.isArray(trackingData?.shipment_track)
      ? trackingData.shipment_track
      : Array.isArray(trackingData?.shipment_track_activities)
        ? trackingData.shipment_track_activities
        : Array.isArray(trackingData?.activities)
          ? trackingData.activities
          : Array.isArray(trackingData?.events)
            ? trackingData.events
            : []

  const latestTrack = shipmentTrack[0] || trackingData?.shipment_status || {}
  const currentStatus =
    trackingData?.track_status?.current_status ||
    trackingData?.status ||
    latestTrack?.current_status ||
    latestTrack?.status ||
    trackingData?.current_status ||
    null

  return {
    courierName: trackingData?.shipment_data?.courier_name || trackingData?.courier_name || trackingData?.courier || null,
    expectedDelivery: normalizeDateOnly(
      trackingData?.etd ||
      trackingData?.edd ||
      trackingData?.expected_delivery_date ||
      trackingData?.estimated_delivery_date ||
      latestTrack?.edd
    ),
    currentStatus,
    activities: shipmentTrack,
    raw: data,
  }
}

// ── ship an order ──

export type NimbusShipResult = {
  /** Columns to save on the order. */
  update: Record<string, any>
  /** The courier that was booked, with the price NimbusPost quoted. */
  rate: CourierRate | null
  label: string | null
}

/**
 * Books an order with the chosen courier (or the cheapest if none is chosen)
 * and returns what to save on the order. An order that already has an AWB is
 * only re-synced, never booked twice.
 */
export async function buildNimbusShipmentUpdate(order: Order, parcel: NimbusParcelInput = {}): Promise<NimbusShipResult | null> {
  if (!hasNimbusPostConfig()) return null

  const orderRef = order.order_ref || sanitizeCode(order.id.slice(0, 8))

  if (order.tracking_number) {
    const tracking = await trackNimbusAwb(order.tracking_number)
    return {
      rate: null,
      label: null,
      update: {
        tracking_number: order.tracking_number,
        tracking_link: getPublicTrackingUrl(orderRef, order.customer_phone, order.tracking_number),
        courier_name: tracking.courierName || order.courier_name || null,
        expected_delivery: tracking.expectedDelivery || order.expected_delivery || null,
        shiprocket_tracking_status: tracking.currentStatus || null,
        tracking_events: tracking.activities || [],
        tracking_synced_at: new Date().toISOString(),
      },
    }
  }

  const weightGrams = Math.max(100, Number(parcel.weightGrams || 0) || calculateOrderWeightGrams(order.items))
  const { rates } = await getNimbusCourierRates({
    deliveryPincode: order.pincode,
    cod: isCodOrder(order),
    orderAmountPaise: order.final_amount || order.total,
    weightGrams,
    lengthCm: parcel.lengthCm,
    breadthCm: parcel.breadthCm,
    heightCm: parcel.heightCm,
  })

  if (!rates.length) {
    return {
      rate: null,
      label: null,
      update: {
        tracking_link: getPublicTrackingUrl(orderRef, order.customer_phone, null),
        shiprocket_tracking_status: 'UNSERVICEABLE',
        tracking_synced_at: new Date().toISOString(),
      },
    }
  }

  const wanted = String(parcel.courierId || '').trim()
  const rate = wanted ? rates.find(r => r.id === wanted) : rates[0]
  if (!rate) {
    throw new Error('That courier is no longer offered for this parcel. Check the couriers again. Nothing was booked.')
  }

  const booking = await createNimbusShipment(order, { ...parcel, weightGrams, courierId: rate.id })

  let tracking = null
  if (booking.awb) tracking = await trackNimbusAwb(booking.awb).catch(() => null)

  return {
    rate,
    label: booking.label,
    update: {
      shiprocket_order_id: booking.orderId,
      shiprocket_shipment_id: booking.shipmentId,
      tracking_number: booking.awb,
      tracking_link: getPublicTrackingUrl(orderRef, order.customer_phone, booking.awb),
      courier_name: booking.courierName || rate.name,
      expected_delivery: tracking?.expectedDelivery || rate.deliveryDate || order.expected_delivery || null,
      shiprocket_tracking_status: tracking?.currentStatus || 'booked',
      tracking_events: tracking?.activities || [],
      tracking_synced_at: new Date().toISOString(),
    },
  }
}
