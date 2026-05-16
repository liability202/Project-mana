import type { Order } from '@/lib/supabase'

// NimbusPost setup:
// NIMBUSPOST_API_KEY=
// or
// NIMBUSPOST_EMAIL=
// NIMBUSPOST_PASSWORD=
// Required:
// NIMBUSPOST_PICKUP_LOCATION=
// NIMBUSPOST_PICKUP_POSTCODE=
// Optional:
// NIMBUSPOST_BASE_URL=https://api.nimbuspost.com/v1
// NIMBUSPOST_FALLBACK_EMAIL=orders@yourdomain.com
// NIMBUSPOST_AUTH_PATH=/auth/login
// NIMBUSPOST_SERVICEABILITY_PATH=/courier/serviceability
// NIMBUSPOST_CREATE_SHIPMENT_PATH=/shipments
// NIMBUSPOST_ASSIGN_AWB_PATH=/shipments/assign-awb
// NIMBUSPOST_PICKUP_PATH=/shipments/generate-pickup
// NIMBUSPOST_TRACKING_PATH=/shipments/track/:awb

const NIMBUSPOST_BASE_URL = (process.env.NIMBUSPOST_BASE_URL || 'https://api.nimbuspost.com/v1').replace(/\/+$/, '')
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const PATHS = {
  auth: process.env.NIMBUSPOST_AUTH_PATH || '/users/login',
  serviceability: process.env.NIMBUSPOST_SERVICEABILITY_PATH || '/courier/serviceability',
  createShipment: process.env.NIMBUSPOST_CREATE_SHIPMENT_PATH || '/shipments',
  assignAwb: process.env.NIMBUSPOST_ASSIGN_AWB_PATH || '/shipments/assign-awb',
  pickup: process.env.NIMBUSPOST_PICKUP_PATH || '/shipments/generate-pickup',
  tracking: process.env.NIMBUSPOST_TRACKING_PATH || '/shipments/track/:awb',
}

let cachedToken: { token: string; expiresAt: number } | null = null

function normalizeMoney(amountPaise: number) {
  return Number((amountPaise / 100).toFixed(2))
}

function normalizeWeightKg(weightGrams: number) {
  return Math.max(0.1, Number((weightGrams / 1000).toFixed(2)))
}

function calculateOrderWeightGrams(items: any[] = []) {
  const total = items.reduce((sum, item) => {
    const qty = Math.max(1, Number(item?.quantity || 1))
    const weight = Math.max(0, Number(item?.weight_grams || 0))
    return sum + weight * qty
  }, 0)

  return total || 500
}

function normalizeDateOnly(value?: string | null) {
  if (!value) return null
  let dateStr = value
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [d, m, y] = value.split('-')
    dateStr = `${y}-${m}-${d}`
  }
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
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

function parseEtdDays(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const match = value.match(/\d+/)
    if (match) return Number(match[0])
  }
  return null
}

function formatEstimatedDate(days: number | null) {
  if (!days && days !== 0) return null
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
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

export function getPublicTrackingUrl(orderRef: string, phone: string) {
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

type ServiceabilityResult = {
  configured: boolean
  serviceable: boolean | null
  courierName: string | null
  courierId: number | null
  etdDays: number | null
  estimatedDeliveryDate: string | null
  availableCourierCount: number
  codAvailable: boolean | null
  freightCharge: number | null
  message?: string
}

export async function getNimbusPostServiceability(params: {
  deliveryPincode: string
  weightGrams: number
  cod: boolean
}) {
  if (!hasNimbusPostConfig()) {
    return {
      configured: false,
      serviceable: null,
      courierName: null,
      courierId: null,
      etdDays: null,
      estimatedDeliveryDate: null,
      availableCourierCount: 0,
      codAvailable: null,
      freightCharge: null,
      message: 'NimbusPost is not configured yet.',
    } satisfies ServiceabilityResult
  }

  const data = await nimbusFetch(PATHS.serviceability, {
    method: 'POST',
    body: JSON.stringify({
      origin: process.env.NIMBUSPOST_PICKUP_POSTCODE || '',
      destination: params.deliveryPincode,
      payment_type: params.cod ? 'cod' : 'prepaid',
      weight: Math.max(1, Math.round(params.weightGrams)),
      order_amount: 500,
    }),
  })

  const companies = getCourierOptions(data)

  if (!companies.length) {
    return {
      configured: true,
      serviceable: false,
      courierName: null,
      courierId: null,
      etdDays: null,
      estimatedDeliveryDate: null,
      availableCourierCount: 0,
      codAvailable: params.cod ? false : true,
      freightCharge: null,
      message: extractErrorMessage(data, 'Delivery is not available on this pincode.'),
    } satisfies ServiceabilityResult
  }

  const ranked = [...companies].sort((left, right) => {
    const leftDays = parseEtdDays(left?.estimated_delivery_days ?? left?.etd ?? left?.edd_days) ?? 999
    const rightDays = parseEtdDays(right?.estimated_delivery_days ?? right?.etd ?? right?.edd_days) ?? 999
    return leftDays - rightDays
  })

  const best = ranked[0]
  const etdDays = parseEtdDays(best?.estimated_delivery_days ?? best?.etd ?? best?.edd_days)
  const estimatedDeliveryDate =
    normalizeDateOnly(best?.etd || best?.edd || best?.estimated_delivery_date || best?.expected_delivery_date) ||
    formatEstimatedDate(etdDays)

  return {
    configured: true,
    serviceable: true,
    courierName: best?.courier_name || best?.channel_courier_name || best?.name || null,
    courierId: Number(best?.courier_company_id || best?.courier_id || best?.id || 0) || null,
    etdDays,
    estimatedDeliveryDate,
    availableCourierCount: companies.length,
    codAvailable: typeof best?.cod === 'number' ? Boolean(best.cod) : params.cod,
    freightCharge: typeof best?.rate === 'number' ? best.rate : Number(best?.total_charges || best?.freight_charges || best?.freight_charge || best?.charge || 0) || null,
    message: companies.length > 1 ? `${companies.length} courier options available.` : 'Delivery is available.',
  } satisfies ServiceabilityResult
}

export type NimbusParcelInput = {
  weightGrams?: number
  lengthCm?: number
  breadthCm?: number
  heightCm?: number
  courierId?: number | null
  generatePickup?: boolean
}

export async function createNimbusShipment(order: Order, parcel?: NimbusParcelInput) {
  const orderCode = order.order_ref || sanitizeCode(order.id.slice(0, 8))
  const weightGrams = Math.max(100, Number(parcel?.weightGrams || 0) || calculateOrderWeightGrams(order.items))

  const payload = {
    order_number: orderCode,
    order_reference_number: orderCode,
    order_amount: normalizeMoney(order.final_amount || order.total),
    payment_type: order.payment_status === 'paid' ? 'prepaid' : 'cod',
    package_weight: normalizeWeightKg(weightGrams),
    package_length: Math.max(1, Number(parcel?.lengthCm || 20)),
    package_breadth: Math.max(1, Number(parcel?.breadthCm || 15)),
    package_height: Math.max(1, Number(parcel?.heightCm || 12)),
    pickup_location: process.env.NIMBUSPOST_PICKUP_LOCATION,
    pickup_pincode: process.env.NIMBUSPOST_PICKUP_POSTCODE,
    consignee: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email || process.env.NIMBUSPOST_FALLBACK_EMAIL || 'orders@mana.local',
      address: order.address,
      city: order.city,
      state: order.state || 'NA',
      pincode: order.pincode,
      country: 'India',
    },
    items: (order.items || []).map((item: any, index: number) => ({
      name: item.product_name || item.name || `Item ${index + 1}`,
      sku: sanitizeCode(item.product_id || `${orderCode}-${index + 1}`),
      units: Math.max(1, Number(item.quantity || 1)),
      selling_price: normalizeMoney(Number(item.price || 0)),
    })),
  }

  return nimbusFetch(PATHS.createShipment, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function assignNimbusAwb(params: { shipmentId: number | string; courierId?: number | null }) {
  return nimbusFetch(PATHS.assignAwb, {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: Number(params.shipmentId),
      courier_id: params.courierId ? Number(params.courierId) : undefined,
    }),
  })
}

export async function generateNimbusPickup(params: { shipmentId: number | string }) {
  return nimbusFetch(PATHS.pickup, {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: Number(params.shipmentId),
    }),
  })
}

export async function trackNimbusAwb(awbCode: string) {
  const data = await nimbusFetch(withAwb(PATHS.tracking, awbCode), {
    method: 'GET',
  })

  const trackingData = data?.tracking_data || data?.data || data
  const shipmentTrack = Array.isArray(trackingData?.shipment_track)
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
    latestTrack?.current_status ||
    latestTrack?.status ||
    trackingData?.current_status ||
    trackingData?.status ||
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

export async function buildNimbusShipmentUpdate(order: Order, parcel?: NimbusParcelInput) {
  if (!hasNimbusPostConfig()) return null

  const orderRef = order.order_ref || sanitizeCode(order.id.slice(0, 8))
  const trackingLink = getPublicTrackingUrl(orderRef, order.customer_phone)

  if (order.tracking_number) {
    const tracking = await trackNimbusAwb(order.tracking_number)
    return {
      tracking_number: order.tracking_number,
      tracking_link: trackingLink,
      courier_name: tracking.courierName || order.courier_name || null,
      expected_delivery: tracking.expectedDelivery || order.expected_delivery || null,
      shiprocket_tracking_status: tracking.currentStatus || null,
      tracking_events: tracking.activities || [],
      tracking_synced_at: new Date().toISOString(),
    }
  }

  const serviceability = await getNimbusPostServiceability({
    deliveryPincode: order.pincode,
    weightGrams: Math.max(100, Number(parcel?.weightGrams || 0) || calculateOrderWeightGrams(order.items)),
    cod: order.payment_status !== 'paid',
  })

  if (!serviceability.serviceable) {
    return {
      tracking_link: trackingLink,
      shiprocket_tracking_status: 'UNSERVICEABLE',
      tracking_synced_at: new Date().toISOString(),
    }
  }

  const created = await createNimbusShipment(order, parcel)
  const shipmentId =
    created?.shipment_id ||
    created?.data?.shipment_id ||
    created?.data?.id ||
    created?.shipment?.id ||
    created?.id ||
    null

  const providerOrderId =
    created?.order_id ||
    created?.data?.order_id ||
    created?.data?.order_number ||
    created?.shipment?.order_id ||
    null

  let awbCode: string | null = null
  let courierName = serviceability.courierName

  if (shipmentId) {
    const awbResponse = await assignNimbusAwb({
      shipmentId,
      courierId: Number(parcel?.courierId || serviceability.courierId || 0) || undefined,
    })

    awbCode =
      awbResponse?.awb_code ||
      awbResponse?.data?.awb_code ||
      awbResponse?.shipment?.awb_code ||
      awbResponse?.tracking_number ||
      awbResponse?.data?.tracking_number ||
      null

    courierName =
      awbResponse?.courier_name ||
      awbResponse?.data?.courier_name ||
      awbResponse?.shipment?.courier_name ||
      courierName

    if (parcel?.generatePickup !== false) {
      await generateNimbusPickup({ shipmentId }).catch(console.error)
    }
  }

  let tracking = null
  if (awbCode) {
    tracking = await trackNimbusAwb(awbCode).catch(() => null)
  }

  return {
    shiprocket_order_id: providerOrderId ? String(providerOrderId) : null,
    shiprocket_shipment_id: shipmentId ? String(shipmentId) : null,
    tracking_number: awbCode,
    tracking_link: trackingLink,
    courier_name: tracking?.courierName || courierName || null,
    expected_delivery:
      tracking?.expectedDelivery ||
      serviceability.estimatedDeliveryDate ||
      order.expected_delivery ||
      null,
    shiprocket_tracking_status: tracking?.currentStatus || 'AWB_ASSIGNED',
    tracking_events: tracking?.activities || [],
    tracking_synced_at: new Date().toISOString(),
  }
}
