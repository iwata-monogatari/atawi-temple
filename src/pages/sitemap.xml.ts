import type { APIRoute } from "astro";
import { publicGuideArticles, tokushuArticles } from "../lib/editorial";
import { researchArticles } from "../lib/research-articles";
import { portalArticles, portalCategories } from "../lib/portal-articles";
import { allDistricts, allSects, allTempleUpdates, allTemples } from "../lib/temples";

const staticPaths = [
  "/",
  "/areas/",
  "/map/",
  "/sects/",
  "/temples/",
  "/obon/",
  "/guide/",
  "/tokushu/",
  "/research/",
  "/updates/",
  "/status/",
  "/search/",
  "/about/",
  "/editorial-policy/",
  "/correction/",
  "/privacy/",
  "/topics/",
  "/jikka-karute/",
  "/guide/family-checklist/",
  "/guide/jikka-information/",
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
    ...portalCategories.map((category) => ({ path: `/topics/${category.key}/`, lastmod: "2026-07-27" })),
    ...portalArticles.map((article) => ({
      path: `/topics/${article.category}/${article.slug}/`,
      lastmod: article.updated,
    })),
    ...tokushuArticles.map((article) => ({ path: `/tokushu/${article.slug}/`, lastmod: latestSiteDate })),
    ...researchArticles.map((article) => ({ path: `/research/${article.slug}/`, lastmod: article.updated })),
    ...allTemples.map((temple) => ({
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
