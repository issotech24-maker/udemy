import { notFound }             from 'next/navigation'
import Link                     from 'next/link'
import type { Metadata }        from 'next'
import { createSupabaseAdmin }  from '@/lib/supabase'
import type { Coupon }          from '../CouponsGrid'
import { CopyButton }           from './CopyButton'

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
  const { id }   = await params
  const coupon   = await fetchCoupon(id)
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

// ─── Star rating ──────────────────────────────────────────────────────────────

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

// ─── Category colour map ──────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'برمجة':          'bg-blue-50   text-blue-700   border-blue-200',
  'تطوير الويب':    'bg-violet-50 text-violet-700 border-violet-200',
  'ذكاء اصطناعي':  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'قواعد البيانات': 'bg-amber-50  text-amber-700  border-amber-200',
  'تصميم':          'bg-pink-50   text-pink-700   border-pink-200',
  'تسويق':          'bg-emerald-50 text-emerald-700 border-emerald-200',
  'أعمال':          'bg-slate-100 text-slate-700  border-slate-200',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CouponPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }   = await params
  const coupon   = await fetchCoupon(id)
  if (!coupon) notFound()

  const safeUrl     = normalizeUrl(coupon.url)
  const displayCode = coupon.coupon_code && !isUrlLike(coupon.coupon_code) ? coupon.coupon_code : null
  const displayDesc = coupon.description && !isUrlLike(coupon.description) ? coupon.description : null
  const catStyle    = CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8" aria-label="مسار التنقل">
        <Link href="/coupons" className="hover:text-slate-800 transition-colors">
          كل الكوبونات
        </Link>
        <span className="text-slate-300 select-none" aria-hidden="true">›</span>
        <span className="text-slate-700 line-clamp-1 max-w-xs">{coupon.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Main column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Course header */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {coupon.category && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${catStyle}`}>
                  {coupon.category}
                </span>
              )}
              {coupon.is_verified && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-sm">
                  <span className="relative flex w-1.5 h-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                  </span>
                  كوبون نشط · محقَّق
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-snug mb-4">{coupon.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {coupon.instructor && (
                <span className="text-slate-500">
                  المدرب: <span className="font-medium text-slate-700">{coupon.instructor}</span>
                </span>
              )}
              {coupon.rating !== null && <Stars rating={coupon.rating} />}
            </div>
          </div>

          {/* Description */}
          {displayDesc && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">تفاصيل الدورة</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{displayDesc}</p>
            </div>
          )}

          {/* Coupon code */}
          {displayCode && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">كود الخصم</h2>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-center text-base font-mono font-bold bg-slate-50 text-slate-800 px-4 py-3.5 rounded-md select-all tracking-[0.15em] border border-slate-200">
                  {displayCode}
                </code>
                <CopyButton text={displayCode} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">انقر «نسخ» أو حدِّد الكود يدوياً ثم انسخه</p>
            </div>
          )}

        </div>

        {/* ── Sidebar (1/3) ── */}
        <div className="space-y-5">

          {/* Price + CTA */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">السعر</p>
            <p className="text-3xl font-bold text-emerald-600 mb-5">
              {coupon.current_price === 0 ? 'مجاني 100%' : `$${coupon.current_price}`}
            </p>
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-md transition-colors"
            >
              احصل على الكورس مجاناً
              <svg viewBox="0 0 16 16" className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              سيفتح صفحة الكورس على Udemy في تبويب جديد
            </p>
          </div>

          {/* Offer details */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">تفاصيل العرض</h2>
            <div className="space-y-0 text-sm divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">الحالة</span>
                <span className="font-semibold text-emerald-600">نشط</span>
              </div>
              {coupon.expires_at && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500">ينتهي في</span>
                  <span className="font-semibold text-slate-700 tabular-nums">{coupon.expires_at.slice(0, 10)}</span>
                </div>
              )}
              {coupon.category && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500">الفئة</span>
                  <span className="font-semibold text-slate-700">{coupon.category}</span>
                </div>
              )}
              {coupon.is_verified && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500">التحقق</span>
                  <span className="font-semibold text-emerald-700">محقَّق</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Back link */}
      <div className="mt-10 pt-6 border-t border-slate-200">
        <Link
          href="/coupons"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3L5 8l5 5" />
          </svg>
          العودة إلى كل الكوبونات
        </Link>
      </div>

    </div>
  )
}
