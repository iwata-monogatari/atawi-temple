import { blogPosts } from "./blog";
import { publicGuideArticles, tokushuArticles } from "./editorial";
import { portalArticles, portalCategories } from "./portal-articles";
import { researchArticles } from "./research-articles";
import { templeKnowledge } from "./temple-knowledge";
import { allDistricts, allSects, allTemples } from "./temples";

export const SITE_URL = "https://temple.atawi.link";

export const SITE_SUMMARY =
  "磐田市の寺院を1か寺ずつ調べて整理している地域データベースです。" +
  `現存寺院・廃寺・寺院跡・霊場を含む${allTemples.length}件を、9地区と宗派で分類し、` +
  "所在地、宗派、本尊、沿革、現地確認の状況、写真を出典とともに掲載します。" +
  "あわせて、法要・帰省・実家じまいを家族で確認するためのガイドを載せています。";

export const SITE_DISCLAIMER =
  "本サイトは各寺院の公式サイトではありません。掲載内容は公開資料と現地確認にもとづく整理であり、" +
  "沿革や創建年代には諸説あるものがあります。未確認の項目は「未確認」「調査中」と明示しています。" +
  "引用の際は各ページの出典と確認日をあわせてご確認ください。" +
  "法要の作法や費用は宗派・寺院・地域で異なります。個別の判断は必ず菩提寺に、" +
  "相続・税・登記の判断は専門家にご確認ください。";

export type IndexEntry = { path: string; title: string; description?: string };
export type IndexGroup = { label: string; entries: IndexEntry[] };

/**
 * llms-full.txt 用の全ページ索引。
 * sitemap.xml.ts と同じデータ源から作るので、記事を足せば索引も自動で増える。
 * ただし**新しい種類のページを足したときは、sitemap.xml.ts とこの両方に追記する**。
 */
export const siteIndexGroups: IndexGroup[] = [
  {
    label: "主要ページ",
    entries: [
      { path: "/", title: "トップ", description: "磐田市のお寺・寺院データベース" },
      { path: "/temples/", title: "寺院一覧" },
      { path: "/areas/", title: "9地区から探す" },
      { path: "/sects/", title: "宗派・関連法人から探す" },
      { path: "/search/", title: "寺院名・宗派で検索" },
      { path: "/map/", title: "住所一覧・地図" },
      { path: "/status/", title: "調査状況" },
      { path: "/updates/", title: "更新情報" },
      { path: "/knowledge/", title: "寺院の基礎資料（一覧）" },
      { path: "/guide/", title: "基礎ガイド（一覧）" },
      { path: "/topics/", title: "家族のためのガイド（一覧）" },
      { path: "/tokushu/", title: "特集・読みもの（一覧）" },
      { path: "/research/", title: "研究論文（一覧）" },
      { path: "/blog/", title: "大石浩之のお寺ノート（一覧）" },
      { path: "/obon/", title: "お盆・帰省の確認" },
      { path: "/jikka-karute/", title: "実家カルテ（無料ツール）" },
      { path: "/guide/family-checklist/", title: "家族で確認するチェックリスト" },
      { path: "/guide/jikka-information/", title: "実家の情報整理" },
      { path: "/about/", title: "運営者情報" },
      { path: "/editorial-policy/", title: "編集方針" },
      { path: "/correction/", title: "情報提供・訂正" },
      { path: "/privacy/", title: "プライバシーポリシー" },
    ],
  },
  {
    // sitemap.xml と件数を揃える。detail_page: false の寺院にも個別ページは生成される
    label: `寺院（${allTemples.length}か寺）`,
    entries: allTemples.map((temple) => ({
      path: `/temples/${temple.slug}/`,
      title: `${temple.name}（${temple.area}地区・${temple.sect}・${temple.status_label}）`,
    })),
  },
  {
    label: `地区（${allDistricts.length}地区）`,
    entries: allDistricts.map((district) => ({
      path: `/areas/${district.slug}/`,
      title: `${district.name}地区の寺院`,
      description: district.summary,
    })),
  },
  {
    label: `宗派（${allSects.length}件）`,
    entries: allSects.map((sect) => ({
      path: `/sects/${sect.slug}/`,
      title: `${sect.name}の寺院`,
    })),
  },
  {
    label: `寺院の基礎資料（${templeKnowledge.length}本）`,
    entries: templeKnowledge.map((item) => ({
      path: `/knowledge/${item.slug}/`,
      title: item.title,
      description: item.description,
    })),
  },
  {
    label: `基礎ガイド（${publicGuideArticles.length}本）`,
    entries: publicGuideArticles.map((article) => ({
      path: `/guide/${article.slug}/`,
      title: article.title,
      description: article.description,
    })),
  },
  {
    label: `家族のためのガイド（${portalCategories.length}分類・${portalArticles.length}本）`,
    entries: [
      ...portalCategories.map((category) => ({
        path: `/topics/${category.key}/`,
        title: `${category.label}（${category.count}本）`,
      })),
      ...portalArticles.map((article) => ({
        path: `/topics/${article.category}/${article.slug}/`,
        title: article.title,
        description: article.description,
      })),
    ],
  },
  {
    label: `特集・読みもの（${tokushuArticles.length}本）`,
    entries: tokushuArticles.map((article) => ({
      path: `/tokushu/${article.slug}/`,
      title: article.title,
      description: article.description,
    })),
  },
  {
    label: `研究論文（${researchArticles.length}本）`,
    entries: researchArticles.map((article) => ({
      path: `/research/${article.slug}/`,
      title: article.title,
      description: article.description,
    })),
  },
  {
    label: `ブログ｜大石浩之のお寺ノート（${blogPosts.length}本）`,
    entries: blogPosts.map((post) => ({
      path: `/blog/${post.slug}/`,
      title: post.title,
      description: post.description,
    })),
  },
];

export const siteIndexPageCount = siteIndexGroups.reduce(
  (total, group) => total + group.entries.length,
  0,
);
