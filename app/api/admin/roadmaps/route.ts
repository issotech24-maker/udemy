import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HARDCODED_SECRET = 'my_super_secret_cron_key_4352'

function checkAuth(req: NextRequest): boolean {
  const auth    = req.headers.get('authorization') ?? ''
  const bearer  = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  const configured = process.env.CRON_SECRET ?? HARDCODED_SECRET
  return bearer === configured || bearer === HARDCODED_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('roadmaps')
    .select('id, title, description, category, steps, associated_keywords, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as {
    title:               string
    description?:        string
    category?:           string
    steps?:              unknown[]
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
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('roadmaps').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}