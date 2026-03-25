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
  coupon_code?: string; status: string; payment_status: string
  payment_id?: string; razorpay_order_id?: string; notes?: string; created_at: string
}
export type Variant = {
  id: string; name: string; description?: string
  price: number; quality_tag?: 'best' | 'popular' | 'basic'
}
export type CartItem = {
  product_id: string; product_name: string; product_image: string
  variant_id?: string; variant_name?: string
  weight_grams: number; price: number; quantity: number
}