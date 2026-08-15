/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
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
    ]
  },
}

module.exports = nextConfig
