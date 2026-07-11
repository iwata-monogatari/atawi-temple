import { verifyAccess } from "../../_lib/access.js";

const MAX_FILES = 12;
const MAX_BYTES = 12 * 1024 * 1024;

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

function sanitize(value) {
  return String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

export async function onRequestPost({ request, env }) {
  try {
    if (!(await verifyAccess(request, env))) {
      return json({ ok: false, message: "管理者として認証されていません。" }, { status: 401 });
    }
  } catch (error) {
    return json({ ok: false, message: error.message }, { status: 503 });
  }

  if (!env.ATAWI_PHOTO_BUCKET) {
    return json({ ok: false, message: "写真保存用R2が設定されていません。" }, { status: 503 });
  }

  const formData = await request.formData();
  const templeSlug = sanitize(formData.get("temple_slug"));
  const note = String(formData.get("note") || "").slice(0, 1000);
  const files = formData.getAll("photos").filter((file) => file instanceof File && file.size > 0);
  let photoCategories = [];
  try { photoCategories = JSON.parse(String(formData.get("photo_categories") || "[]")); } catch {}

  if (!templeSlug) return json({ ok: false, message: "寺院を選択してください。" }, { status: 400 });
  if (files.length === 0) return json({ ok: false, message: "写真を選択してください。" }, { status: 400 });
  if (files.length > MAX_FILES) return json({ ok: false, message: `写真は一度に${MAX_FILES}枚までです。` }, { status: 400 });

  const now = new Date().toISOString();
  const submissionId = crypto.randomUUID();
  const saved = [];

  for (const [index, file] of files.entries()) {
    if (!file.type.startsWith("image/")) return json({ ok: false, message: `${file.name}は画像ではありません。` }, { status: 400 });
    if (file.size > MAX_BYTES) return json({ ok: false, message: `${file.name}は12MBを超えています。` }, { status: 400 });
    const category = photoCategories.find((item) => item.file_name === file.name)?.category_id || "other";
    const key = `admin-uploads/${templeSlug}/${submissionId}/${String(index + 1).padStart(2, "0")}-${sanitize(file.name) || "photo.jpg"}`;
    await env.ATAWI_PHOTO_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { temple_slug: templeSlug, submission_id: submissionId, category_id: sanitize(category), uploaded_at: now },
    });
    saved.push({ key, name: file.name, type: file.type, size: file.size, category_id: category });
  }

  await env.ATAWI_PHOTO_BUCKET.put(
    `admin-uploads/${templeSlug}/${submissionId}/metadata.json`,
    JSON.stringify({ submission_id: submissionId, temple_slug: templeSlug, note, uploaded_at: now, status: "admin-uploaded", photos: saved }, null, 2),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } },
  );

  return json({ ok: true, submission_id: submissionId, status: "admin-uploaded", photos: saved.length });
}
