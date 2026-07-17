const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS photo_submissions (
    id TEXT PRIMARY KEY,
    temple_slug TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    storage TEXT NOT NULL,
    status TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    photo_count INTEGER NOT NULL,
    total_bytes INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS photo_submission_files (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    file_index INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    storage_key TEXT,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS photo_submission_chunks (
    file_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_data BLOB NOT NULL,
    PRIMARY KEY (file_id, chunk_index)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_photo_submission_files_submission
    ON photo_submission_files (submission_id, file_index)`,
  `CREATE INDEX IF NOT EXISTS idx_photo_submissions_uploaded
    ON photo_submissions (uploaded_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_photo_submissions_public_lookup
    ON photo_submissions (temple_slug, status, uploaded_at DESC)`,
];

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      ...(init.headers || {}),
    },
  });
}

function cleanSlug(value) {
  return String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function readTempleSlugs(url) {
  const single = cleanSlug(url.searchParams.get("temple_slug"));
  if (single) return [single];

  return String(url.searchParams.get("temple_slugs") || "")
    .split(",")
    .map(cleanSlug)
    .filter(Boolean)
    .slice(0, 80);
}

async function ensureD1Schema(db) {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.prepare(statement).run();
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.ATAWI_BOARD_DB) {
    return json({ ok: true, configured: false, photos: [] });
  }

  const db = env.ATAWI_BOARD_DB;
  await ensureD1Schema(db);

  const url = new URL(request.url);
  const slugs = readTempleSlugs(url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 60, 1), 120);

  const where = [
    "s.status IN ('admin-uploaded', 'published')",
    "f.content_type LIKE 'image/%'",
  ];
  const params = [];

  if (slugs.length > 0) {
    where.push(`s.temple_slug IN (${slugs.map(() => "?").join(", ")})`);
    params.push(...slugs);
  }

  const result = await db.prepare(
    `SELECT
        f.id,
        s.temple_slug,
        s.note,
        s.storage,
        s.uploaded_at,
        f.file_name,
        f.content_type,
        f.size,
        f.category_id,
        f.file_index
       FROM photo_submission_files f
       INNER JOIN photo_submissions s ON s.id = f.submission_id
      WHERE ${where.join(" AND ")}
      ORDER BY s.uploaded_at DESC, f.file_index ASC
      LIMIT ?`,
  ).bind(...params, limit).all();

  const photos = (result.results || []).map((photo) => ({
    id: photo.id,
    temple_slug: photo.temple_slug,
    note: photo.note || "",
    storage: photo.storage,
    uploaded_at: photo.uploaded_at,
    file_name: photo.file_name,
    content_type: photo.content_type,
    size: photo.size,
    category_id: photo.category_id,
    url: `/api/photo-files/${encodeURIComponent(photo.id)}`,
  }));

  return json({ ok: true, configured: true, photos });
}
