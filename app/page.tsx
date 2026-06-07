import Link                  from 'next/link'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ─── Types (minimal slices used on the homepage) ──────────────────────────────

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
  return /^https?:\/\//i.test(s) || /^www\./i.test(s)
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000))
}

function firstBenefit(benefits: string | null): string {
  if (!benefits) return ''
  return benefits.split('|')[0].trim()
}

const CATEGORY_COLORS: Record<string, string> = {
  'برمجة':          'bg-blue-50   text-blue-700',
  'تطوير الويب':    'bg-violet-50 text-violet-700',
  'ذكاء اصطناعي':  'bg-indigo-50 text-indigo-700',
  'قواعد البيانات': 'bg-amber-50  text-amber-700',
  'تصميم':          'bg-pink-50   text-pink-700',
  'تسويق':          'bg-emerald-50 text-emerald-700',
  'أعمال':          'bg-slate-100 text-slate-700',
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

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchHomeData() {
  try {
    const supabase = createSupabaseAdmin()

    const [
      { data: coupons },
      { data: scholarships },
      { count: couponCount },
      { count: scholarshipCount },
    ] = await Promise.all([
      supabase
        .from('coupons')
        .select('id, title, category, rating, instructor, coupon_code, expires_at')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('scholarships')
        .select('id, title, country, deadline, benefits')
        .order('deadline', { ascending: true })
        .limit(4),
      supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('scholarships')
        .select('*', { count: 'exact', head: true }),
    ])

    return {
      coupons:         (coupons ?? []) as HomeCoupon[],
      scholarships:    (scholarships ?? []) as HomeScholarship[],
      couponCount:     couponCount ?? 0,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="text-center py-12 border border-slate-200 rounded-md bg-white">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
          منصة ذكية للطلاب العرب
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
          UdemyRadar
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-6">
          كوبونات يوديمي المجانية · منح دراسية · أدوات ذكاء اصطناعي للتوظيف ·
          خارطة الطريق المهنية
        </p>

        {/* Dynamic counts */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {couponCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
              </span>
              {couponCount}+ كوبون نشط
            </span>
          )}
          {scholarshipCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              🎓 {scholarshipCount}+ منحة دراسية
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/coupons"
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
          >
            استعرض الكوبونات
          </Link>
          <Link
            href="/scholarships"
            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
          >
            المنح الدراسية
          </Link>
        </div>
      </section>

      {/* ── Latest Coupons ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">أحدث الكوبونات المجانية</h2>
          <Link href="/coupons" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            عرض الكل ←
          </Link>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-md">
            <p className="text-sm text-slate-400">يتم تحميل الكوبونات — سيتم التحديث تلقائياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coupons.map((coupon) => {
              const catStyle = CATEGORY_COLORS[coupon.category ?? ''] ?? 'bg-slate-100 text-slate-600'
              const displayCode = coupon.coupon_code && !isUrlLike(coupon.coupon_code)
                ? coupon.coupon_code
                : null
              return (
                <Link
                  key={coupon.id}
                  href={`/coupons/${coupon.id}`}
                  className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    {coupon.category ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${catStyle}`}>
                        {coupon.category}
                      </span>
                    ) : <span />}
                    {coupon.rating !== null && (
                      <span className="text-xs text-amber-500">★ {coupon.rating.toFixed(1)}</span>
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
                      <span className="text-xs font-semibold text-emerald-600">مجاني 100%</span>
                    )}
                    {coupon.expires_at && (
                      <span className="text-xs text-slate-400">
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

      {/* ── Upcoming Scholarships ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">منح دراسية قادمة</h2>
          <Link href="/scholarships" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            عرض الكل ←
          </Link>
        </div>

        {scholarships.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-md">
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
                  href={`/scholarships/${s.id}`}
                  className="bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                      <span>{flag}</span>
                      {s.country ?? 'دولي'}
                    </span>
                    {days !== null && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm shrink-0 ${
                        isUrgent
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
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
                    <p className="text-xs text-slate-400 mt-auto">آخر موعد: {s.deadline.slice(0, 10)}</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Quick nav cards ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">استكشف المنصة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: '/coupons',
              title: 'كوبونات يوديمي',
              desc: 'كوبونات مجانية ومخفضة يتم تحديثها تلقائياً من مصادر حية',
              icon: '🎟',
            },
            {
              href: '/scholarships',
              title: 'المنح الدراسية',
              desc: 'تتبع مواعيد التقديم والشروط والمزايا لمئات المنح الدولية',
              icon: '🎓',
            },
            {
              href: '/career',
              title: 'أدوات التوظيف الذكية',
              desc: 'توليد خطابات تغطية وتحليل السيرة الذاتية بالذكاء الاصطناعي',
              icon: '📄',
            },
            {
              href: '/roadmaps',
              title: 'خارطة الطريق المهنية',
              desc: 'مسارات مهنية مفصّلة مرتبطة بكوبونات الدورات النشطة',
              icon: '🗺',
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-slate-200 rounded-md p-5 hover:border-slate-300 transition-colors group"
            >
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-slate-700">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}