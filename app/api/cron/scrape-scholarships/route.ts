import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { ScholarshipInsert, CronLogInsert } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Internal types ────────────────────────────────────────────────────────────

interface DeepSeekBody {
  choices: Array<{ message: { content: string } }>
}

interface AIScholarship {
  title: string
  description: string
  country: string
  deadline: string
  requirements: string
  benefits: string
  official_link: string
}

interface AIScholarshipPayload {
  scholarships: AIScholarship[]
}

function isAIScholarshipPayload(val: unknown): val is AIScholarshipPayload {
  return (
    typeof val === 'object' &&
    val !== null &&
    'scholarships' in val &&
    Array.isArray((val as AIScholarshipPayload).scholarships)
  )
}

// ─── AI scholarship generator ──────────────────────────────────────────────────

async function generateScholarshipsAI(): Promise<ScholarshipInsert[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return []

  const year   = new Date().getFullYear()
  const prompt = `أنت مساعد متخصص في قاعدة بيانات المنح الدراسية الدولية.
أنشئ بيانات JSON لـ 5 منح دراسية حقيقية أو واقعية مفتوحة للطلاب العرب في ${year}.
يجب أن يكون كل عنصر بهذا الشكل بالضبط (جميع النصوص بالعربية):
{
  "title": "الاسم الكامل للمنحة بالعربية",
  "description": "وصف المنحة بالعربية (3-4 جمل تشمل الهدف والتغطية والمميزات)",
  "country": "اسم الدولة المضيفة بالعربية",
  "deadline": "YYYY-MM-DD",
  "requirements": "الشرط الأول | الشرط الثاني | الشرط الثالث | الشرط الرابع",
  "benefits": "تغطية كاملة للرسوم | راتب شهري | تذاكر طيران | تأمين صحي",
  "official_link": "https://رابط-رسمي.com"
}
نوّع الدول (ألمانيا، تركيا، اليابان، كوريا، أستراليا، الخ).
الناتج كـ JSON object: { "scholarships": [...] } بدون أي نص إضافي.`

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
      temperature: 0.7,
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)

  const data   = (await res.json()) as DeepSeekBody
  const parsed: unknown = JSON.parse(data.choices[0].message.content)
  if (!isAIScholarshipPayload(parsed)) throw new Error('Unexpected DeepSeek response shape')

  return parsed.scholarships.map((s) => ({
    title:         String(s.title).trim(),
    description:   String(s.description).trim(),
    country:       String(s.country).trim(),
    deadline:      s.deadline ? new Date(s.deadline).toISOString() : null,
    requirements:  String(s.requirements).trim(),
    benefits:      String(s.benefits).trim(),
    official_link: String(s.official_link).trim(),
    telegram_sent: false,
  }))
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth guard
  const secret = process.env.CRON_SECRET
  if (secret) {
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (bearer !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const started = Date.now()
  const logEntry: CronLogInsert = {
    job_name:      'scrape-scholarships',
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
      const scholarships = await generateScholarshipsAI()
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

  // Generate scholarships
  let scholarships: ScholarshipInsert[] = []
  try {
    scholarships = await generateScholarshipsAI()
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

  // Deduplicate by official_link
  const links = scholarships
    .map((s) => s.official_link)
    .filter((x): x is string => Boolean(x))

  const { data: existing } = await supabase
    .from('scholarships')
    .select('official_link')
    .in('official_link', links)

  const existingLinks = new Set(
    (existing ?? []).map((e: { official_link: string }) => e.official_link),
  )
  const toInsert = scholarships.filter((s) => !existingLinks.has(s.official_link ?? ''))

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
  logEntry.items_updated = 0
  logEntry.duration_ms   = Date.now() - started
  await supabase.from('cron_logs').insert(logEntry)

  return NextResponse.json({
    status:        'success',
    items_added:   toInsert.length,
    items_updated: 0,
    duration_ms:   logEntry.duration_ms,
  })
}
