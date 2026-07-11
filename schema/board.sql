CREATE TABLE IF NOT EXISTS board_posts (
  id TEXT PRIMARY KEY,
  temple_slug TEXT NOT NULL,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '匿名',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source_info TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  public_reply TEXT NOT NULL DEFAULT '',
  rate_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_board_posts_public
  ON board_posts(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_posts_rate
  ON board_posts(rate_key, created_at DESC);

