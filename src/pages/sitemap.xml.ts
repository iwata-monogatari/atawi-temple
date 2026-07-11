import type { APIRoute } from "astro";
import { allTemples } from "../lib/temples";

const staticPaths = [
  "/",
  "/temples/",
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
    ...allTemples.map((temple) => `/temples/${temple.slug}/`),
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
