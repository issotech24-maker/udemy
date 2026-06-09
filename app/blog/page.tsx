import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'المدونة – UdemyRadar',
  description: 'مقالات تقنية وتعليمية حول التطوير وتعلم البرمجة والمنح الدراسية',
}

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

async function fetchPosts(): Promise<Post[]> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, content, keywords, created_at')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data as Post[]
  } catch {
    return []
  }
}

function excerpt(content: string, max = 150): string {
  const plain = content.replace(/\n+/g, ' ').trim()
  return plain.length <= max ? plain : plain.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPage() {
  const posts = await fetchPosts()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold bg-violet-100 text-violet-800 px-2.5 py-1 rounded-sm">مدونة</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">المدونة</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          مقالات تقنية وتعليمية حول التطوير وتعلم البرمجة وأفضل الدورات والمنح الدراسية.
        </p>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="py-24 text-center bg-white border border-slate-200 rounded-lg">
          <p className="text-slate-400 text-sm mb-1">لا توجد مقالات منشورة بعد</p>
          <p className="text-slate-300 text-xs">ترقّب المحتوى قريباً</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <p className="text-xs text-slate-400 mb-2 tabular-nums">{post.created_at.slice(0, 10)}</p>
              <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-blue-700 transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">{excerpt(post.content)}</p>
              <span className="inline-block mt-4 text-xs font-semibold text-blue-600">اقرأ المزيد ←</span>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
