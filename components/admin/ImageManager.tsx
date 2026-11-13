'use client'

import { useState } from 'react'
import { imageDescriptor, MIN_PRODUCT_IMAGES } from '@/lib/image-utils'

type ImageManagerProps = {
  label: string
  value: string
  onChange: (value: string) => void
  /** Product name, used to preview each photo's description (alt text). */
  productName?: string
  /** Show a "add more photos" hint below this many images. 0 turns it off. */
  recommended?: number
}

function imageList(value: string) {
  return value.split('\n').map(url => url.trim()).filter(Boolean)
}

function appendUrls(value: string, urls: string[]) {
  const current = imageList(value)
  return [...current, ...urls.filter(Boolean)].join('\n')
}

function fileNameForClipboard(file: File, index: number) {
  if (file.name && file.name !== 'image.png') return file.name
  const extension = file.type.split('/')[1] || 'png'
  return `pasted-image-${Date.now()}-${index}.${extension}`
}

// Vercel rejects request bodies over ~4.5 MB, and phone photos are often
// larger. Shrink big files in the browser first (the server then converts to
// WebP). Small files are sent untouched.
const SHRINK_ABOVE_BYTES = 3.5 * 1024 * 1024
const SHRINK_TO_PX = 2400

async function shrinkIfLarge(file: File): Promise<File> {
  if (file.size <= SHRINK_ABOVE_BYTES || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, SHRINK_TO_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) return file
    // Keep the original name (minus extension) — it becomes the alt text.
    return new File([blob], file.name.replace(/\.[a-z0-9]{2,5}$/i, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function ImageManager({ label, value, onChange, productName = '', recommended = MIN_PRODUCT_IMAGES }: ImageManagerProps) {
  const [uploading, setUploading] = useState(0)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return

    const secret = (localStorage.getItem('mana_admin') || '').trim()
    if (!secret) {
      alert('Admin login not found. Please login again.')
      return
    }

    const uploadedUrls: string[] = []
    setUploading(files.length)

    try {
      for (let index = 0; index < files.length; index += 1) {
        const originalFile = files[index]
        const named = originalFile.name
          ? originalFile
          : new File([originalFile], fileNameForClipboard(originalFile, index), { type: originalFile.type })
        const file = await shrinkIfLarge(named)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('admin_secret', secret)

        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              authorization: `Bearer ${secret}`,
              'x-admin-secret': secret,
            },
            body: fd,
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.url) {
            uploadedUrls.push(data.url)
          } else if (res.status === 401) {
            localStorage.removeItem('mana_admin')
            alert('Upload failed: admin session expired. Please go back to Admin, login again, then upload the image.')
            return
          } else if (res.status === 413) {
            alert(`Upload failed for ${file.name}: the file is too large. Try a smaller photo.`)
          } else {
            alert(`Upload failed: ${data.error || 'Unknown error'}`)
          }
        } catch {
          alert(`Upload failed for ${file.name}`)
        }
        setUploading(files.length - index - 1)
      }
    } finally {
      setUploading(0)
      if (uploadedUrls.length) onChange(appendUrls(value, uploadedUrls))
    }
  }

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files || []).filter(file => file.type.startsWith('image/'))
    if (files.length) {
      event.preventDefault()
      await uploadFiles(files)
      return
    }

    const text = event.clipboardData.getData('text').trim()
    const urls = text.split(/\s+/).filter(item => /^https?:\/\/.+/i.test(item))
    if (urls.length) {
      event.preventDefault()
      onChange(appendUrls(value, urls))
    }
  }

  const images = imageList(value)
  const setImages = (next: string[]) => onChange(next.join('\n'))

  const endDrag = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div onPaste={handlePaste}>
      <label className="text-xs text-ink-3 block mb-1.5">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
        {images.map((url, idx) => {
          const descriptor = imageDescriptor(url, productName)
          return (
            <div
              key={`${url}-${idx}`}
              draggable
              onDragStart={event => {
                setDragIndex(idx)
                event.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={event => {
                if (dragIndex === null) return
                event.preventDefault()
                setOverIndex(idx)
              }}
              onDrop={event => {
                event.preventDefault()
                if (dragIndex !== null && dragIndex !== idx) setImages(move(images, dragIndex, idx))
                endDrag()
              }}
              onDragEnd={endDrag}
              className={`flex flex-col gap-1 cursor-grab active:cursor-grabbing transition-opacity ${dragIndex === idx ? 'opacity-40' : ''}`}
            >
              <div className={`relative aspect-square rounded-xl border overflow-hidden bg-ivory-2 group ${overIndex === idx && dragIndex !== idx ? 'border-green ring-2 ring-green/40' : 'border-ivory-3'}`}>
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                <span className={`absolute top-1.5 left-1.5 text-[.55rem] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-green text-ivory' : 'bg-black/55 text-white'}`}>
                  {idx === 0 ? 'Main' : idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...images]
                    next.splice(idx, 1)
                    setImages(next)
                  }}
                  aria-label={`Remove image ${idx + 1}`}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-terra/80 hover:bg-terra text-white text-xs flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                >
                  x
                </button>
                {/* Buttons for touch screens, where drag and drop doesn't work */}
                <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => setImages(move(images, idx, idx - 1))}
                    aria-label={`Move image ${idx + 1} earlier`}
                    className="h-6 w-6 rounded-full bg-white/90 text-ink text-xs shadow-sm disabled:opacity-0 cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => setImages(move(images, idx, idx + 1))}
                    aria-label={`Move image ${idx + 1} later`}
                    className="h-6 w-6 rounded-full bg-white/90 text-ink text-xs shadow-sm disabled:opacity-0 cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="text-[.6rem] leading-tight text-ink-4 truncate" title={descriptor ? `Description: ${descriptor}` : 'No description in the file name'}>
                {descriptor ? `“${descriptor}”` : idx === 0 ? 'product name' : 'no description'}
              </div>
            </div>
          )
        })}

        <label className={`flex flex-col items-center justify-center aspect-square rounded-xl border border-dashed border-green-5/40 hover:border-green bg-white hover:bg-green-6/20 transition-all text-center p-2 ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}>
          <span className="text-xl text-green mb-1">{uploading ? '…' : '+'}</span>
          <span className="text-[.7rem] text-ink-3">{uploading ? `Uploading ${uploading}…` : 'Upload Photos'}</span>
          <span className="text-[.6rem] text-ink-4 mt-1">or paste image</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={uploading > 0}
            onChange={async (event) => {
              await uploadFiles(Array.from(event.target.files || []))
              event.target.value = ''
            }}
          />
        </label>
      </div>

      {recommended > 0 && images.length < recommended && (
        <p className="text-[.7rem] text-terra mb-2">
          {images.length} of {recommended} recommended photos — add a close-up, a size/scale shot and the back-of-pack label.
        </p>
      )}

      <details className="mt-2">
        <summary className="text-[.7rem] text-ink-4 cursor-pointer hover:text-ink transition-colors">Edit Raw URLs</summary>
        <textarea
          value={value}
          onChange={event => onChange(event.target.value)}
          onPaste={handlePaste}
          className="input min-h-[90px] text-xs font-mono mt-1.5"
          placeholder={"One image URL per line\nhttps://...\nhttps://..."}
        />
      </details>
      <p className="text-[.68rem] text-ink-4 mt-2 leading-relaxed">
        Drag photos (or use ‹ ›) to reorder — the first is the main photo on cards, Google and WhatsApp shares.
        Name files by what they show, e.g. <span className="font-mono">almonds-mamra-closeup.jpg</span>: that becomes the photo&apos;s description.
        Photos are compressed automatically. Click here and press Ctrl+V to paste an image.
      </p>
    </div>
  )
}
