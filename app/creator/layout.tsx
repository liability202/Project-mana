import { CreatorNav } from '@/components/creator/CreatorNav'

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ivory">
      <CreatorNav />
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 lg:p-10 pb-24 lg:pb-10">
        {children}
      </main>
    </div>
  )
}
