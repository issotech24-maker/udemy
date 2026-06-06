export const metadata = {
  title: "خارطة الطريق المهنية – UdemyRadar",
  description: "مسارات مهنية تقنية مفصّلة مرتبطة بكوبونات الدورات النشطة",
};

type Step = {
  phase: string;
  title: string;
  skills: string[];
  duration: string;
};

type Roadmap = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  steps: Step[];
  associated_keywords: string[];
};

const mockRoadmaps: Roadmap[] = [
  {
    id: "1",
    title: "مطوّر الواجهة الأمامية",
    description: "المسار الشامل لإتقان تطوير الواجهات الأمامية من الأساسيات إلى أدوات الإنتاج",
    category: "تطوير الويب",
    level: "مبتدئ → متقدم",
    steps: [
      {
        phase: "المرحلة 1",
        title: "أساسيات الويب",
        skills: ["HTML5", "CSS3", "JavaScript ES6+"],
        duration: "2-3 أشهر",
      },
      {
        phase: "المرحلة 2",
        title: "إطارات العمل",
        skills: ["React", "TypeScript", "Tailwind CSS"],
        duration: "2-3 أشهر",
      },
      {
        phase: "المرحلة 3",
        title: "أدوات الإنتاج",
        skills: ["Next.js", "Vite", "Git & CI/CD"],
        duration: "1-2 أشهر",
      },
      {
        phase: "المرحلة 4",
        title: "التخصص والتوظيف",
        skills: ["اختبار الأداء", "SEO", "بناء معرض أعمال"],
        duration: "شهر واحد",
      },
    ],
    associated_keywords: ["React", "Next.js", "TypeScript", "CSS"],
  },
  {
    id: "2",
    title: "مهندس الذكاء الاصطناعي",
    description: "مسار متكامل للانتقال من مبتدئ إلى مهندس ذكاء اصطناعي قادر على بناء حلول حقيقية",
    category: "ذكاء اصطناعي",
    level: "مبتدئ → متقدم",
    steps: [
      {
        phase: "المرحلة 1",
        title: "الأسس الرياضية والبرمجية",
        skills: ["Python", "NumPy", "رياضيات الآلة"],
        duration: "2 أشهر",
      },
      {
        phase: "المرحلة 2",
        title: "تعلم الآلة الكلاسيكي",
        skills: ["Scikit-learn", "Pandas", "تحليل البيانات"],
        duration: "2-3 أشهر",
      },
      {
        phase: "المرحلة 3",
        title: "التعلم العميق",
        skills: ["PyTorch", "TensorFlow", "Transformers"],
        duration: "3 أشهر",
      },
      {
        phase: "المرحلة 4",
        title: "تطبيقات LLM",
        skills: ["LangChain", "RAG", "Fine-tuning", "نشر النماذج"],
        duration: "2 أشهر",
      },
    ],
    associated_keywords: ["Python", "AI", "Machine Learning", "PyTorch"],
  },
  {
    id: "3",
    title: "مهندس DevOps والبنية التحتية",
    description: "مسار تحويلي لإتقان عمليات التطوير والنشر وإدارة البنية التحتية السحابية",
    category: "DevOps",
    level: "متوسط → متقدم",
    steps: [
      {
        phase: "المرحلة 1",
        title: "Linux والشبكات",
        skills: ["Linux CLI", "Bash Scripting", "شبكات TCP/IP"],
        duration: "1-2 أشهر",
      },
      {
        phase: "المرحلة 2",
        title: "الحاويات والتنسيق",
        skills: ["Docker", "Kubernetes", "Helm"],
        duration: "2 أشهر",
      },
      {
        phase: "المرحلة 3",
        title: "السحابة وCI/CD",
        skills: ["AWS/GCP/Azure", "Terraform", "GitHub Actions"],
        duration: "2-3 أشهر",
      },
      {
        phase: "المرحلة 4",
        title: "المراقبة والأمان",
        skills: ["Prometheus", "Grafana", "أمان البنية التحتية"],
        duration: "1-2 أشهر",
      },
    ],
    associated_keywords: ["Docker", "Kubernetes", "AWS", "Linux"],
  },
];

export default function RoadmapsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">خارطة الطريق المهنية</h1>
        <p className="text-slate-500 text-sm">
          مسارات مهنية مفصّلة – كل مرحلة مرتبطة بكوبونات الدورات النشطة تلقائياً
        </p>
      </div>

      <div className="space-y-8">
        {mockRoadmaps.map((roadmap) => (
          <div
            key={roadmap.id}
            className="bg-white border border-slate-200 rounded-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">
                    {roadmap.title}
                  </h2>
                  <p className="text-sm text-slate-500">{roadmap.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                    {roadmap.category}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-sm">
                    {roadmap.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {roadmap.steps.map((step, index) => (
                  <div
                    key={index}
                    className="border border-slate-100 rounded-md p-4 bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">
                        {step.phase}
                      </span>
                      <span className="text-xs text-slate-400">{step.duration}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800 mb-2">
                      {step.title}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {step.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated coupons hint */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <span className="text-xs text-slate-400">دورات مرتبطة:</span>
              <div className="flex flex-wrap gap-1">
                {roadmap.associated_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-sm"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              <span className="text-xs text-slate-400 mr-auto">
                → كوبونات نشطة لهذه التقنيات
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
