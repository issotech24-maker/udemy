import CareerTools from './CareerTools'

export const metadata = {
  title: 'أدوات التوظيف الذكية – UdemyRadar',
  description:
    'تحليل السيرة الذاتية وفق معايير ATS الألمانية وتوليد خطابات التغطية بالذكاء الاصطناعي',
}

export default function CareerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">أدوات التوظيف الذكية</h1>
        <p className="text-slate-500 text-sm">
          مدعومة بالذكاء الاصطناعي – تحليل احترافي وفق المعايير الأوروبية وتوليد خطابات مخصصة
        </p>
      </div>
      <CareerTools />
    </div>
  )
}
