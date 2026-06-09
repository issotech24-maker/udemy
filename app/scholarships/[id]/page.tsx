import { notFound }            from 'next/navigation'
import Link                    from 'next/link'
import type { Metadata }       from 'next'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Scholarship }    from '../ScholarshipsGrid'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseList(text: string | null): string[] {
  if (!text) return []
  return text.split('|').map((s) => s.trim()).filter(Boolean)
}

const COUNTRY_FLAGS: Record<string, string> = {
  'ألمانيا': '🇩🇪', 'الولايات المتحدة': '🇺🇸', 'المملكة المتحدة': '🇬🇧',
  'تركيا': '🇹🇷', 'اليابان': '🇯🇵', 'كوريا الجنوبية': '🇰🇷',
  'أستراليا': '🇦🇺', 'سويسرا': '🇨🇭', 'المجر': '🇭🇺', 'كندا': '🇨🇦',
  'فرنسا': '🇫🇷', 'هولندا': '🇳🇱', 'السويد': '🇸🇪', 'النرويج': '🇳🇴',
  'الدنمارك': '🇩🇰', 'النمسا': '🇦🇹', 'بلجيكا': '🇧🇪', 'إيطاليا': '🇮🇹',
  'إسبانيا': '🇪🇸', 'البرتغال': '🇵🇹', 'الصين': '🇨🇳', 'روسيا': '🇷🇺',
  'سنغافورة': '🇸🇬', 'الإمارات': '🇦🇪', 'مصر': '🇪🇬', 'المغرب': '🇲🇦',
}

function countryFlag(country: string | null): string {
  if (!country) return '🌍'
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.includes(key)) return flag
  }
  return '🌍'
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.floor((new Date(dateStr).getTime() - Date.now()) / 86_400_000))
}

function extractKeywords(title: string, country: string | null): string {
  const words = title.split(/\s+/).filter((w) => w.length > 2).slice(0, 8)
  const base  = ['منحة دراسية', 'دراسة في الخارج', 'منحة مجانية', 'تمويل دراسي', 'scholarship']
  return [...words, ...(country ? [country] : []), ...base].join(', ')
}

async function fetchScholarship(id: string): Promise<Scholarship | null> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('scholarships')
      .select('id, title, description, country, deadline, requirements, benefits, official_link')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as Scholarship
  } catch {
    return null
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id }       = await params
  const scholarship  = await fetchScholarship(id)
  if (!scholarship) return { title: 'منحة غير موجودة – UdemyRadar' }

  const description = scholarship.description
    ? scholarship.description.slice(0, 155)
    : `تفاصيل منحة "${scholarship.title}" – الشروط والمزايا وآخر موعد للتقديم`

  return {
    title:       `${scholarship.title} – UdemyRadar`,
    description,
    keywords:    extractKeywords(scholarship.title, scholarship.country),
    openGraph: {
      title:       scholarship.title,
      description,
      type:        'website',
      siteName:    'UdemyRadar',
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ScholarshipPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }      = await params
  const s           = await fetchScholarship(id)
  if (!s) notFound()

  const flag         = countryFlag(s.country)
  const benefits     = parseList(s.benefits)
  const requirements = parseList(s.requirements)
  const days         = s.deadline ? daysUntil(s.deadline) : null
  const isUrgent     = days !== null && days < 30

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/scholarships"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-8"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        كل المنح الدراسية
      </Link>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xl leading-none">{flag}</span>
            {s.country && (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">
                {s.country}
              </span>
            )}
            {s.deadline && (
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-sm border ${
                isUrgent
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}>
                آخر موعد: {s.deadline.slice(0, 10)}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">{s.title}</h1>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {s.description && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">تفاصيل المنحة</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</p>
            </div>
          )}

          {benefits.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                المزايا والتغطية
              </p>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((b) => (
                  <span key={b} className="inline-block text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {requirements.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                شروط التقديم
              </p>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deadline banner */}
          {s.deadline && (
            <div className={`rounded-md px-4 py-3 flex items-center gap-3 border ${
              isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-red-400' : 'text-slate-400'}`}>
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-slate-500">آخر موعد للتقديم</p>
                <p className={`text-sm font-bold ${isUrgent ? 'text-red-700' : 'text-slate-900'}`}>
                  {s.deadline.slice(0, 10)}
                  {days !== null && (
                    <span className="ms-2 font-normal text-xs">
                      ({days === 0 ? 'اليوم آخر يوم' : `${days} يوم متبقٍ`})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2 border-t border-slate-100">
          {s.official_link ? (
            <a
              href={s.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-bold rounded-md transition-colors"
            >
              تفاصيل المنحة والتقديم
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3H3.5A1.5 1.5 0 002 4.5v8A1.5 1.5 0 003.5 14h8A1.5 1.5 0 0013 12.5V10M9 2h5m0 0v5m0-5L8 8" />
              </svg>
            </a>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">الرابط الرسمي غير متوفر حالياً</p>
          )}
        </div>
      </div>
    </div>
  )
}