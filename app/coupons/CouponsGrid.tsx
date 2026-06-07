'use client'

import { useState, useEffect } from 'react'

// Matches Supabase coupons table schema
export type Coupon = {
  id: string
  title: string
  description: string | null
  url: string
  category: string | null
  rating: number | null
  current_price: number
  instructor: string | null
  coupon_code: string | null
  is_verified: boolean
  expires_at: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'برمجة':          'bg-blue-50   text-blue-700   border-blue-200',
  'تطوير الويب':    'bg-violet-50 text-violet-700 border-violet-200',
  'ذكاء اصطناعي':  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'قواعد البيانات': 'bg-amber-50  text-amber-700  border-amber-200',
  'تصميم':          'bg-pink-50   text-pink-700   border-pink-200',
  'تسويق':          'bg-emerald-50 text-emerald-700 border-emerald-200',
  'أعمال':          'bg-slate-100 text-slate-700  border-slate-200',
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const empty = 5 - Math.ceil(rating)
  const half  = 5 - full - empty
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating} / 5`}>
      {Array.from({ length: full  }).map((_, i) => <span key={`f-${i}`} className="text-amber-400 text-xs">★</span>)}
      {Array.from({ length: half  }).map((_, i) => <span key={`h-${i}`} className="text-amber-300 text-xs">★</span>)}
      {Array.from({ length: empty }).map((_, i) => <span key={`e-${i}`} className="text-slate-300 text-xs">★</span>)}
      <span className="text-xs text-slate-500 ms-1 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Verified badge ───────────────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
      <span className="relative flex w-2 h-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
      </span>
      Verified&nbsp;&middot;&nbsp;نشط
    </span>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function CouponModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

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

  const catStyle =
    CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={coupon.title}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 transition-all duration-200 ${
        visible ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-white rounded-lg shadow-2xl transition-all duration-200 overflow-hidden ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            {coupon.category && (
              <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-sm border mb-2 ${catStyle}`}>
                {coupon.category}
              </span>
            )}
            <h2 className="text-base font-bold text-slate-900 leading-snug">{coupon.title}</h2>
            {coupon.instructor && (
              <p className="text-xs text-slate-500 mt-1">{coupon.instructor}</p>
            )}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {coupon.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{coupon.description}</p>
          )}

          <div className="flex flex-wrap gap-5">
            {coupon.rating !== null && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">التقييم</p>
                <StarRating rating={coupon.rating} />
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">السعر</p>
              <span className="text-sm font-bold text-emerald-600">
                {coupon.current_price === 0 ? 'مجاني 100%' : `$${coupon.current_price}`}
              </span>
            </div>
            {coupon.expires_at && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">ينتهي في</p>
                <span className="text-sm text-slate-700">{coupon.expires_at.slice(0, 10)}</span>
              </div>
            )}
          </div>

          {coupon.coupon_code && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">كود الخصم</p>
              <code className="block w-full text-center text-sm font-mono font-bold bg-slate-50 text-slate-800 px-4 py-3 rounded-md select-all tracking-widest border border-slate-200">
                {coupon.coupon_code}
              </code>
              <p className="text-[10px] text-slate-400 text-center mt-1">انقر لتحديد الكود ثم انسخه</p>
            </div>
          )}

          {coupon.is_verified && (
            <div className="flex justify-center pt-1">
              <VerifiedBadge />
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2">
          <a
            href={coupon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-md transition-colors"
          >
            احصل على الكورس مجاناً
            <svg viewBox="0 0 16 16" className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Coupon card ──────────────────────────────────────────────────────────────

function CouponCard({ coupon, onOpen }: { coupon: Coupon; onOpen: () => void }) {
  const catStyle =
    CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <article className="bg-white border border-slate-200 rounded-md flex flex-col hover:border-slate-300 hover:shadow-sm transition-all duration-150 overflow-hidden h-full group">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        {coupon.category ? (
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${catStyle}`}>
            {coupon.category}
          </span>
        ) : (
          <span />
        )}
        {coupon.is_verified && <VerifiedBadge />}
      </div>

      {/* Body — click opens modal */}
      <button
        onClick={onOpen}
        className="flex-1 px-5 pb-4 flex flex-col gap-2 text-start w-full"
      >
        <h2 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-slate-700 transition-colors">
          {coupon.title}
        </h2>
        {coupon.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{coupon.description}</p>
        )}
        {coupon.instructor && (
          <p className="text-xs text-slate-400">{coupon.instructor}</p>
        )}
        {coupon.rating !== null && <StarRating rating={coupon.rating} />}
        <span className="text-[10px] text-slate-400 mt-auto pt-1 underline underline-offset-2 decoration-dotted">
          انقر للتفاصيل
        </span>
      </button>

      {/* Code + expiry row */}
      <div className="px-5 pb-3 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
        {coupon.coupon_code ? (
          <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-sm select-all tracking-wide">
            {coupon.coupon_code}
          </code>
        ) : <span />}
        {coupon.expires_at && (
          <span className="text-xs text-slate-400 shrink-0">
            ينتهي {coupon.expires_at.slice(0, 10)}
          </span>
        )}
      </div>

      {/* Direct CTA */}
      <div className="px-5 pb-5">
        <a
          href={coupon.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors"
        >
          احصل على الكورس مجاناً
        </a>
      </div>
    </article>
  )
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

function FilterChips({
  categories,
  active,
  onChange,
}: {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية حسب الفئة">
      {categories.map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            aria-pressed={isActive}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              isActive
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export default function CouponsGrid({ coupons }: { coupons: Coupon[] }) {
  const [active, setActive]     = useState('الكل')
  const [selected, setSelected] = useState<Coupon | null>(null)

  const categories = [
    'الكل',
    ...Array.from(new Set(coupons.map((c) => c.category ?? 'أخرى'))),
  ]

  const visible =
    active === 'الكل'
      ? coupons
      : coupons.filter((c) => (c.category ?? 'أخرى') === active)

  if (coupons.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-400">لا توجد كوبونات حالياً — سيتم التحديث تلقائياً كل 6 ساعات</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-7">
        <FilterChips categories={categories} active={active} onChange={setActive} />

        {visible.length === 0 ? (
          <p
            key={`empty-${active}`}
            className="text-sm text-slate-400 py-10 text-center animate-fade-in-up"
          >
            لا توجد كوبونات في هذه الفئة حالياً
          </p>
        ) : (
          <div
            key={active}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {visible.map((coupon, i) => (
              <div
                key={coupon.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CouponCard coupon={coupon} onOpen={() => setSelected(coupon)} />
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center">
          {visible.length} كوبون
          {active !== 'الكل' ? ` في فئة "${active}"` : ' نشط'}
        </p>
      </div>

      {selected && (
        <CouponModal coupon={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
