import { NextResponse } from 'next/server'
import type { CronLogRecord } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Fallback mock data used when Supabase is not yet configured
const MOCK_LOGS: CronLogRecord[] = [
  {
    id: 'mock-1',
    job_name: 'scrape-coupons',
    status: 'success',
    items_added: 7,
    items_updated: 2,
    error_message: null,
    duration_ms: 3240,
    created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: 'mock-2',
    job_name: 'scrape-scholarships',
    status: 'success',
    items_added: 3,
    items_updated: 0,
    error_message: null,
    duration_ms: 4820,
    created_at: new Date(Date.now() - 8 * 3_600_000).toISOString(),
  },
  {
    id: 'mock-3',
    job_name: 'scrape-coupons',
    status: 'failed',
    items_added: 0,
    items_updated: 0,
    error_message: 'DeepSeek API timeout after 30s',
    duration_ms: 30_000,
    created_at: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  },
  {
    id: 'mock-4',
    job_name: 'scrape-scholarships',
    status: 'success',
    items_added: 2,
    items_updated: 1,
    error_message: null,
    duration_ms: 5100,
    created_at: new Date(Date.now() - 32 * 3_600_000).toISOString(),
  },
  {
    id: 'mock-5',
    job_name: 'scrape-coupons',
    status: 'success',
    items_added: 9,
    items_updated: 0,
    error_message: null,
    duration_ms: 2780,
    created_at: new Date(Date.now() - 50 * 3_600_000).toISOString(),
  },
]

export async function GET() {
  // Attempt live Supabase query
  try {
    const { createSupabaseAdmin } = await import('@/lib/supabase')
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('cron_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      return NextResponse.json({ logs: data as CronLogRecord[], source: 'db' })
    }
  } catch {
    // Supabase not configured yet — return mock data
  }

  return NextResponse.json({ logs: MOCK_LOGS, source: 'mock' })
}
