import { verifyAdmin } from "../../_lib/access.js";

const R2_MAX_FILES = 12;
const R2_MAX_BYTES = 12 * 1024 * 1024;
const D1_MAX_FILES = 5;
const D1_MAX_BYTES = 8 * 1024 * 1024;
const D1_CHUNK_BYTES = 1_750_000;

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
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

function sanitize(value) {
  return String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function isFileLike(value) {
  return value
    && typeof value === "object"
    && typeof value.name === "string"
    && typeof value.size === "number"
    && typeof value.type === "string"
    && typeof value.arrayBuffer === "function";
}

function hasR2(env) {
  return Boolean(env.ATAWI_PHOTO_BUCKET && typeof env.ATAWI_PHOTO_BUCKET.put === "function");
}

function hasD1(env) {
  return Boolean(env.ATAWI_BOARD_DB && typeof env.ATAWI_BOARD_DB.prepare === "function");
}

async function ensureAdmin(request, env) {
  try {
    if (!(await verifyAdmin(request, env))) {
      return json({ ok: false, message: "Admin login is required." }, { status: 401 });
    }
  } catch (error) {
    return json({ ok: false, message: error.message }, { status: 503 });
  }
  return null;
}

async function ensureD1Schema(db) {
  for (const statement of SCHEMA_STATEMENTS) {
    await db.prepare(statement).run();
  }
}

function photoCategoryFor(photoCategories, file) {
  return photoCategories.find((item) => item.file_name === file.name)?.category_id || "other";
}

function validateFiles(files, limits) {
  if (files.length === 0) return "Select at least one photo.";
  if (files.length > limits.maxFiles) return `Upload up to ${limits.maxFiles} photos at once.`;

  for (const file of files) {
    if (!file.type.startsWith("image/")) return `${file.name} is not an image file.`;
    if (file.size > limits.maxBytes) {
      return `${file.name} exceeds the ${Math.floor(limits.maxBytes / 1024 / 1024)}MB limit.`;
    }
  }

  return "";
}

async function saveToR2({ env, templeSlug, submissionId, note, files, photoCategories, now }) {
  const saved = [];

  for (const [index, file] of files.entries()) {
    const category = photoCategoryFor(photoCategories, file);
    const key = `admin-uploads/${templeSlug}/${submissionId}/${String(index + 1).padStart(2, "0")}-${sanitize(file.name) || "photo.jpg"}`;
    await env.ATAWI_PHOTO_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        temple_slug: templeSlug,
        submission_id: submissionId,
        category_id: sanitize(category),
        uploaded_at: now,
      },
    });
    saved.push({ key, name: file.name, type: file.type, size: file.size, category_id: category });
  }

  await env.ATAWI_PHOTO_BUCKET.put(
    `admin-uploads/${templeSlug}/${submissionId}/metadata.json`,
    JSON.stringify({
      submission_id: submissionId,
      temple_slug: templeSlug,
      note,
      uploaded_at: now,
      storage: "r2",
      status: "admin-uploaded",
      photos: saved,
    }, null, 2),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } },
  );

  return saved;
}

async function saveToD1({ env, templeSlug, submissionId, note, files, photoCategories, now }) {
  const db = env.ATAWI_BOARD_DB;
  await ensureD1Schema(db);

  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  await db.prepare(
    `INSERT INTO photo_submissions
      (id, temple_slug, note, storage, status, uploaded_at, photo_count, total_bytes)
     VALUES (?, ?, ?, 'd1', 'admin-uploaded', ?, ?, ?)`,
  ).bind(submissionId, templeSlug, note, now, files.length, totalBytes).run();

  const saved = [];
  for (const [index, file] of files.entries()) {
    const category = photoCategoryFor(photoCategories, file);
    const fileId = crypto.randomUUID();
    const buffer = await file.arrayBuffer();
    const chunkCount = Math.ceil(buffer.byteLength / D1_CHUNK_BYTES);

    await db.prepare(
      `INSERT INTO photo_submission_files
        (id, submission_id, file_index, file_name, content_type, size, category_id, storage_key, chunk_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    ).bind(fileId, submissionId, index, file.name, file.type, file.size, category, chunkCount, now).run();

    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const start = chunkIndex * D1_CHUNK_BYTES;
      const end = Math.min(start + D1_CHUNK_BYTES, buffer.byteLength);
      await db.prepare(
        `INSERT INTO photo_submission_chunks (file_id, chunk_index, chunk_data)
         VALUES (?, ?, ?)`,
      ).bind(fileId, chunkIndex, buffer.slice(start, end)).run();
    }

    saved.push({
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      category_id: category,
      chunk_count: chunkCount,
    });
  }

  return saved;
}

export async function onRequestGet({ request, env }) {
  const authResponse = await ensureAdmin(request, env);
  if (authResponse) return authResponse;

  if (!hasD1(env)) {
    return json({
      ok: true,
      storage: { r2: hasR2(env), d1: false },
      submissions: [],
      message: "D1 storage is not configured.",
    });
  }

  await ensureD1Schema(env.ATAWI_BOARD_DB);
  const result = await env.ATAWI_BOARD_DB.prepare(
    `SELECT id, temple_slug, note, storage, status, uploaded_at, photo_count, total_bytes
       FROM photo_submissions
      ORDER BY uploaded_at DESC
      LIMIT 30`,
  ).all();

  return json({
    ok: true,
    storage: { r2: hasR2(env), d1: true },
    submissions: result.results || [],
  });
}

export async function onRequestPost({ request, env }) {
  const authResponse = await ensureAdmin(request, env);
  if (authResponse) return authResponse;

  const r2Available = hasR2(env);
  const d1Available = hasD1(env);
  if (!r2Available && !d1Available) {
    return json({
      ok: false,
      message: "Photo storage is not configured. Configure ATAWI_PHOTO_BUCKET or ATAWI_BOARD_DB.",
    }, { status: 503 });
  }

  const formData = await request.formData();
  const templeSlug = sanitize(formData.get("temple_slug"));
  const note = String(formData.get("note") || "").slice(0, 1000);
  const files = formData.getAll("photos").filter((file) => isFileLike(file) && file.size > 0);
  let photoCategories = [];
  try {
    photoCategories = JSON.parse(String(formData.get("photo_categories") || "[]"));
  } catch {
    photoCategories = [];
  }

  if (!templeSlug) return json({ ok: false, message: "Select a temple." }, { status: 400 });

  const storage = r2Available ? "r2" : "d1";
  const limits = storage === "r2"
    ? { maxFiles: R2_MAX_FILES, maxBytes: R2_MAX_BYTES }
    : { maxFiles: D1_MAX_FILES, maxBytes: D1_MAX_BYTES };
  const validationError = validateFiles(files, limits);
  if (validationError) return json({ ok: false, message: validationError }, { status: 400 });

  const now = new Date().toISOString();
  const submissionId = crypto.randomUUID();
  const saved = storage === "r2"
    ? await saveToR2({ env, templeSlug, submissionId, note, files, photoCategories, now })
    : await saveToD1({ env, templeSlug, submissionId, note, files, photoCategories, now });

  return json({
    ok: true,
    submission_id: submissionId,
    storage,
    status: "admin-uploaded",
    photos: saved.length,
    saved,
  });
}
