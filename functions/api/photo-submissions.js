const MAX_FILES = 12;
const MAX_BYTES = 12 * 1024 * 1024;

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function sanitize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function onRequestPost({ request, env }) {
  if (!env.ATAWI_PHOTO_BUCKET) {
    return json(
      {
        ok: false,
        code: "PHOTO_BUCKET_NOT_CONFIGURED",
        message: "Cloudflare R2 binding ATAWI_PHOTO_BUCKET is required before photos can be stored.",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const templeSlug = sanitize(formData.get("temple_slug"));
  const submitterName = String(formData.get("submitter_name") || "").slice(0, 80);
  const note = String(formData.get("note") || "").slice(0, 1000);
  const files = formData.getAll("photos").filter((file) => file instanceof File && file.size > 0);

  if (!templeSlug) return json({ ok: false, message: "temple_slug is required." }, { status: 400 });
  if (files.length === 0) return json({ ok: false, message: "At least one photo is required." }, { status: 400 });
  if (files.length > MAX_FILES) return json({ ok: false, message: `Up to ${MAX_FILES} photos can be uploaded at once.` }, { status: 400 });

  const now = new Date().toISOString();
  const submissionId = crypto.randomUUID();
  const saved = [];

  for (const [index, file] of files.entries()) {
    if (!file.type.startsWith("image/")) {
      return json({ ok: false, message: `${file.name} is not an image.` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return json({ ok: false, message: `${file.name} is larger than 12MB.` }, { status: 400 });
    }

    const extension = sanitize(file.name.split(".").pop() || "jpg") || "jpg";
    const key = `submissions/${templeSlug}/${submissionId}/${String(index + 1).padStart(2, "0")}-${sanitize(file.name) || `photo.${extension}`}`;
    await env.ATAWI_PHOTO_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        temple_slug: templeSlug,
        submission_id: submissionId,
        submitted_at: now,
      },
    });
    saved.push({ key, name: file.name, type: file.type, size: file.size });
  }

  const metadataKey = `submissions/${templeSlug}/${submissionId}/metadata.json`;
  await env.ATAWI_PHOTO_BUCKET.put(
    metadataKey,
    JSON.stringify(
      {
        submission_id: submissionId,
        temple_slug: templeSlug,
        submitter_name: submitterName,
        note,
        submitted_at: now,
        status: "pending-review",
        photos: saved,
      },
      null,
      2,
    ),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } },
  );

  return json({ ok: true, submission_id: submissionId, status: "pending-review", photos: saved.length });
}
