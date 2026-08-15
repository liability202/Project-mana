import { GET as getAgent } from '@/app/.well-known/agent.json/route'

export async function GET() {
  return getAgent()
}
