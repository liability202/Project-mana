import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Mana Dry Fruits E-Commerce API',
      description: 'Public API for product catalog, shipping serviceability, and ordering for Mana Dry Fruits.',
      version: '1.0.0',
      contact: {
        name: 'MK and Sons Support',
        email: 'support@manadryfruits.com',
        url: SITE_URL,
      },
    },
    servers: [{ url: SITE_URL }],
    paths: {
      '/api/products': {
        get: {
          summary: 'List or search products',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'slug', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Successful response' },
          },
        },
      },
      '/api/shipping/serviceability': {
        post: {
          summary: 'Check PIN code delivery availability',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { pincode: { type: 'string' } },
                  required: ['pincode'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Serviceability response' },
          },
        },
      },
      '/api/coupons/validate': {
        post: {
          summary: 'Validate coupon code',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { code: { type: 'string' }, amount: { type: 'number' } },
                  required: ['code'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Coupon result' },
          },
        },
      },
    },
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
