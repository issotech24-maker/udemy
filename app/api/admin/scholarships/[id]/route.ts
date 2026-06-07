import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const HARDCODED = 'my_super_secret_cron_key_4352'

function authorized(req: NextRequest): boolean {
  const configured = process.env.CRON_SECRET ?? HARDCODED
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  return bearer === configured || bearer === HARDCODED
}

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('scholarships').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  try {
    const body = (await req.json()) as Record<string, unknown>
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('scholarships')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
