function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

export async function onRequestGet({ env }) {
  if (!env.ATAWI_BOARD_DB) return json({ ok: false, message: "D1 binding ATAWI_BOARD_DBが必要です。" }, { status: 503 });
  const result = await env.ATAWI_BOARD_DB.prepare(
    `SELECT id, temple_slug, category, display_name, title, body, source_info,
            contact_email, status, public_reply, created_at, reviewed_at, published_at
       FROM board_posts
      ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC
      LIMIT 200`,
  ).all();
  return json({ ok: true, posts: result.results || [] });
}

export async function onRequestPatch({ request, env }) {
  if (!env.ATAWI_BOARD_DB) return json({ ok: false, message: "D1 binding ATAWI_BOARD_DBが必要です。" }, { status: 503 });
  let input;
  try { input = await request.json(); } catch {
    return json({ ok: false, message: "更新内容を確認してください。" }, { status: 400 });
  }

  const id = String(input.id || "");
  const status = String(input.status || "");
  const publicReply = String(input.public_reply || "").normalize("NFKC").trim().slice(0, 1000);
  if (!id || !["approved", "rejected", "resolved"].includes(status)) {
    return json({ ok: false, message: "投稿IDと状態を確認してください。" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const publishedAt = status === "approved" || status === "resolved" ? now : null;
  const result = await env.ATAWI_BOARD_DB.prepare(
    `UPDATE board_posts
        SET status = ?, public_reply = ?, reviewed_at = ?,
            published_at = COALESCE(published_at, ?)
      WHERE id = ?`,
  ).bind(status, publicReply, now, publishedAt, id).run();
  if (!result.meta?.changes) return json({ ok: false, message: "投稿が見つかりません。" }, { status: 404 });
  return json({ ok: true, id, status });
}

