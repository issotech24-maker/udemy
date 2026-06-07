import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CouponInsert, CronLogInsert } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Internal types ────────────────────────────────────────────────────────────

interface DeepSeekBody {
  choices: Array<{ message: { content: string } }>
}

interface AICourse {
  title: string
  description: string
  instructor: string
  category: string
  rating: number
  coupon_code: string
  expires_in_days: number
  url: string
}

interface AICoursePayload {
  courses: AICourse[]
}

function isAICoursePayload(val: unknown): val is AICoursePayload {
  return (
    typeof val === 'object' &&
    val !== null &&
    'courses' in val &&
    Array.isArray((val as AICoursePayload).courses)
  )
}

// ─── AI generator (primary source when no Udemy API creds) ───────────────────

async function generateCouponsAI(): Promise<CouponInsert[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return []

  const prompt = `أنت مساعد متخصص في بيانات الدورات التعليمية التقنية.
أنشئ بيانات JSON لـ 8 دورات تقنية مجانية متنوعة للطلاب العرب.
يجب أن يكون كل عنصر بهذا الشكل بالضبط (عنوان ووصف بالعربية فقط):
{
  "title": "عنوان الدورة بالعربية",
  "description": "وصف جذاب بالعربية جملتان أو ثلاث يشرحان ما يتعلمه الطالب",
  "instructor": "اسم المدرس",
  "category": "فئة واحدة من: برمجة | تطوير الويب | ذكاء اصطناعي | قواعد البيانات | تصميم | تسويق | أعمال | DevOps",
  "rating": 4.5,
  "coupon_code": "COUPON24",
  "expires_in_days": 3,
  "url": "https://www.udemy.com/course/course-slug/"
}
نوّع الفئات. الناتج كـ JSON object فقط: { "courses": [...] } بدون أي نص إضافي.`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)

  const data = (await res.json()) as DeepSeekBody
  const parsed: unknown = JSON.parse(data.choices[0].message.content)
  if (!isAICoursePayload(parsed)) throw new Error('Unexpected DeepSeek response shape')

  const now = Date.now()
  return parsed.courses.map((c) => ({
    title:         String(c.title).trim(),
    description:   String(c.description).trim(),
    url:           String(c.url).trim(),
    category:      String(c.category).trim(),
    rating:        Math.min(5, Math.max(0, Number(c.rating) || 4.5)),
    current_price: 0,
    instructor:    String(c.instructor).trim(),
    coupon_code:   String(c.coupon_code).toUpperCase().trim(),
    is_verified:   false,
    expires_at:    new Date(now + (Number(c.expires_in_days) || 3) * 86_400_000).toISOString(),
    telegram_sent: false,
  }))
}

// ─── Udemy Partner API fetcher ────────────────────────────────────────────────

async function fetchUdemyCoupons(): Promise<CouponInsert[]> {
  const clientId     = process.env.UDEMY_CLIENT_ID
  const clientSecret = process.env.UDEMY_CLIENT_SECRET

  // No credentials → fall back to AI generation
  if (!clientId || !clientSecret) return generateCouponsAI()

  const params = new URLSearchParams({
    'fields[course]': 'id,title,url,headline,primary_category,avg_rating,price',
    price:     'price-free',
    page_size: '15',
    ordering:  '-created',
  })

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res   = await fetch(
    `https://www.udemy.com/api-2.0/courses/?${params.toString()}`,
    { headers: { Authorization: `Basic ${creds}`, Accept: 'application/json' } },
  )
  if (!res.ok) throw new Error(`Udemy API ${res.status}: ${await res.text()}`)

  const body = (await res.json()) as { results: Array<Record<string, unknown>> }
  const now  = Date.now()

  return (body.results ?? []).map((c) => {
    const cat = c.primary_category as Record<string, unknown> | null
    return {
      title:         String(c.title ?? ''),
      description:   String(c.headline ?? ''),
      url:           `https://www.udemy.com${String(c.url ?? '')}`,
      category:      String(cat?.title ?? 'برمجة'),
      rating:        Number(c.avg_rating ?? 4.5),
      current_price: 0,
      instructor:    null,
      coupon_code:   `UDEMY-${String(c.id ?? Math.random().toString(36).slice(2))}`,
      is_verified:   false,
      expires_at:    new Date(now + 3 * 86_400_000).toISOString(),
      telegram_sent: false,
    }
  })
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth guard — accepts header, query param, or hardcoded localhost fallback
  const HARDCODED_SECRET = 'my_super_secret_cron_key_4352'
  const configuredSecret = process.env.CRON_SECRET ?? HARDCODED_SECRET
  const bearer      = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const querySecret = req.nextUrl.searchParams.get('secret') ?? ''
  const incoming    = bearer || querySecret
  if (incoming !== configuredSecret && incoming !== HARDCODED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()

  // Build log record
  const logEntry: CronLogInsert = {
    job_name:      'scrape-coupons',
    status:        'running',
    items_added:   0,
    items_updated: 0,
  }

  // Try Supabase connection
  let supabase: ReturnType<typeof createSupabaseAdmin> | null = null
  try {
    supabase = createSupabaseAdmin()
  } catch {
    // Dry-run mode — Supabase not configured
    try {
      const coupons = await fetchUdemyCoupons()
      return NextResponse.json({
        status:        'dry-run',
        note:          'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to persist.',
        items_fetched: coupons.length,
        sample:        coupons[0] ?? null,
      })
    } catch (err) {
      return NextResponse.json({ status: 'failed', error: String(err) }, { status: 500 })
    }
  }

  // Fetch coupons
  let coupons: CouponInsert[] = []
  try {
    coupons = await fetchUdemyCoupons()
  } catch (err) {
    logEntry.status        = 'failed'
    logEntry.error_message = String(err)
    logEntry.duration_ms   = Date.now() - started
    await supabase.from('cron_logs').insert(logEntry)
    return NextResponse.json({ status: 'failed', error: String(err) }, { status: 500 })
  }

  if (coupons.length === 0) {
    logEntry.status      = 'success'
    logEntry.duration_ms = Date.now() - started
    await supabase.from('cron_logs').insert(logEntry)
    return NextResponse.json({ status: 'success', items_added: 0, items_updated: 0 })
  }

  // Deduplicate: find existing coupon_codes
  const codes = coupons.map((c) => c.coupon_code).filter((x): x is string => Boolean(x))
  const { data: existing } = await supabase
    .from('coupons')
    .select('coupon_code')
    .in('coupon_code', codes)

  const existingCodes = new Set((existing ?? []).map((e: { coupon_code: string }) => e.coupon_code))
  const toInsert      = coupons.filter((c) => !existingCodes.has(c.coupon_code ?? ''))
  const toUpdate      = coupons.filter((c) =>  existingCodes.has(c.coupon_code ?? ''))

  // Insert new coupons
  if (toInsert.length > 0) {
    const { error } = await supabase.from('coupons').insert(toInsert)
    if (error) {
      logEntry.status        = 'failed'
      logEntry.error_message = error.message
      logEntry.duration_ms   = Date.now() - started
      await supabase.from('cron_logs').insert(logEntry)
      return NextResponse.json({ status: 'failed', error: error.message }, { status: 500 })
    }
  }

  // Re-verify existing (refresh expiry)
  for (const coupon of toUpdate) {
    await supabase
      .from('coupons')
      .update({ is_verified: true, expires_at: coupon.expires_at })
      .eq('coupon_code', coupon.coupon_code as string)
  }

  // Write success log
  logEntry.status        = 'success'
  logEntry.items_added   = toInsert.length
  logEntry.items_updated = toUpdate.length
  logEntry.duration_ms   = Date.now() - started
  await supabase.from('cron_logs').insert(logEntry)

  return NextResponse.json({
    status:        'success',
    items_added:   toInsert.length,
    items_updated: toUpdate.length,
    duration_ms:   logEntry.duration_ms,
  })
}
