import { notFound }          from 'next/navigation'
import Link                  from 'next/link'
import type { Metadata }     from 'next'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Coupon }       from '../CouponsGrid'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  if (!url) return '#'
  let decoded = url
  try { decoded = decodeURIComponent(url) } catch { decoded = url }
  decoded = decoded.replace(/([^:])\/\/+/g, '$1/')
  if (/^https?:\/\//i.test(decoded)) return decoded
  return `https://${decoded}`
}

function isUrlLike(s: string): boolean {
  return /^https?:\/\//i.test(s) || /^www\./i.test(s)
}

function extractKeywords(title: string, category: string | null): string {
  const words = title.split(/\s+/).filter((w) => w.length > 2).slice(0, 8)
  const base  = ['يوديمي', 'كوبون مجاني', 'دورة مجانية', 'تعلم مجاني', 'Udemy coupon']
  return [...words, ...(category ? [category] : []), ...base].join(', ')
}

async function fetchCoupon(id: string): Promise<Coupon | null> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('coupons')
      .select('id, title, description, url, category, rating, current_price, instructor, coupon_code, is_verified, expires_at')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as Coupon
  } catch {
    return null
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const coupon  = await fetchCoupon(id)
  if (!coupon) return { title: 'كوبون غير موجود – UdemyRadar' }

  const description = coupon.description && !isUrlLike(coupon.description)
    ? coupon.description.slice(0, 155)
    : `احصل على دورة "${coupon.title}" مجاناً أو بخصم كبير عبر كوبون يوديمي`

  return {
    title:       `${coupon.title} – UdemyRadar`,
    description,
    keywords:    extractKeywords(coupon.title, coupon.category),
    openGraph: {
      title:       coupon.title,
      description,
      type:        'website',
      siteName:    'UdemyRadar',
    },
  }
}

// ─── Star rating (server-side) ────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const half  = rating % 1 >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating} / 5`}>
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} className="text-amber-400 text-sm">★</span>)}
      {Array.from({ length: half  }).map((_, i) => <span key={`h${i}`} className="text-amber-300 text-sm">★</span>)}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-slate-300 text-sm">★</span>)}
      <span className="text-xs text-slate-500 ms-1 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CouponPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params
  const coupon   = await fetchCoupon(id)
  if (!coupon) notFound()

  const safeUrl     = normalizeUrl(coupon.url)
  const displayCode = coupon.coupon_code && !isUrlLike(coupon.coupon_code)
    ? coupon.coupon_code
    : null
  const displayDesc = coupon.description && !isUrlLike(coupon.description)
    ? coupon.description
    : null

  const CATEGORY_COLORS: Record<string, string> = {
    'برمجة':          'bg-blue-50   text-blue-700   border-blue-200',
    'تطوير الويب':    'bg-violet-50 text-violet-700 border-violet-200',
    'ذكاء اصطناعي':  'bg-indigo-50 text-indigo-700 border-indigo-200',
    'قواعد البيانات': 'bg-amber-50  text-amber-700  border-amber-200',
    'تصميم':          'bg-pink-50   text-pink-700   border-pink-200',
    'تسويق':          'bg-emerald-50 text-emerald-700 border-emerald-200',
    'أعمال':          'bg-slate-100 text-slate-700  border-slate-200',
  }
  const catStyle = CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/coupons"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-8"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        كل الكوبونات
      </Link>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {coupon.category && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${catStyle}`}>
                {coupon.category}
              </span>
            )}
            {coupon.is_verified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                <span className="relative flex w-2 h-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
                </span>
                Verified · نشط
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug mb-2">{coupon.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {coupon.instructor && <span>{coupon.instructor}</span>}
            {coupon.rating !== null && (
              <Stars rating={coupon.rating} />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {displayDesc && (
            <p className="text-sm text-slate-600 leading-relaxed">{displayDesc}</p>
          )}

          {/* Coupon code */}
          {displayCode && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">كود الخصم</p>
              <code className="block w-full text-center text-base font-mono font-bold bg-slate-50 text-slate-800 px-4 py-4 rounded-md select-all tracking-widest border border-slate-200">
                {displayCode}
              </code>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">انقر على الكود لتحديده ثم انسخه</p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-5">
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
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2">
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-md transition-colors"
          >
            احصل على الكورس مجاناً
            <svg viewBox="0 0 16 16" className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            سيتم فتح صفحة الكورس على Udemy في تبويب جديد
          </p>
        </div>
      </div>
    </div>
  )
}