import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { BLOG_POSTS } from '@/lib/blog-data'
import { BRAND_NAME, SITE_URL, breadcrumbJsonLd } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/product/ProductCard'

type Props = { params: { slug: string } }

export function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ slug: p.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const post = BLOG_POSTS.find(p => p.slug === params.slug)
  if (!post) return { title: 'Article Not Found' }

  return {
    title: `${post.title} | Mana Journal`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: BRAND_NAME,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      images: [{ url: post.coverImage, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.coverImage],
    },
  }
}

async function getConnectedProduct(slug?: string) {
  if (!slug) return null
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export default async function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find(p => p.slug === params.slug)
  if (!post) notFound()

  const connectedProduct = await getConnectedProduct(post.connectedProductSlug)

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: post.author.name,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: post.title, path: `/blog/${post.slug}` },
            ])
          ),
        }}
      />

      <article className="bg-ivory pb-16">
        {/* Header */}
        <header className="bg-green px-[5%] py-14 md:py-18">
          <div className="mx-auto max-w-[840px]">
            <nav aria-label="Breadcrumb" className="mb-4 text-[.72rem] text-green-4 flex items-center gap-2">
              <Link href="/" className="hover:text-ivory no-underline">Home</Link>
              <span>›</span>
              <Link href="/blog" className="hover:text-ivory no-underline">Blog</Link>
              <span>›</span>
              <span className="text-green-5 capitalize">{post.category}</span>
            </nav>

            <h1 className="font-serif text-[clamp(2rem,4.5vw,3.6rem)] text-ivory font-light leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-[.8rem] text-green-4 border-t border-green-5/30 pt-4 mt-6">
              <div>By <strong className="text-ivory font-medium">{post.author.name}</strong> ({post.author.role})</div>
              <span>•</span>
              <div>{post.publishedAt}</div>
              <span>•</span>
              <div>{post.readingTime}</div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="px-[5%] -mt-8 mb-12">
          <div className="mx-auto max-w-[900px] h-[340px] md:h-[480px] relative rounded-2xl overflow-hidden shadow-soft border border-ivory-3">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="px-[5%]">
          <div className="mx-auto max-w-[800px] bg-white border border-ivory-3 rounded-2xl p-6 md:p-12 shadow-soft">
            <div className="prose prose-lg max-w-none text-ink-2 leading-[1.88] space-y-6">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={index} className="font-serif text-2xl text-ink font-normal mt-8 mb-4 border-b border-ivory-3 pb-2">
                      {paragraph.replace('### ', '')}
                    </h3>
                  )
                }
                if (paragraph.startsWith('#### ')) {
                  return (
                    <h4 key={index} className="font-serif text-xl text-green font-normal mt-6 mb-3">
                      {paragraph.replace('#### ', '')}
                    </h4>
                  )
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <blockquote key={index} className="border-l-4 border-green-4 bg-green-6 p-4 rounded-r-lg italic text-green-2 text-base my-4">
                      {paragraph.replace('> ', '')}
                    </blockquote>
                  )
                }
                if (paragraph.startsWith('---')) {
                  return <hr key={index} className="border-ivory-3 my-8" />
                }
                return (
                  <p key={index} className="text-[.96rem] text-ink-2">
                    {paragraph}
                  </p>
                )
              })}
            </div>

            {/* Connected Product Banner / Recommendation */}
            {connectedProduct && (
              <div className="mt-12 pt-8 border-t border-ivory-3 bg-ivory-2 rounded-xl p-6 md:p-8">
                <div className="text-[.7rem] uppercase tracking-[.25em] text-green font-medium mb-2">
                  Featured Product Mentioned In Article
                </div>
                <h3 className="font-serif text-2xl text-ink font-light mb-4">
                  Shop Authentic {connectedProduct.name} Direct From Mana
                </h3>
                <div className="max-w-[320px]">
                  <ProductCard product={connectedProduct} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link href="/blog" className="btn-outline inline-flex no-underline text-sm px-6 py-2.5">
            ← Back to All Articles
          </Link>
        </div>
      </article>
    </>
  )
}
