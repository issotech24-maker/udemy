import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CouponInsert, CronLogInsert } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Config ───────────────────────────────────────────────────────────────────

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY  ?? '3fbd9ae512msh7c59afd2abf0e57p189b7djsn22f8ddafbf26'
const RAPIDAPI_HOST = 'paid-udemy-course-for-free.p.rapidapi.com'
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}/?page=1&page_size=10`

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

// ─── RapidAPI types (paid-udemy-course-for-free) ──────────────────────────────
// The API returns a flat array; field names vary slightly across versions.

interface RapidCourse {
  id?:             number | string
  // title variants
  title?:          string
  name?:           string
  course_title?:   string
  // url / coupon link variants
  url?:            string
  link?:           string
  coupon_url?:     string
  course_url?:     string
  // coupon code variants
  coupon_code?:    string
  couponCode?:     string
  coupon?:         string
  // rating variants
  rating?:         number | string
  avg_rating?:     number | string
  course_rating?:  number | string
  // instructor variants
  instructor?:     string
  author?:         string
  teacher?:        string
  // category variants
  category?:       string
  category_title?: string
  // description variants
  description?:    string
  headline?:       string
  short_description?: string
  about?:          string
  desc_text?:      string
  // misc
  image?:          string
  img?:            string
  thumbnail?:      string
  price?:          string | number
  students?:       number
  language?:       string
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

// Decodes, repairs, and rebuilds a clean Udemy course URL + extracts coupon code.
// Handles: broken protocols (https//), percent-encoded params (%3F/%3D), double
// slashes, redirect wrappers, and missing protocol. Always produces a canonical
// https://www.udemy.com/course/<slug>/?couponCode=<CODE> URL when possible.
function buildCleanUdemyUrl(rawUrl: string, explicitCode: string): { url: string; couponCode: string } {
  // 1. Fix broken protocol variants: "https//...", "http//...", "//..."
  let fixed = rawUrl
  if (/^https\/\//i.test(fixed))  fixed = fixed.replace(/^https\/\//i,  'https://')
  else if (/^http\/\//i.test(fixed)) fixed = fixed.replace(/^http\/\//i, 'http://')
  else if (/^\/\//.test(fixed))   fixed = `https:${fixed}`

  // 2. Ensure a protocol is present
  if (!/^https?:\/\//i.test(fixed)) fixed = `https://${fixed}`

  // 3. Decode percent-encoded characters (%3F -> ?, %3D -> =, %2F -> /, etc.)
  try { fixed = decodeURIComponent(fixed) } catch { /* leave as-is */ }

  // 4. Collapse accidental double slashes (not the protocol ones)
  fixed = fixed.replace(/([^:])\/\/+/g, '$1/')

  // 5. Extract the course slug from /course/<slug>
  const slugMatch = fixed.match(/\/course\/([^/?#\s]+)/i)

  // 6. Determine coupon code — explicit field wins, then parse from URL params
  let code = explicitCode.trim()
  if (!code) {
    try {
      const u = new URL(fixed)
      code = (
        u.searchParams.get('couponCode') ??
        u.searchParams.get('coupon_code') ??
        u.searchParams.get('coupon') ?? ''
      )
    } catch {
      const m = fixed.match(/[?&]coupon(?:Code|_code)?=([^&\s]+)/i)
      code = m ? decodeURIComponent(m[1]) : ''
    }
  }

  if (slugMatch) {
    const slug     = slugMatch[1].replace(/\/+$/, '')
    const baseUrl  = `https://www.udemy.com/course/${slug}/`
    const finalUrl = code ? `${baseUrl}?couponCode=${encodeURIComponent(code)}` : baseUrl
    return { url: finalUrl, couponCode: code }
  }

  // Fallback: slug not found — strip all params and re-attach coupon cleanly
  try {
    const u       = new URL(fixed)
    const baseUrl = `${u.origin}${u.pathname.replace(/\/+$/, '')}/`
    const finalUrl = code ? `${baseUrl}?couponCode=${encodeURIComponent(code)}` : baseUrl
    return { url: finalUrl, couponCode: code }
  } catch {
    return { url: fixed, couponCode: code }
  }
}

function normalizeRapidCourse(raw: RapidCourse): {
  title: string; description: string; url: string
  couponCode: string; rating: number; instructor: string; rawCategory: string
} {
  const title = String(raw.title ?? raw.name ?? raw.course_title ?? '').trim()
  const desc  = String(raw.desc_text ?? raw.description ?? raw.headline ?? raw.short_description ?? raw.about ?? '').trim()

  // `coupon` from this API carries the full ready-made Udemy URL; other fields carry the bare code
  const couponFieldIsUrl = raw.coupon != null && /^https?:\/\//i.test(String(raw.coupon))
  const rawUrl       = couponFieldIsUrl
    ? String(raw.coupon).trim()
    : String(raw.url ?? raw.link ?? raw.coupon_url ?? raw.course_url ?? '').trim()
  const explicitCode = couponFieldIsUrl
    ? ''                                                               // let buildCleanUdemyUrl parse it from the URL
    : String(raw.coupon_code ?? raw.couponCode ?? raw.coupon ?? '').trim()

  const { url, couponCode: parsedCode } = buildCleanUdemyUrl(rawUrl, explicitCode)
  const code = (parsedCode || `RAPID-${String(raw.id ?? Date.now())}`).trim().toUpperCase()

  const rating = Math.min(5, Math.max(0, Number(raw.rating ?? raw.avg_rating ?? raw.course_rating ?? 4.5) || 4.5))
  const inst   = String(raw.instructor ?? raw.author ?? raw.teacher ?? '').trim()
  const rawCat = String(raw.category ?? raw.category_title ?? '').trim()

  return { title, description: desc, url, couponCode: code, rating, instructor: inst, rawCategory: rawCat }
}

// ─── Step 1: fetch raw courses from RapidAPI ──────────────────────────────────

async function fetchRapidAPI(): Promise<RapidCourse[]> {
  const res = await fetch(RAPIDAPI_BASE, {
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key':  RAPIDAPI_KEY,
    },
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)')
    throw new Error(`RapidAPI ${res.status}: ${errBody}`)
  }

  const body: unknown = await res.json()
  // Temporary debug — shows exact field names from this API version
  console.log("RAW API BODY SHAPE:", JSON.stringify(Array.isArray(body) ? (body as unknown[])[0] : body).slice(0, 2000))
  const courses = extractCourses(body)
  console.log("RAW API ITEM SAMPLE:", JSON.stringify(courses[0] ?? null))

  // Deduplicate by coupon code
  const seen = new Set<string>()
  return courses.filter((c) => {
    const { couponCode } = normalizeRapidCourse(c)
    if (seen.has(couponCode)) return false
    seen.add(couponCode)
    return true
  })
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
      "title": "العنوان بالعربية",
      "description": "الوصف بالعربية",
      "category": "برمجة",
      "rating": 4.5,
      "instructor": "..."
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

  // Build a lookup by coupon_code so order does not matter
  const lookup = new Map(parsed.courses.map((c) => [c.coupon_code, c]))

  return batch.map((raw) => {
    const t = lookup.get(raw.couponCode)
    return {
      title:         t?.title       ?? raw.title,
      description:   t?.description ?? (raw.description || null),
      // Always use our own cleaned URL — never trust DeepSeek's copy
      url:           raw.url,
      category:      t?.category    ?? mapCategory(raw.rawCategory),
      rating:        t?.rating      ?? raw.rating,
      current_price: 0,
      instructor:    t?.instructor  ?? (raw.instructor || null),
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

  // Purge coupons whose expiry has passed before inserting fresh ones
  await supabase.from('coupons').delete().lt('expires_at', new Date().toISOString())

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