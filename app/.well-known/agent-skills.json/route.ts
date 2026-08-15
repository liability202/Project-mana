import { GET as getSkills } from '@/app/.well-known/skills.json/route'

export async function GET() {
  return getSkills()
}
