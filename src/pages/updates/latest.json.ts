import type { APIRoute } from "astro";
import { allTempleUpdates, getTempleBySlug, isCemeteryServiceInfo } from "../../lib/temples";

const recentUpdates = allTempleUpdates.slice(0, 5).map((update) => {
  const temple = getTempleBySlug(update.temple_slug);
  return {
    update_id: update.update_id,
    date: update.date,
    temple_slug: update.temple_slug,
    title: update.title,
    summary: isCemeteryServiceInfo(update.summary)
      ? "現地写真と基礎情報を更新しました。"
      : update.summary,
    href: "href" in update && update.href ? update.href : `/temples/${update.temple_slug}/`,
    temple_name: temple?.name || "",
    temple_area: temple?.area || "",
  };
});

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      generated_at: new Date().toISOString(),
      updates: recentUpdates,
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
