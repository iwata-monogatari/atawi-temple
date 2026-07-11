import { verifyAdmin } from "../_lib/access.js";

const LOGIN_PAGE = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>管理者ログイン｜ATAWI TEMPLE</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; background: #f5f2ec; color: #2b2b2b; }
  main { background: #fff; border: 1px solid #ddd5c8; border-radius: 12px; padding: 32px 28px; width: min(360px, calc(100vw - 48px)); box-shadow: 0 8px 24px rgba(0,0,0,.06); }
  h1 { font-size: 18px; margin: 0 0 8px; }
  p { font-size: 13px; line-height: 1.7; margin: 0 0 16px; color: #5a5a5a; }
  input { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 15px; border: 1px solid #c9c0b0; border-radius: 8px; }
  button { margin-top: 12px; width: 100%; padding: 10px; font-size: 15px; border: 0; border-radius: 8px; background: #6b5d3f; color: #fff; cursor: pointer; }
  button:hover { background: #55492f; }
</style>
</head>
<body>
<main>
  <h1>管理者ログイン</h1>
  <p>管理キーを入力してください。キーが正しくない場合は、この画面に戻ります。</p>
  <form id="login-form">
    <input id="admin-key" type="password" autocomplete="current-password" placeholder="管理キー" required>
    <button type="submit">ログイン</button>
  </form>
</main>
<script>
  document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const key = document.getElementById("admin-key").value.trim();
    if (!key) return;
    document.cookie = "atawi_admin_key=" + encodeURIComponent(key) + "; Path=/admin; Secure; SameSite=Strict; Max-Age=43200";
    window.location.reload();
  });
</script>
</body>
</html>`;

export async function onRequest({ request, env, next }) {
  try {
    if (await verifyAdmin(request, env)) return next();
    const wantsHtml = request.method === "GET" && (request.headers.get("Accept") || "").includes("text/html");
    if (wantsHtml) {
      return new Response(LOGIN_PAGE, {
        status: 401,
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return new Response("管理者ログインが必要です。", { status: 401 });
  } catch (error) {
    return new Response(`管理者認証の設定を確認してください。\n${error.message}`, { status: 503 });
  }
}
