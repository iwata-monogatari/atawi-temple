import type { APIRoute } from "astro";
import { BLOG_DESCRIPTION, BLOG_TITLE, blogPosts } from "../lib/blog";
import { publicGuideArticles, tokushuArticles } from "../lib/editorial";
import { portalArticles } from "../lib/portal-articles";
import { researchArticles } from "../lib/research-articles";
import { templeKnowledge } from "../lib/temple-knowledge";
import { SITE_DISCLAIMER, SITE_SUMMARY, siteIndexPageCount } from "../lib/site-index";
import { allSects, allTemples, allTempleUpdates } from "../lib/temples";

/**
 * /llms.txt — 生成AI向けのサイト要約と主要な入口（編集憲章§6.4）。
 * 全ページの索引は /llms-full.txt に置く。どちらもデータから毎回組み立てるので、
 * 記事を足せば索引も自動で増える。
 */
export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/+$/, "") || "https://temple.atawi.link";
  const asOf = [
    ...allTemples.map((temple) => temple.last_verified_at),
    ...allTempleUpdates.map((update) => update.date),
    ...blogPosts.map((post) => post.updated),
  ].filter(Boolean).sort().at(-1) || "2026-07-17";

  const lines = [
    "# ATAWI TEMPLE（磐田市のお寺・寺院データベース）",
    "",
    `> ${SITE_SUMMARY}`,
    "",
    "## 主要な入口",
    "",
    `- 寺院一覧（${allTemples.length}件）: ${base}/temples/`,
    `- 9地区から探す: ${base}/areas/`,
    `- 宗派・関連法人から探す（${allSects.length}件）: ${base}/sects/`,
    `- 寺院名・宗派で検索: ${base}/search/`,
    `- 住所一覧・地図: ${base}/map/`,
    `- 調査状況: ${base}/status/`,
    `- 更新情報: ${base}/updates/`,
    "",
    "## 読みもの",
    "",
    `- 寺院の基礎資料（${templeKnowledge.length}本）: ${base}/knowledge/`,
    `- 家族のためのガイド（${portalArticles.length}本）: ${base}/topics/`,
    `- 基礎ガイド（${publicGuideArticles.length}本）: ${base}/guide/`,
    `- 特集・読みもの（${tokushuArticles.length}本）: ${base}/tokushu/`,
    `- 研究論文（${researchArticles.length}本）: ${base}/research/`,
    "",
    `## ブログ｜${BLOG_TITLE}（${blogPosts.length}本）`,
    "",
    `- 一覧: ${base}/blog/`,
    `- RSS: ${base}/feed.xml`,
    "",
    BLOG_DESCRIPTION,
    "",
    "データベース本体が運営組織名義の事実の整理であるのに対し、" +
      "ブログは大石浩之個人の署名記事です。現場で見たことと本人の判断を含みます。",
    "",
    ...blogPosts.slice(0, 20).map((post) =>
      `- ${post.title}（${post.published}）: ${base}/blog/${post.slug}/`),
    "",
    "## 家族向けの無料ツール",
    "",
    `- 実家カルテ: ${base}/jikka-karute/`,
    `- 家族で確認するチェックリスト: ${base}/guide/family-checklist/`,
    `- お盆・帰省の確認: ${base}/obon/`,
    "",
    "## 運営者",
    "",
    "- 運営会社: 富士ヶ丘サービス株式会社（静岡県磐田市）",
    "- サイト名: ATAWI TEMPLE",
    "- 編集: 大石浩之（宅地建物取引士）",
    `- 運営者情報: ${base}/about/`,
    `- 編集方針: ${base}/editorial-policy/`,
    `- 情報提供・訂正: ${base}/correction/`,
    "",
    "## 引用時の注意",
    "",
    SITE_DISCLAIMER,
    "",
    "## 全ページの索引",
    "",
    `- ${base}/llms-full.txt`,
    "",
    `（${asOf} 時点・全${siteIndexPageCount}ページ）`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
