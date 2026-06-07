'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { FormEvent, ReactNode } from 'react'

// ─── Auth header ──────────────────────────────────────────────────────────────

const AUTH_HDR = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? 'my_super_secret_cron_key_4352'}`,
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'coupons' | 'scholarships' | 'roadmaps' | 'cv-logs'

type CouponRow = {
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

type ScholarshipRow = {
  id: string
  title: string
  description: string | null
  country: string | null
  deadline: string | null
  requirements: string | null
  benefits: string | null
  official_link: string | null
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

type CronLogRecord = {
  id: string
  job_name: string
  status: 'success' | 'failed' | 'running'
  items_added: number
  items_updated: number
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

type CronTriggerState = { running: string | null; lastResult: string | null }

type Toast = { id: number; message: string; variant: 'success' | 'error' }

// ─── Static data (roadmaps + CV are not in scope for live edit) ───────────────

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

// ─── Colour maps ──────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  'مبتدئ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'متوسط': 'bg-amber-50   text-amber-700   border-amber-200',
  'متقدم': 'bg-rose-50    text-rose-700    border-rose-200',
}

// ─── Cron helpers ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (h >= 48) return `منذ ${Math.floor(h / 24)} أيام`
  if (h >= 1)  return `منذ ${h} ساعة`
  return `منذ ${m} دقيقة`
}

function cronLogToActivity(log: CronLogRecord) {
  const icon  = log.job_name === 'scrape-coupons' ? '🎟️' : log.job_name === 'scrape-scholarships' ? '🎓' : '⚙️'
  const label = log.job_name === 'scrape-coupons' ? 'مسح الكوبونات' : log.job_name === 'scrape-scholarships' ? 'مسح المنح' : log.job_name
  const dur   = log.duration_ms ? ` · ${(log.duration_ms / 1000).toFixed(1)}s` : ''
  return {
    id:      log.id,
    icon,
    action:  `${label} – ${log.status === 'success' ? '✓ نجح' : '✗ فشل'}`,
    subject: log.status === 'success'
      ? `${log.items_added} مضاف · ${log.items_updated} محدّث${dur}`
      : (log.error_message ?? 'خطأ غير معروف'),
    time: relativeTime(log.created_at),
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md shadow-lg text-xs font-semibold text-white pointer-events-auto ${
            t.variant === 'success' ? 'bg-emerald-600' : 'bg-red-500'
          }`}
        >
          <span>{t.variant === 'success' ? '✓' : '✗'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin1234'

function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]     = useState('')
  const [err, setErr]   = useState(false)
  const [busy, setBusy] = useState(false)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true)
    setTimeout(() => {
      if (pw === ADMIN_PASS) { sessionStorage.setItem('udemy-admin-auth', '1'); onAuth() }
      else { setErr(true); setBusy(false) }
    }, 350)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-md px-8 py-10">
          <div className="flex justify-center mb-6">
            <div className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-base font-bold text-slate-900 text-center mb-1">لوحة الإدارة</h1>
          <p className="text-xs text-slate-400 text-center mb-7">UdemyRadar CMS</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="admin-pw" className="block text-xs font-semibold text-slate-700 mb-1.5">كلمة المرور</label>
              <input id="admin-pw" type="password" autoComplete="current-password" value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(false) }}
                placeholder="••••••••" required
                className={`w-full border rounded-md px-3 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none transition-colors ${err ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white focus:border-slate-500'}`}
              />
              {err && <p className="text-xs text-red-500 mt-1.5">كلمة المرور غير صحيحة</p>}
            </div>
            <button type="submit" disabled={busy} className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60">
              {busy ? '...' : 'دخول'}
            </button>
          </form>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-4">استبدل بـ Supabase Auth في الإنتاج</p>
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, sub, accent }: { value: number | string; label: string; sub: string; accent?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md px-5 py-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 cursor-default select-none">
      <p className={`text-3xl font-bold tabular-nums leading-none ${accent ?? 'text-slate-900'}`}>{value}</p>
      <p className="text-xs font-semibold text-slate-800 mt-2">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

const TAB_LIST: { id: AdminTab; label: string }[] = [
  { id: 'overview',     label: 'نظرة عامة' },
  { id: 'coupons',      label: 'الكوبونات' },
  { id: 'scholarships', label: 'المنح' },
  { id: 'roadmaps',     label: 'المسارات' },
  { id: 'cv-logs',      label: 'سجلات CV' },
]

function TabNav({ active, onChange, counts }: {
  active: AdminTab
  onChange: (t: AdminTab) => void
  counts: Partial<Record<AdminTab, number>>
}) {
  return (
    <div className="flex flex-wrap gap-0 border-b border-slate-200 mb-6">
      {TAB_LIST.map((tab) => {
        const isActive = active === tab.id
        const count    = counts[tab.id]
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {tab.label}
            {count !== undefined && (
              <span className={`inline-block min-w-[1.25rem] text-center text-[10px] font-bold px-1 py-0.5 rounded-sm ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
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
  return <div className="overflow-x-auto rounded-md border border-slate-200"><table className="w-full text-sm min-w-[640px]">{children}</table></div>
}
function Th({ children }: { children: ReactNode }) {
  return <th className="text-start px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-200 whitespace-nowrap">{children}</th>
}
function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-xs text-slate-700 align-middle ${className ?? ''}`}>{children}</td>
}
function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-sm border whitespace-nowrap ${className ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>{children}</span>
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: ReactNode; footer: ReactNode
}) {
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVis(true))
    document.body.style.overflow = 'hidden'
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function close() { setVis(false); setTimeout(onClose, 180) }

  return (
    <div role="dialog" aria-modal="true"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 transition-all duration-200 ${vis ? 'bg-black/40' : 'bg-black/0'}`}
      onClick={close}
    >
      <div
        className={`w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 ${vis ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={close} aria-label="إغلاق" className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        <div className="px-6 pb-5 pt-3 border-t border-slate-100 shrink-0">{footer}</div>
      </div>
    </div>
  )
}

// ─── Form primitives ──────────────────────────────────────────────────────────

function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls    = 'w-full border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 placeholder-slate-300 outline-none focus:border-slate-500 transition-colors'
const textareaCls = `${inputCls} resize-none`

// ─── Coupon edit modal ────────────────────────────────────────────────────────

function CouponEditModal({ row, onSave, onClose }: {
  row: CouponRow
  onSave: (id: string, updates: Partial<CouponRow>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title:       row.title,
    category:    row.category    ?? '',
    coupon_code: row.coupon_code ?? '',
    url:         row.url         ?? '',
    instructor:  row.instructor  ?? '',
    description: row.description ?? '',
    expires_at:  row.expires_at  ? row.expires_at.slice(0, 10) : '',
    is_verified: row.is_verified,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true)
    try {
      await onSave(row.id, {
        title:       form.title,
        category:    form.category    || null,
        coupon_code: form.coupon_code || null,
        url:         form.url,
        instructor:  form.instructor  || null,
        description: form.description || null,
        expires_at:  form.expires_at  || null,
        is_verified: form.is_verified,
      })
      onClose()
    } finally { setSaving(false) }
  }

  function set(k: keyof typeof form, v: string | boolean) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  return (
    <Modal title="تعديل الكوبون" onClose={onClose} footer={
      <button type="submit" form="coupon-edit-form" disabled={saving}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-60">
        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    }>
      <form id="coupon-edit-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="العنوان">
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="الفئة">
            <input className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="برمجة" />
          </FormField>
          <FormField label="كود الخصم">
            <input className={inputCls} value={form.coupon_code} onChange={(e) => set('coupon_code', e.target.value)} />
          </FormField>
        </div>
        <FormField label="رابط الدورة (URL)">
          <input className={inputCls} type="url" value={form.url} onChange={(e) => set('url', e.target.value)} required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="المدرّس">
            <input className={inputCls} value={form.instructor} onChange={(e) => set('instructor', e.target.value)} />
          </FormField>
          <FormField label="تاريخ الانتهاء">
            <input className={inputCls} type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
          </FormField>
        </div>
        <FormField label="الوصف">
          <textarea className={textareaCls} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={form.is_verified} onChange={(e) => set('is_verified', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-0" />
          <span className="text-xs font-medium text-slate-700">Verified (موثّق تلقائياً)</span>
        </label>
      </form>
    </Modal>
  )
}

// ─── Scholarship edit modal ───────────────────────────────────────────────────

function ScholarshipEditModal({ row, onSave, onClose }: {
  row: ScholarshipRow
  onSave: (id: string, updates: Partial<ScholarshipRow>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title:         row.title,
    country:       row.country       ?? '',
    deadline:      row.deadline      ? row.deadline.slice(0, 10) : '',
    official_link: row.official_link ?? '',
    description:   row.description   ?? '',
    requirements:  row.requirements  ?? '',
    benefits:      row.benefits      ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true)
    try {
      await onSave(row.id, {
        title:         form.title,
        country:       form.country       || null,
        deadline:      form.deadline      || null,
        official_link: form.official_link || null,
        description:   form.description   || null,
        requirements:  form.requirements  || null,
        benefits:      form.benefits      || null,
      })
      onClose()
    } finally { setSaving(false) }
  }

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  return (
    <Modal title="تعديل المنحة" onClose={onClose} footer={
      <button type="submit" form="scholarship-edit-form" disabled={saving}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-60">
        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    }>
      <form id="scholarship-edit-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="اسم المنحة">
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="الدولة">
            <input className={inputCls} value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="ألمانيا" />
          </FormField>
          <FormField label="آخر موعد للتقديم">
            <input className={inputCls} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </FormField>
        </div>
        <FormField label="الرابط الرسمي">
          <input className={inputCls} type="url" value={form.official_link} onChange={(e) => set('official_link', e.target.value)} />
        </FormField>
        <FormField label="الوصف">
          <textarea className={textareaCls} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <FormField label="المزايا" hint="افصل المزايا بـ | مثال: تغطية كاملة | راتب شهري | تذاكر طيران">
          <textarea className={textareaCls} rows={2} value={form.benefits} onChange={(e) => set('benefits', e.target.value)} />
        </FormField>
        <FormField label="شروط التقديم" hint="افصل الشروط بـ | مثال: بكالوريوس | IELTS 6.5 | خبرة سنتين">
          <textarea className={textareaCls} rows={2} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} />
        </FormField>
      </form>
    </Modal>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-slate-500">هل أنت متأكد؟</span>
      <button onClick={onConfirm} className="text-red-600 font-semibold hover:underline">نعم</button>
      <button onClick={onCancel}  className="text-slate-400 hover:text-slate-700">لا</button>
    </span>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  cronLogs, cronState, onTrigger,
  couponsCount, scholarshipsCount, verifiedCount,
}: {
  cronLogs: CronLogRecord[]
  cronState: CronTriggerState
  onTrigger: (p: string) => void
  couponsCount: number
  scholarshipsCount: number
  verifiedCount: number
}) {
  const avgCvScore = Math.round(CV_LOGS.reduce((s, l) => s + l.score, 0) / CV_LOGS.length)
  const items = cronLogs.map(cronLogToActivity)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={couponsCount}      label="كوبون نشط"     sub={`${verifiedCount} موثّق تلقائياً`} />
        <StatCard value={scholarshipsCount} label="منحة فعالة"    sub="مرتبة بالموعد النهائي" />
        <StatCard value={ROADMAPS.length}   label="مسار مهني"     sub={`${ROADMAPS.reduce((s,r)=>s+r.step_count,0)} مراحل`} />
        <StatCard value={`${avgCvScore}`}   label="متوسط درجة CV" sub={`${CV_LOGS.length} تحليل`} accent="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">سجل الأتمتة</p>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center"><p className="text-xs text-slate-400">لا توجد سجلات بعد</p></div>
            ) : items.map((item, i) => (
              <div key={item.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${i < items.length-1 ? 'border-b border-slate-100' : ''}`}>
                <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 leading-snug">{item.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.subject}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">وظائف الأتمتة</p>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            {[
              { path: 'scrape-coupons',      label: 'مسح الكوبونات',      schedule: 'كل 6 ساعات' },
              { path: 'scrape-scholarships', label: 'مسح المنح الدراسية', schedule: 'يومياً' },
            ].map((job, i, arr) => {
              const lastRun   = cronLogs.find((l) => l.job_name === job.path)
              const isRunning = cronState.running === job.path
              return (
                <div key={job.path} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${i < arr.length-1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900">{job.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {job.schedule}{lastRun ? ` · آخر تشغيل: ${relativeTime(lastRun.created_at)}` : ' · لم يُشغَّل بعد'}
                      </p>
                    </div>
                    <button type="button" disabled={isRunning} onClick={() => onTrigger(job.path)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-md text-slate-700 hover:border-slate-400 hover:bg-white transition-all shrink-0 disabled:opacity-50">
                      {isRunning
                        ? <><span className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />يعمل...</>
                        : <>▶ تشغيل</>}
                    </button>
                  </div>
                  {lastRun && (
                    <div className="mt-2 flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${lastRun.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lastRun.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {lastRun.status === 'success' ? 'نجح' : 'فشل'}
                      </span>
                      {lastRun.status === 'success' && (
                        <span className="text-[10px] text-slate-400">+{lastRun.items_added} · ↺{lastRun.items_updated} · {lastRun.duration_ms ? `${(lastRun.duration_ms/1000).toFixed(1)}s` : '–'}</span>
                      )}
                      {lastRun.status === 'failed' && lastRun.error_message && (
                        <span className="text-[10px] text-red-400 truncate max-w-[180px]">{lastRun.error_message}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {['قاعدة البيانات (Supabase)', 'DeepSeek AI API', 'البنية الأساسية (Vercel)'].map((svc) => (
              <div key={svc} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors border-t border-slate-100">
                <span className="text-xs text-slate-700">{svc}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />شغّال
                </span>
              </div>
            ))}
          </div>
          {cronState.lastResult && <p className="text-[10px] text-slate-500 mt-2 px-1">{cronState.lastResult}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Coupons tab ──────────────────────────────────────────────────────────────

function CouponsTab({ rows, loading, onDelete, onEdit, addToast }: {
  rows: CouponRow[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updates: Partial<CouponRow>) => Promise<void>
  addToast: (msg: string, variant?: 'success' | 'error') => void
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [editTarget, setEditTarget]       = useState<CouponRow | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const verifiedCount = rows.filter((c) => c.is_verified).length

  async function confirmDelete(id: string) {
    setDeleting(id)
    try {
      await onDelete(id)
      addToast('تم حذف الكوبون بنجاح')
    } catch {
      addToast('فشل حذف الكوبون', 'error')
    } finally {
      setDeleting(null)
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <SectionHead title="إدارة الكوبونات" sub={loading ? 'جاري التحميل...' : `${rows.length} كوبون – ${verifiedCount} موثّق`} />
      {loading ? (
        <div className="py-12 text-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <TableWrap>
          <thead>
            <tr><Th>العنوان</Th><Th>الفئة</Th><Th>التقييم</Th><Th>الكود</Th><Th>ينتهي</Th><Th>الحالة</Th><Th>إجراءات</Th></tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${i < rows.length-1 ? 'border-b border-slate-100' : ''}`}>
                <Td><span className="font-medium text-slate-900 line-clamp-1 block max-w-[200px]">{c.title}</span></Td>
                <Td>{c.category ? <Pill>{c.category}</Pill> : <span className="text-slate-400">–</span>}</Td>
                <Td><span className="tabular-nums font-semibold text-amber-600">{c.rating !== null ? c.rating.toFixed(1) : '–'}</span></Td>
                <Td>{c.coupon_code
                  ? <code className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-sm">{c.coupon_code}</code>
                  : <span className="text-slate-400">–</span>}
                </Td>
                <Td>{c.expires_at ? c.expires_at.slice(0, 10) : '–'}</Td>
                <Td>
                  {c.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />قيد المراجعة
                    </span>
                  )}
                </Td>
                <Td>
                  {pendingDelete === c.id ? (
                    <DeleteConfirm onConfirm={() => confirmDelete(c.id)} onCancel={() => setPendingDelete(null)} />
                  ) : deleting === c.id ? (
                    <span className="text-xs text-slate-400">يُحذف...</span>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => setEditTarget(c)}
                        className="text-xs font-medium px-2 py-1 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        تعديل
                      </button>
                      <button type="button" onClick={() => setPendingDelete(c.id)}
                        className="text-xs font-medium px-2 py-1 rounded-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        حذف
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {editTarget && (
        <CouponEditModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (id, updates) => { await onEdit(id, updates); addToast('تم تحديث الكوبون بنجاح') }}
        />
      )}
    </div>
  )
}

// ─── Scholarships tab ─────────────────────────────────────────────────────────

function ScholarshipsTab({ rows, loading, onDelete, onEdit, addToast }: {
  rows: ScholarshipRow[]
  loading: boolean
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, updates: Partial<ScholarshipRow>) => Promise<void>
  addToast: (msg: string, variant?: 'success' | 'error') => void
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [editTarget, setEditTarget]       = useState<ScholarshipRow | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)

  async function confirmDelete(id: string) {
    setDeleting(id)
    try {
      await onDelete(id)
      addToast('تم حذف المنحة بنجاح')
    } catch {
      addToast('فشل حذف المنحة', 'error')
    } finally {
      setDeleting(null)
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <SectionHead title="إدارة المنح الدراسية" sub={loading ? 'جاري التحميل...' : `${rows.length} منحة`} />
      {loading ? (
        <div className="py-12 text-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <TableWrap>
          <thead>
            <tr><Th>المنحة</Th><Th>الدولة</Th><Th>الموعد النهائي</Th><Th>الرابط</Th><Th>إجراءات</Th></tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${i < rows.length-1 ? 'border-b border-slate-100' : ''}`}>
                <Td><span className="font-medium text-slate-900 line-clamp-1 block max-w-[220px]">{s.title}</span></Td>
                <Td>{s.country ?? '–'}</Td>
                <Td>{s.deadline ? s.deadline.slice(0, 10) : '–'}</Td>
                <Td>
                  {s.official_link ? (
                    <a href={s.official_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block max-w-[140px]">
                      {s.official_link.replace(/^https?:\/\//, '').split('/')[0]}
                    </a>
                  ) : <span className="text-slate-400">–</span>}
                </Td>
                <Td>
                  {pendingDelete === s.id ? (
                    <DeleteConfirm onConfirm={() => confirmDelete(s.id)} onCancel={() => setPendingDelete(null)} />
                  ) : deleting === s.id ? (
                    <span className="text-xs text-slate-400">يُحذف...</span>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => setEditTarget(s)}
                        className="text-xs font-medium px-2 py-1 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        تعديل
                      </button>
                      <button type="button" onClick={() => setPendingDelete(s.id)}
                        className="text-xs font-medium px-2 py-1 rounded-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        حذف
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      {editTarget && (
        <ScholarshipEditModal
          row={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (id, updates) => { await onEdit(id, updates); addToast('تم تحديث المنحة بنجاح') }}
        />
      )}
    </div>
  )
}

// ─── Roadmaps tab (static) ────────────────────────────────────────────────────

function RoadmapsTab() {
  return (
    <div>
      <SectionHead title="إدارة مسارات الطريق" sub={`${ROADMAPS.length} مسارات`} />
      <TableWrap>
        <thead><tr><Th>المسار</Th><Th>الفئة</Th><Th>الصعوبة</Th><Th>المدة</Th><Th>المراحل</Th></tr></thead>
        <tbody>
          {ROADMAPS.map((r, i) => (
            <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${i < ROADMAPS.length-1 ? 'border-b border-slate-100' : ''}`}>
              <Td><span className="font-semibold text-slate-900">{r.title}</span></Td>
              <Td><Pill>{r.category}</Pill></Td>
              <Td><Pill className={DIFFICULTY_COLOR[r.difficulty] ?? 'bg-slate-100 text-slate-700 border-slate-200'}>{r.difficulty}</Pill></Td>
              <Td><span className="font-bold text-slate-900">{r.total_duration}</span></Td>
              <Td><span className="tabular-nums">{r.step_count} مراحل</span></Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  )
}

// ─── CV Logs tab (static) ─────────────────────────────────────────────────────

function CvLogsTab() {
  const avg = Math.round(CV_LOGS.reduce((s, l) => s + l.score, 0) / CV_LOGS.length)
  return (
    <div>
      <SectionHead title="سجلات تحليل CV" sub={`${CV_LOGS.length} تحليل – متوسط ${avg} نقطة`} />
      <TableWrap>
        <thead><tr><Th>التاريخ</Th><Th>المعرّف</Th><Th>اسم الملف</Th><Th>الدرجة</Th></tr></thead>
        <tbody>
          {CV_LOGS.map((log, i) => {
            const col = log.score >= 85 ? 'text-emerald-600' : log.score >= 70 ? 'text-amber-600' : 'text-red-500'
            return (
              <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${i < CV_LOGS.length-1 ? 'border-b border-slate-100' : ''}`}>
                <Td>{log.created_at}</Td>
                <Td><span className="font-mono text-slate-500">{log.identifier}</span></Td>
                <Td><span className="font-medium text-slate-900">{log.file_name}</span></Td>
                <Td><span className={`text-sm font-bold tabular-nums ${col}`}>{log.score}</span><span className="text-xs text-slate-400"> / 100</span></Td>
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
  const [isAuth, setIsAuth]       = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  const [coupons, setCoupons]                       = useState<CouponRow[]>([])
  const [scholarships, setScholarships]             = useState<ScholarshipRow[]>([])
  const [couponsLoading, setCouponsLoading]         = useState(false)
  const [scholarshipsLoading, setScholarshipsLoading] = useState(false)
  const [cronLogs, setCronLogs]   = useState<CronLogRecord[]>([])
  const [cronState, setCronState] = useState<CronTriggerState>({ running: null, lastResult: null })

  const toastSeq = useRef(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    const id = ++toastSeq.current
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true)
    try {
      const res = await fetch('/api/admin/coupons', { headers: AUTH_HDR })
      if (!res.ok) return
      const json = (await res.json()) as { data: CouponRow[] }
      setCoupons(json.data ?? [])
    } catch { /* ignore */ }
    finally { setCouponsLoading(false) }
  }, [])

  const fetchScholarships = useCallback(async () => {
    setScholarshipsLoading(true)
    try {
      const res = await fetch('/api/admin/scholarships', { headers: AUTH_HDR })
      if (!res.ok) return
      const json = (await res.json()) as { data: ScholarshipRow[] }
      setScholarships(json.data ?? [])
    } catch { /* ignore */ }
    finally { setScholarshipsLoading(false) }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cron-logs')
      if (!res.ok) return
      const json = (await res.json()) as { logs: CronLogRecord[] }
      setCronLogs(json.logs ?? [])
    } catch { /* ignore */ }
  }, [])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const deleteCoupon = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE', headers: AUTH_HDR })
    if (!res.ok) throw new Error('Delete failed')
    setCoupons((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const editCoupon = useCallback(async (id: string, updates: Partial<CouponRow>) => {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { ...AUTH_HDR, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Update failed')
    const json = (await res.json()) as { data: CouponRow }
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...json.data } : c)))
  }, [])

  const deleteScholarship = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/scholarships/${id}`, { method: 'DELETE', headers: AUTH_HDR })
    if (!res.ok) throw new Error('Delete failed')
    setScholarships((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const editScholarship = useCallback(async (id: string, updates: Partial<ScholarshipRow>) => {
    const res = await fetch(`/api/admin/scholarships/${id}`, {
      method: 'PATCH',
      headers: { ...AUTH_HDR, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Update failed')
    const json = (await res.json()) as { data: ScholarshipRow }
    setScholarships((prev) => prev.map((s) => (s.id === id ? { ...s, ...json.data } : s)))
  }, [])

  // ── Cron trigger ──────────────────────────────────────────────────────────

  const triggerCron = useCallback(async (path: string) => {
    setCronState({ running: path, lastResult: null })
    try {
      const res  = await fetch(`/api/cron/${path}`, { headers: AUTH_HDR })
      const data = (await res.json()) as Record<string, unknown>
      const status = String(data.status ?? 'unknown')
      setCronState({
        running: null,
        lastResult: status === 'success'
          ? `✓ نجح – ${Number(data.items_added ?? 0)} مضاف · ${Number(data.items_updated ?? 0)} محدّث`
          : status === 'dry-run'
            ? `⚙ وضع تجريبي – ${Number(data.items_fetched ?? 0)} عنصر`
            : `✗ فشل – ${String(data.error ?? '')}`,
      })
      await fetchLogs()
      if (path === 'scrape-coupons')      await fetchCoupons()
      if (path === 'scrape-scholarships') await fetchScholarships()
    } catch (err) {
      setCronState({ running: null, lastResult: `✗ خطأ شبكي – ${String(err)}` })
    }
  }, [fetchLogs, fetchCoupons, fetchScholarships])

  // ── Boot ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('udemy-admin-auth') === '1') setIsAuth(true)
  }, [])

  useEffect(() => {
    if (!isAuth) return
    fetchCoupons()
    fetchScholarships()
    fetchLogs()
  }, [isAuth, fetchCoupons, fetchScholarships, fetchLogs])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuth) return <AuthGate onAuth={() => setIsAuth(true)} />

  function handleLogout() {
    sessionStorage.removeItem('udemy-admin-auth')
    setIsAuth(false)
  }

  const verifiedCount = coupons.filter((c) => c.is_verified).length

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer toasts={toasts} />

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-widest uppercase">UdemyRadar</span>
            <span className="text-slate-300 select-none">|</span>
            <span className="text-xs font-medium text-slate-500">لوحة الإدارة</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">Admin</span>
          </div>
          <button type="button" onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 border border-transparent hover:border-slate-200 hover:bg-white rounded-md transition-all duration-150">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" />
            </svg>
            خروج
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNav
          active={activeTab}
          onChange={setActiveTab}
          counts={{
            coupons:      coupons.length,
            scholarships: scholarships.length,
            roadmaps:     ROADMAPS.length,
            'cv-logs':    CV_LOGS.length,
          }}
        />

        {activeTab === 'overview' && (
          <OverviewTab
            cronLogs={cronLogs} cronState={cronState} onTrigger={triggerCron}
            couponsCount={coupons.length} scholarshipsCount={scholarships.length}
            verifiedCount={verifiedCount}
          />
        )}
        {activeTab === 'coupons' && (
          <CouponsTab
            rows={coupons} loading={couponsLoading}
            onDelete={deleteCoupon} onEdit={editCoupon} addToast={addToast}
          />
        )}
        {activeTab === 'scholarships' && (
          <ScholarshipsTab
            rows={scholarships} loading={scholarshipsLoading}
            onDelete={deleteScholarship} onEdit={editScholarship} addToast={addToast}
          />
        )}
        {activeTab === 'roadmaps'  && <RoadmapsTab />}
        {activeTab === 'cv-logs'   && <CvLogsTab />}
      </div>
    </div>
  )
}
