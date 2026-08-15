import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Mana Dry Fruits',
    name_for_model: 'mana_dry_fruits',
    description_for_human: 'Buy premium dry fruits, Kashmiri saffron, Ayurvedic herbs and single-origin spices online in India.',
    description_for_model: 'Plugin for accessing product info, dry fruits, Ayurvedic herbs, spices, shipping details and ordering options from Mana Dry Fruits (manadryfruits.com).',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `${SITE_URL}/llms.txt`,
    },
    logo_url: `${SITE_URL}/icon.svg`,
    contact_email: 'support@manadryfruits.com',
    legal_info_url: `${SITE_URL}/terms`,
  }

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
