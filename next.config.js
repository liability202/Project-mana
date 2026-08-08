/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF/WebP cut the hero and category artwork down dramatically versus the
    // source PNGs, which is most of the home page's transfer weight.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // lucide-react has no usable tree-shaking without this; it was pulling the
    // whole icon set into the client bundle on every page that imports an icon.
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
