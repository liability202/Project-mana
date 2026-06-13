'use client'

type ImageManagerProps = {
  label: string
  value: string
  onChange: (value: string) => void
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

export function ImageManager({ label, value, onChange }: ImageManagerProps) {
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return

    const secret = localStorage.getItem('mana_admin') || ''
    if (!secret) {
      alert('Admin login not found. Please login again.')
      return
    }

    const uploadedUrls: string[] = []

    for (let index = 0; index < files.length; index += 1) {
      const originalFile = files[index]
      const file = originalFile.name
        ? originalFile
        : new File([originalFile], fileNameForClipboard(originalFile, index), { type: originalFile.type })
      const fd = new FormData()
      fd.append('file', file)

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { authorization: `Bearer ${secret}` },
          body: fd,
        })
        const data = await res.json()
        if (res.ok && data.url) {
          uploadedUrls.push(data.url)
        } else {
          alert(`Upload failed: ${data.error || 'Unknown error'}`)
        }
      } catch {
        alert(`Upload failed for ${file.name}`)
      }
    }

    if (uploadedUrls.length) onChange(appendUrls(value, uploadedUrls))
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

  return (
    <div onPaste={handlePaste}>
      <label className="text-xs text-ink-3 block mb-1.5">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3">
        {images.map((url, idx) => (
          <div key={`${url}-${idx}`} className="relative aspect-square rounded-xl border border-ivory-3 overflow-hidden bg-ivory-2 group">
            <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                const next = [...images]
                next.splice(idx, 1)
                onChange(next.join('\n'))
              }}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-terra/80 hover:bg-terra text-white text-xs flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              x
            </button>
          </div>
        ))}

        <label className="flex flex-col items-center justify-center aspect-square rounded-xl border border-dashed border-green-5/40 hover:border-green bg-white hover:bg-green-6/20 transition-all cursor-pointer text-center p-2">
          <span className="text-xl text-green mb-1">+</span>
          <span className="text-[.7rem] text-ink-3">Upload Photo</span>
          <span className="text-[.6rem] text-ink-4 mt-1">or paste image</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              await uploadFiles(Array.from(event.target.files || []))
              event.target.value = ''
            }}
          />
        </label>
      </div>

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
      <p className="text-[.68rem] text-ink-4 mt-2">Tip: click this area and press Ctrl+V to paste a copied image or image URL.</p>
    </div>
  )
}
