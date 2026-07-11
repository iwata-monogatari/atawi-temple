const CATEGORIES = new Set(["reading", "history", "heritage", "location", "publication", "other"]);

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

function clean(value, maxLength) {
  return String(value || "").normalize("NFKC").trim().slice(0, maxLength);
}

function validSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

async function hashRateKey(request, env) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const source = `${env.BOARD_RATE_LIMIT_SALT || "atawi-temple-board"}:${ip}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet({ env }) {
  if (!env.ATAWI_BOARD_DB) {
    return json({ ok: true, configured: false, posts: [] });
  }

  const result = await env.ATAWI_BOARD_DB.prepare(
    `SELECT id, temple_slug, category, display_name, title, body, source_info,
            status, public_reply, created_at, published_at
       FROM board_posts
      WHERE status IN ('approved', 'resolved')
      ORDER BY published_at DESC
      LIMIT 50`,
  ).all();

  return json({ ok: true, configured: true, posts: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!env.ATAWI_BOARD_DB) {
    return json({ ok: false, message: "掲示板の保存先を準備中です。" }, { status: 503 });
  }

  let input;
  try { input = await request.json(); } catch {
    return json({ ok: false, message: "送信内容を確認してください。" }, { status: 400 });
  }

  if (clean(input.website, 200)) return json({ ok: true, accepted: true });

  const templeSlug = clean(input.temple_slug, 120).toLowerCase();
  const category = clean(input.category, 30);
  const displayName = clean(input.display_name, 40) || "匿名";
  const title = clean(input.title, 80);
  const body = clean(input.body, 2000);
  const sourceInfo = clean(input.source_info, 500);
  const contactEmail = clean(input.contact_email, 160);

  if (!validSlug(templeSlug)) return json({ ok: false, message: "対象寺院を選択してください。" }, { status: 400 });
  if (!CATEGORIES.has(category)) return json({ ok: false, message: "情報の種類を選択してください。" }, { status: 400 });
  if (title.length < 4) return json({ ok: false, message: "件名を4文字以上で入力してください。" }, { status: 400 });
  if (body.length < 20) return json({ ok: false, message: "情報の内容を20文字以上で入力してください。" }, { status: 400 });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return json({ ok: false, message: "連絡先メールアドレスを確認してください。" }, { status: 400 });
  }

  const rateKey = await hashRateKey(request, env);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await env.ATAWI_BOARD_DB.prepare(
    "SELECT COUNT(*) AS count FROM board_posts WHERE rate_key = ? AND created_at >= ?",
  ).bind(rateKey, since).first();
  if (Number(recent?.count || 0) >= 5) {
    return json({ ok: false, message: "短時間の投稿上限に達しました。時間をおいてください。" }, { status: 429 });
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.ATAWI_BOARD_DB.prepare(
    `INSERT INTO board_posts
      (id, temple_slug, category, display_name, title, body, source_info,
       contact_email, status, public_reply, rate_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', ?, ?)`,
  ).bind(id, templeSlug, category, displayName, title, body, sourceInfo, contactEmail, rateKey, createdAt).run();

  return json({ ok: true, accepted: true, id, message: "投稿を受け付けました。確認後に掲示板へ掲載します。" });
}

