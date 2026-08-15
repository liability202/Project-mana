import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const agentCard = {
    $schema: 'https://agentprotocol.ai/schemas/agent-card.json',
    name: 'Mana Dry Fruits Commerce Agent',
    description: 'Autonomous AI Shopping Agent for ordering lab-tested dry fruits, Kashmiri saffron, and Ayurvedic herbs in India.',
    version: '1.0.0',
    provider: 'MK and Sons',
    url: SITE_URL,
    capabilities: [
      'product-search',
      'cart-management',
      'pincode-validation',
      'order-placement',
      'shipment-tracking',
    ],
    protocols: ['A2A', 'UCP', 'ACP', 'MCP', 'x402'],
    supportedCurrencies: ['INR'],
    endpoints: {
      llm_context: `${SITE_URL}/llms.txt`,
      api_catalog: `${SITE_URL}/openapi.json`,
      mcp_server: `${SITE_URL}/.well-known/mcp/server.json`,
      ucp_manifest: `${SITE_URL}/.well-known/ucp.json`,
      acp_manifest: `${SITE_URL}/.well-known/acp.json`,
      auth_spec: `${SITE_URL}/auth.md`,
    },
    contact: {
      email: 'support@manadryfruits.com',
      whatsapp: '+91-9910899796',
    },
  }

  return NextResponse.json(agentCard, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
