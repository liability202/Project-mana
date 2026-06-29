import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ReferralClient from './ReferralClient'

export const revalidate = 60 // cache for 60 seconds

export default async function ReferralPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()

  const { data: creator } = await supabaseAdmin
    .from('creators')
    .select('id, name, code, discount_pct')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle()

  if (!creator) {
    notFound()
  }

  return <ReferralClient creator={creator} />
}
