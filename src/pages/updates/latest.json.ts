import type { APIRoute } from "astro";
import {recentSiteUpdates} from "../../lib/updates";

const recentUpdates = recentSiteUpdates;

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
