import { ImageResponse } from 'next/og'

// Edge runtime: @vercel/og's Node build fails to resolve its font asset on
// Windows, and the image is cheap to render on demand + CDN-cached anyway.
export const runtime = 'edge'
export const alt = 'Mana Dry Fruits — Premium Dry Fruits, Ayurvedic Herbs & Spices'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1C3D2E 0%, #2A5940 55%, #3D7A58 100%)',
          color: '#FDFAF4',
          fontFamily: 'Georgia, serif',
          padding: '0 90px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 14,
            textTransform: 'uppercase',
            color: '#6AAF87',
            marginBottom: 28,
          }}
        >
          Pure · Natural · Handpicked
        </div>

        <div style={{ fontSize: 104, lineHeight: 1.05, fontWeight: 400 }}>MANA</div>

        <div
          style={{
            fontSize: 40,
            lineHeight: 1.3,
            marginTop: 18,
            color: '#EDE5D6',
          }}
        >
          Premium Dry Fruits, Ayurvedic Herbs &amp; Spices
        </div>

        <div
          style={{
            display: 'flex',
            gap: 18,
            marginTop: 46,
            fontSize: 24,
            color: '#C2E0CE',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <span>Lab Tested</span>
          <span>·</span>
          <span>FSSAI Certified</span>
          <span>·</span>
          <span>Packed Fresh To Order</span>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 26,
            letterSpacing: 4,
            color: '#6AAF87',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          manadryfruits.com
        </div>
      </div>
    ),
    size,
  )
}
