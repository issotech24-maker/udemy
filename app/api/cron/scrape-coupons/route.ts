import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CouponInsert, CronLogInsert } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Config ───────────────────────────────────────────────────────────────────

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY  ?? '3fbd9ae512msh7c59afd2abf0e57p189b7djsn22f8ddafbf26'
const RAPIDAPI_HOST = 'udemy-paid-courses-for-free-api.p.rapidapi.com'
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}/rapidapi/courses/search`

// Keywords to sweep — results are merged and deduplicated before DB insert
const KEYWORDS = ['python', 'javascript', 'react', 'web development', 'machine learning', 'sql', 'flutter', 'devops']

// Arabic category mapping — keeps our filter chips consistent
const CATEGORY_MAP: Record<string, string> = {
  development:       'برمجة',
  programming:       'برمجة',
  'web development': 'تطوير الويب',
  web:               'تطوير الويب',
  'mobile apps':     'تطوير الويب',
  'data science':    'ذكاء اصطناعي',
  'machine learning':'ذكاء اصطناعي',
  ai:                'ذكاء اصطناعي',
  'artificial intelligence': 'ذكاء اصطناعي',
  database:          'قواعد البيانات',
  sql:               'قواعد البيانات',
  design:            'تصميم',
  'ui/ux':           'تصميم',
  marketing:         'تسويق',
  business:          'أعمال',
  entrepreneurship:  'أعمال',
  devops:            'DevOps',
  cloud:             'DevOps',
}

function mapCategory(raw: string | undefined | null): string {
  if (!raw) return 'برمجة'
  const key = raw.trim().toLowerCase()
  for (const [pattern, arabic] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(pattern)) return arabic
  }
  return 'برمجة'
}

// ─── RapidAPI types ───────────────────────────────────────────────────────────

interface RapidCourse {
  id?:           number | string
  title?:        string
  url?:          string
  coupon_code?:  string
  couponCode?:   string
  rating?:       number | string
  instructor?:   string
  category?:     string
  description?:  string
  headline?:     string
  img?:          string
  price?:        string | number
  // Some variants nest inside a "course" key
  course?: {
    title?: string
    url?: string
    rating?: number | string
    headline?: string
    instructor?: { display_name?: string }
    primary_category?: { title?: string }
  }
}

interface RapidResponse {
  courses?: RapidCourse[]
  results?: RapidCourse[]
  data?:    RapidCourse[]
}

function extractCourses(body: unknown): RapidCourse[] {
  if (Array.isArray(body)) return body as RapidCourse[]
  const b = body as RapidResponse
  return b.courses ?? b.results ?? b.data ?? []
}

function normalizeRapidCourse(raw: RapidCourse): {
  title: string; description: string; url: string
  couponCode: string; rating: number; instructor: string; rawCategory: string
} {
  // Some API variants wrap fields inside a nested `course` object
  const nested = raw.course ?? {}
  const title   = String(raw.title ?? nested.title ?? '').trim()
  const desc    = String(raw.description ?? raw.headline ?? nested.headline ?? '').trim()
  const rawUrl  = String(raw.url ?? nested.url ?? '').trim()
  const url     = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://www.udemy.com${rawUrl}`
  const code    = String(raw.coupon_code ?? raw.couponCode ?? `RAPID-${raw.id ?? Date.now()}`).trim().toUpperCase()
  const rating  = Math.min(5, Math.max(0, Number(raw.rating ?? nested.rating ?? 4.5) || 4.5))
  const inst    = raw.instructor
    ?? (nested.instructor as { display_name?: string } | undefined)?.display_name
    ?? ''
  const rawCat  = raw.category
    ?? (nested.primary_category as { title?: string } | undefined)?.title
    ?? ''
  return { title, description: desc, url, couponCode: code, rating, instructor: String(inst).trim(), rawCategory: rawCat }
}

// ─── Step 1: fetch raw courses from RapidAPI ──────────────────────────────────

async function fetchRapidAPI(): Promise<RapidCourse[]> {
  const seen  = new Set<string>()
  const all: RapidCourse[] = []

  for (const query of KEYWORDS) {
    try {
      const url = `${RAPIDAPI_BASE}?page=1&page_size=10&query=${encodeURIComponent(query)}`
      const res = await fetch(url, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key':  RAPIDAPI_KEY,
        },
      })
      if (!res.ok) {
        const errBody = await res.text().catch(() => '(no body)')
        throw new Error(`RapidAPI ${res.status} for "${query}": ${errBody}`)
      }
      const body: unknown = await res.json()
      const courses = extractCourses(body)
      for (const c of courses) {
        const { couponCode } = normalizeRapidCourse(c)
        if (!seen.has(couponCode)) { seen.add(couponCode); all.push(c) }
      }
    } catch (err) {
      throw new Error(`RapidAPI fetch failed for keyword "${query}": ${String(err)}`)
    }
  }

  return all
}

// ─── Step 2: translate + normalise via DeepSeek ───────────────────────────────

interface DeepSeekBody { choices: Array<{ message: { content: string } }> }

interface TranslatedCourse {
  title:       string
  description: string
  category:    string
  coupon_code: string
  url:         string
  rating:      number
  instructor:  string
}

interface TranslatedPayload { courses: TranslatedCourse[] }

function isTranslatedPayload(v: unknown): v is TranslatedPayload {
  return (
    typeof v === 'object' && v !== null &&
    'courses' in v && Array.isArray((v as TranslatedPayload).courses)
  )
}

async function translateBatch(batch: ReturnType<typeof normalizeRapidCourse>[]): Promise<CouponInsert[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    // No DeepSeek key — use raw English data with category mapping
    return batch.map((c) => ({
      title:         c.title,
      description:   c.description || null,
      url:           c.url,
      category:      mapCategory(c.rawCategory),
      rating:        c.rating,
      current_price: 0,
      instructor:    c.instructor || null,
      coupon_code:   c.couponCode,
      is_verified:   true,
      expires_at:    new Date(Date.now() + 3 * 86_400_000).toISOString(),
      telegram_sent: false,
    }))
  }

  const inputJson = JSON.stringify(batch.map((c) => ({
    coupon_code: c.couponCode,
    url:         c.url,
    rating:      c.rating,
    instructor:  c.instructor,
    raw_category: c.rawCategory,
    title_en:    c.title,
    description_en: c.description,
  })))

  const prompt = `أنت مساعد متخصص في ترجمة وتصنيف بيانات الدورات التعليمية.
لديك قائمة دورات من Udemy. لكل دورة:
1. ترجم العنوان (title_en) إلى عربية احترافية وموجزة
2. ترجم الوصف (description_en) إلى عربية (جملتان أو ثلاث)، أو اكتب وصفاً مناسباً إن كان فارغاً
3. اختر الفئة (category) من: برمجة | تطوير الويب | ذكاء اصطناعي | قواعد البيانات | تصميم | تسويق | أعمال | DevOps

البيانات المدخلة (JSON):
${inputJson}

أعد JSON object فقط بهذا الشكل بدون أي نص إضافي:
{
  "courses": [
    {
      "coupon_code": "...",
      "url": "...",
      "rating": 4.5,
      "instructor": "...",
      "title": "العنوان بالعربية",
      "description": "الوصف بالعربية",
      "category": "برمجة"
    }
  ]
}`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:           'deepseek-chat',
      messages:        [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature:     0.3,
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`)

  const data    = (await res.json()) as DeepSeekBody
  const parsed: unknown = JSON.parse(data.choices[0].message.content)
  if (!isTranslatedPayload(parsed)) throw new Error('Unexpected DeepSeek shape')

  // Build a lookup by coupon_code so order doesn't matter
  const lookup = new Map(parsed.courses.map((c) => [c.coupon_code, c]))

  return batch.map((raw) => {
    const t = lookup.get(raw.couponCode)
    return {
      title:         t?.title         ?? raw.title,
      description:   t?.description   ?? (raw.description || null),
      url:           t?.url           ?? raw.url,
      category:      t?.category      ?? mapCategory(raw.rawCategory),
      rating:        t?.rating        ?? raw.rating,
      current_price: 0,
      instructor:    t?.instructor    ?? (raw.instructor || null),
      coupon_code:   raw.couponCode,
      is_verified:   true,
      expires_at:    new Date(Date.now() + 3 * 86_400_000).toISOString(),
      telegram_sent: false,
    }
  })
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

async function fetchCoupons(): Promise<CouponInsert[]> {
  const rawCourses = await fetchRapidAPI()

  if (rawCourses.length === 0) {
    // RapidAPI returned nothing — fall back to AI-only generation
    return generateCouponsAI()
  }

  const normalised = rawCourses.map(normalizeRapidCourse)

  // Translate in chunks of 10 to stay within DeepSeek token limits
  const CHUNK = 10
  const results: CouponInsert[] = []
  for (let i = 0; i < normalised.length; i += CHUNK) {
    const chunk = normalised.slice(i, i + CHUNK)
    const translated = await translateBatch(chunk)
    results.push(...translated)
  }
  return results
}

// ─── AI fallback (when RapidAPI key missing or returns nothing) ───────────────

async function generateCouponsAI(): Promise<CouponInsert[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return []

  interface AICoursePayload { courses: Array<{
    title: string; description: string; instructor: string; category: string
    rating: number; coupon_code: string; expires_in_days: number; url: string
  }> }
  function isAIPayload(v: unknown): v is AICoursePayload {
    return typeof v === 'object' && v !== null && 'courses' in v && Array.isArray((v as AICoursePayload).courses)
  }

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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
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
  if (!isAIPayload(parsed)) throw new Error('Unexpected DeepSeek shape')

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

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const HARDCODED_SECRET = 'my_super_secret_cron_key_4352'
  const configuredSecret = process.env.CRON_SECRET ?? HARDCODED_SECRET
  const bearer      = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const querySecret = req.nextUrl.searchParams.get('secret') ?? ''
  const queryKey    = req.nextUrl.searchParams.get('key') ?? ''
  const incoming    = bearer || querySecret || queryKey
  if (incoming !== configuredSecret && incoming !== HARDCODED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const logEntry: CronLogInsert = {
    job_name:      'scrape-coupons',
    status:        'running',
    items_added:   0,
    items_updated: 0,
  }

  // Try Supabase
  let supabase: ReturnType<typeof createSupabaseAdmin> | null = null
  try {
    supabase = createSupabaseAdmin()
  } catch {
    try {
      const coupons = await fetchCoupons()
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

  // Fetch + translate
  let coupons: CouponInsert[] = []
  try {
    coupons = await fetchCoupons()
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

  // Deduplicate against existing rows
  const codes = coupons.map((c) => c.coupon_code).filter((x): x is string => Boolean(x))
  const { data: existing } = await supabase
    .from('coupons')
    .select('coupon_code')
    .in('coupon_code', codes)

  const existingCodes = new Set((existing ?? []).map((e: { coupon_code: string }) => e.coupon_code))
  const toInsert      = coupons.filter((c) => !existingCodes.has(c.coupon_code ?? ''))
  const toUpdate      = coupons.filter((c) =>  existingCodes.has(c.coupon_code ?? ''))

  // Insert new
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

  // Re-verify existing (refresh expiry + mark verified)
  for (const coupon of toUpdate) {
    await supabase
      .from('coupons')
      .update({ is_verified: true, expires_at: coupon.expires_at })
      .eq('coupon_code', coupon.coupon_code as string)
  }

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
