export const metadata = {
  title: "المنح الدراسية – UdemyRadar",
  description: "تتبع أحدث المنح الدراسية الدولية مع العد التنازلي لمواعيد التقديم",
};

const mockScholarships = [
  {
    id: "1",
    title: "منحة فولبرايت للدراسات العليا",
    country: "الولايات المتحدة",
    deadline: "2026-07-31",
    requirements: "درجة البكالوريوس، إجادة اللغة الإنجليزية، خطة دراسية واضحة",
    benefits: "تغطية كاملة للرسوم الدراسية، بدل معيشة شهري، تذاكر سفر ذهاباً وإياباً، تأمين صحي",
    official_link: "#",
  },
  {
    id: "2",
    title: "منحة DAAD للدراسة في ألمانيا",
    country: "ألمانيا",
    deadline: "2026-08-15",
    requirements: "تخصص علمي أو هندسي، مستوى أكاديمي مرتفع، خطة بحثية",
    benefits: "راتب شهري 934 يورو، تأمين صحي، دورة لغة ألمانية مجانية",
    official_link: "#",
  },
  {
    id: "3",
    title: "منحة شيفنينج البريطانية",
    country: "المملكة المتحدة",
    deadline: "2026-11-05",
    requirements: "سنتان خبرة عمل، مؤهل أكاديمي جيد، IELTS 6.5+",
    benefits: "رسوم دراسية كاملة، مصروف معيشة شهري، تذاكر سفر",
    official_link: "#",
  },
  {
    id: "4",
    title: "منحة الحكومة الكندية للدراسات العليا",
    country: "كندا",
    deadline: "2026-10-01",
    requirements: "بكالوريوس بتقدير لا يقل عن جيد جداً، خطة بحثية، خطاب توصية",
    benefits: "رسوم دراسية + راتب شهري 1,200 دولار كندي + تذاكر سفر",
    official_link: "#",
  },
  {
    id: "5",
    title: "زمالة هومبولت البحثية",
    country: "ألمانيا",
    deadline: "2026-09-30",
    requirements: "دكتوراه لا تتجاوز 12 سنة، منشورات علمية، مشروع بحثي محدد",
    benefits: "منحة شهرية 2,670 يورو + بدلات عائلية + دورات لغوية",
    official_link: "#",
  },
  {
    id: "6",
    title: "منحة أبوظبي للتعليم العالي",
    country: "الإمارات",
    deadline: "2026-06-30",
    requirements: "مواطن إماراتي أو مقيم، GPA 3.5+، قبول من جامعة معتمدة",
    benefits: "رسوم دراسية كاملة + سكن + مصروف شهري",
    official_link: "#",
  },
];

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ScholarshipsPage() {
  const sorted = [...mockScholarships].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">المنح الدراسية</h1>
        <p className="text-slate-500 text-sm">
          {sorted.length} منحة نشطة – مرتبة حسب أقرب موعد للتقديم
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((s) => {
          const days = daysUntil(s.deadline);
          const isUrgent = days < 30;
          return (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-md p-6 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">
                    {s.title}
                  </h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                    {s.country}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`text-center px-3 py-2 rounded-md border ${
                      isUrgent
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-xl font-bold tabular-nums ${
                        isUrgent ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {days}
                    </p>
                    <p className="text-xs text-slate-400">يوم متبقي</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                    الشروط
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed">{s.requirements}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                    المزايا
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed">{s.benefits}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">آخر موعد للتقديم: {s.deadline}</p>
                <a
                  href={s.official_link}
                  className="text-xs font-medium px-4 py-1.5 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  الموقع الرسمي ←
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
