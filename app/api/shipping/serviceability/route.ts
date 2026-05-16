import { NextResponse } from 'next/server'
import { getNimbusPostServiceability } from '@/lib/nimbuspost'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pincode = String(searchParams.get('pincode') || '').trim()
    const grams = Math.max(100, Number(searchParams.get('grams') || 500))
    const cod = searchParams.get('cod') === '1'

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'Enter a valid 6-digit pincode.' }, { status: 400 })
    }

    const snapshot = await getNimbusPostServiceability({
      deliveryPincode: pincode,
      weightGrams: grams,
      cod,
    })

    return NextResponse.json(snapshot)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Could not check delivery availability.' }, { status: 500 })
  }
}
