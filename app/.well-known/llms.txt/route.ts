import { NextResponse } from 'next/server'
import { GET as getLlmsText } from '@/app/llms.txt/route'

export async function GET() {
  return getLlmsText()
}
