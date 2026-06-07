'use client'

import { useState, useEffect } from 'react'

// Matches Supabase scholarships table schema
export type Scholarship = {
  id: string
  title: string
  description: string | null
  country: string | null
  deadline: string | null
  requirements: string | null   // pipe-separated text from AI
  benefits: string | null       // pipe-separated text from AI
  official_link: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseList(text: string | null): string[] {
  if (!text) return []
  return text.split('|').map((s) => s.trim()).filter(Boolean)
}

const COUNTRY_FLAGS: Record<string, string> = {
  'ألمانيا':               '🇩🇪',
  'الولايات المتحدة':      '🇺🇸',
  'المملكة المتحدة':       '🇬🇧',
  'تركيا':                 '🇹🇷',
  'اليابان':               '🇯🇵',
  'كوريا الجنوبية':        '🇰🇷',
  'أستراليا':              '🇦🇺',
  'سويسرا':                '🇨🇭',
  'المجر':                 '🇭🇺',
  'كندا':                  '🇨🇦',
  'فرنسا':                 '🇫🇷',
  'هولندا':                '🇳🇱',
  'السويد':                '🇸🇪',
  'النرويج':               '🇳🇴',
  'الدنمارك':              '🇩🇰',
  'النمسا':                '🇦🇹',
  'بلجيكا':               '🇧🇪',
  'إيطاليا':               '🇮🇹',
  'إسبانيا':               '🇪🇸',
  'البرتغال':              '🇵🇹',
  'الصين':                 '🇨🇳',
  'روسيا':                 '🇷🇺',
  'أيرلندا':               '🇮🇪',
  'نيوزيلندا':             '🇳🇿',
  'سنغافورة':              '🇸🇬',
  'الإمارات':              '🇦🇪',
  'مصر':                   '🇪🇬',
  'المغرب':                '🇲🇦',
}

function countryFlag(country: string | null): string {
  if (!country) return '🌍'
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.includes(key)) return flag
  }
  return '🌍'
}

// ─── Countdown ────────────────────────────────────────────────────────────────

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

// ─── Detail modal ─────────────────────────────────────────────────────────────

function ScholarshipModal({ s, onClose }: { s: Scholarship; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const benefits     = parseList(s.benefits)
  const requirements = parseList(s.requirements)
  const flag         = countryFlag(s.country)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 180)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={s.title}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 transition-all duration-200 ${
        visible ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-xl bg-white rounded-lg shadow-2xl transition-all duration-200 overflow-hidden max-h-[90vh] flex flex-col ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xl leading-none">{flag}</span>
              {s.country && (
                <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">
                  {s.country}
                </span>
              )}
              {s.deadline && (
                <span className="text-xs font-medium text-slate-500">
                  آخر موعد: <span className="font-semibold text-slate-700">{s.deadline.slice(0, 10)}</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{s.title}</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="إغلاق"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {s.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
          )}

          {benefits.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                المزايا والتغطية
              </p>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((b) => <BenefitPill key={b} label={b} />)}
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

          {s.deadline && (
            <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 flex items-center gap-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-slate-500">آخر موعد للتقديم</p>
                <p className="text-sm font-bold text-slate-900">{s.deadline.slice(0, 10)}</p>
              </div>
              {s.deadline && <Countdown deadline={s.deadline} />}
            </div>
          )}
        </div>

        {/* CTA footer */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 shrink-0">
          {s.official_link ? (
            <a
              href={s.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-bold rounded-md transition-colors"
            >
              تفاصيل المنحة والتقديم
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3H3.5A1.5 1.5 0 002 4.5v8A1.5 1.5 0 003.5 14h8A1.5 1.5 0 0013 12.5V10M9 2h5m0 0v5m0-5L8 8" />
              </svg>
            </a>
          ) : (
            <p className="text-xs text-slate-400 text-center">الرابط الرسمي غير متوفر حالياً</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Scholarship card ─────────────────────────────────────────────────────────

function ScholarshipCard({ s, onOpen }: { s: Scholarship; onOpen: () => void }) {
  const flag         = countryFlag(s.country)
  const benefits     = parseList(s.benefits)
  const requirements = parseList(s.requirements)

  return (
    <article className="bg-white border border-slate-200 rounded-md hover:border-slate-300 hover:shadow-sm transition-all duration-150 overflow-hidden">
      {/* Header — clickable */}
      <button
        onClick={onOpen}
        className="w-full text-start px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start gap-4 group"
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
            انقر للتفاصيل الكاملة
          </span>
        </div>
        {s.deadline && <Countdown deadline={s.deadline} />}
      </button>

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
                  +{requirements.length - 3} شروط إضافية — انقر للمزيد
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
            className="inline-block text-center text-sm font-semibold px-6 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-md transition-colors shrink-0"
          >
            تفاصيل المنحة والتقديم
          </a>
        ) : (
          <button
            onClick={onOpen}
            className="inline-block text-center text-sm font-semibold px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors shrink-0"
          >
            تفاصيل المنحة
          </button>
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

export default function ScholarshipsGrid({ scholarships }: { scholarships: Scholarship[] }) {
  const [countryFilter, setCountryFilter] = useState('الكل')
  const [selected, setSelected]           = useState<Scholarship | null>(null)

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
    <>
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
              <ScholarshipCard key={s.id} s={s} onOpen={() => setSelected(s)} />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center pt-2">
          عرض {visible.length} من {scholarships.length} منحة
        </p>
      </div>

      {selected && (
        <ScholarshipModal s={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
