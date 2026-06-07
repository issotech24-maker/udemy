import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { ScholarshipInsert, CronLogInsert } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Config ───────────────────────────────────────────────────────────────────

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY ?? '3fbd9ae512msh7c59afd2abf0e57p189b7djsn22f8ddafbf26'
const RAPIDAPI_HOST = 'open-scholarships.p.rapidapi.com'
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}/`

// ─── Raw API types ────────────────────────────────────────────────────────────
// Field names are intentionally broad — actual keys revealed by console.log below.

interface RawScholarship {
  // title variants
  title?:              string
  name?:               string
  scholarship_name?:   string
  scholarship_title?:  string
  // description variants
  description?:        string
  desc?:               string
  about?:              string
  summary?:            string
  details?:            string
  overview?:           string
  // country variants
  country?:            string
  location?:           string
  countries?:          string | string[]
  host_country?:       string
  // deadline variants
  deadline?:           string
  application_deadline?: string
  closing_date?:       string
  due_date?:           string
  // requirements / eligibility variants
  requirements?:       string
  eligibility?:        string
  criteria?:           string
  who_can_apply?:      string
  // benefits / funding variants
  benefits?:           string
  funding?:            string
  coverage?:           string
  award?:              string
  value?:              string
  // link variants
  link?:               string
  url?:                string
  apply_url?:          string
  application_link?:   string
  official_link?:      string
  website?:            string
  // misc
  id?:                 string | number
  level?:              string
  field?:              string
  subject?:            string
  host_institution?:   string
}

interface RawResponse {
  data?:         RawScholarship[]
  scholarships?: RawScholarship[]
  results?:      RawScholarship[]
  items?:        RawScholarship[]
}

function extractScholarships(body: unknown): RawScholarship[] {
  if (Array.isArray(body)) return body as RawScholarship[]
  const b = body as RawResponse
  return b.data ?? b.scholarships ?? b.results ?? b.items ?? []
}

function firstString(...vals: (string | string[] | undefined | null)[]): string {
  for (const v of vals) {
    if (!v) continue
    if (Array.isArray(v)) { const s = v.join(', ').trim(); if (s) return s }
    const s = String(v).trim()
    if (s) return s
  }
  return ''
}

function normalizeRaw(raw: RawScholarship): {
  title: string; description: string; country: string
  deadline: string; requirements: string; benefits: string; link: string
} {
  return {
    title:        firstString(raw.title, raw.scholarship_title, raw.scholarship_name, raw.name),
    description:  firstString(raw.description, raw.desc, raw.about, raw.summary, raw.overview, raw.details),
    country:      firstString(raw.country, raw.host_country, raw.location, raw.countries),
    deadline:     firstString(raw.deadline, raw.application_deadline, raw.closing_date, raw.due_date),
    requirements: firstString(raw.requirements, raw.eligibility, raw.criteria, raw.who_can_apply),
    benefits:     firstString(raw.benefits, raw.funding, raw.coverage, raw.award, raw.value),
    link:         firstString(raw.link, raw.official_link, raw.apply_url, raw.application_link, raw.url, raw.website),
  }
}

// ─── Step 1: fetch from RapidAPI ──────────────────────────────────────────────

async function fetchRapidAPI(): Promise<RawScholarship[]> {
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

  // Debug: shows exact JSON keys returned by this API version
  const sample = Array.isArray(body) ? (body as unknown[])[0] : body
  console.log('RAW SCHOLARSHIP BODY SHAPE:', JSON.stringify(sample).slice(0, 2000))

  return extractScholarships(body)
}

// ─── Step 2: translate via DeepSeek ──────────────────────────────────────────

interface DeepSeekBody { choices: Array<{ message: { content: string } }> }

interface TranslatedScholarship {
  id_key:       string   // original title used as stable key
  title:        string
  description:  string
  country:      string
  requirements: string
  benefits:     string
}

interface TranslatedPayload { scholarships: TranslatedScholarship[] }

function isTranslatedPayload(v: unknown): v is TranslatedPayload {
  return (
    typeof v === 'object' && v !== null &&
    'scholarships' in v &&
    Array.isArray((v as TranslatedPayload).scholarships)
  )
}

async function translateBatch(
  batch: ReturnType<typeof normalizeRaw>[]
): Promise<ScholarshipInsert[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    // No DeepSeek key — store raw English data
    return batch.map((s) => ({
      title:         s.title   || 'منحة دراسية',
      description:   s.description  || null,
      country:       s.country      || null,
      deadline:      s.deadline     || null,
      requirements:  s.requirements || null,
      benefits:      s.benefits     || null,
      official_link: s.link         || null,
      telegram_sent: false,
    }))
  }

  const inputJson = JSON.stringify(batch.map((s, i) => ({
    id_key:       String(i),
    title_en:     s.title,
    description_en: s.description,
    country:      s.country,
    requirements_en: s.requirements,
    benefits_en:  s.benefits,
  })))

  const prompt = `أنت مساعد متخصص في ترجمة بيانات المنح الدراسية.
لديك قائمة منح دراسية. لكل منحة:
1. ترجم العنوان (title_en) إلى عربية احترافية وموجزة
2. ترجم الوصف (description_en) إلى عربية (جملتان أو ثلاث)؛ أو اكتب وصفاً مناسباً إن كان فارغاً
3. ترجم الشروط (requirements_en) إلى عربية موجزة، أو اتركه فارغاً
4. ترجم المزايا (benefits_en) إلى عربية موجزة، أو اتركه فارغاً
5. اترك country كما هو (اسم الدولة بالإنجليزية)

البيانات المدخلة (JSON):
${inputJson}

أعد JSON object فقط بهذا الشكل بدون أي نص إضافي:
{
  "scholarships": [
    {
      "id_key": "0",
      "title": "العنوان بالعربية",
      "description": "الوصف بالعربية",
      "country": "Country Name",
      "requirements": "الشروط بالعربية أو فارغ",
      "benefits": "المزايا بالعربية أو فارغ"
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

  const lookup = new Map(parsed.scholarships.map((s) => [s.id_key, s]))

  return batch.map((raw, i) => {
    const t = lookup.get(String(i))
    return {
      title:         t?.title        ?? (raw.title       || 'منحة دراسية'),
      description:   t?.description  ?? (raw.description || null),
      country:       t?.country      ?? (raw.country     || null),
      deadline:      raw.deadline                        || null,
      requirements:  t?.requirements ?? (raw.requirements || null),
      benefits:      t?.benefits     ?? (raw.benefits     || null),
      official_link: raw.link                            || null,
      telegram_sent: false,
    }
  })
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

async function fetchScholarships(): Promise<ScholarshipInsert[]> {
  const raw = await fetchRapidAPI()

  if (raw.length === 0) return []

  const normalised = raw.map(normalizeRaw).filter((s) => s.title.length > 0)

  const CHUNK = 10
  const results: ScholarshipInsert[] = []
  for (let i = 0; i < normalised.length; i += CHUNK) {
    const chunk      = normalised.slice(i, i + CHUNK)
    const translated = await translateBatch(chunk)
    results.push(...translated)
  }
  return results
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

  const started  = Date.now()
  const logEntry: CronLogInsert = {
    job_name:      'scrape-scholarships',
    status:        'running',
    items_added:   0,
    items_updated: 0,
  }

  let supabase: ReturnType<typeof createSupabaseAdmin> | null = null
  try {
    supabase = createSupabaseAdmin()
  } catch {
    try {
      const scholarships = await fetchScholarships()
      return NextResponse.json({
        status:        'dry-run',
        note:          'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to persist.',
        items_fetched: scholarships.length,
        sample:        scholarships[0] ?? null,
      })
    } catch (err) {
      return NextResponse.json({ status: 'failed', error: String(err) }, { status: 500 })
    }
  }

  let scholarships: ScholarshipInsert[] = []
  try {
    scholarships = await fetchScholarships()
  } catch (err) {
    logEntry.status        = 'failed'
    logEntry.error_message = String(err)
    logEntry.duration_ms   = Date.now() - started
    await supabase.from('cron_logs').insert(logEntry)
    return NextResponse.json({ status: 'failed', error: String(err) }, { status: 500 })
  }

  if (scholarships.length === 0) {
    logEntry.status      = 'success'
    logEntry.duration_ms = Date.now() - started
    await supabase.from('cron_logs').insert(logEntry)
    return NextResponse.json({ status: 'success', items_added: 0, items_updated: 0 })
  }

  // Deduplicate against existing rows by official_link (fallback: title)
  const links = scholarships
    .map((s) => s.official_link)
    .filter((x): x is string => Boolean(x))

  const { data: existingByLink } = await supabase
    .from('scholarships')
    .select('official_link')
    .in('official_link', links.length > 0 ? links : ['__none__'])

  const existingLinks = new Set(
    (existingByLink ?? []).map((e: { official_link: string | null }) => e.official_link ?? '')
  )

  const toInsert = scholarships.filter(
    (s) => !s.official_link || !existingLinks.has(s.official_link)
  )

  if (toInsert.length > 0) {
    const { error } = await supabase.from('scholarships').insert(toInsert)
    if (error) {
      logEntry.status        = 'failed'
      logEntry.error_message = error.message
      logEntry.duration_ms   = Date.now() - started
      await supabase.from('cron_logs').insert(logEntry)
      return NextResponse.json({ status: 'failed', error: error.message }, { status: 500 })
    }
  }

  logEntry.status        = 'success'
  logEntry.items_added   = toInsert.length
  logEntry.items_updated = scholarships.length - toInsert.length
  logEntry.duration_ms   = Date.now() - started
  await supabase.from('cron_logs').insert(logEntry)

  return NextResponse.json({
    status:        'success',
    items_added:   toInsert.length,
    items_updated: logEntry.items_updated,
    duration_ms:   logEntry.duration_ms,
  })
}