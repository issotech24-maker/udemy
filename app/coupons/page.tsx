import CouponsGrid from './CouponsGrid'
import type { Coupon } from './CouponsGrid'

export const metadata = {
  title: 'كوبونات يوديمي المجانية – UdemyRadar',
  description: 'أحدث كوبونات يوديمي المجانية والمخفضة محدّثة تلقائياً',
}

const mockCoupons: Coupon[] = [
  {
    id: '1',
    title: 'دورة Python الشاملة: من الصفر إلى الاحتراف',
    description: 'تعلم Python بأسلوب عملي مع مشاريع حقيقية ومئات التمارين التطبيقية',
    instructor: 'Jose Portilla',
    category: 'برمجة',
    rating: 4.7,
    coupon_code: 'FREE-PY24',
    current_price: 0,
    expires_at: '2026-06-20',
    is_verified: true,
  },
  {
    id: '2',
    title: 'تعلم React وNext.js: بناء تطبيقات ويب حديثة',
    description: 'دورة شاملة تغطي React 19 وNext.js App Router من الأساسيات إلى المتقدم',
    instructor: 'Maximilian Schwarzmüller',
    category: 'تطوير الويب',
    rating: 4.8,
    coupon_code: 'REACT2024',
    current_price: 0,
    expires_at: '2026-06-18',
    is_verified: true,
  },
  {
    id: '3',
    title: 'الذكاء الاصطناعي وتعلم الآلة العملية',
    description: 'أسس الذكاء الاصطناعي والشبكات العصبية مع مشاريع تطبيقية حقيقية',
    instructor: 'Andrew Ng',
    category: 'ذكاء اصطناعي',
    rating: 4.9,
    coupon_code: 'AI-FREE',
    current_price: 0,
    expires_at: '2026-06-25',
    is_verified: true,
  },
  {
    id: '4',
    title: 'SQL وقواعد البيانات للمبتدئين',
    description: 'كل ما تحتاجه لإتقان SQL من الاستعلامات البسيطة إلى المتقدمة',
    instructor: 'Colt Steele',
    category: 'قواعد البيانات',
    rating: 4.6,
    coupon_code: 'SQL100',
    current_price: 0,
    expires_at: '2026-06-22',
    is_verified: false,
  },
  {
    id: '5',
    title: 'تصميم واجهات المستخدم بـ Figma',
    description: 'من الأساسيات إلى بناء نظام تصميم احترافي كامل باستخدام Figma',
    instructor: 'Daniel Scott',
    category: 'تصميم',
    rating: 4.7,
    coupon_code: 'FIGMA50',
    current_price: 0,
    expires_at: '2026-06-30',
    is_verified: true,
  },
  {
    id: '6',
    title: 'Docker وKubernetes: الدليل الكامل',
    description: 'إدارة الحاويات ونشر التطبيقات في بيئات الإنتاج باحترافية',
    instructor: 'Bret Fisher',
    category: 'برمجة',
    rating: 4.8,
    coupon_code: 'DOCK24',
    current_price: 0,
    expires_at: '2026-06-28',
    is_verified: true,
  },
  {
    id: '7',
    title: 'التسويق الرقمي الشامل 2024',
    description: 'SEO وSocial Media وGoogle Ads والتسويق بالمحتوى في دورة واحدة متكاملة',
    instructor: 'Daragh Walsh',
    category: 'تسويق',
    rating: 4.5,
    coupon_code: 'MKT2024',
    current_price: 0,
    expires_at: '2026-07-05',
    is_verified: true,
  },
  {
    id: '8',
    title: 'ريادة الأعمال والاستثمار للمبتدئين',
    description: 'بناء نموذج عمل ناجح، جذب المستثمرين، وإدارة الشركات الناشئة',
    instructor: 'Chris Haroun',
    category: 'أعمال',
    rating: 4.6,
    coupon_code: 'BIZ100',
    current_price: 0,
    expires_at: '2026-07-10',
    is_verified: false,
  },
  {
    id: '9',
    title: 'تطوير تطبيقات Flutter من الصفر',
    description: 'بناء تطبيقات iOS وAndroid باستخدام Flutter ولغة Dart بأسلوب احترافي',
    instructor: 'Angela Yu',
    category: 'تطوير الويب',
    rating: 4.8,
    coupon_code: 'FLUTTER9',
    current_price: 0,
    expires_at: '2026-07-03',
    is_verified: true,
  },
]

export default function CouponsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">كوبونات يوديمي</h1>
        <p className="text-slate-500 text-sm">
          {mockCoupons.length} كوبون نشط – محدّث تلقائياً
        </p>
      </div>
      <CouponsGrid coupons={mockCoupons} />
    </div>
  )
}
