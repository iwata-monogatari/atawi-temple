import blogData from "../../data/blog-posts.json";

export const BLOG_TITLE = "大石浩之のお寺ノート";
export const BLOG_DESCRIPTION =
  "菩提寺・法要・墓じまい・実家じまいの相談を磐田市で受けている大石浩之（不動産業・宅地建物取引士）が、現場で見たことを書いているブログです。";

export type BlogFaq = { question: string; answer: string };
export type BlogSource = { title: string; url?: string; note: string };
export type BlogLink = { label: string; href: string };
export type BlogCover = { src: string; alt: string };

export type BlogPost = {
  /** 公開URLの末尾。YYYYMMDD-kebab-slug 形式で固定（URLは変更しない） */
  slug: string;
  title: string;
  description: string;
  /** 初出日。以後変更しない */
  published: string;
  /** 最終更新日。初出時は published と同じ */
  updated: string;
  /** 狙う検索クエリ1本（憲章§5.1） */
  query: string;
  /** 結論ブロックの Q（読者の話し言葉1行・憲章§4） */
  leadQuestion: string;
  /** 結論ブロックの A（200字以内・自己完結） */
  lead: string;
  tags: string[];
  cover?: BlogCover;
  /** FAQ 3問（憲章§4） */
  faq: BlogFaq[];
  sources: BlogSource[];
  /** 内部リンク3〜5本（憲章§5.2） */
  related: BlogLink[];
};

/**
 * 本文は台帳に埋めず data/blog/<slug>.html に置く。
 * 記事1本が数千字あるため、JSON へ押し込むとエスケープ事故で本文が壊れる。
 */
const bodyModules = import.meta.glob("../../data/blog/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const bodyBySlug = new Map<string, string>(
  Object.entries(bodyModules).map(([path, html]) => [
    (path.split("/").pop() || "").replace(/\.html$/, ""),
    html,
  ]),
);

export const blogPosts: BlogPost[] = [...(blogData.posts as unknown as BlogPost[])].sort(
  (a, b) => b.published.localeCompare(a.published) || b.slug.localeCompare(a.slug),
);

export const blogPostUrl = (slug: string) => `/blog/${slug}/`;

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogBody(slug: string) {
  return bodyBySlug.get(slug) || "";
}

/** 一覧を年月で束ねる（新しい順） */
export function groupBlogPostsByMonth(posts: BlogPost[] = blogPosts) {
  const groups = new Map<string, BlogPost[]>();
  for (const post of posts) {
    const key = post.published.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(post);
    else groups.set(key, [post]);
  }
  return [...groups.entries()].map(([month, items]) => ({
    month,
    label: `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`,
    posts: items,
  }));
}

/** sitemap / feed の lastmod に使う。記事が無い間はサイト公開日で埋める */
export const blogLastUpdated =
  blogPosts.map((post) => post.updated).sort().at(-1) || "2026-07-17";

export const formatBlogDate = (date: string) => date.replaceAll("-", ".");
