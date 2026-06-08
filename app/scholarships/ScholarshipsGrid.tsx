'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'

// Matches Supabase scholarships table schema
export type Scholarship = {
  id: string
  title: string
  description: string | null
  country: string | null
  deadline: string | null
  requirements: string | null
  benefits: string | null
  official_link: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Countdown (client-only) ──────────────────────────────────────────────────

type TimeLeft = { days: number; hours: number; minutes: number }

function calcTimeLeft(deadline: string): TimeLeft {
  const diff = Math.max(0, new Date(deadline).getTime() - Date.now())
  const totalMinutes = Math.floor(diff / 60_000)
  return {
    days:    Math.floor(totalMinutes / 1440),
    hours:   Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  }
}

function Countdown({ deadline }: { deadline: string }) {
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTime(calcTimeLeft(deadline))
    const id = setInterval(() => setTime(calcTimeLeft(deadline)), 60_000)
    return () => clearInterval(id)
  }, [deadline])

  if (time === null) {
    return (
      <div className="flex gap-1.5 shrink-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-12 h-14 rounded-md bg-slate-50 border border-slate-200 animate-pulse" />
        ))}
      </div>
    )
  }

  const isUrgent  = time.days < 30
  const cellBase  = 'flex flex-col items-center justify-center rounded-md border px-2.5 py-1.5 min-w-[44px]'
  const cellColor = isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
  const numColor  = isUrgent ? 'text-red-600' : 'text-slate-900'

  return (
    <div className="flex gap-1.5 shrink-0" aria-label={`${time.days} يوم ${time.hours} ساعة`}>
      {[
        { val: time.days,    label: 'يوم' },
        { val: time.hours,   label: 'ساعة' },
        { val: time.minutes, label: 'دقيقة' },
      ].map(({ val, label }) => (
        <div key={label} className={`${cellBase} ${cellColor}`}>
          <span className={`text-lg font-bold tabular-nums leading-none ${numColor}`}>
            {String(val).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Benefit pill ─────────────────────────────────────────────────────────────

function BenefitPill({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 whitespace-nowrap">
      {label}
    </span>
  )
}

// ─── Scholarship card ─────────────────────────────────────────────────────────

function ScholarshipCard({ s }: { s: Scholarship }) {
  const flag         = countryFlag(s.country)
  const benefits     = parseList(s.benefits)
  const requirements = parseList(s.requirements)

  return (
    <article className="bg-white border border-slate-200 rounded-md hover:border-slate-300 hover:shadow-sm transition-all duration-150 overflow-hidden">
      {/* Header — navigates to detail page */}
      <Link
        href={`/scholarships/${s.id}`}
        className="block w-full text-start px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start gap-4 group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-lg leading-none" aria-hidden="true">{flag}</span>
            {s.country && (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">
                {s.country}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-slate-700 transition-colors mb-0.5">
            {s.title}
          </h2>
          {s.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.description}</p>
          )}
          <span className="text-[10px] text-slate-400 mt-2 block underline underline-offset-2 decoration-dotted">
            عرض التفاصيل الكاملة
          </span>
        </div>
        {s.deadline && <Countdown deadline={s.deadline} />}
      </Link>

      {/* Body */}
      <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
        {benefits.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">المزايا والتغطية</p>
            <div className="flex flex-wrap gap-1.5">
              {benefits.map((b) => <BenefitPill key={b} label={b} />)}
            </div>
          </div>
        )}
        {requirements.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">شروط التقديم</p>
            <ul className="space-y-1.5">
              {requirements.slice(0, 3).map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                  {req}
                </li>
              ))}
              {requirements.length > 3 && (
                <li className="text-xs text-slate-400 italic">
                  +{requirements.length - 3} شروط إضافية
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          {s.deadline && (
            <p className="text-xs text-slate-500">
              آخر موعد:{' '}
              <span className="font-semibold text-slate-800">{s.deadline.slice(0, 10)}</span>
            </p>
          )}
        </div>
        {s.official_link ? (
          <a
            href={s.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-center text-sm font-semibold px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md transition-colors shrink-0"
          >
            تفاصيل المنحة والتقديم
          </a>
        ) : (
          <Link
            href={`/scholarships/${s.id}`}
            className="inline-block text-center text-sm font-semibold px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shrink-0"
          >
            تفاصيل المنحة
          </Link>
        )}
      </div>
    </article>
  )
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

function FilterChips({
  options,
  active,
  onChange,
  label,
}: {
  options: string[]
  active: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((opt) => {
        const isActive = opt === active
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            aria-pressed={isActive}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ScholarshipsGrid({ scholarships }: { scholarships: Scholarship[] }) {
  const [countryFilter, setCountryFilter] = useState('الكل')

  const countries = [
    'الكل',
    ...Array.from(new Set(scholarships.map((s) => s.country ?? 'أخرى'))),
  ]

  const visible = scholarships
    .filter((s) => countryFilter === 'الكل' || (s.country ?? 'أخرى') === countryFilter)
    .sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })

  if (scholarships.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-400">لا توجد منح حالياً — سيتم التحديث تلقائياً</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-400">الدولة</p>
        <FilterChips
          options={countries}
          active={countryFilter}
          onChange={setCountryFilter}
          label="تصفية حسب الدولة"
        />
      </div>

      <div className="h-px bg-slate-200" />

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">
          لا توجد منح تطابق المعايير المختارة
        </p>
      ) : (
        <div className="space-y-5">
          {visible.map((s) => (
            <ScholarshipCard key={s.id} s={s} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pt-2">
        عرض {visible.length} من {scholarships.length} منحة
      </p>
    </div>
  )
}