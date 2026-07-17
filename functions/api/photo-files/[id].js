const SCHEMA = `
CREATE TABLE IF NOT EXISTS photo_submissions (
  id TEXT PRIMARY KEY,
  temple_slug TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  storage TEXT NOT NULL,
  status TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  photo_count INTEGER NOT NULL,
  total_bytes INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS photo_submission_files (
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
);
CREATE TABLE IF NOT EXISTS photo_submission_chunks (
  file_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_data BLOB NOT NULL,
  PRIMARY KEY (file_id, chunk_index)
);
`;

function text(message, status = 404) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function cleanId(value) {
  return String(value || "").normalize("NFKC").replace(/[^a-z0-9-]/gi, "").slice(0, 80);
}

function toUint8Array(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (Array.isArray(value)) return new Uint8Array(value);
  if (typeof value === "string") {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }
  return new Uint8Array();
}

function concatChunks(chunks) {
  const byteChunks = chunks.map((chunk) => toUint8Array(chunk.chunk_data));
  const total = byteChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of byteChunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

async function ensureD1Schema(db) {
  await db.exec(SCHEMA);
}

export async function onRequestGet({ params, env }) {
  if (!env.ATAWI_BOARD_DB) return text("Photo storage is not configured.", 503);

  const id = cleanId(params.id);
  if (!id) return text("Photo not found.");

  const db = env.ATAWI_BOARD_DB;
  await ensureD1Schema(db);

  const file = await db.prepare(
    `SELECT
        f.id,
        f.file_name,
        f.content_type,
        f.size,
        f.storage_key,
        s.storage,
        s.status
       FROM photo_submission_files f
       INNER JOIN photo_submissions s ON s.id = f.submission_id
      WHERE f.id = ?
      LIMIT 1`,
  ).bind(id).first();

  if (!file || !["admin-uploaded", "published"].includes(file.status)) return text("Photo not found.");
  if (!String(file.content_type || "").startsWith("image/")) return text("Photo not found.");

  const headers = {
    "content-type": file.content_type,
    "cache-control": "public, max-age=3600",
    "x-content-type-options": "nosniff",
  };

  if (file.storage === "r2" && file.storage_key && env.ATAWI_PHOTO_BUCKET) {
    const object = await env.ATAWI_PHOTO_BUCKET.get(file.storage_key);
    if (!object) return text("Photo not found.");
    return new Response(object.body, { headers });
  }

  const result = await db.prepare(
    `SELECT chunk_data
       FROM photo_submission_chunks
      WHERE file_id = ?
      ORDER BY chunk_index ASC`,
  ).bind(id).all();

  const chunks = result.results || [];
  if (chunks.length === 0) return text("Photo not found.");

  return new Response(concatChunks(chunks), { headers });
}
