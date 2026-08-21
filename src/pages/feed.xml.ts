import type { APIRoute } from "astro";
import { BLOG_DESCRIPTION, BLOG_TITLE, blogLastUpdated, blogPosts } from "../lib/blog";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** JST 9:00 固定。ビルド時刻に依存させない（同じ入力なら同じ出力にする） */
function rfc822(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${String(day).padStart(2, "0")} ${MONTHS[month - 1]} ${year} 09:00:00 +0900`;
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.toString().replace(/\/+$/, "") || "https://temple.atawi.link";
  const items = blogPosts
    .slice(0, 50)
    .map((post) => {
      const url = `${baseUrl}/blog/${post.slug}/`;
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${escapeXml(post.description)}</description>
    <pubDate>${rfc822(post.published)}</pubDate>
    <author>oishi@ATAWI TEMPLE (大石浩之)</author>
${post.tags.map((tag) => `    <category>${escapeXml(tag)}</category>`).join("\n")}
  </item>`;
    })
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(BLOG_TITLE)}｜ATAWI TEMPLE</title>
  <link>${baseUrl}/blog/</link>
  <description>${escapeXml(BLOG_DESCRIPTION)}</description>
  <language>ja</language>
  <lastBuildDate>${rfc822(blogLastUpdated)}</lastBuildDate>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>
`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
};
