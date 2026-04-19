import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')

  // If there's a referral code in the URL, set it in a cookie
  if (ref) {
    const response = NextResponse.next()
    response.cookies.set('mana_ref', ref, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      httpOnly: false, // Allow client-side access if needed for the banner
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
