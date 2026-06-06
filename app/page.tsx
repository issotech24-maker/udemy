import Link from "next/link";

const latestCoupons = [
  {
    id: "1",
    title: "دورة Python الشاملة: من الصفر إلى الاحتراف",
    instructor: "Jose Portilla",
    category: "برمجة",
    rating: 4.7,
    coupon_code: "FREE-PY24",
    expires_at: "2026-06-20",
    url: "#",
  },
  {
    id: "2",
    title: "تعلم React وNext.js بناء تطبيقات حديثة",
    instructor: "Maximilian Schwarzmüller",
    category: "تطوير الويب",
    rating: 4.8,
    coupon_code: "REACT2024",
    expires_at: "2026-06-18",
    url: "#",
  },
  {
    id: "3",
    title: "دورة الذكاء الاصطناعي وتعلم الآلة العملية",
    instructor: "Andrew Ng",
    category: "ذكاء اصطناعي",
    rating: 4.9,
    coupon_code: "AI-FREE",
    expires_at: "2026-06-25",
    url: "#",
  },
  {
    id: "4",
    title: "SQL وقواعد البيانات للمبتدئين",
    instructor: "Colt Steele",
    category: "قواعد البيانات",
    rating: 4.6,
    coupon_code: "SQL100",
    expires_at: "2026-06-22",
    url: "#",
  },
];

const upcomingScholarships = [
  {
    id: "1",
    title: "منحة فولبرايت للدراسات العليا",
    country: "الولايات المتحدة",
    deadline: "2026-07-31",
    benefits: "تغطية كاملة للرسوم الدراسية والمعيشة والتذاكر",
  },
  {
    id: "2",
    title: "منحة DAAD للدراسة في ألمانيا",
    country: "ألمانيا",
    deadline: "2026-08-15",
    benefits: "راتب شهري + تأمين صحي + دورة لغة ألمانية",
  },
  {
    id: "3",
    title: "منحة شيفنينج البريطانية",
    country: "المملكة المتحدة",
    deadline: "2026-11-05",
    benefits: "رسوم دراسية كاملة + مصروف شهري + تذاكر سفر",
  },
];

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero */}
      <section className="text-center py-12 border border-slate-200 rounded-md bg-white">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
          منصة ذكية للطلاب العرب
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
          UdemyRadar
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8">
          كوبونات يوديمي المجانية · منح دراسية · أدوات ذكاء اصطناعي للتوظيف ·
          خارطة الطريق المهنية
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/coupons"
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
          >
            استعرض الكوبونات
          </Link>
          <Link
            href="/scholarships"
            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
          >
            المنح الدراسية
          </Link>
        </div>
      </section>

      {/* Latest Coupons */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            أحدث الكوبونات المجانية
          </h2>
          <Link
            href="/coupons"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            عرض الكل ←
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white border border-slate-200 rounded-md p-4 flex flex-col gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                  {coupon.category}
                </span>
                <span className="text-xs text-slate-400">★ {coupon.rating}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                {coupon.title}
              </p>
              <p className="text-xs text-slate-400">{coupon.instructor}</p>
              <div className="mt-auto flex items-center justify-between">
                <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-sm">
                  {coupon.coupon_code}
                </code>
                <span className="text-xs text-slate-400">
                  ينتهي {coupon.expires_at}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Scholarships */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            منح دراسية قادمة
          </h2>
          <Link
            href="/scholarships"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            عرض الكل ←
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingScholarships.map((s) => {
            const days = daysUntil(s.deadline);
            return (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                    {s.country}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                      days < 30
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {days} يوم متبقي
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {s.benefits}
                </p>
                <p className="text-xs text-slate-400 mt-auto">
                  آخر موعد: {s.deadline}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick nav cards */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          استكشف المنصة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: "/coupons",
              title: "كوبونات يوديمي",
              desc: "كوبونات مجانية ومدفوعة يتم تحديثها تلقائياً يومياً",
              icon: "🎟",
            },
            {
              href: "/scholarships",
              title: "المنح الدراسية",
              desc: "تتبع مواعيد التقديم والشروط والمزايا لمئات المنح",
              icon: "🎓",
            },
            {
              href: "/career",
              title: "أدوات التوظيف الذكية",
              desc: "توليد خطابات تغطية وتحليل السيرة الذاتية بالذكاء الاصطناعي",
              icon: "📄",
            },
            {
              href: "/roadmaps",
              title: "خارطة الطريق المهنية",
              desc: "مسارات مهنية مفصّلة مرتبطة بكوبونات الدورات النشطة",
              icon: "🗺",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-slate-200 rounded-md p-5 hover:border-slate-300 transition-colors group"
            >
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-slate-700">
                {card.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
