import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const HARDCODED = 'my_super_secret_cron_key_4352'

function authorized(req: NextRequest): boolean {
  const configured = process.env.CRON_SECRET ?? HARDCODED
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  return bearer === configured || bearer === HARDCODED
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('scholarships')
      .select('id, title, description, country, deadline, requirements, benefits, official_link')
      .order('deadline', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
