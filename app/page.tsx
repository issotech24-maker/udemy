import Link from 'next/link'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type HomeCoupon = {
  id: string
  title: string
  category: string | null
  rating: number | null
  instructor: string | null
  coupon_code: string | null
  expires_at: string | null
}

type HomeScholarship = {
  id: string
  title: string
  country: string | null
  deadline: string | null
  benefits: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUrlLike(s: string): boolean {
  return s.includes('://') || s.startsWith('www.')
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000))
}

function firstBenefit(benefits: string | null): string {
  if (!benefits) return ''
  return benefits.split('|')[0].trim()
}

const CATEGORY_COLORS: Record<string, string> = {
  'برمجة':          'bg-blue-50   text-blue-700   border border-blue-100',
  'تطوير الويب':    'bg-violet-50 text-violet-700 border border-violet-100',
  'ذكاء اصطناعي':  'bg-indigo-50 text-indigo-700 border border-indigo-100',
  'قواعد البيانات': 'bg-amber-50  text-amber-700  border border-amber-100',
  'تصميم':          'bg-pink-50   text-pink-700   border border-pink-100',
  'تسويق':          'bg-emerald-50 text-emerald-700 border border-emerald-100',
  'أعمال':          'bg-slate-50  text-slate-700  border border-slate-200',
}

const COUNTRY_FLAGS: Record<string, string> = {
  'ألمانيا': '🇩🇪', 'الولايات المتحدة': '🇺🇸', 'المملكة المتحدة': '🇬🇧',
  'تركيا': '🇹🇷', 'اليابان': '🇯🇵', 'أستراليا': '🇦🇺', 'سويسرا': '🇨🇭',
  'كندا': '🇨🇦', 'فرنسا': '🇫🇷', 'هولندا': '🇳🇱', 'السويد': '🇸🇪',
  'الإمارات': '🇦🇪', 'مصر': '🇪🇬', 'المغرب': '🇲🇦', 'سنغافورة': '🇸🇬',
}

function countryFlag(country: string | null): string {
  if (!country) return '🌍'
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.includes(key)) return flag
  }
  return '🌍'
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchHomeData() {
  try {
    const supabase = createSupabaseAdmin()
    const now = new Date().toISOString()
    const [
      { data: coupons },
      { data: scholarships },
      { count: couponCount },
      { count: scholarshipCount },
    ] = await Promise.all([
      supabase
        .from('coupons')
        .select('id, title, category, rating, instructor, coupon_code, expires_at')
        .or('expires_at.is.null,expires_at.gt.' + now)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('scholarships')
        .select('id, title, country, deadline, benefits')
        .or('deadline.is.null,deadline.gt.' + now)
        .order('deadline', { ascending: true })
        .limit(4),
      supabase.from('coupons').select('*', { count: 'exact', head: true }),
      supabase.from('scholarships').select('*', { count: 'exact', head: true }),
    ])
    return {
      coupons:          (coupons      ?? []) as HomeCoupon[],
      scholarships:     (scholarships ?? []) as HomeScholarship[],
      couponCount:      couponCount      ?? 0,
      scholarshipCount: scholarshipCount ?? 0,
    }
  } catch {
    return { coupons: [], scholarships: [], couponCount: 0, scholarshipCount: 0 }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { coupons, scholarships, couponCount, scholarshipCount } = await fetchHomeData()

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
              منصة مجانية للطلاب العرب
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5">
              تعلّم بذكاء، وفّر المال،
              <br />
              وابنِ مسيرتك المهنية
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto">
              كوبونات يوديمي المجانية · منح دراسية دولية · مسارات مهنية تقنية · أدوات توظيف بالذكاء الاصطناعي
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <Link
                href="/coupons"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-md transition-colors"
              >
                استعرض الكوبونات المجانية
              </Link>
              <Link
                href="/scholarships"
                className="px-6 py-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-md transition-colors"
              >
                المنح الدراسية
              </Link>
            </div>

            {(couponCount > 0 || scholarshipCount > 0) && (
              <div className="flex flex-wrap justify-center gap-6 text-sm border-t border-slate-100 pt-8">
                {couponCount > 0 && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                    <span className="font-semibold tabular-nums">{couponCount}+</span>
                    <span className="text-slate-500">كوبون نشط</span>
                  </div>
                )}
                {scholarshipCount > 0 && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                    <span className="font-semibold tabular-nums">{scholarshipCount}+</span>
                    <span className="text-slate-500">منحة دراسية</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" aria-hidden="true" />
                  <span className="font-semibold">5</span>
                  <span className="text-slate-500">مسار مهني</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── Content sections ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Latest coupons */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">أحدث الكوبونات المجانية</h2>
              <p className="text-sm text-slate-500 mt-0.5">تُحدَّث تلقائياً من مصادر حية</p>
            </div>
            <Link href="/coupons" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              عرض الكل ←
            </Link>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-200 rounded-md bg-white">
              <p className="text-sm text-slate-400">يتم تحميل الكوبونات — سيتم التحديث تلقائياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {coupons.map((coupon) => {
                const catStyle = CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-50 text-slate-600 border border-slate-200'
                const displayCode = coupon.coupon_code && !isUrlLike(coupon.coupon_code)
                  ? coupon.coupon_code
                  : null
                return (
                  <Link
                    key={coupon.id}
                    href={'/coupons/' + coupon.id}
                    className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {coupon.category ? (
                        <span className={'text-xs font-semibold px-2 py-0.5 rounded-sm ' + catStyle}>
                          {coupon.category}
                        </span>
                      ) : <span />}
                      {coupon.rating !== null && (
                        <span className="text-xs font-medium text-amber-600 shrink-0">
                          ★ {coupon.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-slate-600 transition-colors">
                      {coupon.title}
                    </p>
                    {coupon.instructor && (
                      <p className="text-xs text-slate-400">{coupon.instructor}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                      {displayCode ? (
                        <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-sm">
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
              })}
            </div>
          )}
        </section>

        {/* Upcoming scholarships */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">منح دراسية قادمة</h2>
              <p className="text-sm text-slate-500 mt-0.5">مرتبة حسب أقرب موعد للتقديم</p>
            </div>
            <Link href="/scholarships" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              عرض الكل ←
            </Link>
          </div>

          {scholarships.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-slate-200 rounded-md bg-white">
              <p className="text-sm text-slate-400">يتم تحميل المنح — سيتم التحديث تلقائياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scholarships.map((s) => {
                const days     = s.deadline ? daysUntil(s.deadline) : null
                const isUrgent = days !== null && days < 30
                const benefit  = firstBenefit(s.benefits)
                const flag     = countryFlag(s.country)
                return (
                  <Link
                    key={s.id}
                    href={'/scholarships/' + s.id}
                    className="bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-sm">
                        {flag} {s.country ?? 'دولي'}
                      </span>
                      {days !== null && (
                        <span className={
                          'text-xs font-semibold px-2 py-0.5 rounded-sm border shrink-0 ' +
                          (isUrgent
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200')
                        }>
                          {days} يوم
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-slate-600 transition-colors">
                      {s.title}
                    </h3>
                    {benefit && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{benefit}</p>
                    )}
                    {s.deadline && (
                      <p className="text-xs text-slate-400 mt-auto">
                        آخر موعد:{' '}
                        <span className="font-semibold text-slate-600">{s.deadline.slice(0, 10)}</span>
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Platform feature grid */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">استكشف المنصة</h2>
            <p className="text-sm text-slate-500 mt-0.5">كل ما تحتاجه لتطوير مسيرتك المهنية في مكان واحد</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              {
                href:  '/coupons',
                badge: 'كوبون',
                color: 'bg-emerald-100 text-emerald-800',
                title: 'كوبونات يوديمي',
                desc:  'كوبونات مجانية ومخفضة يتم تحديثها تلقائياً من مصادر حية',
              },
              {
                href:  '/scholarships',
                badge: 'منحة',
                color: 'bg-blue-100 text-blue-800',
                title: 'المنح الدراسية',
                desc:  'تتبع مواعيد التقديم والشروط والمزايا لمئات المنح الدولية',
              },
              {
                href:  '/career',
                badge: 'توظيف',
                color: 'bg-violet-100 text-violet-800',
                title: 'أدوات التوظيف الذكية',
                desc:  'توليد خطابات تغطية وتحليل السيرة الذاتية بالذكاء الاصطناعي',
              },
              {
                href:  '/roadmaps',
                badge: 'مسار',
                color: 'bg-amber-100 text-amber-800',
                title: 'خارطة الطريق المهنية',
                desc:  'مسارات مهنية مفصّلة مرتبطة بكوبونات الدورات النشطة',
              },
            ] as const).map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white border border-slate-200 rounded-md p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <span className={'inline-block text-xs font-bold px-2 py-1 rounded-sm mb-3 ' + card.color}>
                  {card.badge}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
