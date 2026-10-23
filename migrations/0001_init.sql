CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('home','page','gallery','press','contact','detail')),
  parent_id TEXT REFERENCES pages(id),
  nav_order INTEGER NOT NULL DEFAULT 100,
  is_core INTEGER NOT NULL DEFAULT 0,
  is_trashed INTEGER NOT NULL DEFAULT 0,
  draft_json TEXT NOT NULL,
  published_json TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pages_public ON pages(is_trashed, nav_order);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  draft_json TEXT NOT NULL,
  published_json TEXT
);
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
