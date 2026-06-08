import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
      .from('coupons')
      .select('id, title, description, url, category, rating, current_price, instructor, coupon_code, is_verified, expires_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
