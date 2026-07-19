import type { APIRoute } from "astro";
import { publicGuideArticles, tokushuArticles } from "../lib/editorial";
import { allDistricts, allSects, allTempleUpdates, allTemples, hasDetailPage } from "../lib/temples";

const staticPaths = [
  "/",
  "/areas/",
  "/map/",
  "/sects/",
  "/temples/",
  "/obon/",
  "/guide/",
  "/tokushu/",
  "/updates/",
  "/status/",
  "/search/",
  "/about/",
  "/editorial-policy/",
  "/correction/",
  "/privacy/",
];

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.toString().replace(/\/+$/, "") || "https://temple.atawi.link";
  const latestSiteDate = [
    ...allTemples.map((temple) => temple.last_verified_at),
    ...allTempleUpdates.map((update) => update.date),
  ].sort().at(-1) || "2026-07-17";
  const urls = [
    ...staticPaths.map((path) => ({ path, lastmod: latestSiteDate })),
    ...allDistricts.map((district) => ({ path: `/areas/${district.slug}/`, lastmod: latestSiteDate })),
    ...allSects.map((sect) => ({ path: `/sects/${sect.slug}/`, lastmod: latestSiteDate })),
    ...publicGuideArticles.map((article) => ({ path: `/guide/${article.slug}/`, lastmod: latestSiteDate })),
    ...tokushuArticles.map((article) => ({ path: `/tokushu/${article.slug}/`, lastmod: latestSiteDate })),
    ...allTemples.filter(hasDetailPage).map((temple) => ({
      path: `/temples/${temple.slug}/`,
      lastmod: temple.last_verified_at || latestSiteDate,
    })),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ path, lastmod }) => `  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${path.startsWith("/temples/") ? "monthly" : "weekly"}</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
};
