'use client'

import { useState, useTransition } from 'react'
import { analyzeCvAction, generateCoverLetterAction } from './actions'
import type { CvAnalysisResult } from './actions'

function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70"
      aria-hidden="true"
    />
  )
}

function ScoreMeter({ score }: { score: number }) {
  const color =
    score >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : score >= 70
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-red-700 bg-red-50 border-red-200'
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-md border ${color}`}
    >
      {score}
      <span className="text-xs font-normal opacity-70">/100</span>
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {copied ? '✓ تم النسخ' : 'نسخ النص'}
    </button>
  )
}

const inputClass =
  'w-full text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400'

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
      {message}
    </div>
  )
}

function CvAnalyzerSection() {
  const [result, setResult] = useState<CvAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cvText = (
      e.currentTarget.elements.namedItem('cvText') as HTMLTextAreaElement
    ).value.trim()
    if (!cvText) return
    setError(null)
    startTransition(async () => {
      try {
        const r = await analyzeCvAction(cvText)
        setResult(r)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      }
    })
  }

  return (
    <section className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <span className="text-xl" aria-hidden="true">📊</span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">محلّل السيرة الذاتية</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تقييم شامل وفق معايير ATS الألمانية والأوروبية
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="cv-text"
            className="block text-xs font-medium text-slate-500 mb-1.5"
          >
            نص السيرة الذاتية
          </label>
          <textarea
            id="cv-text"
            name="cvText"
            rows={10}
            required
            disabled={isPending}
            placeholder="الصق نص سيرتك الذاتية كاملاً هنا (بالعربية أو الإنجليزية)..."
            className={`${inputClass} resize-none`}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending && <Spinner />}
          {isPending ? 'جاري التحليل...' : 'حلّل السيرة الذاتية'}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}

      {result && !isPending && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">التقييم الكلي:</span>
            <ScoreMeter score={result.score} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              تحليل مفصّل
            </p>
            <ul className="space-y-2.5">
              {result.feedback.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function CoverLetterSection() {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const userData = {
      name: fd.get('name') as string,
      jobTitle: fd.get('jobTitle') as string,
      company: fd.get('company') as string,
      skills: fd.get('skills') as string,
    }
    setError(null)
    startTransition(async () => {
      try {
        const letter = await generateCoverLetterAction(userData)
        setResult(letter)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      }
    })
  }

  return (
    <section className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <span className="text-xl" aria-hidden="true">✉</span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">مولّد خطاب التغطية</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            خطاب احترافي مخصص بالذكاء الاصطناعي
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cl-name" className="block text-xs font-medium text-slate-500 mb-1.5">
              الاسم الكامل
            </label>
            <input
              id="cl-name"
              name="name"
              type="text"
              required
              disabled={isPending}
              placeholder="محمد أحمد"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cl-job" className="block text-xs font-medium text-slate-500 mb-1.5">
              المسمى الوظيفي المستهدف
            </label>
            <input
              id="cl-job"
              name="jobTitle"
              type="text"
              required
              disabled={isPending}
              placeholder="مهندس برمجيات"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cl-company" className="block text-xs font-medium text-slate-500 mb-1.5">
              الشركة المستهدفة
            </label>
            <input
              id="cl-company"
              name="company"
              type="text"
              required
              disabled={isPending}
              placeholder="SAP AG"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cl-skills" className="block text-xs font-medium text-slate-500 mb-1.5">
            المهارات والخبرات
          </label>
          <textarea
            id="cl-skills"
            name="skills"
            rows={3}
            required
            disabled={isPending}
            placeholder="5 سنوات خبرة في Python وTypeScript، إتقان بناء REST APIs..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending && <Spinner />}
          {isPending ? 'جاري الكتابة...' : 'ولّد خطاب التغطية'}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}

      {result && !isPending && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              الخطاب المُولَّد
            </p>
            <CopyButton text={result} />
          </div>
          <div className="border border-slate-200 rounded-md px-5 py-5 text-sm text-slate-800 leading-loose whitespace-pre-wrap bg-slate-50">
            {result}
          </div>
        </div>
      )}
    </section>
  )
}

export default function CareerTools() {
  return (
    <div className="space-y-6">
      <CvAnalyzerSection />
      <CoverLetterSection />
    </div>
  )
}
