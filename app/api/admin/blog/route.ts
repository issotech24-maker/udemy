import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Stub: the posts/blog table does not exist yet in Supabase.
// Create a posts table (id, title, slug, content, keywords, created_at)
// then replace this handler with a real insert.
export async function POST() {
  return NextResponse.json(
    { error: 'جدول posts غير موجود بعد – أنشئه في Supabase ثم حدّث هذا المسار' },
    { status: 503 }
  )
}