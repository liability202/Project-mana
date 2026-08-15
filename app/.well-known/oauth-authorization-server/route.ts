import { GET as getOidc } from '@/app/.well-known/openid-configuration/route'

export async function GET() {
  return getOidc()
}
