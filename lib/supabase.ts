import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Product = {
  id: string; name: string; slug: string; description: string
  category: string; price: number; price_per_unit: string
  compare_price?: number; images: string[]; tags: string[]
  variants: any[]; in_stock: boolean; vendor?: string; created_at: string
}
export type Order = {
  id: string; customer_name: string; customer_phone: string
  customer_email?: string; address: string; city: string
  state?: string; pincode: string; items: any[]
  subtotal: number; discount: number; shipping: number; total: number
  order_ref?: string; razorpay_link?: string
  coupon_code?: string; discount_amount?: number; final_amount?: number
  wallet_used?: number; cashback_earned?: number
  status: string; payment_status: string
  payment_id?: string; razorpay_order_id?: string; notes?: string; created_at: string
  user_id?: string | null
}
export type Variant = {
  id: string; name: string; description?: string
  price: number; quality_tag?: 'best' | 'popular' | 'basic'
  images?: string[]
  items?: any[]
}
export type CartItem = {
  product_id: string; product_name: string; product_image: string
  variant_id?: string; variant_name?: string
  weight_grams: number; price: number; quantity: number
}
export type Coupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
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
  created_at: string
}
export type Wallet = {
  id: string
  user_id?: string | null
  phone?: string | null
  balance: number
  created_at: string
  updated_at?: string
}
export type WalletTransaction = {
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
export type UserProfile = {
  id: string
  user_id?: string | null
  phone?: string | null
  full_name?: string | null
  email?: string | null
  is_cashback_eligible: boolean
  instagram_handle?: string | null
  cashback_request_status?: 'none' | 'requested' | 'approved'
  created_at: string
}
