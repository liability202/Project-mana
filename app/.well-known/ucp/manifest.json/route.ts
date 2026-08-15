import { GET as getUcp } from '@/app/.well-known/ucp.json/route'

export async function GET() {
  return getUcp()
}
