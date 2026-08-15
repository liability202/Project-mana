import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const mcpServerCard = {
    $schema: 'https://modelcontextprotocol.io/schemas/server.json',
    name: 'Mana Dry Fruits MCP Server',
    description: 'Model Context Protocol (MCP) server for Mana Dry Fruits e-commerce catalog, shipping calculations, and order creation.',
    version: '1.0.0',
    vendor: 'MK and Sons',
    homepage: SITE_URL,
    capabilities: {
      tools: {
        search_products: {
          description: 'Search dry fruits, herbs, spices and pansari items by query or category',
          parameters: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Search term' },
              category: { type: 'string', description: 'Category filter (dry-fruits, herbs, spices, pansari)' },
            },
          },
          endpoint: `${SITE_URL}/api/products`,
        },
        get_product_details: {
          description: 'Fetch full details, prices, and stock status for a specific product',
          parameters: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Product slug identifier' },
            },
            required: ['slug'],
          },
          endpoint: `${SITE_URL}/api/products`,
        },
        check_pincode_serviceability: {
          description: 'Check shipping availability and estimated delivery time for Indian PIN code',
          parameters: {
            type: 'object',
            properties: {
              pincode: { type: 'string', description: '6-digit Indian PIN code' },
            },
            required: ['pincode'],
          },
          endpoint: `${SITE_URL}/api/shipping/serviceability`,
        },
      },
      resources: {
        catalog_summary: `${SITE_URL}/llms.txt`,
        api_spec: `${SITE_URL}/openapi.json`,
      },
    },
  }

  return NextResponse.json(mcpServerCard, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
