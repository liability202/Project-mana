'use client'
import { useEffect, useState } from 'react'

type Toast = { id: number; message: string }

let addToast: (msg: string) => void = () => {}

export function showToast(message: string) {
  addToast(message)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    addToast = (message: string) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 2600)
    }
  }, [])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-green text-ivory px-5 py-2.5 rounded-md text-sm flex items-center gap-2 shadow-medium whitespace-nowrap animate-fade-up"
        >
          <span>✦</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
