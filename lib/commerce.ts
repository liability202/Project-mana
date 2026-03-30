import type { SupabaseClient } from '@supabase/supabase-js'

export type DiscountType = 'percentage' | 'fixed'

export type CouponRecord = {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  influencer_name?: string | null
  commission_rate?: number | null
  min_order_amount?: number | null
  max_discount?: number | null
  usage_limit?: number | null
  usage_count: number
  total_orders: number
  total_revenue: number
  total_discount_given: number
  is_active: boolean
}

export type WalletRecord = {
  id: string
  user_id?: string | null
  phone?: string | null
  balance: number
}

export type WalletTransactionRecord = {
  id: string
  wallet_id: string
  user_id?: string | null
  phone?: string | null
  order_id?: string | null
  amount: number
  type: 'credit' | 'debit'
  reason: 'cashback' | 'usage' | 'adjustment'
  description?: string | null
  created_at: string
}

function isMissingRelationError(error: any) {
  const message = String(error?.message || '')
  return message.includes('schema cache') || message.includes('does not exist')
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function calculateCouponDiscount(subtotal: number, coupon: Pick<CouponRecord, 'discount_type' | 'discount_value'>) {
  if (coupon.discount_type === 'fixed') return Math.min(subtotal, coupon.discount_value)
  return Math.min(subtotal, Math.round((subtotal * coupon.discount_value) / 100))
}

export function validateCouponRules(subtotal: number, coupon: CouponRecord) {
  if (!coupon.is_active) return 'Coupon is inactive.'
  if ((coupon.usage_limit || 0) > 0 && coupon.usage_count >= (coupon.usage_limit || 0)) {
    return 'Coupon usage limit has been reached.'
  }
  if ((coupon.min_order_amount || 0) > subtotal) {
    return `Minimum order amount is ${coupon.min_order_amount}.`
  }
  return null
}

export function getAppliedCouponDiscount(subtotal: number, coupon: CouponRecord) {
  const raw = calculateCouponDiscount(subtotal, coupon)
  if (coupon.max_discount && coupon.max_discount > 0) return Math.min(raw, coupon.max_discount)
  return raw
}

export async function getCouponByCode(client: SupabaseClient, code: string) {
  const normalized = code.trim().toUpperCase()
  const { data, error } = await client
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data as CouponRecord | null
}

export async function ensureUserProfile(
  client: SupabaseClient,
  params: { userId?: string | null; phone: string; name?: string | null; email?: string | null }
) {
  const normalizedPhone = normalizePhone(params.phone)
  let query = client.from('user_profiles').select('*')
  if (params.userId) query = query.eq('user_id', params.userId)
  else query = query.eq('phone', normalizedPhone)

  const { data: existing, error: lookupError } = await query.maybeSingle()
  if (lookupError) {
    if (isMissingRelationError(lookupError)) {
      return {
        id: `guest-${normalizedPhone}`,
        user_id: params.userId || null,
        phone: normalizedPhone,
        full_name: params.name || null,
        email: params.email || null,
        is_cashback_eligible: false,
      }
    }
    throw lookupError
  }
  if (existing) return existing

  const payload = {
    user_id: params.userId || null,
    phone: normalizedPhone,
    full_name: params.name || null,
    email: params.email || null,
  }

  const { data, error } = await client.from('user_profiles').insert(payload).select('*').single()
  if (error) {
    if (isMissingRelationError(error)) {
      return {
        id: `guest-${normalizedPhone}`,
        user_id: params.userId || null,
        phone: normalizedPhone,
        full_name: params.name || null,
        email: params.email || null,
        is_cashback_eligible: false,
      }
    }
    throw error
  }
  return data
}

export async function ensureWallet(client: SupabaseClient, params: { userId?: string | null; phone: string }) {
  const normalizedPhone = normalizePhone(params.phone)
  let query = client.from('wallet').select('*')
  if (params.userId) query = query.eq('user_id', params.userId)
  else query = query.eq('phone', normalizedPhone)

  const { data: existing, error: lookupError } = await query.maybeSingle()
  if (lookupError) {
    if (isMissingRelationError(lookupError)) {
      return {
        id: `wallet-${normalizedPhone}`,
        user_id: params.userId || null,
        phone: normalizedPhone,
        balance: 0,
      } as WalletRecord
    }
    throw lookupError
  }
  if (existing) return existing as WalletRecord

  const { data, error } = await client
    .from('wallet')
    .insert({ user_id: params.userId || null, phone: normalizedPhone, balance: 0 })
    .select('*')
    .single()

  if (error) {
    if (isMissingRelationError(error)) {
      return {
        id: `wallet-${normalizedPhone}`,
        user_id: params.userId || null,
        phone: normalizedPhone,
        balance: 0,
      } as WalletRecord
    }
    throw error
  }
  return data as WalletRecord
}

export async function getWalletSnapshot(client: SupabaseClient, params: { userId?: string | null; phone: string }) {
  const profile = await ensureUserProfile(client, { userId: params.userId, phone: params.phone })
  const wallet = await ensureWallet(client, { userId: params.userId, phone: params.phone })

  const { data: transactions, error: txnError } = await client
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (txnError) {
    if (isMissingRelationError(txnError)) {
      return {
        profile,
        wallet,
        transactions: [],
      }
    }
    throw txnError
  }

  return {
    profile,
    wallet,
    transactions: (transactions || []) as WalletTransactionRecord[],
  }
}

export async function debitWallet(
  client: SupabaseClient,
  params: { walletId: string; userId?: string | null; phone: string; amount: number; orderId?: string | null; description?: string }
) {
  if (params.amount <= 0) return

  const normalizedPhone = normalizePhone(params.phone)
  const { data: wallet, error: walletError } = await client
    .from('wallet')
    .select('*')
    .eq('id', params.walletId)
    .single()

  if (walletError) {
    if (isMissingRelationError(walletError)) return
    throw walletError
  }
  if ((wallet.balance || 0) < params.amount) throw new Error('Insufficient wallet balance.')

  const { error: updateError } = await client
    .from('wallet')
    .update({ balance: wallet.balance - params.amount })
    .eq('id', params.walletId)

  if (updateError) {
    if (isMissingRelationError(updateError)) return
    throw updateError
  }

  const { error: txnError } = await client.from('wallet_transactions').insert({
    wallet_id: params.walletId,
    user_id: params.userId || null,
    phone: normalizedPhone,
    order_id: params.orderId || null,
    amount: -params.amount,
    type: 'debit',
    reason: 'usage',
    description: params.description || 'Wallet cashback used on order',
  })

  if (txnError) {
    if (isMissingRelationError(txnError)) return
    throw txnError
  }
}

export async function creditCashback(
  client: SupabaseClient,
  params: { walletId: string; userId?: string | null; phone: string; amount: number; orderId?: string | null; description?: string }
) {
  if (params.amount <= 0) return

  const normalizedPhone = normalizePhone(params.phone)
  const { data: wallet, error: walletError } = await client
    .from('wallet')
    .select('*')
    .eq('id', params.walletId)
    .single()

  if (walletError) {
    if (isMissingRelationError(walletError)) return
    throw walletError
  }

  const { error: updateError } = await client
    .from('wallet')
    .update({ balance: (wallet.balance || 0) + params.amount })
    .eq('id', params.walletId)

  if (updateError) {
    if (isMissingRelationError(updateError)) return
    throw updateError
  }

  const { error: txnError } = await client.from('wallet_transactions').insert({
    wallet_id: params.walletId,
    user_id: params.userId || null,
    phone: normalizedPhone,
    order_id: params.orderId || null,
    amount: params.amount,
    type: 'credit',
    reason: 'cashback',
    description: params.description || 'Cashback earned on delivered order',
  })

  if (txnError) {
    if (isMissingRelationError(txnError)) return
    throw txnError
  }
}
