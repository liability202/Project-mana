import { GET as getAcp } from '@/app/.well-known/acp.json/route'

export async function GET() {
  return getAcp()
}
