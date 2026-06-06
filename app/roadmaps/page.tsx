import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'خارطة الطريق المهنية – UdemyRadar',
  description: 'مسارات مهنية تقنية مفصّلة مرتبطة بكوبونات الدورات النشطة',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = {
  phase: string
  title: string
  skills: string[]
  duration: string
}

type Roadmap = {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  total_duration: string
  steps: Step[]
  associated_keywords: string[]
}

// ─── Styling maps ─────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  'مبتدئ': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'متوسط': 'bg-amber-50 text-amber-700 border-amber-200',
  'متقدم': 'bg-rose-50 text-rose-700 border-rose-200',
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockRoadmaps: Roadmap[] = [
  {
    id: '1',
    title: 'مطوّر الواجهة الأمامية',
    description:
      'المسار الشامل لإتقان تطوير الواجهات الأمامية من الأساسيات إلى أدوات الإنتاج',
    category: 'تطوير الويب',
    difficulty: 'مبتدئ',
    total_duration: '6 أشهر',
    steps: [
      {
        phase: 'المرحلة 1',
        title: 'أساسيات الويب',
        skills: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Flexbox & Grid'],
        duration: '6 – 8 أسابيع',
      },
      {
        phase: 'المرحلة 2',
        title: 'إطارات العمل الحديثة',
        skills: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite'],
        duration: '6 – 8 أسابيع',
      },
      {
        phase: 'المرحلة 3',
        title: 'أدوات الإنتاج',
        skills: ['Next.js', 'Git & GitHub', 'CI/CD Basics', 'Testing'],
        duration: '4 – 5 أسابيع',
      },
      {
        phase: 'المرحلة 4',
        title: 'التخصص والتوظيف',
        skills: ['Web Performance', 'Accessibility', 'SEO', 'معرض أعمال'],
        duration: '3 – 4 أسابيع',
      },
    ],
    associated_keywords: ['React', 'Next.js', 'TypeScript', 'CSS'],
  },
  {
    id: '2',
    title: 'مطوّر الواجهة الخلفية',
    description:
      'بناء APIs قوية وقواعد بيانات وأنظمة خلفية قابلة للتوسع وفق أفضل الممارسات',
    category: 'تطوير الويب',
    difficulty: 'متوسط',
    total_duration: '5 أشهر',
    steps: [
      {
        phase: 'المرحلة 1',
        title: 'أساسيات الخادم',
        skills: ['Node.js', 'Express', 'HTTP/REST', 'PostgreSQL'],
        duration: '5 – 6 أسابيع',
      },
      {
        phase: 'المرحلة 2',
        title: 'قواعد البيانات المتقدمة',
        skills: ['SQL المتقدم', 'Prisma ORM', 'Redis', 'Supabase'],
        duration: '4 – 5 أسابيع',
      },
      {
        phase: 'المرحلة 3',
        title: 'الأمان والمصادقة',
        skills: ['JWT & Sessions', 'OAuth 2.0', 'RBAC', 'Rate Limiting'],
        duration: '3 – 4 أسابيع',
      },
      {
        phase: 'المرحلة 4',
        title: 'النشر والتوسع',
        skills: ['Docker', 'VPS & Cloud', 'Load Balancing', 'Logging'],
        duration: '3 – 4 أسابيع',
      },
    ],
    associated_keywords: ['Node.js', 'PostgreSQL', 'Docker', 'API'],
  },
  {
    id: '3',
    title: 'مهندس الذكاء الاصطناعي',
    description:
      'مسار متكامل من الأسس الرياضية إلى بناء نماذج LLM ونشر تطبيقات الذكاء الاصطناعي الحقيقية',
    category: 'ذكاء اصطناعي',
    difficulty: 'متقدم',
    total_duration: '10 أشهر',
    steps: [
      {
        phase: 'المرحلة 1',
        title: 'الأسس الرياضية والبرمجية',
        skills: ['Python', 'NumPy', 'Linear Algebra', 'Statistics'],
        duration: '6 – 8 أسابيع',
      },
      {
        phase: 'المرحلة 2',
        title: 'تعلم الآلة الكلاسيكي',
        skills: ['Scikit-learn', 'Pandas', 'Feature Engineering', 'Model Evaluation'],
        duration: '8 – 10 أسابيع',
      },
      {
        phase: 'المرحلة 3',
        title: 'التعلم العميق',
        skills: ['PyTorch', 'CNNs & RNNs', 'Transformers', 'Hugging Face'],
        duration: '8 – 10 أسابيع',
      },
      {
        phase: 'المرحلة 4',
        title: 'تطبيقات LLM',
        skills: ['LangChain', 'RAG', 'Fine-tuning', 'API Deployment'],
        duration: '6 – 8 أسابيع',
      },
    ],
    associated_keywords: ['Python', 'PyTorch', 'LangChain', 'AI'],
  },
  {
    id: '4',
    title: 'مهندس DevOps والبنية التحتية',
    description:
      'مسار تحويلي لإتقان عمليات التطوير والنشر وإدارة البنية التحتية السحابية',
    category: 'DevOps',
    difficulty: 'متوسط',
    total_duration: '7 أشهر',
    steps: [
      {
        phase: 'المرحلة 1',
        title: 'Linux والشبكات',
        skills: ['Linux CLI', 'Bash Scripting', 'TCP/IP', 'SSH & Security'],
        duration: '5 – 6 أسابيع',
      },
      {
        phase: 'المرحلة 2',
        title: 'الحاويات والتنسيق',
        skills: ['Docker', 'Kubernetes', 'Helm', 'Container Security'],
        duration: '6 – 8 أسابيع',
      },
      {
        phase: 'المرحلة 3',
        title: 'السحابة وCI/CD',
        skills: ['AWS / GCP', 'Terraform', 'GitHub Actions', 'ArgoCD'],
        duration: '6 – 8 أسابيع',
      },
      {
        phase: 'المرحلة 4',
        title: 'المراقبة والأمان',
        skills: ['Prometheus', 'Grafana', 'ELK Stack', 'أمان البنية'],
        duration: '4 – 5 أسابيع',
      },
    ],
    associated_keywords: ['Docker', 'Kubernetes', 'AWS', 'Linux'],
  },
  {
    id: '5',
    title: 'مطوّر تطبيقات الجوال',
    description:
      'بناء تطبيقات جوال احترافية متعددة المنصات من الصفر حتى النشر على متاجر التطبيقات',
    category: 'تطوير الجوال',
    difficulty: 'مبتدئ',
    total_duration: '6 أشهر',
    steps: [
      {
        phase: 'المرحلة 1',
        title: 'أساسيات Flutter وDart',
        skills: ['Dart Language', 'Flutter Widgets', 'Layouts', 'Animations'],
        duration: '5 – 6 أسابيع',
      },
      {
        phase: 'المرحلة 2',
        title: 'إدارة الحالة والـUI',
        skills: ['Riverpod / Bloc', 'Custom Themes', 'Responsive UI', 'Navigation'],
        duration: '5 – 6 أسابيع',
      },
      {
        phase: 'المرحلة 3',
        title: 'الخدمات والتخزين',
        skills: ['REST APIs', 'Firebase', 'SQLite / Hive', 'Push Notifications'],
        duration: '5 – 6 أسابيع',
      },
      {
        phase: 'المرحلة 4',
        title: 'النشر وما بعده',
        skills: ['App Store & Play Store', 'CI/CD Fastlane', 'Crash Reporting', 'Analytics'],
        duration: '3 – 4 أسابيع',
      },
    ],
    associated_keywords: ['Flutter', 'Dart', 'Firebase', 'Mobile'],
  },
]

// ─── Timeline component ───────────────────────────────────────────────────────

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-5">
          {/* Connector column — appears on the right in RTL */}
          <div className="flex flex-col items-center w-8 shrink-0">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center shrink-0 z-10 relative">
              <span className="text-xs font-bold text-slate-600 tabular-nums leading-none">
                {i + 1}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-px bg-slate-200 flex-1 mt-1" />
            )}
          </div>

          {/* Step content */}
          <div className={`flex-1 ${i < steps.length - 1 ? 'pb-5' : ''}`}>
            <div className="bg-white border border-slate-200 rounded-md p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  {step.phase}
                </span>
                <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-sm shrink-0 whitespace-nowrap">
                  {step.duration}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mb-2.5">{step.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {step.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoadmapsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">خارطة الطريق المهنية</h1>
        <p className="text-slate-500 text-sm">
          {mockRoadmaps.length} مسار مهني مفصّل – كل مرحلة مرتبطة تلقائياً بكوبونات الدورات النشطة
        </p>
      </div>

      {/* Roadmap cards */}
      <div className="space-y-8">
        {mockRoadmaps.map((roadmap) => {
          const difficultyClass =
            DIFFICULTY_COLOR[roadmap.difficulty] ??
            'bg-slate-50 text-slate-600 border-slate-200'

          return (
            <div
              key={roadmap.id}
              className="bg-white border border-slate-200 rounded-md overflow-hidden"
            >
              {/* ── Card header ── */}
              <div className="px-6 py-5 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Title + description + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm">
                        {roadmap.category}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-sm border ${difficultyClass}`}
                      >
                        {roadmap.difficulty}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-1">
                      {roadmap.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {roadmap.description}
                    </p>
                  </div>

                  {/* Duration badge — prominent stat card */}
                  <div className="border border-slate-200 rounded-md px-5 py-3.5 text-center shrink-0 bg-white">
                    <p className="text-2xl font-bold text-slate-900 leading-none">
                      {roadmap.total_duration}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-widest">
                      المدة الإجمالية
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Timeline body ── */}
              <div className="px-6 py-6">
                <Timeline steps={roadmap.steps} />
              </div>

              {/* ── Footer ── */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-400">دورات مرتبطة:</span>
                {roadmap.associated_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-sm"
                  >
                    {kw}
                  </span>
                ))}
                <a
                  href="/coupons"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 me-auto transition-colors"
                >
                  ← تصفح الكوبونات لهذه التقنيات
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
