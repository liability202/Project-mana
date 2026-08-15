import { GET as getX402 } from '@/app/.well-known/x402.json/route'

export async function GET() {
  return getX402()
}
