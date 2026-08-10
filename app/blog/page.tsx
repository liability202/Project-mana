import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BLOG_POSTS } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Wellness & Health Guides – Mana Dry Fruits Blog',
  description: 'Explore Ayurvedic health guides, dry fruit buying tips, spice purity tests, and natural wellness guides by Mana Dry Fruits experts.',
  alternates: { canonical: '/blog' },
}

export default function BlogIndexPage() {
  return (
    <>
      <header className="bg-green px-[5%] py-16 md:py-20 text-center">
        <div className="mx-auto max-w-[800px]">
          <span className="text-[.68rem] tracking-[.3em] uppercase text-green-4 font-medium mb-3 block">
            Knowledge & Wellness Center
          </span>
          <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-light text-ivory leading-tight mb-4">
            Mana <em className="not-italic text-green-4">Wellness</em> Journal
          </h1>
          <p className="text-[1rem] md:text-[1.1rem] text-green-4 font-light leading-[1.8] max-w-[600px] mx-auto">
            Expert guides on Ayurveda, dry fruit purity tests, herbal dosages, and health benefits sourced direct from nature.
          </p>
        </div>
      </header>

      <main className="bg-ivory px-[5%] py-12 md:py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="bg-white border border-ivory-3 rounded-2xl overflow-hidden shadow-soft flex flex-col transition-all hover:border-green-4 group">
                <div className="relative h-56 w-full bg-ivory-2 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-green text-ivory text-[.6rem] font-medium tracking-wider uppercase px-3 py-1 rounded-full">
                    {post.category.replace('-', ' ')}
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-[.72rem] text-ink-4 mb-3">
                    <span>{post.publishedAt}</span>
                    <span>•</span>
                    <span>{post.readingTime}</span>
                  </div>

                  <h2 className="font-serif text-[1.4rem] md:text-[1.6rem] text-ink font-normal leading-snug mb-3 group-hover:text-green transition-colors">
                    <Link href={`/blog/${post.slug}`} className="no-underline text-inherit">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-[.9rem] text-ink-3 leading-[1.7] mb-6 line-clamp-3">
                    {post.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-ivory-3 flex items-center justify-between">
                    <span className="text-[.75rem] font-medium text-ink-2">By {post.author.name}</span>
                    <Link href={`/blog/${post.slug}`} className="text-green font-medium text-[.82rem] no-underline hover:underline flex items-center gap-1">
                      Read Article →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
