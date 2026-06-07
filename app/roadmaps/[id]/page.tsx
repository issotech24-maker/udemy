import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { RoadmapRecord, RoadmapStep } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ─── SEO ─────────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = createSupabaseAdmin()
    const { data } = await supabase
      .from('roadmaps')
      .select('title, description, category, associated_keywords')
      .eq('id', id)
      .single()
    if (data) {
      return {
        title: data.title + ' – خارطة الطريق – UdemyRadar',
        description: data.description ?? 'مسار مهني تقني مفصّل مرتبط بكوبونات الدورات النشطة',
        keywords: (data.associated_keywords ?? []).join(', '),
        openGraph: {
          title: data.title,
          description: data.description ?? undefined,
        },
      }
    }
  } catch {}
  return { title: 'خارطة الطريق – UdemyRadar' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUrlLike(s: string): boolean {
  return s.includes('://') || s.startsWith('www.')
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SmartCoupon = {
  id: string
  title: string
  category: string | null
  rating: number | null
  coupon_code: string | null
  expires_at: string | null
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ steps }: { steps: RoadmapStep[] }) {
  return (
    <div>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-5">
          <div className="flex flex-col items-center w-8 shrink-0">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center shrink-0 z-10 relative">
              <span className="text-xs font-bold text-slate-600 tabular-nums leading-none">{i + 1}</span>
            </div>
            {i < steps.length - 1 && <div className="w-px bg-slate-200 flex-1 mt-1" />}
          </div>
          <div className={`flex-1 ${i < steps.length - 1 ? 'pb-5' : ''}`}>
            <div className="bg-white border border-slate-200 rounded-md p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{step.phase}</span>
                <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-sm shrink-0 whitespace-nowrap">{step.duration}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mb-2.5">{step.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {step.skills.map((skill) => (
                  <span key={skill} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RoadmapPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createSupabaseAdmin()

  const { data: rawRoadmap } = await supabase
    .from('roadmaps')
    .select('id, title, description, category, steps, associated_keywords, created_at')
    .eq('id', id)
    .single()

  if (!rawRoadmap) return notFound()

  const rm = rawRoadmap as RoadmapRecord
  const kws: string[] = rm.associated_keywords ?? []

  // Smart coupon query: find active coupons matching any roadmap keyword in title or category
  let smartCoupons: SmartCoupon[] = []
  if (kws.length > 0) {
    const filter = kws
      .flatMap((kw) => ['title.ilike.%' + kw + '%', 'category.ilike.%' + kw + '%'])
      .join(',')
    const { data: couponsData } = await supabase
      .from('coupons')
      .select('id, title, category, rating, coupon_code, expires_at')
      .or(filter)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(6)
    smartCoupons = (couponsData ?? []) as SmartCoupon[]
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Back */}
      <Link
        href="/roadmaps"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 4L6 8l4 4" />
        </svg>
        جميع المسارات
      </Link>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {rm.category && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">
              {rm.category}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{rm.title}</h1>
        {rm.description && (
          <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{rm.description}</p>
        )}
        {kws.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {kws.map((kw) => (
              <span key={kw} className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-5">مراحل المسار</h2>
        <Timeline steps={rm.steps ?? []} />
      </section>

      {/* Smart coupons */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900">دورات مرتبطة بهذا المسار</h2>
          <Link href="/coupons" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
            عرض الكل ←
          </Link>
        </div>

        {smartCoupons.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-md py-10 text-center">
            <p className="text-sm text-slate-400">
              لا توجد دورات مرتبطة حالياً – ستظهر تلقائياً بعد إضافة كوبونات تتطابق مع كلمات المسار
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartCoupons.map((coupon) => {
              const displayCode =
                coupon.coupon_code && !isUrlLike(coupon.coupon_code)
                  ? coupon.coupon_code
                  : null
              return (
                <Link
                  key={coupon.id}
                  href={'/coupons/' + coupon.id}
                  className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-2.5 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between gap-2">
                    {coupon.category && (
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm truncate">
                        {coupon.category}
                      </span>
                    )}
                    {coupon.rating !== null && (
                      <span className="text-xs text-amber-500 shrink-0">★ {coupon.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-slate-600 transition-colors">
                    {coupon.title}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                    {displayCode ? (
                      <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm">
                        {displayCode}
                      </code>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">مجاني 100%</span>
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

    </div>
  )
}
