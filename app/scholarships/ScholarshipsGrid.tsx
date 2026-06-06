'use client'

import { useState, useEffect } from 'react'

export type Scholarship = {
  id: string
  title: string
  subtitle: string
  country: string
  flag: string
  level: string
  field: string
  deadline: string
  requirements: string[]
  benefit_tags: string[]
  official_link: string
}

// ─── Countdown ────────────────────────────────────────────────────────────────

type TimeLeft = { days: number; hours: number; minutes: number }

function calcTimeLeft(deadline: string): TimeLeft {
  const diff = Math.max(0, new Date(deadline).getTime() - Date.now())
  const totalMinutes = Math.floor(diff / 60_000)
  const days    = Math.floor(totalMinutes / 1440)
  const hours   = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return { days, hours, minutes }
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
          <div
            key={i}
            className="w-12 h-14 rounded-md bg-slate-50 border border-slate-200 animate-pulse"
          />
        ))}
      </div>
    )
  }

  const isUrgent = time.days < 30
  const cellBase = `flex flex-col items-center justify-center rounded-md border px-2.5 py-1.5 min-w-[44px]`
  const cellColor = isUrgent
    ? 'bg-red-50 border-red-200'
    : 'bg-slate-50 border-slate-200'
  const numColor = isUrgent ? 'text-red-600' : 'text-slate-900'

  return (
    <div className="flex gap-1.5 shrink-0" aria-label={`${time.days} يوم ${time.hours} ساعة`}>
      <div className={`${cellBase} ${cellColor}`}>
        <span className={`text-lg font-bold tabular-nums leading-none ${numColor}`}>
          {String(time.days).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">يوم</span>
      </div>
      <div className={`${cellBase} ${cellColor}`}>
        <span className={`text-lg font-bold tabular-nums leading-none ${numColor}`}>
          {String(time.hours).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">ساعة</span>
      </div>
      <div className={`${cellBase} ${cellColor}`}>
        <span className={`text-lg font-bold tabular-nums leading-none ${numColor}`}>
          {String(time.minutes).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">دقيقة</span>
      </div>
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
  return (
    <article className="bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-lg leading-none" aria-hidden="true">{s.flag}</span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">
              {s.country}
            </span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-sm">
              {s.level}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-snug mb-0.5">
            {s.title}
          </h2>
          <p className="text-xs text-slate-500">{s.subtitle}</p>
        </div>
        <Countdown deadline={s.deadline} />
      </div>

      {/* Body */}
      <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
        {/* Benefits */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            المزايا والتغطية
          </p>
          <div className="flex flex-wrap gap-1.5">
            {s.benefit_tags.map((tag) => (
              <BenefitPill key={tag} label={tag} />
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            شروط التقديم
          </p>
          <ul className="space-y-1.5">
            {s.requirements.map((req, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-slate-500">
            التخصص:{' '}
            <span className="font-medium text-slate-700">{s.field}</span>
          </p>
          <p className="text-xs text-slate-500">
            آخر موعد للتقديم:{' '}
            <span className="font-semibold text-slate-800">{s.deadline}</span>
          </p>
        </div>
        <a
          href={s.official_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-center text-sm font-semibold px-6 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-md transition-colors shrink-0"
        >
          تفاصيل المنحة والتقديم
        </a>
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
                ? 'bg-slate-900 text-white border-slate-900'
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

export default function ScholarshipsGrid({
  scholarships,
}: {
  scholarships: Scholarship[]
}) {
  const [levelFilter, setLevelFilter]     = useState('الكل')
  const [countryFilter, setCountryFilter] = useState('الكل')

  const levels    = ['الكل', ...Array.from(new Set(scholarships.map((s) => s.level)))]
  const countries = ['الكل', ...Array.from(new Set(scholarships.map((s) => s.country)))]

  const visible = scholarships
    .filter((s) => levelFilter   === 'الكل' || s.level   === levelFilter)
    .filter((s) => countryFilter === 'الكل' || s.country === countryFilter)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  return (
    <div className="space-y-6">
      {/* Level filter */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-400">المستوى الدراسي</p>
        <FilterChips
          options={levels}
          active={levelFilter}
          onChange={setLevelFilter}
          label="تصفية حسب المستوى الدراسي"
        />
      </div>

      {/* Country filter */}
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

      {/* Results */}
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
