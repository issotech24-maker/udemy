import { createSupabaseAdmin } from '@/lib/supabase'
import CouponsGrid from './CouponsGrid'
import type { Coupon } from './CouponsGrid'

// Re-fetch on every request so new cron inserts are always visible
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'كوبونات يوديمي المجانية – UdemyRadar',
  description: 'أحدث كوبونات يوديمي المجانية والمخفضة محدّثة تلقائياً كل 6 ساعات',
}

async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('coupons')
      .select('id, title, description, url, category, rating, current_price, instructor, coupon_code, is_verified, expires_at')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data as Coupon[]
  } catch {
    return []
  }
}

export default async function CouponsPage() {
  const coupons = await fetchCoupons()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">كوبونات يوديمي</h1>
        <p className="text-slate-500 text-sm">
          {coupons.length > 0
            ? `${coupons.length} كوبون نشط – محدّث تلقائياً`
            : 'يتم تحميل الكوبونات...'}
        </p>
      </div>
      <CouponsGrid coupons={coupons} />
    </div>
  )
}
