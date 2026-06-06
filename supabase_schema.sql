-- UdemyRadar Database Schema
-- Zero-touch automation platform for Arab students and tech professionals

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- COUPONS
-- Stores Udemy coupon codes with automation tracking
-- ============================================================
CREATE TABLE coupons (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT,
  url            TEXT        NOT NULL,
  category       TEXT,
  rating         NUMERIC(3, 1),
  current_price  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  instructor     TEXT,
  coupon_code    TEXT,
  is_verified    BOOLEAN     NOT NULL DEFAULT false,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  telegram_sent  BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX coupons_category_idx    ON coupons (category);
CREATE INDEX coupons_expires_at_idx  ON coupons (expires_at);
CREATE INDEX coupons_created_at_idx  ON coupons (created_at DESC);

-- ============================================================
-- SCHOLARSHIPS
-- Stores scholarship listings with deadline countdown support
-- ============================================================
CREATE TABLE scholarships (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT,
  country        TEXT,
  deadline       TIMESTAMPTZ,
  requirements   TEXT,
  benefits       TEXT,
  official_link  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  telegram_sent  BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX scholarships_deadline_idx    ON scholarships (deadline);
CREATE INDEX scholarships_country_idx     ON scholarships (country);
CREATE INDEX scholarships_created_at_idx  ON scholarships (created_at DESC);

-- ============================================================
-- ROADMAPS
-- Career roadmaps with JSONB phase structure and keyword mapping
-- ============================================================
CREATE TABLE roadmaps (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT    NOT NULL,
  description          TEXT,
  category             TEXT,
  -- JSONB structure: [{ phase, title, skills: string[], duration }]
  steps                JSONB   NOT NULL DEFAULT '[]',
  -- Used to dynamically map active coupons to roadmap phases
  associated_keywords  TEXT[]  NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX roadmaps_category_idx  ON roadmaps (category);
CREATE INDEX roadmaps_steps_gin     ON roadmaps USING gin (steps);
CREATE INDEX roadmaps_keywords_gin  ON roadmaps USING gin (associated_keywords);

-- ============================================================
-- CV LOGS
-- Tracks AI-powered CV analysis sessions per user
-- ============================================================
CREATE TABLE cv_logs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier    TEXT,
  file_name          TEXT,
  ai_score           NUMERIC(5, 2),
  -- JSONB structure: { summary, strengths: string[], improvements: string[], keywords: string[] }
  ai_feedback_json   JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cv_logs_user_identifier_idx  ON cv_logs (user_identifier);
CREATE INDEX cv_logs_created_at_idx       ON cv_logs (created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — enable when connecting Supabase auth
-- ============================================================
ALTER TABLE coupons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_logs       ENABLE ROW LEVEL SECURITY;

-- Public read on coupons, scholarships, roadmaps
CREATE POLICY "coupons_public_read"      ON coupons       FOR SELECT USING (true);
CREATE POLICY "scholarships_public_read" ON scholarships  FOR SELECT USING (true);
CREATE POLICY "roadmaps_public_read"     ON roadmaps      FOR SELECT USING (true);

-- CV logs: users can only read their own records
CREATE POLICY "cv_logs_owner_read" ON cv_logs
  FOR SELECT USING (user_identifier = current_user);

-- Service role (automation bots) can insert/update all tables
-- Grant these in Supabase Dashboard under service_role key usage

-- ============================================================
-- CRON LOGS
-- Tracks automation job execution history (coupons, scholarships)
-- ============================================================
CREATE TABLE cron_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name       TEXT        NOT NULL,
  status         TEXT        NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  items_added    INTEGER     NOT NULL DEFAULT 0,
  items_updated  INTEGER     NOT NULL DEFAULT 0,
  error_message  TEXT,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cron_logs_job_name_idx   ON cron_logs (job_name);
CREATE INDEX cron_logs_status_idx     ON cron_logs (status);
CREATE INDEX cron_logs_created_at_idx ON cron_logs (created_at DESC);

ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write cron logs
CREATE POLICY "cron_logs_service_only" ON cron_logs
  USING (false);

