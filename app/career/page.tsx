export const metadata = {
  title: "أدوات التوظيف الذكية – UdemyRadar",
  description: "توليد خطابات التغطية وتحليل السيرة الذاتية بالذكاء الاصطناعي",
};

const tools = [
  {
    id: "cover-letter",
    title: "مولّد خطاب التغطية",
    description:
      "أدخل الوظيفة المستهدفة ومهاراتك، وسيولّد الذكاء الاصطناعي خطاب تغطية احترافياً مخصصاً لك",
    status: "قريباً",
    icon: "✉",
  },
  {
    id: "cv-analysis",
    title: "محلّل السيرة الذاتية",
    description:
      "ارفع سيرتك الذاتية واحصل على تقييم شامل ونصائح تحسين مستندة إلى أفضل ممارسات التوظيف",
    status: "قريباً",
    icon: "📊",
  },
  {
    id: "interview-prep",
    title: "تدريب على المقابلات",
    description:
      "أسئلة مقابلة مخصصة لمجال تخصصك مع نماذج إجابات احترافية وتقييم للردود",
    status: "قريباً",
    icon: "🎙",
  },
  {
    id: "linkedin-optimizer",
    title: "محسّن ملف LinkedIn",
    description:
      "تحليل ملفك الشخصي على LinkedIn وتقديم توصيات لزيادة ظهوره في نتائج بحث المجنّدين",
    status: "قريباً",
    icon: "🔗",
  },
];

const recentLogs = [
  {
    id: "1",
    file_name: "CV_Ahmed_2024.pdf",
    ai_score: 82,
    created_at: "2026-06-05",
  },
  {
    id: "2",
    file_name: "Resume_Sara_Tech.pdf",
    ai_score: 91,
    created_at: "2026-06-04",
  },
  {
    id: "3",
    file_name: "CV_Mohamed_Backend.pdf",
    ai_score: 74,
    created_at: "2026-06-03",
  },
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    score >= 70 ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm border ${color}`}>
      {score}/100
    </span>
  );
}

export default function CareerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">أدوات التوظيف الذكية</h1>
        <p className="text-slate-500 text-sm">
          مجموعة أدوات مدعومة بالذكاء الاصطناعي لمساعدتك في الحصول على وظيفة أحلامك
        </p>
      </div>

      {/* Tools grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white border border-slate-200 rounded-md p-6 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{tool.icon}</span>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
                  {tool.status}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-900">{tool.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{tool.description}</p>
              <button
                disabled
                className="mt-auto text-xs font-medium py-2 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed"
              >
                قريباً
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent CV analysis logs */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          آخر تحليلات السيرة الذاتية
        </h2>
        <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">📄</span>
                <span className="text-sm text-slate-700 font-medium">{log.file_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <ScoreBadge score={log.ai_score} />
                <span className="text-xs text-slate-400">{log.created_at}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
