'use server'

import { Buffer } from 'buffer'

export type CvAnalysisResult = {
  score: number
  feedback: string[]
}

type DeepSeekMessage = {
  role: 'system' | 'user'
  content: string
}

type DeepSeekResponseBody = {
  choices: Array<{ message: { content: string } }>
}

async function callDeepSeek(
  messages: DeepSeekMessage[],
  json: boolean = false
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY غير مضبوط – أضف المفتاح في ملف .env.local')
  }

  const body: Record<string, unknown> = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.7,
  }
  if (json) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`خطأ في DeepSeek API: ${res.status} – ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as DeepSeekResponseBody
  return data.choices[0].message.content
}

// ─── Text normalisation ───────────────────────────────────────────────────────

function normalizeText(raw: string): string {
  return (
    raw
      // Canonical Unicode — fixes Arabic shaped/combined characters
      .normalize('NFC')
      // Null bytes that sneak in from binary reads
      .replace(/\x00/g, '')
      // Unicode replacement character — signals a failed byte-to-char conversion
      .replace(/�/g, '')
      // Collapse excessive horizontal whitespace (≥ 4 spaces) down to 2
      .replace(/[^\S\r\n]{4,}/g, '  ')
      // Normalise line endings
      .replace(/\r\n|\r/g, '\n')
      .trim()
  )
}

/**
 * Returns true when > 20 % of characters are outside the expected ranges:
 * printable ASCII, Arabic Unicode blocks, Latin extended, common punctuation.
 * Used to decide whether a fallback extraction attempt is worth trying.
 */
function hasHighCorruption(text: string): boolean {
  const clean = text.replace(
    /[\x09\x0A\x0D\x20-\x7EÀ-ɏ؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g,
    ''
  )
  return clean.length / Math.max(text.length, 1) > 0.20
}

// ─── File text extraction ─────────────────────────────────────────────────────

/**
 * Server action: receives a base64-encoded file, extracts the plain text.
 * Handles PDF via pdf-parse (with UTF-8 normalisation + fallback pass) and
 * DOCX via mammoth. Both packages are listed in serverExternalPackages so
 * Next.js does not bundle them and their internal FS usage is safe.
 */
export async function extractFileTextAction(
  fileBase64: string,
  fileName:   string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const buf = Buffer.from(fileBase64, 'base64')

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (ext === 'pdf') {
    // Dynamic import keeps the module out of the Edge/client bundle.
    // @ts-expect-error — no default-export type when using dynamic import here
    const pdfParse = (await import('pdf-parse')).default as (
      dataBuffer: Buffer,
      options?: {
        max?: number
        pagerender?: (pageData: {
          getTextContent: () => Promise<{ items: Array<{ str: string }> }>
        }) => Promise<string>
      }
    ) => Promise<{ text: string; numpages: number }>

    let text = ''

    // Primary pass — standard extraction
    try {
      const result = await pdfParse(buf)
      text = normalizeText(result.text)
    } catch {
      // primary failed; will retry below
    }

    // Fallback pass — custom page renderer that joins tokens with spaces,
    // which better preserves Arabic word boundaries when the default
    // renderer drops inter-word spacing.
    if (!text || text.length < 80 || hasHighCorruption(text)) {
      try {
        const result2 = await pdfParse(buf, {
          // eslint-disable-next-line @typescript-eslint/require-await
          pagerender: async (pageData) => {
            const content = await pageData.getTextContent()
            return content.items.map((item) => item.str).join(' ') + '\n'
          },
        })
        const text2 = normalizeText(result2.text)
        if (text2.length > text.length) text = text2
      } catch {
        // keep whatever the primary pass produced
      }
    }

    if (!text || text.length < 20) {
      throw new Error(
        'تعذّر استخراج نص من هذا الملف — تأكد أنه PDF يحتوي على نص قابل للنسخ وليس صوراً ممسوحة ضوئياً'
      )
    }
    return text
  }

  // ── DOCX ────────────────────────────────────────────────────────────────────
  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const { value: raw } = await mammoth.extractRawText({ buffer: buf })
    const text = normalizeText(raw)
    if (!text || text.length < 20) {
      throw new Error('تعذّر استخراج نص من ملف DOCX')
    }
    return text
  }

  throw new Error('يُقبل ملفات PDF وDOCX فقط')
}

// ─── CV Analysis ──────────────────────────────────────────────────────────────

export async function analyzeCvAction(cvText: string): Promise<CvAnalysisResult> {
  const content = await callDeepSeek(
    [
      {
        role: 'system',
        content: `أنت خبير في تقييم السير الذاتية وفق معايير ATS الألمانية والأوروبية الحديثة.
قيّم السيرة الذاتية المقدمة وأعد إجابتك حصراً بصيغة JSON باللغة العربية وفق هذه البنية الدقيقة:
{"score": رقم_صحيح_من_0_إلى_100, "feedback": ["نقطة 1", "نقطة 2", "نقطة 3"]}
يجب أن تتضمن feedback: نقاط القوة الواضحة، الأخطاء الهيكلية، والتوصيات التحسينية المحددة. لا تكتب أي نص خارج JSON.`,
      },
      {
        role: 'user',
        content: `قيّم هذه السيرة الذاتية:\n\n${cvText}`,
      },
    ],
    true
  )

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('لم يتمكن النموذج من إرجاع تقييم منظّم، يرجى المحاولة مجدداً')
  }

  const p        = parsed as { score?: unknown; feedback?: unknown }
  const score    = Math.max(0, Math.min(100, Math.round(Number(p.score ?? 0))))
  const feedback = Array.isArray(p.feedback)
    ? (p.feedback as unknown[]).map(String)
    : []

  return { score, feedback }
}

// ─── Cover Letter ─────────────────────────────────────────────────────────────

export async function generateCoverLetterAction(userData: {
  jobDescription: string
  cvText:         string
}): Promise<string> {
  return callDeepSeek([
    {
      role: 'system',
      content: `Act as an expert HR recruiter. Analyze the provided Job Description and dynamically tailor a professional Cover Letter in Arabic based strictly on the highlights and experience found in the provided CV Text. The letter must be compelling, concise, and precisely aligned with the role requirements. Write in formal Arabic.`,
    },
    {
      role: 'user',
      content: `Job Description:\n${userData.jobDescription}\n\nCV Text:\n${userData.cvText}`,
    },
  ])
}
