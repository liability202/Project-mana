import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

// Product photos are shown at most ~700px wide (1400px on retina screens), so
// 1600px keeps full zoom quality. WebP at q82 turns a 2 MB PNG into ~150-250 KB.
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 82

async function compressImage(input: Buffer, type: string): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const originalExtension = (type.split('/')[1] || 'png').replace('jpeg', 'jpg')
  // GIFs may be animated; SVGs are vectors. Store those untouched.
  if (type === 'image/gif' || type === 'image/svg+xml') {
    return { buffer: input, contentType: type, extension: originalExtension === 'svg+xml' ? 'svg' : originalExtension }
  }
  try {
    const output = await sharp(input)
      .rotate() // apply the phone's EXIF orientation before metadata is stripped
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()
    return { buffer: output, contentType: 'image/webp', extension: 'webp' }
  } catch {
    // An image sharp can't read is still better uploaded as-is than rejected.
    return { buffer: input, contentType: type || 'application/octet-stream', extension: originalExtension }
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const auth = req.headers.get('authorization')
    const headerSecret = req.headers.get('x-admin-secret')
    const formSecret = String(formData.get('admin_secret') || '')
    const token = (headerSecret || auth?.replace(/^Bearer\s+/i, '') || formSecret).trim()
    if (!isAdminToken(token)) {
      return NextResponse.json({
        error: 'Unauthorized. Please logout from admin, login again, and retry upload.',
      }, { status: 401 })
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files can be uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const { buffer, contentType, extension } = await compressImage(Buffer.from(bytes), file.type)

    // Keep the descriptive part of the original name (it becomes the image's
    // alt text — see lib/image-utils.ts); only the extension changes.
    const baseName = file.name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[^a-zA-Z0-9.-]/g, '_') || 'image'
    const fileName = `admin-products/${Date.now()}-${baseName}.${extension}`

    const bucketCandidates = [
      process.env.SUPABASE_PRODUCT_IMAGE_BUCKET,
      'product-images',
      'product image',
    ].filter(Boolean) as string[]

    let uploadedBucket = ''
    let uploadError = ''

    for (const bucket of bucketCandidates) {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType,
          upsert: false,
        })

      if (!error) {
        uploadedBucket = bucket
        break
      }

      uploadError = error.message
    }

    if (!uploadedBucket) {
      const fallbackBucket = process.env.SUPABASE_PRODUCT_IMAGE_BUCKET || 'product-images'
      const { error: createError } = await supabaseAdmin.storage.createBucket(fallbackBucket, {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      })

      if (createError && !createError.message.toLowerCase().includes('already exists')) {
        return NextResponse.json({
          error: createError.message || uploadError || 'Upload failed. Could not create Supabase storage bucket.',
        }, { status: 500 })
      }

      const { error } = await supabaseAdmin.storage
        .from(fallbackBucket)
        .upload(fileName, buffer, {
          contentType,
          upsert: false,
        })

      if (error) {
        return NextResponse.json({
          error: error.message || uploadError || 'Upload failed after creating Supabase storage bucket.',
        }, { status: 500 })
      }

      uploadedBucket = fallbackBucket
    }

    const { data } = supabaseAdmin.storage
      .from(uploadedBucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: data.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
