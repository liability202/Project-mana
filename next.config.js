/** @type {import('next').NextConfig} */

// Only this project's Supabase storage may go through the image optimizer;
// "*.supabase.co" let anyone spend the store's optimization quota.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname || 'dktkyiwuegyievucnoxc.supabase.co'
  } catch {
    return 'dktkyiwuegyievucnoxc.supabase.co'
  }
})()

// Pages that must never be indexed or framed by another site.
const PRIVATE_PATHS = ['/admin/:path*', '/api/:path*', '/checkout', '/profile', '/account', '/creator/:path*', '/test-bot', '/track-order']

const securityHeaders = [
  // Clickjacking: nobody else may embed the checkout or admin pages.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Link',
            value: '</llms.txt>; rel="help"; type="text/markdown", </.well-known/ai-plugin.json>; rel="service-desc", </.well-known/agent.json>; rel="agent-card", </.well-known/ucp.json>; rel="commerce-manifest"',
          },
          {
            key: 'Content-Signal',
            value: 'ai-ready=true, search=yes, ai-train=yes, agent-accessible=true',
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        ],
      },
      // Later entries win for the same header key.
      ...PRIVATE_PATHS.map(source => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ]
  },
}

module.exports = nextConfig
