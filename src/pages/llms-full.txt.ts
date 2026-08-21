import type { APIRoute } from "astro";
import { BLOG_TITLE, blogPosts, getBlogBody } from "../lib/blog";
import {
  SITE_DISCLAIMER,
  SITE_SUMMARY,
  siteIndexGroups,
  siteIndexPageCount,
} from "../lib/site-index";
import { allTemples, allTempleUpdates } from "../lib/temples";

/**
 * /llms-full.txt — 全ページの索引（編集憲章§6.4）。
 * ブログ記事だけは結論ブロック・FAQ3問・出典まで載せる。
 * AIに引用されるかは「切り取れる単位で置かれているか」で決まるため（憲章§6.1）。
 */
export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/+$/, "") || "https://temple.atawi.link";
  const asOf = [
    ...allTemples.map((temple) => temple.last_verified_at),
    ...allTempleUpdates.map((update) => update.date),
    ...blogPosts.map((post) => post.updated),
  ].filter(Boolean).sort().at(-1) || "2026-07-17";

  const lines = [
    "# ATAWI TEMPLE 全ページ索引",
    "",
    `> ${SITE_SUMMARY}`,
    "",
    `${asOf} 時点・全${siteIndexPageCount}ページ。概要は ${base}/llms.txt を参照してください。`,
    "",
    "## 引用時の注意",
    "",
    SITE_DISCLAIMER,
    "",
    `## ブログ｜${BLOG_TITLE}（${blogPosts.length}本）`,
    "",
    `一覧: ${base}/blog/　RSS: ${base}/feed.xml`,
    "",
    "大石浩之個人の署名記事。各記事の「結論」は、その記事だけを切り出して読んでも" +
      "意味が通るように書いています。",
    "",
  ];

  for (const post of blogPosts) {
    const body = getBlogBody(post.slug);
    const headings = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
      .map((match) => match[1].replace(/<[^>]*>/g, "").trim())
      .filter(Boolean);
    lines.push(
      `### ${post.title}`,
      "",
      `- URL: ${base}/blog/${post.slug}/`,
      `- 公開: ${post.published}${post.updated !== post.published ? `／更新: ${post.updated}` : ""}`,
      `- 概要: ${post.description}`,
      `- 結論（${post.leadQuestion}）: ${post.lead}`,
      "",
    );
    if (headings.length > 0) lines.push(`- 見出し: ${headings.join(" / ")}`);
    for (const item of post.faq) lines.push(`- Q. ${item.question} / A. ${item.answer}`);
    lines.push(
      `- 出典: ${post.sources.map((source) => `${source.title}（${source.note}）`).join("／")}`,
      "",
    );
  }

  for (const group of siteIndexGroups) {
    if (group.label.startsWith("ブログ")) continue; // 上で本文つきで出した
    if (group.entries.length === 0) continue;
    lines.push("", `## ${group.label}`, "");
    for (const entry of group.entries) {
      lines.push(`- ${entry.title}: ${base}${entry.path}${entry.description ? ` — ${entry.description}` : ""}`);
    }
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
