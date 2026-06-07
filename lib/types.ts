// --- Supabase DB row types

export type CouponRecord = {
  id: string
  title: string
  description: string | null
  url: string
  category: string | null
  rating: number | null
  current_price: number
  instructor: string | null
  coupon_code: string | null
  is_verified: boolean
  expires_at: string | null
  created_at: string
  telegram_sent: boolean
}

export type CouponInsert = Omit<CouponRecord, 'id' | 'created_at'>

export type ScholarshipRecord = {
  id: string
  title: string
  description: string | null
  country: string | null
  deadline: string | null
  requirements: string | null
  benefits: string | null
  official_link: string | null
  created_at: string
  telegram_sent: boolean
}

export type ScholarshipInsert = Omit<ScholarshipRecord, 'id' | 'created_at'>

export type CronLogRecord = {
  id: string
  job_name: string
  status: 'success' | 'failed' | 'running'
  items_added: number
  items_updated: number
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export type CronLogInsert = {
  job_name: string
  status: 'success' | 'failed' | 'running'
  items_added: number
  items_updated: number
  error_message?: string | null
  duration_ms?: number | null
}

export type RoadmapStep = {
  phase: string
  title: string
  skills: string[]
  duration: string
}

export type RoadmapRecord = {
  id: string
  title: string
  description: string | null
  category: string | null
  steps: RoadmapStep[]
  associated_keywords: string[]
  created_at: string
}