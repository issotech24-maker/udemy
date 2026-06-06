'use client'

import { useState } from 'react'

export type Coupon = {
  id: string
  title: string
  description: string
  instructor: string
  category: string
  rating: number
  coupon_code: string
  current_price: number
  expires_at: string
  is_verified: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  'برمجة':         'bg-blue-50   text-blue-700   border-blue-200',
  'تطوير الويب':   'bg-violet-50 text-violet-700 border-violet-200',
  'ذكاء اصطناعي': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'قواعد البيانات':'bg-amber-50  text-amber-700  border-amber-200',
  'تصميم':         'bg-pink-50   text-pink-700   border-pink-200',
  'تسويق':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'أعمال':         'bg-slate-100 text-slate-700  border-slate-200',
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const empty = 5 - Math.ceil(rating)
  const half  = 5 - full - empty

  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating} / 5`}>
      {Array.from({ length: full  }).map((_, i) => (
        <span key={`f-${i}`} className="text-amber-400 text-xs leading-none">★</span>
      ))}
      {Array.from({ length: half  }).map((_, i) => (
        <span key={`h-${i}`} className="text-amber-300 text-xs leading-none">★</span>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e-${i}`} className="text-slate-300 text-xs leading-none">★</span>
      ))}
      <span className="text-xs text-slate-500 ms-1 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  )
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const categoryStyle =
    CATEGORY_COLORS[coupon.category] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <article className="bg-white border border-slate-200 rounded-md flex flex-col hover:border-slate-300 transition-colors overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <span
          className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${categoryStyle}`}
        >
          {coupon.category}
        </span>
        {coupon.is_verified && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="6" fill="currentColor" opacity=".15" />
              <path d="M3.5 6l1.8 1.8L8.5 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            موثّق
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pb-4 flex flex-col gap-2 flex-1">
        <h2 className="text-sm font-semibold text-slate-900 leading-snug">
          {coupon.title}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {coupon.description}
        </p>
        <p className="text-xs text-slate-400">{coupon.instructor}</p>
        <StarRating rating={coupon.rating} />
      </div>

      {/* Footer */}
      <div className="px-5 pb-3 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
        <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-sm select-all tracking-wide">
          {coupon.coupon_code}
        </code>
        <span className="text-xs text-slate-400 shrink-0">ينتهي {coupon.expires_at}</span>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <a
          href="#"
          className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors"
        >
          احصل على الكورس مجاناً
        </a>
      </div>
    </article>
  )
}

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

export default function CouponsGrid({ coupons }: { coupons: Coupon[] }) {
  const [active, setActive] = useState('الكل')

  const categories = ['الكل', ...Array.from(new Set(coupons.map((c) => c.category)))]

  const visible =
    active === 'الكل' ? coupons : coupons.filter((c) => c.category === active)

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
        {active !== 'الكل' ? ` في فئة "${active}"` : ' نشط'}
      </p>
    </div>
  )
}
