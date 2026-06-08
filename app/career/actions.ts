'use server'

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// PDF and DOCX text extraction is done with zero npm dependencies:
//   • PDF  → pure-JS binary parser (BT/ET blocks + Tj/TJ operators, UTF-16BE)
//   • DOCX → built-in node:zlib inflateRawSync + ZIP container parser
// This avoids pdfjs-dist worker-thread crashes on Vercel serverless.
// All public server actions return discriminated unions ({ ok }) and never throw,
// so no unhandled rejection can propagate to the Next.js render pipeline.

import { inflateRawSync } from 'node:zlib'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type CvAnalysisResult = {
  score: number
  feedback: string[]
}

type DeepSeekMessage    = { role: 'system' | 'user'; content: string }
type DeepSeekResponse   = { choices: Array<{ message: { content: string } }> }

// ─── DeepSeek helper ──────────────────────────────────────────────────────────

async function callDeepSeek(
  messages: DeepSeekMessage[],
  json = false,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY غير مضبوط – أضف المفتاح في ملف .env.local')

  const body: Record<string, unknown> = { model: 'deepseek-chat', messages, temperature: 0.7 }
  if (json) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`خطأ في DeepSeek API: ${res.status} – ${txt.slice(0, 200)}`)
  }
  const data = (await res.json()) as DeepSeekResponse
  return data.choices[0].message.content
}

// ─── Pure-JS PDF text extraction ──────────────────────────────────────────────

/**
 * Decode a PDF literal-string escape sequence.
 * Handles \n \r \t \b \f \\ \( \) and \ddd octal.
 * Detects UTF-16BE BOM (0xFE 0xFF) and converts to a JS string.
 */
function decodePdfLiteralString(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; ) {
    if (raw[i] !== '\\') { out += raw[i++]; continue }
    i++
    if (i >= raw.length) break
    const ch = raw[i]
    if (ch === 'n')  { out += '\n'; i++; continue }
    if (ch === 'r')  { out += '\r'; i++; continue }
    if (ch === 't')  { out += '\t'; i++; continue }
    if (ch === 'b')  { out += '\b'; i++; continue }
    if (ch === 'f')  { out += '\f'; i++; continue }
    if (ch === '(')  { out += '(';  i++; continue }
    if (ch === ')')  { out += ')';  i++; continue }
    if (ch === '\\') { out += '\\'; i++; continue }
    if (ch === '\n' || ch === '\r') { i++; continue } // PDF line continuation
    // Octal escape \ddd
    if (ch >= '0' && ch <= '7') {
      let oct = ch; i++
      if (i < raw.length && raw[i] >= '0' && raw[i] <= '7') { oct += raw[i++] }
      if (i < raw.length && raw[i] >= '0' && raw[i] <= '7') { oct += raw[i++] }
      out += String.fromCharCode(parseInt(oct, 8))
      continue
    }
    out += ch; i++
  }

  // UTF-16BE BOM → decode as Unicode (used for Arabic, CJK, etc.)
  if (out.length >= 2 &&
      out.charCodeAt(0) === 0xFE && out.charCodeAt(1) === 0xFF) {
    let uni = ''
    for (let j = 2; j + 1 < out.length; j += 2) {
      const cp = (out.charCodeAt(j) << 8) | out.charCodeAt(j + 1)
      if (cp > 0) {
        try { uni += String.fromCodePoint(cp) } catch { /* skip surrogates */ }
      }
    }
    return uni
  }

  return out
}

/**
 * Consume a PDF literal string starting at `pos` (the `(` character).
 * Returns the raw inner content and the index after the closing `)`.
 */
function readPdfLiteral(
  raw: string, pos: number,
): { content: string; end: number } {
  let depth = 1
  let i = pos + 1
  let content = ''
  while (i < raw.length && depth > 0) {
    const ch = raw[i]
    if (ch === '\\') {
      content += ch
      i++
      if (i < raw.length) { content += raw[i]; i++ }
      continue
    }
    if (ch === '(') { depth++; content += ch; i++; continue }
    if (ch === ')') { depth--; if (depth > 0) content += ch; i++; continue }
    content += ch; i++
  }
  return { content, end: i }
}

function extractPdfText(buf: Buffer): string {
  // latin1 (= binary): 1-to-1 byte-to-char, preserves all byte values
  const raw = buf.toString('latin1')
  const parts: string[] = []

  // ── Walk BT…ET blocks for text operators ─────────────────────────────────
  let searchFrom = 0
  for (;;) {
    const btIdx = raw.indexOf('BT', searchFrom)
    if (btIdx < 0) break
    // Must be a token boundary (preceded by whitespace/start, followed by whitespace/newline)
    const pre  = btIdx === 0 ? '\n' : raw[btIdx - 1]
    const post = btIdx + 2 < raw.length ? raw[btIdx + 2] : '\n'
    if (!/[\s\0]/.test(pre) || !/[\s\0]/.test(post)) { searchFrom = btIdx + 1; continue }

    const etIdx = raw.indexOf('ET', btIdx + 2)
    if (etIdx < 0) break

    const block = raw.slice(btIdx + 2, etIdx)
    let i = 0
    while (i < block.length) {
      if (block[i] === '(') {
        const { content, end } = readPdfLiteral(block, i)
        // Peek at the operator following this literal
        const after = block.slice(end).trimStart()
        if (/^(?:Tj|'|")\b/.test(after)) {
          const text = decodePdfLiteralString(content)
          if (text.trim()) parts.push(text)
        }
        i = end
      } else if (block[i] === '[') {
        // TJ array — may contain multiple strings interleaved with kerning numbers
        let depth = 1
        let j = i + 1
        const arrayStrings: string[] = []
        while (j < block.length && depth > 0) {
          if (block[j] === '[') { depth++; j++; continue }
          if (block[j] === ']') { depth--; j++; continue }
          if (block[j] === '(') {
            const { content, end } = readPdfLiteral(block, j)
            arrayStrings.push(content)
            j = end
          } else { j++ }
        }
        const after = block.slice(j).trimStart()
        if (/^TJ\b/.test(after)) {
          for (const s of arrayStrings) {
            const text = decodePdfLiteralString(s)
            if (text.trim()) parts.push(text)
          }
        }
        i = j
      } else { i++ }
    }
    parts.push('\n')
    searchFrom = etIdx + 2
  }

  // ── Fallback: global Tj scan for PDFs without clear BT/ET structure ──────
  if (parts.join('').trim().length < 80) {
    parts.length = 0
    // Simple greedy match: (string) Tj
    let pos = 0
    while (pos < raw.length) {
      const openParen = raw.indexOf('(', pos)
      if (openParen < 0) break
      const { content, end } = readPdfLiteral(raw, openParen)
      const after = raw.slice(end).trimStart()
      if (/^Tj\b/.test(after)) {
        const text = decodePdfLiteralString(content)
        if (text.trim()) parts.push(text + ' ')
      }
      pos = end
    }
  }

  const joined = parts.join('')
  return joined
    .normalize('NFC')
    .replace(/[^\S\n]{4,}/g, '   ')
    .trim()
}

// ─── Pure-JS DOCX text extraction (node:zlib, no npm deps) ───────────────────

function extractDocxText(buf: Buffer): string {
  // DOCX is a ZIP archive containing word/document.xml.
  // Parse the ZIP Central Directory, locate that file, decompress, strip XML tags.

  // Find End-of-Central-Directory signature (0x50 4b 05 06)
  let eocd = -1
  const maxSearch = Math.min(buf.length, 65_558)
  for (let i = buf.length - 22; i >= buf.length - maxSearch; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b &&
        buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i; break
    }
  }
  if (eocd < 0) throw new Error('Not a valid ZIP/DOCX file (no EOCD found)')

  const numEntries   = buf.readUInt16LE(eocd + 10)
  const centralStart = buf.readUInt32LE(eocd + 16)

  let pos = centralStart
  for (let e = 0; e < numEntries; e++) {
    // Central Directory File Header sig: 0x50 4b 01 02
    if (buf[pos] !== 0x50 || buf[pos + 1] !== 0x4b ||
        buf[pos + 2] !== 0x01 || buf[pos + 3] !== 0x02) break

    const compression    = buf.readUInt16LE(pos + 10)
    const compressedSize = buf.readUInt32LE(pos + 20)
    const fileNameLen    = buf.readUInt16LE(pos + 28)
    const extraLen       = buf.readUInt16LE(pos + 30)
    const commentLen     = buf.readUInt16LE(pos + 32)
    const localOffset    = buf.readUInt32LE(pos + 42)
    const fileName       = buf.toString('utf8', pos + 46, pos + 46 + fileNameLen)

    if (fileName === 'word/document.xml') {
      // Read Local File Header to find data start
      const lhFileNameLen = buf.readUInt16LE(localOffset + 26)
      const lhExtraLen    = buf.readUInt16LE(localOffset + 28)
      const dataStart     = localOffset + 30 + lhFileNameLen + lhExtraLen
      const compressed    = buf.subarray(dataStart, dataStart + compressedSize)

      const xml = compression === 0
        ? compressed.toString('utf8')
        : inflateRawSync(compressed).toString('utf8')

      return xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g,  '&')
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, h) =>
          String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) =>
          String.fromCodePoint(parseInt(d, 10)))
        .normalize('NFC')
        .replace(/[^\S\n]{4,}/g, '   ')
        .trim()
    }

    pos += 46 + fileNameLen + extraLen + commentLen
  }

  throw new Error('word/document.xml not found in DOCX archive')
}

// ─── Quality gate ─────────────────────────────────────────────────────────────

/**
 * Returns true when more than 25 % of characters fall outside expected ranges:
 * printable ASCII, Arabic Unicode, Latin Extended, common punctuation.
 * Used to detect extraction results that are too corrupted to be useful.
 */
function isResultCorrupted(text: string): boolean {
  const suspicious = text.replace(
    /[\x09\x0A\x0D\x20-\x7E\xC0-ɏ؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g,
    '',
  )
  return suspicious.length / Math.max(text.length, 1) > 0.25
}

// ─── Public server actions ────────────────────────────────────────────────────

/**
 * Extracts plain text from a base64-encoded PDF or DOCX file.
 * Always returns a discriminated union — never throws — so the Next.js
 * render pipeline is protected from unhandled exceptions.
 */
export async function extractFileTextAction(
  fileBase64: string,
  fileName:   string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    // Reject files > ~7 MB binary (≈ 9.5 MB base64) to prevent timeout/OOM
    if (fileBase64.length > 12_700_000) {
      return { ok: false, error: 'حجم الملف كبير جداً — الحد الأقصى المسموح به 7 ميغابايت' }
    }
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    const buf = Buffer.from(fileBase64, 'base64')

    let text: string
    if (ext === 'pdf') {
      text = extractPdfText(buf)
    } else if (ext === 'docx') {
      text = extractDocxText(buf)
    } else {
      return { ok: false, error: 'يُقبل ملفات PDF وDOCX فقط' }
    }

    if (!text || text.trim().length < 20) {
      return {
        ok: false,
        error:
          'تعذّر استخراج نص من هذا الملف — تأكد أنه يحتوي على نص قابل للنسخ وليس صوراً ممسوحة ضوئياً',
      }
    }

    if (isResultCorrupted(text)) {
      return {
        ok: false,
        error:
          'ظهر النص بشكل غير مقروء — جرّب حفظ الملف بصيغة PDF مُنشأة من نص (لا مسح ضوئي) أو DOCX',
      }
    }

    return { ok: true, text: text.trim() }
  } catch {
    return {
      ok: false,
      error:
        'حدث خطأ أثناء معالجة ملف الـ PDF برمجياً، يرجى المحاولة مرة أخرى أو التأكد من صيغة الملف',
    }
  }
}

// ─── CV Analysis ──────────────────────────────────────────────────────────────

export async function analyzeCvAction(cvText: string): Promise<CvAnalysisResult> {
  try {
    const content = await callDeepSeek(
      [
        {
          role: 'system',
          content: `أنت خبير في تقييم السير الذاتية وفق معايير ATS الألمانية والأوروبية الحديثة.
قيّم السيرة الذاتية المقدمة وأعد إجابتك حصراً بصيغة JSON باللغة العربية وفق هذه البنية الدقيقة:
{"score": رقم_صحيح_من_0_إلى_100, "feedback": ["نقطة 1", "نقطة 2", "نقطة 3"]}
يجب أن تتضمن feedback: نقاط القوة الواضحة، الأخطاء الهيكلية، والتوصيات التحسينية المحددة. لا تكتب أي نص خارج JSON.`,
        },
        { role: 'user', content: `قيّم هذه السيرة الذاتية:\n\n${cvText}` },
      ],
      true,
    )

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error('لم يتمكن النموذج من إرجاع تقييم منظّم، يرجى المحاولة مجدداً')
    }

    const p        = parsed as { score?: unknown; feedback?: unknown }
    const score    = Math.max(0, Math.min(100, Math.round(Number(p.score ?? 0))))
    const feedback = Array.isArray(p.feedback) ? (p.feedback as unknown[]).map(String) : []
    return { score, feedback }
  } catch (err) {
    throw err instanceof Error ? err : new Error('حدث خطأ غير متوقع أثناء التحليل')
  }
}

// ─── Cover Letter ─────────────────────────────────────────────────────────────

export async function generateCoverLetterAction(userData: {
  jobDescription: string
  cvText:         string
}): Promise<string> {
  try {
    return await callDeepSeek([
      {
        role: 'system',
        content: `Act as an expert HR recruiter. Analyze the provided Job Description and dynamically tailor a professional Cover Letter in Arabic based strictly on the highlights and experience found in the provided CV Text. The letter must be compelling, concise, and precisely aligned with the role requirements. Write in formal Arabic.`,
      },
      {
        role: 'user',
        content: `Job Description:\n${userData.jobDescription}\n\nCV Text:\n${userData.cvText}`,
      },
    ])
  } catch (err) {
    throw err instanceof Error ? err : new Error('حدث خطأ غير متوقع أثناء الكتابة')
  }
}
