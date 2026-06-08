'use client'

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react'
import Link from 'next/link'
import type { RoadmapRecord, RoadmapStep } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type StepForm = { phase: string; title: string; skills: string; duration: string }
type Toast    = { id: number; message: string; ok: boolean }

// ─── Auth header ──────────────────────────────────────────────────────────────

const AUTH_HDR = {
  Authorization: 'Bearer ' + (process.env.NEXT_PUBLIC_CRON_SECRET ?? 'my_super_secret_cron_key_4352'),
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyStep(idx: number): StepForm {
  return { phase: 'المرحلة ' + (idx + 1), title: '', skills: '', duration: '' }
}

function stepsToInsert(forms: StepForm[]): RoadmapStep[] {
  return forms.map((f) => ({
    phase:    f.phase.trim()    || 'مرحلة',
    title:    f.title.trim()    || '',
    skills:   f.skills.split(',').map((s) => s.trim()).filter(Boolean),
    duration: f.duration.trim() || '',
  }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRoadmapsPage() {
  const [mounted,    setMounted]    = useState(false)
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [category,   setCategory]   = useState('')
  const [keywords,   setKeywords]   = useState('')
  const [steps,      setSteps]      = useState<StepForm[]>([emptyStep(0)])
  const [roadmaps,   setRoadmaps]   = useState<RoadmapRecord[]>([])
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [toasts,     setToasts]     = useState<Toast[]>([])
  const [pendingDel, setPendingDel] = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  const toastSeq = useRef(0)
  const addToast = useCallback((message: string, ok = true) => {
    const id = ++toastSeq.current
    setToasts((prev) => [...prev, { id, message, ok }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('udemy-admin-auth') !== '1') {
      window.location.href = '/admin'
    }
  }, [])

  const fetchRoadmaps = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/roadmaps', { headers: AUTH_HDR })
      if (!res.ok) return
      const json = await res.json() as { data: RoadmapRecord[] }
      setRoadmaps(json.data ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (mounted) fetchRoadmaps()
  }, [mounted, fetchRoadmaps])

  // ── Step helpers ──────────────────────────────────────────────────────────

  function addStep() {
    setSteps((prev) => [...prev, emptyStep(prev.length)])
  }

  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateStep(idx: number, field: keyof StepForm, value: string) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean)
      const res = await fetch('/api/admin/roadmaps', {
        method:  'POST',
        headers: { ...AUTH_HDR, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:               title.trim(),
          description:         desc.trim()      || null,
          category:            category.trim()  || null,
          steps:               stepsToInsert(steps),
          associated_keywords: kws,
        }),
      })
      const json = await res.json() as { error?: string }
      if (res.ok) {
        addToast('تم إضافة المسار بنجاح')
        setTitle(''); setDesc(''); setCategory(''); setKeywords('')
        setSteps([emptyStep(0)])
        await fetchRoadmaps()
      } else {
        addToast(String(json.error ?? 'حدث خطأ'), false)
      }
    } catch (err) {
      addToast('خطأ في الشبكة: ' + String(err), false)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function confirmDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/admin/roadmaps', {
        method:  'DELETE',
        headers: { ...AUTH_HDR, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      })
      if (res.ok) {
        addToast('تم حذف المسار')
        setRoadmaps((prev) => prev.filter((r) => r.id !== id))
      } else {
        addToast('فشل الحذف', false)
      }
    } catch {
      addToast('خطأ في الحذف', false)
    } finally {
      setDeleting(null)
      setPendingDel(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  const iCls  = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-500 transition-colors'
  const taCls = iCls + ' resize-none'
  const kwCount    = keywords.split(',').filter((k) => k.trim()).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-md shadow-lg text-xs font-semibold text-white pointer-events-auto ${t.ok ? 'bg-emerald-600' : 'bg-red-500'}`}>
              {t.ok ? '✓' : '✗'} {t.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            ← لوحة الإدارة
          </Link>
          <span className="text-slate-200 select-none">|</span>
          <span className="text-xs font-semibold text-slate-700">إدارة المسارات المهنية</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">Roadmaps</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Add form ── */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">إضافة مسار جديد</h2>
            <p className="text-xs text-slate-400 mt-0.5">يُحفظ مباشرة في جدول roadmaps في Supabase</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {/* Title + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  عنوان المسار <span className="text-red-500">*</span>
                </label>
                <input className={iCls} value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="مطوّر الواجهة الأمامية" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">الفئة</label>
                <input className={iCls} value={category} onChange={(e) => setCategory(e.target.value)}
                  placeholder="تطوير الويب" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">الوصف</label>
              <textarea className={taCls} rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="وصف مختصر للمسار المهني..." />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الكلمات المفتاحية
                <span className="font-normal text-slate-400 ms-1">(مفصولة بفاصلة – تُستخدم لربط الكوبونات تلقائياً)</span>
              </label>
              <input className={iCls} value={keywords} onChange={(e) => setKeywords(e.target.value)}
                placeholder="React, Next.js, TypeScript, CSS" />
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-700">المراحل والخطوات</label>
                <button type="button" onClick={addStep}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors">
                  + إضافة مرحلة
                </button>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مرحلة {idx + 1}</span>
                      {steps.length > 1 && (
                        <button type="button" onClick={() => removeStep(idx)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">
                          حذف المرحلة
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">تسمية المرحلة</label>
                        <input className={iCls} value={step.phase}
                          onChange={(e) => updateStep(idx, 'phase', e.target.value)}
                          placeholder="المرحلة 1" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">عنوان المرحلة</label>
                        <input className={iCls} value={step.title}
                          onChange={(e) => updateStep(idx, 'title', e.target.value)}
                          placeholder="أساسيات الويب" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          المهارات <span className="font-normal">(مفصولة بفاصلة)</span>
                        </label>
                        <input className={iCls} value={step.skills}
                          onChange={(e) => updateStep(idx, 'skills', e.target.value)}
                          placeholder="HTML5, CSS3, JavaScript ES6+" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">المدة الزمنية</label>
                        <input className={iCls} value={step.duration}
                          onChange={(e) => updateStep(idx, 'duration', e.target.value)}
                          placeholder="6 – 8 أسابيع" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {steps.length} مرحلة · {kwCount} كلمة مفتاحية
              </p>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60">
                {saving ? 'جاري الحفظ...' : 'حفظ المسار'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Existing roadmaps ── */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">المسارات الموجودة</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'جاري التحميل...' : roadmaps.length + ' مسار في قاعدة البيانات'}
              </p>
            </div>
            <button type="button" onClick={fetchRoadmaps} disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50">
              تحديث
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">لا توجد مسارات في قاعدة البيانات بعد</p>
              <p className="text-xs text-slate-300 mt-1">أضف مساراً باستخدام النموذج أعلاه</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {roadmaps.map((rm) => {
                const kws       = rm.associated_keywords ?? []
                const stepCount = (rm.steps ?? []).length
                return (
                  <div key={rm.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{rm.title}</p>
                          {rm.category && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-sm shrink-0">
                              {rm.category}
                            </span>
                          )}
                        </div>
                        {rm.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">{rm.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span>{stepCount} مراحل</span>
                          {kws.slice(0, 4).map((kw) => (
                            <span key={kw} className="bg-slate-100 px-1.5 py-0.5 rounded-sm">{kw}</span>
                          ))}
                          {kws.length > 4 && <span>+{kws.length - 4}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={'/roadmaps/' + rm.id} target="_blank"
                          className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-sm hover:bg-white transition-colors">
                          عرض
                        </Link>
                        {pendingDel === rm.id ? (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500">متأكد؟</span>
                            <button onClick={() => confirmDelete(rm.id)} className="text-red-600 font-semibold hover:underline">نعم</button>
                            <button onClick={() => setPendingDel(null)} className="text-slate-400 hover:text-slate-700">لا</button>
                          </span>
                        ) : deleting === rm.id ? (
                          <span className="text-xs text-slate-400">يُحذف...</span>
                        ) : (
                          <button type="button" onClick={() => setPendingDel(rm.id)}
                            className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-2 py-1 rounded-sm hover:bg-red-50 transition-colors">
                            حذف
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
