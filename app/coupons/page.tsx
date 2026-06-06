export const metadata = {
  title: "كوبونات يوديمي المجانية – UdemyRadar",
  description: "أحدث كوبونات يوديمي المجانية والمخفضة محدّثة تلقائياً",
};

const CATEGORIES = ["الكل", "برمجة", "تطوير الويب", "ذكاء اصطناعي", "قواعد البيانات", "تصميم", "أعمال"];

const mockCoupons = [
  {
    id: "1",
    title: "دورة Python الشاملة: من الصفر إلى الاحتراف",
    description: "تعلم Python بأسلوب عملي مع مشاريع حقيقية ومئات التمارين",
    instructor: "Jose Portilla",
    category: "برمجة",
    rating: 4.7,
    coupon_code: "FREE-PY24",
    current_price: 0,
    expires_at: "2026-06-20",
    is_verified: true,
  },
  {
    id: "2",
    title: "تعلم React وNext.js: بناء تطبيقات ويب حديثة",
    description: "دورة شاملة تغطي React 19 وNext.js App Router من الأساسيات إلى المتقدم",
    instructor: "Maximilian Schwarzmüller",
    category: "تطوير الويب",
    rating: 4.8,
    coupon_code: "REACT2024",
    current_price: 0,
    expires_at: "2026-06-18",
    is_verified: true,
  },
  {
    id: "3",
    title: "الذكاء الاصطناعي وتعلم الآلة العملية",
    description: "أسس الذكاء الاصطناعي، الشبكات العصبية، ومشاريع تطبيقية",
    instructor: "Andrew Ng",
    category: "ذكاء اصطناعي",
    rating: 4.9,
    coupon_code: "AI-FREE",
    current_price: 0,
    expires_at: "2026-06-25",
    is_verified: true,
  },
  {
    id: "4",
    title: "SQL وقواعد البيانات للمبتدئين",
    description: "كل ما تحتاجه لإتقان SQL من الاستعلامات البسيطة إلى المتقدمة",
    instructor: "Colt Steele",
    category: "قواعد البيانات",
    rating: 4.6,
    coupon_code: "SQL100",
    current_price: 0,
    expires_at: "2026-06-22",
    is_verified: false,
  },
  {
    id: "5",
    title: "تصميم واجهات المستخدم بـ Figma",
    description: "من الأساسيات إلى بناء نظام تصميم احترافي كامل",
    instructor: "Daniel Scott",
    category: "تصميم",
    rating: 4.7,
    coupon_code: "FIGMA50",
    current_price: 0,
    expires_at: "2026-06-30",
    is_verified: true,
  },
  {
    id: "6",
    title: "Docker وKubernetes: الدليل الكامل",
    description: "إدارة الحاويات ونشر التطبيقات في بيئات الإنتاج",
    instructor: "Bret Fisher",
    category: "برمجة",
    rating: 4.8,
    coupon_code: "DOCK24",
    current_price: 0,
    expires_at: "2026-06-28",
    is_verified: true,
  },
];

export default function CouponsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">كوبونات يوديمي</h1>
        <p className="text-slate-500 text-sm">
          {mockCoupons.length} كوبون نشط – محدّث تلقائياً
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors first:bg-slate-900 first:text-white first:border-slate-900"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white border border-slate-200 rounded-md p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm shrink-0">
                {coupon.category}
              </span>
              <div className="flex items-center gap-1.5">
                {coupon.is_verified && (
                  <span className="text-xs text-emerald-600 font-medium">✓ موثّق</span>
                )}
                <span className="text-xs text-slate-400">★ {coupon.rating}</span>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-slate-800 leading-snug">
              {coupon.title}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {coupon.description}
            </p>
            <p className="text-xs text-slate-400">{coupon.instructor}</p>

            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
              <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-sm select-all">
                {coupon.coupon_code}
              </code>
              <span className="text-xs text-slate-400">ينتهي {coupon.expires_at}</span>
            </div>

            <a
              href={coupon.current_price === 0 ? "#" : "#"}
              className="block text-center text-xs font-medium py-2 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {coupon.current_price === 0 ? "احصل عليه مجاناً" : `احصل عليه – $${coupon.current_price}`}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
