/** PostgreSQL DDL — 所有建表语句（幂等：IF NOT EXISTS） */

export const SCHEMA_SQL = `
-- 统一内容条目表：四类内容共用
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('paper', 'model-product', 'institutional-news', 'investment-news')),
  category TEXT NOT NULL CHECK (category IN ('AI4S', 'AI4SS', 'AI4R')),
  subcategory TEXT DEFAULT '',
  authors_or_org TEXT DEFAULT '',
  journal_or_venue TEXT DEFAULT '',
  source_quality TEXT NOT NULL CHECK (source_quality IN ('top-tier', 'authoritative', 'general', 'preprint')),
  published_at TEXT DEFAULT '',
  fetched_at TEXT NOT NULL DEFAULT NOW()::text,
  score DOUBLE PRECISION DEFAULT 0,
  score_breakdown TEXT DEFAULT '{}',
  score_reason TEXT DEFAULT '',
  summary_cn TEXT DEFAULT '',
  key_point TEXT DEFAULT '',
  is_daily_recommended INTEGER DEFAULT 0,
  is_favorited INTEGER DEFAULT 0,
  is_daily_pick INTEGER DEFAULT 0,
  is_compressed INTEGER DEFAULT 0,
  region TEXT NOT NULL CHECK (region IN ('cn', 'western', 'global')),
  created_at TEXT NOT NULL DEFAULT NOW()::text
);

-- 兼容已有数据库：如果列不存在则添加
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_favorited INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_daily_pick INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_compressed INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_items_fetched_at ON items(fetched_at);
CREATE INDEX IF NOT EXISTS idx_items_content_type ON items(content_type);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_score ON items(score DESC);
CREATE INDEX IF NOT EXISTS idx_items_region ON items(region);
CREATE INDEX IF NOT EXISTS idx_items_daily_pick ON items(is_daily_pick);
CREATE INDEX IF NOT EXISTS idx_items_favorited ON items(is_favorited);

-- 每个 URL 唯一（PostgreSQL 不支持 INSERT OR IGNORE 但用 ON CONFLICT 替代）
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_url ON items(url);

-- 日报表
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  summary TEXT DEFAULT '',
  stats TEXT DEFAULT '{}',
  recommended_paper_id TEXT,
  created_at TEXT NOT NULL DEFAULT NOW()::text
);

-- 周报/月报表
CREATE TABLE IF NOT EXISTS periodic_reports (
  id TEXT PRIMARY KEY,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  top_items TEXT DEFAULT '[]',
  trend_summary TEXT DEFAULT '',
  literature_review TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT NOW()::text,
  UNIQUE(period_start, period_end, report_type)
);
`;

export interface Item {
  id: string;
  title: string;
  description: string;
  url: string;
  source_name: string;
  content_type: "paper" | "model-product" | "institutional-news" | "investment-news";
  category: "AI4S" | "AI4SS" | "AI4R";
  subcategory: string;
  authors_or_org: string;
  journal_or_venue: string;
  source_quality: "top-tier" | "authoritative" | "general" | "preprint";
  published_at: string;
  fetched_at: string;
  score: number;
  score_breakdown: string;
  score_reason: string;
  summary_cn: string;
  key_point: string;
  is_daily_recommended: number;
  is_favorited: number;
  is_daily_pick: number;
  is_compressed: number;
  region: "cn" | "western" | "global";
  created_at: string;
}

export interface DailyReport {
  id: string;
  date: string;
  summary: string;
  stats: string;
  recommended_paper_id: string | null;
  created_at: string;
}

export interface PeriodicReport {
  id: string;
  period_start: string;
  period_end: string;
  report_type: "weekly" | "monthly";
  top_items: string;
  trend_summary: string;
  literature_review: string;
  created_at: string;
}

export interface LiteratureReview {
  frontier_topics: Array<{
    topic: string;
    summary: string;
    key_papers: string[];
  }>;
  competing_viewpoints: Array<{
    issue: string;
    position_a: string;
    position_b: string;
  }>;
  open_problems: Array<{
    problem: string;
    why_hard: string;
    recent_attempts: string;
  }>;
}
