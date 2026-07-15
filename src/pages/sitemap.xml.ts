import type { APIRoute } from "astro";
import { guideArticles, tokushuArticles } from "../lib/editorial";
import { allDistricts, allSects, allTemples, hasDetailPage } from "../lib/temples";

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
  const urls = [
    ...staticPaths,
    ...allDistricts.map((district) => `/areas/${district.slug}/`),
    ...allSects.map((sect) => `/sects/${sect.slug}/`),
    ...guideArticles.map((article) => `/guide/${article.slug}/`),
    ...tokushuArticles.map((article) => `/tokushu/${article.slug}/`),
    ...allTemples.filter(hasDetailPage).map((temple) => `/temples/${temple.slug}/`),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${baseUrl}${path}</loc>
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
