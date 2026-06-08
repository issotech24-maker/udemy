'use client'

import {
  useState,
  useTransition,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from 'react'
import {
  analyzeCvAction,
  generateCoverLetterAction,
  extractFileTextAction,
} from './actions'
import type { CvAnalysisResult } from './actions'

// ─── Shared primitives ────────────────────────────────────────────────────────

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
    <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-md border ${color}`}>
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
      className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {copied ? '✓ تم النسخ' : 'نسخ النص'}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
      {message}
    </div>
  )
}

const inputClass =
  'w-full text-sm border border-gray-200 rounded-md px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400'

// ─── Shared file types ────────────────────────────────────────────────────────

type UploadedFile = { name: string; text: string }

// ─── Shared FileDropzone ──────────────────────────────────────────────────────

type FileDropzoneProps = {
  uploadedFile: UploadedFile | null
  onFile:       (f: UploadedFile) => void
  onClear:      () => void
  onError:      (msg: string) => void
  disabled?:    boolean
  inputId?:     string
}

function FileDropzone({
  uploadedFile,
  onFile,
  onClear,
  onError,
  disabled = false,
  inputId = 'file-dropzone',
}: FileDropzoneProps) {
  const [dragOver,      setDragOver]      = useState(false)
  const [isExtracting,  setIsExtracting]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Read the file as a base64 string (via data URL) — works correctly for
  // binary formats like PDF/DOCX unlike readAsText which mangles binary bytes.
  function readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        // Strip the "data:<mime>;base64," prefix
        resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
      }
      reader.onerror = () => reject(new Error('read-error'))
      reader.readAsDataURL(file)
    })
  }

  async function processFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext !== 'pdf' && ext !== 'docx') {
      onError('الملفات المقبولة: PDF أو DOCX فقط')
      return
    }
    setIsExtracting(true)
    try {
      const base64 = await readAsBase64(file)
      // Server action: robust PDF/DOCX text extraction with normalisation
      const text   = await extractFileTextAction(base64, file.name)
      onFile({ name: file.name, text })
    } catch (err) {
      onError(err instanceof Error ? err.message : 'تعذّر قراءة الملف')
    } finally {
      setIsExtracting(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onClear()
    if (inputRef.current) inputRef.current.value = ''
  }

  const isLocked = disabled || isExtracting

  return (
    <>
      <div
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-label="منطقة رفع الملف — اسحب ملفك هنا أو انقر للاختيار"
        onDragOver={(e) => { e.preventDefault(); if (!isLocked) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={isLocked ? undefined : handleDrop}
        onClick={() => !isLocked && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!isLocked && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click()
        }}
        className={`cursor-pointer rounded-md border-2 border-dashed transition-colors px-6 py-8 text-center select-none ${
          isLocked && !isExtracting
            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-slate-50'
            : isExtracting
            ? 'border-blue-200 bg-blue-50 cursor-wait'
            : dragOver
            ? 'border-blue-400 bg-blue-50'
            : uploadedFile
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        {isExtracting ? (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <Spinner />
            <p className="text-sm text-slate-500">جاري قراءة الملف...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-emerald-700">{uploadedFile.name}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors"
            >
              إزالة الملف
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <svg
              className="w-8 h-8 text-slate-300"
              fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-slate-600">
              اسحب الملف هنا أو{' '}
              <span className="font-semibold text-blue-600">اختر من جهازك</span>
            </p>
            <p className="text-xs text-slate-400">PDF, DOCX · حجم أقصى 5 ميغابايت</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        disabled={isLocked}
        className="sr-only"
        aria-label="رفع الملف"
      />
    </>
  )
}

// ─── CV Analyzer ──────────────────────────────────────────────────────────────

function CvAnalyzerSection() {
  const [result,       setResult]       = useState<CvAnalysisResult | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [isPending,    startTransition] = useTransition()
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const textarea = e.currentTarget.elements.namedItem('cvText') as HTMLTextAreaElement
    const cvText   = uploadedFile?.text || textarea.value.trim()
    if (!cvText) {
      setError('يرجى إدخال نص السيرة الذاتية أو رفع ملف')
      return
    }
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
    <section className="bg-white border border-gray-200 rounded-md p-6 space-y-5">

      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
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
          <label htmlFor="cv-text" className="block text-xs font-medium text-slate-500 mb-1.5">
            الصق نص السيرة الذاتية
          </label>
          <textarea
            id="cv-text"
            name="cvText"
            rows={10}
            disabled={isPending || !!uploadedFile}
            placeholder="الصق نص سيرتك الذاتية كاملاً هنا (بالعربية أو الإنجليزية)..."
            className={`${inputClass} resize-none${uploadedFile ? ' opacity-40 cursor-not-allowed' : ''}`}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-slate-400 select-none">أو</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">رفع ملف السيرة الذاتية</p>
          <FileDropzone
            inputId="cv-analyzer-file"
            uploadedFile={uploadedFile}
            onFile={(f) => { setUploadedFile(f); setError(null) }}
            onClear={() => setUploadedFile(null)}
            onError={setError}
            disabled={isPending}
          />
        </div>

        <p className="text-xs text-slate-500 bg-slate-50 border border-gray-200 rounded-md px-4 py-3 leading-relaxed">
          🔒 نحن نحترم خصوصيتك بالكامل: ملفك يتم تحليله فوراً في الذاكرة ولا يتم تخزينه أو مشاركته مع أي جهة خارجية.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending && <Spinner />}
          {isPending ? 'جاري التحليل...' : 'حلّل السيرة الذاتية'}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}

      {result && !isPending && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
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
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
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

// ─── Cover Letter ─────────────────────────────────────────────────────────────

function CoverLetterSection() {
  const [result,    setResult]       = useState<string | null>(null)
  const [error,     setError]        = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [cvFile,    setCvFile]       = useState<UploadedFile | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cvFile) {
      setError('يرجى رفع ملف السيرة الذاتية أولاً')
      return
    }
    if (!cvFile.text) {
      setError('تعذّر استخراج النص من الملف — تأكد أن الملف يحتوي على نص قابل للقراءة')
      return
    }
    const fd             = new FormData(e.currentTarget)
    const jobDescription = fd.get('jobDescription') as string
    setError(null)
    startTransition(async () => {
      try {
        const letter = await generateCoverLetterAction({
          jobDescription,
          cvText: cvFile.text,
        })
        setResult(letter)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
      }
    })
  }

  return (
    <section className="bg-white border border-gray-200 rounded-md p-6 space-y-5">

      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <span className="text-xl" aria-hidden="true">✉</span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">مولّد خطاب التغطية</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            أدخل وصف الوظيفة وارفع سيرتك الذاتية — يُولَّد الخطاب مخصصاً بدقة
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label htmlFor="cl-jd" className="block text-xs font-medium text-slate-500 mb-1.5">
            وصف الوظيفة
            <span className="font-normal text-slate-400 ms-1.5">(Job Description)</span>
          </label>
          <textarea
            id="cl-jd"
            name="jobDescription"
            rows={6}
            required
            disabled={isPending}
            placeholder="الصق وصف الوظيفة كاملاً هنا (المهام، المتطلبات، المهارات المطلوبة)..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">
            قم برفع سيرتك الذاتية
            <span className="font-normal text-slate-400 ms-1">(PDF أو Word)</span>
          </p>
          <FileDropzone
            inputId="cl-cv-file"
            uploadedFile={cvFile}
            onFile={(f) => { setCvFile(f); setError(null) }}
            onClear={() => setCvFile(null)}
            onError={setError}
            disabled={isPending}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending && <Spinner />}
          {isPending ? 'جاري الكتابة...' : 'ولّد خطاب التغطية'}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}

      {result && !isPending && (
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              الخطاب المُولَّد
            </p>
            <CopyButton text={result} />
          </div>
          <div className="border border-gray-200 rounded-md px-5 py-5 text-sm text-slate-800 leading-loose whitespace-pre-wrap bg-slate-50">
            {result}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function CareerTools() {
  return (
    <div className="space-y-6">
      <CvAnalyzerSection />
      <CoverLetterSection />
    </div>
  )
}
