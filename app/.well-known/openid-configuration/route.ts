import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const oidcConfig = {
    issuer: SITE_URL,
    authorization_endpoint: `${SITE_URL}/account`,
    token_endpoint: `${SITE_URL}/api/auth/otp/verify`,
    userinfo_endpoint: `${SITE_URL}/api/creator/profile`,
    scopes_supported: ['openid', 'profile', 'orders'],
    response_types_supported: ['code', 'token'],
    grant_types_supported: ['urn:ietf:params:oauth:grant-type:token-exchange', 'authorization_code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
  }

  return NextResponse.json(oidcConfig, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
