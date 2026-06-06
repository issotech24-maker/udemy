'use client'

import { useState, useEffect } from 'react'
import type { FormEvent, ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'coupons' | 'scholarships' | 'roadmaps' | 'cv-logs'

type CouponRow = {
  id: string
  title: string
  category: string
  rating: number
  coupon_code: string
  expires_at: string
  is_verified: boolean
}

type ScholarshipRow = {
  id: string
  title: string
  flag: string
  country: string
  level: string
  deadline: string
  benefit_count: number
}

type RoadmapRow = {
  id: string
  title: string
  category: string
  difficulty: string
  total_duration: string
  step_count: number
}

type CvLogRow = {
  id: string
  created_at: string
  identifier: string
  file_name: string
  score: number
}

type ActivityItem = {
  id: number
  icon: string
  action: string
  subject: string
  time: string
}

// ─── Mock data ──────────────────────────────────────────────────────────────

const COUPONS: CouponRow[] = [
  { id: '1', title: 'دورة Python الشاملة: من الصفر إلى الاحتراف',  category: 'برمجة',          rating: 4.7, coupon_code: 'FREE-PY24',  expires_at: '2026-06-20', is_verified: true  },
  { id: '2', title: 'تعلم React وNext.js: بناء تطبيقات ويب حديثة', category: 'تطوير الويب',    rating: 4.8, coupon_code: 'REACT2024',  expires_at: '2026-06-18', is_verified: true  },
  { id: '3', title: 'الذكاء الاصطناعي وتعلم الآلة العملية',         category: 'ذكاء اصطناعي',  rating: 4.9, coupon_code: 'AI-FREE',    expires_at: '2026-06-25', is_verified: true  },
  { id: '4', title: 'SQL وقواعد البيانات للمبتدئين',               category: 'قواعد البيانات', rating: 4.6, coupon_code: 'SQL100',     expires_at: '2026-06-22', is_verified: false },
  { id: '5', title: 'تصميم واجهات المستخدم بـ Figma',              category: 'تصميم',          rating: 4.7, coupon_code: 'FIGMA50',    expires_at: '2026-06-30', is_verified: true  },
  { id: '6', title: 'Docker وKubernetes: الدليل الكامل',            category: 'برمجة',          rating: 4.8, coupon_code: 'DOCK24',     expires_at: '2026-06-28', is_verified: true  },
  { id: '7', title: 'التسويق الرقمي الشامل 2024',                  category: 'تسويق',          rating: 4.5, coupon_code: 'MKT2024',    expires_at: '2026-07-05', is_verified: true  },
  { id: '8', title: 'ريادة الأعمال والاستثمار للمبتدئين',           category: 'أعمال',          rating: 4.6, coupon_code: 'BIZ100',     expires_at: '2026-07-10', is_verified: false },
  { id: '9', title: 'تطوير تطبيقات Flutter من الصفر',               category: 'تطوير الويب',    rating: 4.8, coupon_code: 'FLUTTER9',   expires_at: '2026-07-03', is_verified: true  },
]

const SCHOLARSHIPS: ScholarshipRow[] = [
  { id: '1',  flag: '🇺🇸', title: 'منحة فولبرايت للدراسات العليا',          country: 'الولايات المتحدة', level: 'ماجستير',  deadline: '2026-07-31', benefit_count: 5 },
  { id: '2',  flag: '🇩🇪', title: 'منحة DAAD للدراسات العليا والبحث',       country: 'ألمانيا',          level: 'ماجستير',  deadline: '2026-10-15', benefit_count: 5 },
  { id: '3',  flag: '🇬🇧', title: 'منحة شيفنينج البريطانية',                country: 'المملكة المتحدة',  level: 'ماجستير',  deadline: '2026-11-05', benefit_count: 6 },
  { id: '4',  flag: '🇹🇷', title: 'منحة الحكومة التركية (YTB)',              country: 'تركيا',            level: 'بكالوريوس', deadline: '2027-02-20', benefit_count: 6 },
  { id: '5',  flag: '🇩🇪', title: 'زمالة ألكسندر فون هومبولت',              country: 'ألمانيا',          level: 'بحثي',     deadline: '2026-09-30', benefit_count: 5 },
  { id: '6',  flag: '🇯🇵', title: 'منحة الحكومة اليابانية (MEXT)',           country: 'اليابان',          level: 'دكتوراه',  deadline: '2026-08-31', benefit_count: 5 },
  { id: '7',  flag: '🇰🇷', title: 'منحة الحكومة الكورية (GKS)',              country: 'كوريا الجنوبية',   level: 'دكتوراه',  deadline: '2026-09-15', benefit_count: 6 },
  { id: '8',  flag: '🇦🇺', title: 'منحة أستراليا أواردز',                   country: 'أستراليا',          level: 'ماجستير',  deadline: '2026-12-15', benefit_count: 6 },
  { id: '9',  flag: '🇨🇭', title: 'منحة الحكومة السويسرية للتميز',           country: 'سويسرا',           level: 'بحثي',     deadline: '2026-12-01', benefit_count: 5 },
  { id: '10', flag: '🇭🇺', title: 'منحة ستيبنديوم هونغاريكوم',               country: 'المجر',            level: 'بكالوريوس', deadline: '2027-01-15', benefit_count: 5 },
]

const ROADMAPS: RoadmapRow[] = [
  { id: '1', title: 'مطوّر الواجهة الأمامية',          category: 'تطوير الويب',   difficulty: 'مبتدئ',  total_duration: '6 أشهر',  step_count: 4 },
  { id: '2', title: 'مطوّر الواجهة الخلفية',          category: 'تطوير الويب',   difficulty: 'متوسط',  total_duration: '5 أشهر',  step_count: 4 },
  { id: '3', title: 'مهندس الذكاء الاصطناعي',          category: 'ذكاء اصطناعي', difficulty: 'متقدم',  total_duration: '10 أشهر', step_count: 4 },
  { id: '4', title: 'مهندس DevOps والبنية التحتية',   category: 'DevOps',        difficulty: 'متوسط',  total_duration: '7 أشهر',  step_count: 4 },
  { id: '5', title: 'مطوّر تطبيقات الجوال',            category: 'تطوير الجوال', difficulty: 'مبتدئ',  total_duration: '6 أشهر',  step_count: 4 },
]

const CV_LOGS: CvLogRow[] = [
  { id: '1', created_at: '2026-06-06 14:32', identifier: 'ahmed.k@***',  file_name: 'cv_ahmed_2026.pdf',    score: 82 },
  { id: '2', created_at: '2026-06-06 11:15', identifier: 'sara.m@***',   file_name: 'Sara_CV_Final.pdf',    score: 91 },
  { id: '3', created_at: '2026-06-05 20:44', identifier: 'omar.r@***',   file_name: 'CV_Omar_Dev.docx',     score: 67 },
  { id: '4', created_at: '2026-06-05 16:20', identifier: 'layla.h@***',  file_name: 'lebenslauf_layla.pdf', score: 88 },
  { id: '5', created_at: '2026-06-04 09:10', identifier: 'hani.j@***',   file_name: 'hani_resume.pdf',      score: 74 },
  { id: '6', created_at: '2026-06-03 22:05', identifier: 'nour.a@***',   file_name: 'Nour_CV_2026.pdf',     score: 95 },
]

const ACTIVITY: ActivityItem[] = [
  { id: 1, icon: '🎟️', action: 'كوبون جديد تم إضافته',  subject: 'دورة Flutter من الصفر',       time: 'منذ ساعتين' },
  { id: 2, icon: '🎓', action: 'منحة تم تحديثها',        subject: 'DAAD للدراسات العليا',          time: 'منذ 5 ساعات' },
  { id: 3, icon: '🤖', action: 'تحليل CV جديد',          subject: 'Sara_CV_Final.pdf – 91 نقطة',   time: 'منذ 7 ساعات' },
  { id: 4, icon: '🗺️', action: 'مسار جديد أُضيف',       subject: 'مطوّر تطبيقات الجوال',          time: 'أمس 18:30' },
  { id: 5, icon: '✅', action: 'كوبون تم التحقق منه',    subject: 'REACT2024 – فعّال',             time: 'أمس 14:00' },
]

// ─── Colour helpers ─────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  'مبتدئ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'متوسط': 'bg-amber-50   text-amber-700   border-amber-200',
  'متقدم': 'bg-rose-50    text-rose-700    border-rose-200',
}

const LEVEL_COLOR: Record<string, string> = {
  'ماجستير':   'bg-indigo-50  text-indigo-700  border-indigo-200',
  'دكتوراه':   'bg-violet-50  text-violet-700  border-violet-200',
  'بكالوريوس': 'bg-blue-50    text-blue-700    border-blue-200',
  'بحثي':      'bg-slate-100  text-slate-700   border-slate-200',
}

// ─── Auth gate ───────────────────────────────────────────────────────────────
// Production: replace with Supabase Auth / middleware session

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin1234'

function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]         = useState('')
  const [error, setError]   = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (pw === ADMIN_PASS) {
        sessionStorage.setItem('udemy-admin-auth', '1')
        onAuth()
      } else {
        setError(true)
        setLoading(false)
      }
    }, 350)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-md px-8 py-10">
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-base font-bold text-slate-900 text-center mb-1">لوحة الإدارة</h1>
          <p className="text-xs text-slate-400 text-center mb-7">UdemyRadar CMS</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-pw" className="block text-xs font-semibold text-slate-700 mb-1.5">
                كلمة المرور
              </label>
              <input
                id="admin-pw"
                type="password"
                autoComplete="current-password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false) }}
                placeholder="••••••••"
                required
                className={`w-full border rounded-md px-3 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none transition-colors ${
                  error
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-slate-200 bg-white focus:border-slate-500'
                }`}
              />
              {error && (
                <p className="text-xs text-red-500 mt-1.5">كلمة المرور غير صحيحة</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60"
            >
              {loading ? '...' : 'دخول'}
            </button>
          </form>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-4">
          استبدل بـ Supabase Auth في الإنتاج · NEXT_PUBLIC_ADMIN_PASSWORD
        </p>
      </div>
    </div>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  sub,
  accent,
}: {
  value: number | string
  label: string
  sub: string
  accent?: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-md px-5 py-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 cursor-default select-none">
      <p className={`text-3xl font-bold tabular-nums leading-none ${accent ?? 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-800 mt-2">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

// ─── Tab navigation ──────────────────────────────────────────────────────────

const TAB_DEFS: { id: AdminTab; label: string; count?: number }[] = [
  { id: 'overview',      label: 'نظرة عامة' },
  { id: 'coupons',       label: 'الكوبونات',  count: COUPONS.length },
  { id: 'scholarships',  label: 'المنح',       count: SCHOLARSHIPS.length },
  { id: 'roadmaps',      label: 'المسارات',    count: ROADMAPS.length },
  { id: 'cv-logs',       label: 'سجلات CV',    count: CV_LOGS.length },
]

function TabNav({
  active,
  onChange,
}: {
  active: AdminTab
  onChange: (t: AdminTab) => void
}) {
  return (
    <div className="flex flex-wrap gap-0 border-b border-slate-200 mb-6">
      {TAB_DEFS.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`inline-block min-w-[1.25rem] text-center text-[10px] font-bold px-1 py-0.5 rounded-sm ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-sm min-w-[640px]">{children}</table>
    </div>
  )
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="text-start px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-200 whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-xs text-slate-700 align-middle ${className ?? ''}`}>
      {children}
    </td>
  )
}

function Pill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-sm border whitespace-nowrap ${className ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}
    >
      {children}
    </span>
  )
}

function ActionBtn({
  children,
  variant = 'default',
}: {
  children: ReactNode
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      className={`text-xs font-medium px-2 py-1 rounded-sm transition-colors ${
        variant === 'danger'
          ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHead({
  title,
  sub,
  addLabel,
}: {
  title: string
  sub: string
  addLabel?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      {addLabel && (
        <button
          type="button"
          className="flex items-center gap-1.5 shrink-0 text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white rounded-md transition-colors hover:-translate-y-0.5 hover:shadow-sm duration-150"
        >
          <span className="text-sm leading-none">+</span>
          {addLabel}
        </button>
      )}
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const verifiedCount  = COUPONS.filter((c) => c.is_verified).length
  const avgCvScore     = Math.round(CV_LOGS.reduce((s, l) => s + l.score, 0) / CV_LOGS.length)

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={COUPONS.length}
          label="كوبون نشط"
          sub={`${verifiedCount} موثّق تلقائياً`}
        />
        <StatCard
          value={SCHOLARSHIPS.length}
          label="منحة فعالة"
          sub="10 دول مختلفة"
        />
        <StatCard
          value={ROADMAPS.length}
          label="مسار مهني"
          sub={`${ROADMAPS.reduce((s, r) => s + r.step_count, 0)} مراحل إجمالية`}
        />
        <StatCard
          value={`${avgCvScore}`}
          label="متوسط درجة CV"
          sub={`${CV_LOGS.length} تحليل`}
          accent="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity feed */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            النشاط الأخير
          </p>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            {ACTIVITY.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                  i < ACTIVITY.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 leading-snug">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.subject}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            حالة النظام
          </p>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            {[
              'قاعدة البيانات (Supabase)',
              'DeepSeek AI API',
              'خط تحديث الكوبونات',
              'إشعارات تيليغرام',
              'البنية الأساسية (Vercel)',
            ].map((svc, i, arr) => (
              <div
                key={svc}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors ${
                  i < arr.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <span className="text-xs text-slate-700">{svc}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  شغّال
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Coupons tab ──────────────────────────────────────────────────────────────

function CouponsTab() {
  const verifiedCount = COUPONS.filter((c) => c.is_verified).length

  return (
    <div>
      <SectionHead
        title="إدارة الكوبونات"
        sub={`${COUPONS.length} كوبون – ${verifiedCount} موثّق`}
        addLabel="كوبون جديد"
      />
      <TableWrap>
        <thead>
          <tr>
            <Th>العنوان</Th>
            <Th>الفئة</Th>
            <Th>التقييم</Th>
            <Th>الكود</Th>
            <Th>ينتهي</Th>
            <Th>الحالة</Th>
            <Th>إجراءات</Th>
          </tr>
        </thead>
        <tbody>
          {COUPONS.map((c, i) => (
            <tr
              key={c.id}
              className={`hover:bg-slate-50 transition-colors ${
                i < COUPONS.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <Td>
                <span className="font-medium text-slate-900 line-clamp-1 block max-w-[200px]">
                  {c.title}
                </span>
              </Td>
              <Td>
                <Pill>{c.category}</Pill>
              </Td>
              <Td>
                <span className="tabular-nums font-semibold text-amber-600">
                  {c.rating.toFixed(1)}
                </span>
              </Td>
              <Td>
                <code className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-sm">
                  {c.coupon_code}
                </code>
              </Td>
              <Td>{c.expires_at}</Td>
              <Td>
                {c.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Verified · نشط
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    قيد المراجعة
                  </span>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-0.5">
                  <ActionBtn>تعديل</ActionBtn>
                  <ActionBtn variant="danger">حذف</ActionBtn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  )
}

// ─── Scholarships tab ─────────────────────────────────────────────────────────

function ScholarshipsTab() {
  return (
    <div>
      <SectionHead
        title="إدارة المنح الدراسية"
        sub={`${SCHOLARSHIPS.length} منحة – مرتبة حسب الموعد النهائي`}
        addLabel="منحة جديدة"
      />
      <TableWrap>
        <thead>
          <tr>
            <Th>المنحة</Th>
            <Th>الدولة</Th>
            <Th>المستوى</Th>
            <Th>الموعد النهائي</Th>
            <Th>المزايا</Th>
            <Th>إجراءات</Th>
          </tr>
        </thead>
        <tbody>
          {SCHOLARSHIPS.map((s, i) => (
            <tr
              key={s.id}
              className={`hover:bg-slate-50 transition-colors ${
                i < SCHOLARSHIPS.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <Td>
                <span className="font-medium text-slate-900 line-clamp-1 block max-w-[220px]">
                  {s.flag} {s.title}
                </span>
              </Td>
              <Td>{s.country}</Td>
              <Td>
                <Pill className={LEVEL_COLOR[s.level] ?? 'bg-slate-100 text-slate-700 border-slate-200'}>
                  {s.level}
                </Pill>
              </Td>
              <Td>{s.deadline}</Td>
              <Td>
                <span className="text-slate-500">{s.benefit_count} مزايا</span>
              </Td>
              <Td>
                <div className="flex items-center gap-0.5">
                  <ActionBtn>تعديل</ActionBtn>
                  <ActionBtn variant="danger">حذف</ActionBtn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  )
}

// ─── Roadmaps tab ─────────────────────────────────────────────────────────────

function RoadmapsTab() {
  const totalSteps = ROADMAPS.reduce((s, r) => s + r.step_count, 0)
  return (
    <div>
      <SectionHead
        title="إدارة مسارات الطريق"
        sub={`${ROADMAPS.length} مسارات – ${totalSteps} مراحل إجمالية`}
        addLabel="مسار جديد"
      />
      <TableWrap>
        <thead>
          <tr>
            <Th>المسار</Th>
            <Th>الفئة</Th>
            <Th>الصعوبة</Th>
            <Th>المدة</Th>
            <Th>المراحل</Th>
            <Th>إجراءات</Th>
          </tr>
        </thead>
        <tbody>
          {ROADMAPS.map((r, i) => (
            <tr
              key={r.id}
              className={`hover:bg-slate-50 transition-colors ${
                i < ROADMAPS.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <Td>
                <span className="font-semibold text-slate-900">{r.title}</span>
              </Td>
              <Td>
                <Pill>{r.category}</Pill>
              </Td>
              <Td>
                <Pill className={DIFFICULTY_COLOR[r.difficulty] ?? 'bg-slate-100 text-slate-700 border-slate-200'}>
                  {r.difficulty}
                </Pill>
              </Td>
              <Td>
                <span className="font-bold text-slate-900">{r.total_duration}</span>
              </Td>
              <Td>
                <span className="tabular-nums">{r.step_count} مراحل</span>
              </Td>
              <Td>
                <div className="flex items-center gap-0.5">
                  <ActionBtn>تعديل</ActionBtn>
                  <ActionBtn variant="danger">حذف</ActionBtn>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  )
}

// ─── CV Logs tab ──────────────────────────────────────────────────────────────

function CvLogsTab() {
  const avg = Math.round(CV_LOGS.reduce((s, l) => s + l.score, 0) / CV_LOGS.length)
  return (
    <div>
      <SectionHead
        title="سجلات تحليل CV"
        sub={`${CV_LOGS.length} تحليل – متوسط الدرجات ${avg} نقطة`}
      />
      <TableWrap>
        <thead>
          <tr>
            <Th>التاريخ</Th>
            <Th>المعرّف</Th>
            <Th>اسم الملف</Th>
            <Th>الدرجة</Th>
            <Th>إجراءات</Th>
          </tr>
        </thead>
        <tbody>
          {CV_LOGS.map((log, i) => {
            const scoreColor =
              log.score >= 85 ? 'text-emerald-600' :
              log.score >= 70 ? 'text-amber-600'   :
                                'text-red-500'
            return (
              <tr
                key={log.id}
                className={`hover:bg-slate-50 transition-colors ${
                  i < CV_LOGS.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <Td>{log.created_at}</Td>
                <Td>
                  <span className="font-mono text-slate-500">{log.identifier}</span>
                </Td>
                <Td>
                  <span className="font-medium text-slate-900">{log.file_name}</span>
                </Td>
                <Td>
                  <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
                    {log.score}
                  </span>
                  <span className="text-xs text-slate-400"> / 100</span>
                </Td>
                <Td>
                  <ActionBtn>عرض التقرير</ActionBtn>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </TableWrap>
    </div>
  )
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [isAuth, setIsAuth]         = useState(false)
  const [activeTab, setActiveTab]   = useState<AdminTab>('overview')
  const [mounted, setMounted]       = useState(false)

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('udemy-admin-auth') === '1') {
      setIsAuth(true)
    }
  }, [])

  // Render nothing until client mounts to avoid sessionStorage hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuth) {
    return <AuthGate onAuth={() => setIsAuth(true)} />
  }

  function handleLogout() {
    sessionStorage.removeItem('udemy-admin-auth')
    setIsAuth(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-widest uppercase">
              UdemyRadar
            </span>
            <span className="text-slate-300 select-none">|</span>
            <span className="text-xs font-medium text-slate-500">لوحة الإدارة</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 border border-transparent hover:border-slate-200 hover:bg-white rounded-md transition-all duration-150"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" />
            </svg>
            خروج
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNav active={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview'     && <OverviewTab />}
        {activeTab === 'coupons'      && <CouponsTab />}
        {activeTab === 'scholarships' && <ScholarshipsTab />}
        {activeTab === 'roadmaps'     && <RoadmapsTab />}
        {activeTab === 'cv-logs'      && <CvLogsTab />}
      </div>
    </div>
  )
}
