'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  'برمجة':          'bg-blue-50   text-blue-700   border-blue-100',
  'تطوير الويب':    'bg-violet-50 text-violet-700 border-violet-100',
  'ذكاء اصطناعي':  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'قواعد البيانات': 'bg-amber-50  text-amber-700  border-amber-100',
  'تصميم':          'bg-pink-50   text-pink-700   border-pink-100',
  'تسويق':          'bg-emerald-50 text-emerald-700 border-emerald-100',
  'أعمال':          'bg-slate-50  text-slate-700  border-slate-200',
}

function isUrlLike(s: string): boolean {
  return s.includes('://') || s.startsWith('www.')
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const empty = 5 - Math.ceil(rating)
  const half  = 5 - full - empty
  return (
    <span className="inline-flex items-center gap-0.5" title={rating + ' / 5'}>
      {Array.from({ length: full  }).map((_, i) => <span key={'f' + i} className="text-amber-400 text-xs">★</span>)}
      {Array.from({ length: half  }).map((_, i) => <span key={'h' + i} className="text-amber-300 text-xs">★</span>)}
      {Array.from({ length: empty }).map((_, i) => <span key={'e' + i} className="text-slate-200 text-xs">★</span>)}
      <span className="text-xs text-slate-500 ms-1 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Verified badge (no ping animation) ──────────────────────────────────────

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      نشط
    </span>
  )
}

// ─── Coupon card ──────────────────────────────────────────────────────────────

function CouponCard({ coupon }: { coupon: Coupon }) {
  const catStyle = CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-50 text-slate-600 border-slate-200'
  const displayDescription = coupon.description && !isUrlLike(coupon.description) ? coupon.description : null
  const displayCode        = coupon.coupon_code  && !isUrlLike(coupon.coupon_code)  ? coupon.coupon_code  : null

  return (
    <Link
      href={'/coupons/' + coupon.id}
      className="flex flex-col bg-white border border-slate-200 rounded-md overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all duration-150 h-full group"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        {coupon.category ? (
          <span className={'inline-block text-xs font-semibold px-2.5 py-0.5 rounded-sm border ' + catStyle}>
            {coupon.category}
          </span>
        ) : <span />}
        {coupon.is_verified && <VerifiedBadge />}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-slate-700 transition-colors">
          {coupon.title}
        </h2>
        {displayDescription && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{displayDescription}</p>
        )}
        {coupon.instructor && (
          <p className="text-xs text-slate-400">{coupon.instructor}</p>
        )}
        {coupon.rating !== null && <StarRating rating={coupon.rating} />}
        <span className="text-xs font-semibold text-blue-600 mt-auto pt-1">
          عرض التفاصيل ←
        </span>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
        {displayCode ? (
          <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-sm select-all tracking-wide">
            {displayCode}
          </code>
        ) : (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm">
            مجاني 100%
          </span>
        )}
        {coupon.expires_at && (
          <span className="text-xs text-slate-400 shrink-0">
            ينتهي {coupon.expires_at.slice(0, 10)}
          </span>
        )}
      </div>
    </Link>
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
            className={
              'px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors ' +
              (isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300')
            }
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
  const [active, setActive] = useState('الكل')

  const categories = [
    'الكل',
    ...Array.from(new Set(coupons.map((c) => c.category ?? 'أخرى'))),
  ]

  const visible = active === 'الكل'
    ? coupons
    : coupons.filter((c) => (c.category ?? 'أخرى') === active)

  if (coupons.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-400">لا توجد كوبونات حالياً — سيتم التحديث تلقائياً مرة يومياً</p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <FilterChips categories={categories} active={active} onChange={setActive} />

      {visible.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">
          لا توجد كوبونات في هذه الفئة حالياً
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        {visible.length} كوبون
        {active !== 'الكل' ? ' في فئة "' + active + '"' : ' نشط'}
      </p>
    </div>
  )
}
