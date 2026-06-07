import { createSupabaseAdmin } from '@/lib/supabase'
import ScholarshipsGrid from './ScholarshipsGrid'
import type { Scholarship } from './ScholarshipsGrid'

// Re-fetch on every request so new cron inserts are always visible
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'المنح الدراسية – UdemyRadar',
  description: 'تتبع أحدث المنح الدراسية الدولية مع العد التنازلي لمواعيد التقديم',
}

async function fetchScholarships(): Promise<Scholarship[]> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('scholarships')
      .select('id, title, description, country, deadline, requirements, benefits, official_link')
      .order('deadline', { ascending: true })
    if (error || !data) return []
    return data as Scholarship[]
  } catch {
    return []
  }
}

export default async function ScholarshipsPage() {
  const scholarships = await fetchScholarships()
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">المنح الدراسية</h1>
        <p className="text-slate-500 text-sm">
          {scholarships.length > 0
            ? `${scholarships.length} منحة نشطة – مرتبة حسب أقرب موعد للتقديم – مع عداد تنازلي حي`
            : 'يتم تحميل المنح...'}
        </p>
      </div>
      <ScholarshipsGrid scholarships={scholarships} />
    </div>
  )
}
