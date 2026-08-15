import { GET as getOpenApi } from '@/app/openapi.json/route'

export async function GET() {
  return getOpenApi()
}
