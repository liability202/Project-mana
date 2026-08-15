import { GET as getAuthMd } from '@/app/auth.md/route'

export async function GET() {
  return getAuthMd()
}
