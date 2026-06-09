import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type Post = {
  id: string
  title: string
  slug: string
  content: string
  keywords: string | null
  created_at: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, content, keywords, created_at')
      .eq('slug', slug)
      .single()
    if (error || !data) return null
    return data as Post
  } catch {
    return null
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)
  if (!post) return { title: 'مقال غير موجود – UdemyRadar' }
  return {
    title:       `${post.title} – UdemyRadar`,
    description: post.content.replace(/\n+/g, ' ').trim().slice(0, 155),
    keywords:    post.keywords ?? undefined,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = await fetchPost(slug)
  if (!post) notFound()

  const tags = (post.keywords ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8" aria-label="مسار التنقل">
        <Link href="/blog" className="hover:text-slate-800 transition-colors">المدونة</Link>
        <span className="text-slate-300 select-none" aria-hidden="true">›</span>
        <span className="text-slate-700 line-clamp-1">{post.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <p className="text-xs text-slate-400 mb-3 tabular-nums">{post.created_at.slice(0, 10)}</p>
          <h1 className="text-2xl font-bold text-slate-900 leading-snug mb-4">{post.title}</h1>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </article>

      {/* Back link */}
      <div className="mt-10 pt-6 border-t border-slate-200">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
          العودة إلى المدونة
        </Link>
      </div>

    </div>
  )
}
