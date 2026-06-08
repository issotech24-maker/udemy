'use server'

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

  const p = parsed as { score?: unknown; feedback?: unknown }
  const score    = Math.max(0, Math.min(100, Math.round(Number(p.score ?? 0))))
  const feedback = Array.isArray(p.feedback)
    ? (p.feedback as unknown[]).map(String)
    : []

  return { score, feedback }
}

export async function generateCoverLetterAction(userData: {
  target:     string
  background: string
}): Promise<string> {
  return callDeepSeek([
    {
      role: 'system',
      content: `أنت كاتب محترف متخصص في صياغة خطابات التغطية المقنعة باللغة العربية للشركات الدولية، مع مراعاة المعايير المهنية الألمانية والأوروبية. اكتب خطاباً احترافياً ومخصصاً يعكس قيمة المرشح بشكل مميز.`,
    },
    {
      role: 'user',
      content: `اكتب خطاب تغطية احترافياً باللغة العربية بناءً على المعطيات التالية:

الوظيفة المستهدفة والشركة: ${userData.target}
نبذة عن المتقدم وخبراته: ${userData.background}

المتطلبات:
• مقدمة جذابة تلفت انتباه صاحب العمل فوراً
• ربط ذكي بين خبرات المتقدم ومتطلبات الوظيفة
• إبراز القيمة المضافة الفريدة للمرشح
• خاتمة بدعوة واضحة ومقنعة للتواصل
• 3 إلى 4 فقرات متماسكة واحترافية`,
    },
  ])
}
