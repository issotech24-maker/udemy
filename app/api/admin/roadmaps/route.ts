import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SECRET = process.env.CRON_SECRET ?? 'my_super_secret_cron_key_4352'

function authorized(req: NextRequest): boolean {
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  return bearer.length > 0 && bearer === SECRET
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('roadmaps')
      .select('id, title, description, category, steps, associated_keywords, created_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json() as {
      title:                string
      description?:         string
      category?:            string
      steps?:               unknown[]
      associated_keywords?: string[]
    }
    if (!body.title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('roadmaps')
      .insert({
        title:               body.title.trim(),
        description:         body.description?.trim()  || null,
        category:            body.category?.trim()     || null,
        steps:               body.steps                ?? [],
        associated_keywords: body.associated_keywords  ?? [],
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('roadmaps').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
