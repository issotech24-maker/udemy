'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function calcSeoScore(
  title: string, slug: string, content: string, keywords: string
): { score: number; checks: { label: string; passed: boolean; weight: number }[] } {
  const wc  = wordCount(content)
  const kws = keywords.split(',').map((k) => k.trim()).filter(Boolean)
  const kwInContent = kws.length > 0 && kws.some((kw) =>
    content.toLowerCase().includes(kw.toLowerCase())
  )
  const checks = [
    { label: 'عنوان بين 40–60 حرف',        passed: title.length >= 40 && title.length <= 60, weight: 20 },
    { label: 'Slug صالح (a-z, 0-9, -)',   passed: Boolean(slug) && /^[a-z0-9-]+$/.test(slug), weight: 15 },
    { label: 'محتوى 300+ كلمة',            passed: wc >= 300,        weight: 25 },
    { label: 'ثلاث كلمات مفتاحية أو أكثر', passed: kws.length >= 3, weight: 20 },
    { label: 'كلمات مفتاحية في المحتوى',   passed: kwInContent,      weight: 20 },
  ]
  const score = checks.reduce((total, c) => total + (c.passed ? c.weight : 0), 0)
  return { score, checks }
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  const ring  = score >= 70
    ? 'border-emerald-300 bg-emerald-50'
    : score >= 40 ? 'border-amber-300 bg-amber-50'
    : 'border-red-300 bg-red-50'
  return (
    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 shrink-0 ${ring}`}>
      <span className={`text-2xl font-bold tabular-nums leading-none ${color}`}>{score}</span>
      <span className="text-[9px] text-slate-400 mt-0.5">/ 100</span>
    </div>
  )
}

// ─── AI result type ───────────────────────────────────────────────────────────

type AiResult = {
  optimizedTitle?:   string
  metaDescription?:  string
  suggestedKeywords?: string[]
  improvedIntro?:    string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogNewPage() {
  const [mounted,    setMounted]    = useState(false)
  const [title,      setTitle]      = useState('')
  const [slug,       setSlug]       = useState('')
  const [content,    setContent]    = useState('')
  const [keywords,   setKeywords]   = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [saveMsg,    setSaveMsg]    = useState<{ text: string; ok: boolean } | null>(null)
  const [aiResult,   setAiResult]   = useState<AiResult | null>(null)

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem('udemy-admin-auth') !== '1') {
      window.location.href = '/admin'
    }
  }, [])

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title))
  }, [title, slugEdited])

  const wc = wordCount(content)
  const { score, checks } = calcSeoScore(title, slug, content, keywords)

  const CRON_KEY = process.env.NEXT_PUBLIC_CRON_SECRET ?? 'my_super_secret_cron_key_4352'

  async function handleOptimize() {
    if (!title && !content) return
    setOptimizing(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/blog/optimize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, content, keywords }),
      })
      if (res.ok) setAiResult(await res.json() as AiResult)
    } catch { /* ignore */ }
    finally { setOptimizing(false) }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/admin/blog', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + CRON_KEY },
        body:    JSON.stringify({ title, slug, content, keywords }),
      })
      const data = await res.json() as { error?: string }
      setSaveMsg(res.ok
        ? { text: 'تم حفظ المقال بنجاح', ok: true }
        : { text: String(data.error ?? 'حدث خطأ'), ok: false }
      )
    } catch (err) {
      setSaveMsg({ text: 'خطأ في الشبكة: ' + String(err), ok: false })
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  const iCls  = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-500 transition-colors'
  const taCls = iCls + ' resize-none'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              ← لوحة الإدارة
            </Link>
            <span className="text-slate-200 select-none">|</span>
            <span className="text-xs font-semibold text-slate-700">مقال جديد</span>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-sm">Blog</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${
            score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : score >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-red-50 text-red-500 border-red-200'
          }`}>SEO {score}/100</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main form ── */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">العنوان</label>
                <span className={`text-[10px] tabular-nums ${
                  title.length > 60 ? 'text-red-500 font-semibold' :
                  title.length >= 40 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                }`}>{title.length} حرف</span>
              </div>
              <input className={iCls} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان المقال..." required />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">الـ Slug</label>
              <div className="flex">
                <span className="flex items-center px-3 border border-e-0 border-slate-200 rounded-s-md bg-slate-50 text-xs text-slate-400 whitespace-nowrap">
                  /blog/
                </span>
                <input
                  className="flex-1 border border-slate-200 rounded-e-md px-3 py-2 text-sm font-mono text-slate-700 placeholder-slate-400 outline-none focus:border-slate-500 transition-colors"
                  value={slug} dir="ltr"
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                  placeholder="article-slug"
                />
              </div>
              {slug && !/^[a-z0-9-]+$/.test(slug) && (
                <p className="text-[10px] text-red-500 mt-1">Slug: أحرف إنجليزية صغيرة وأرقام وشرطات فقط</p>
              )}
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الكلمات المفتاحية
                <span className="font-normal text-slate-400 ms-1">(مفصولة بفاصلة)</span>
              </label>
              <input className={iCls} value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Next.js, React, تطوير الويب, TypeScript" />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">المحتوى</label>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className={`tabular-nums font-semibold ${
                    wc >= 300 ? 'text-emerald-600' : wc >= 100 ? 'text-amber-500' : ''
                  }`}>{wc} كلمة</span>
                  <span>{content.length} حرف</span>
                </div>
              </div>
              <textarea className={taCls} rows={16} value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب محتوى المقال هنا..." required />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-60">
                {saving ? 'جاري الحفظ...' : 'نشر المقال'}
              </button>
              {saveMsg && (
                <span className={`text-xs font-medium ${saveMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {saveMsg.text}
                </span>
              )}
            </div>
          </form>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* SEO Score */}
            <div className="bg-white border border-slate-200 rounded-md p-5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">درجة السيو</p>
              <div className="flex items-center gap-4 mb-4">
                <ScoreRing score={score} />
                <p className={`text-xs font-semibold leading-relaxed ${
                  score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {score >= 70 ? 'ممتاز – جاهز للنشر' : score >= 40 ? 'جيد – يحتاج تحسين' : 'ضعيف – يجب التحسين'}
                </p>
              </div>
              <div className="space-y-2">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      c.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>{c.passed ? '✓' : '○'}</span>
                    <span className={`text-[11px] flex-1 ${c.passed ? 'text-slate-700' : 'text-slate-400'}`}>{c.label}</span>
                    <span className="text-[10px] text-slate-300">+{c.weight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Optimize */}
            <div className="bg-white border border-slate-200 rounded-md p-5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">تحسين بالذكاء الاصطناعي</p>
              <button type="button" onClick={handleOptimize}
                disabled={optimizing || (!title && !content)}
                className="w-full py-2.5 border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {optimizing
                  ? <><span className="w-3.5 h-3.5 border border-violet-400 border-t-transparent rounded-full animate-spin" />يحلل...</>
                  : <>✦ تحسين مع DeepSeek</>
                }
              </button>

              {aiResult && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  {aiResult.optimizedTitle && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-slate-400">عنوان مقترح</p>
                        <button type="button" onClick={() => setTitle(aiResult.optimizedTitle!)}
                          className="text-[10px] font-semibold text-violet-600 hover:underline">تطبيق</button>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-md p-2">{aiResult.optimizedTitle}</p>
                    </div>
                  )}
                  {aiResult.metaDescription && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 mb-1">وصف الصفحة</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-md p-2">{aiResult.metaDescription}</p>
                    </div>
                  )}
                  {aiResult.suggestedKeywords && aiResult.suggestedKeywords.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-slate-400">كلمات مفتاحية مقترحة</p>
                        <button type="button"
                          onClick={() => setKeywords((aiResult.suggestedKeywords ?? []).join(', '))}
                          className="text-[10px] font-semibold text-violet-600 hover:underline">تطبيق الكل</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.suggestedKeywords.map((kw) => (
                          <span key={kw} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-sm">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiResult.improvedIntro && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-slate-400">مقدمة مقترحة</p>
                        <button type="button"
                          onClick={() => setContent(aiResult.improvedIntro + '\n\n' + content)}
                          className="text-[10px] font-semibold text-violet-600 hover:underline">إضافة للمحتوى</button>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-md p-2 leading-relaxed">{aiResult.improvedIntro}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white border border-slate-200 rounded-md p-5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">إحصائيات المحتوى</p>
              <div className="space-y-3">
                {[
                  { label: 'الكلمات',          value: wc,             target: 300, unit: 'كلمة' },
                  { label: 'الأحرف',           value: content.length, target: 1500, unit: 'حرف' },
                  { label: 'الكلمات المفتاحية', value: keywords.split(',').filter((k) => k.trim()).length, target: 5, unit: 'كلمة' },
                ].map((stat) => {
                  const pct = Math.min(100, Math.round((stat.value / stat.target) * 100))
                  return (
                    <div key={stat.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">{stat.label}</span>
                        <span className="font-semibold text-slate-900 tabular-nums">{stat.value} {stat.unit}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-slate-300'
                          }`}
                          style={{ width: pct + '%' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
