import { GET as getMcp } from '@/app/.well-known/mcp/server.json/route'

export async function GET() {
  return getMcp()
}
