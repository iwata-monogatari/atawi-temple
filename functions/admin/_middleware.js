import { verifyAccess } from "../_lib/access.js";

export async function onRequest({ request, env, next }) {
  try {
    if (await verifyAccess(request, env)) return next();
    return new Response("管理者ログインが必要です。", { status: 401 });
  } catch (error) {
    return new Response(`管理者認証の設定を確認してください。\n${error.message}`, { status: 503 });
  }
}
