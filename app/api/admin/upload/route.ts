import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  // Admin only
  const auth = req.headers.get('authorization')
  const token = auth?.replace(/^Bearer\s+/i, '').trim()
  const adminSecret = (process.env.ADMIN_SECRET || '').trim()

  if (!adminSecret || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files can be uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate safe unique filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `admin-products/${Date.now()}-${cleanName}`

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
          contentType: file.type || 'application/octet-stream',
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
          contentType: file.type || 'application/octet-stream',
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
