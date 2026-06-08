import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface DeepSeekBody {
  choices: Array<{ message: { content: string } }>
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 503 })
  }

  let body: { title?: string; content?: string; keywords?: string }
  try {
    body = await req.json() as { title?: string; content?: string; keywords?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title = '', content = '', keywords = '' } = body

  // Reject empty submissions
  if (!title.trim() && !content.trim()) {
    return NextResponse.json({ error: 'title or content is required' }, { status: 400 })
  }

  const prompt = `أنت خبير في تحسين محركات البحث (SEO) للمحتوى العربي التقني.
بناءً على المقال التالي، قدّم تحسينات SEO احترافية:

العنوان الحالي: ${title}
الكلمات المفتاحية الحالية: ${keywords}
بداية المحتوى: ${content.slice(0, 600)}

المطلوب (أعد JSON فقط بدون نص إضافي):
{
  "optimizedTitle": "عنوان محسّن (40-60 حرف)",
  "metaDescription": "وصف الصفحة (140-160 حرف)",
  "suggestedKeywords": ["كلمة1", "كلمة2", "كلمة3", "كلمة4", "كلمة5"],
  "improvedIntro": "فقرة افتتاحية محسّنة (2-3 جمل)"
}`

  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body:    JSON.stringify({
        model:           'deepseek-chat',
        messages:        [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature:     0.4,
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reach DeepSeek API' }, { status: 502 })
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status))
    return NextResponse.json({ error: 'DeepSeek error: ' + errText }, { status: 502 })
  }

  try {
    const data   = await res.json() as DeepSeekBody
    const result = JSON.parse(data.choices[0].message.content)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
