// ブログ台帳（data/blog-posts.json）と本文（data/blog/*.html）の検査。
// 編集憲章の査読ゲートのうち、機械で判定できる項目だけをここで落とす。
import { readFile, readdir, access } from "node:fs/promises";

const ledger = JSON.parse(await readFile("data/blog-posts.json", "utf8"));
const posts = ledger.posts ?? [];

const bodyFiles = (await readdir("data/blog"))
  .filter((name) => name.endsWith(".html"))
  .map((name) => name.replace(/\.html$/, ""));

const errors = [];
const warnings = [];

/** 「政」＋「策」の2文字連結は全サイト全面禁止（編集憲章§7.1） */
const FORBIDDEN_WORD = "政" + "策";

/** AI臭の定型句（編集憲章§7.4） */
const FORBIDDEN_PHRASES = [
  "いかがでしたか",
  "ポイントは3つです",
  "ぜひ",
  "していきましょう",
  "近年、",
  "が求められています",
  "が注目されています",
];

/** 相対表現は数値化する（編集憲章§6.1） */
const RELATIVE_EXPRESSIONS = ["昨年", "一昨年", "最近", "今後ますます"];

const ALLOWED_TAGS = new Set([
  "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "a", "br",
  "table", "thead", "tbody", "tr", "th", "td", "blockquote",
  "figure", "figcaption", "img", "small", "span", "dl", "dt", "dd",
]);

function requireText(record, field, label, max) {
  const value = record[field];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label}: ${field} が空です`);
    return;
  }
  if (max && [...value].length > max) {
    errors.push(`${label}: ${field} が${max}字を超えています（${[...value].length}字）`);
  }
}

const seenSlugs = new Set();

for (const post of posts) {
  const label = `blog:${post.slug ?? "(slug無し)"}`;

  if (!/^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug ?? "")) {
    errors.push(`${label}: slug は YYYYMMDD-kebab-slug 形式にしてください`);
  }
  if (seenSlugs.has(post.slug)) errors.push(`${label}: slug が重複しています`);
  seenSlugs.add(post.slug);

  requireText(post, "title", label, 32);
  requireText(post, "description", label, 160);
  requireText(post, "query", label);
  requireText(post, "leadQuestion", label);
  requireText(post, "lead", label, 200);

  for (const field of ["published", "updated"]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post[field] ?? "")) {
      errors.push(`${label}: ${field} は YYYY-MM-DD で書いてください`);
    }
  }
  // slug の日付と published がずれると sitemap・feed・URL の日付が食い違う
  if (typeof post.slug === "string" && typeof post.published === "string") {
    if (post.slug.slice(0, 8) !== post.published.replaceAll("-", "")) {
      errors.push(`${label}: slug の日付と published が一致しません`);
    }
  }
  if (post.updated < post.published) {
    errors.push(`${label}: updated が published より前です`);
  }

  if (!Array.isArray(post.faq) || post.faq.length !== 3) {
    errors.push(`${label}: FAQ はちょうど3問にしてください（編集憲章§4）`);
  } else {
    post.faq.forEach((item, index) => {
      if (!item?.question || !item?.answer) errors.push(`${label}: FAQ ${index + 1} が不完全です`);
    });
  }

  if (!Array.isArray(post.sources) || post.sources.length === 0) {
    errors.push(`${label}: sources が空です（一次情報と確認日を必ず書く）`);
  } else {
    for (const source of post.sources) {
      if (!source?.title) errors.push(`${label}: sources に title の無い項目があります`);
      if (!source?.note || !/\d{4}年\d{1,2}月/.test(source.note)) {
        errors.push(`${label}: sources の note に「YYYY年M月確認」を書いてください（${source?.title}）`);
      }
    }
  }

  const related = Array.isArray(post.related) ? post.related : [];
  if (related.length < 3 || related.length > 5) {
    errors.push(`${label}: 内部リンク related は3〜5本にしてください（現在${related.length}本）`);
  }
  for (const link of related) {
    if (!link?.href?.startsWith("/")) {
      errors.push(`${label}: related の href はサイト内の絶対パスにしてください（${link?.href}）`);
    }
  }

  if (!Array.isArray(post.tags) || post.tags.length === 0) {
    warnings.push(`${label}: tags が空です`);
  }

  if (post.cover) {
    if (!post.cover.src?.startsWith("/")) errors.push(`${label}: cover.src はサイト内の絶対パスにしてください`);
    if (!post.cover.alt) errors.push(`${label}: cover.alt が空です`);
    else {
      try {
        await access(`public${post.cover.src}`);
      } catch {
        errors.push(`${label}: cover の実体がありません（public${post.cover.src}）`);
      }
    }
  }

  // ---- 本文 ----
  if (!bodyFiles.includes(post.slug)) {
    errors.push(`${label}: 本文 data/blog/${post.slug}.html がありません`);
    continue;
  }

  const body = await readFile(`data/blog/${post.slug}.html`, "utf8");
  const visible = body.replace(/<[^>]*>/g, "").replace(/\s+/g, "");

  if (visible.length < 2500) {
    warnings.push(`${label}: 本文が${visible.length}字です（目安3,500〜4,500字）`);
  }
  if (/<h1[\s>]/i.test(body)) errors.push(`${label}: 本文に <h1> を書かないでください（テンプレートが出します）`);
  if (/<(script|style|iframe)[\s>]/i.test(body)) errors.push(`${label}: 本文に script/style/iframe は置けません`);

  const h2Count = (body.match(/<h2[\s>]/gi) || []).length;
  if (h2Count < 3) warnings.push(`${label}: h2 が${h2Count}本です（4〜5本が目安）`);

  for (const tag of body.matchAll(/<\/?([a-zA-Z0-9]+)[\s>/]/g)) {
    const name = tag[1].toLowerCase();
    if (!ALLOWED_TAGS.has(name)) errors.push(`${label}: 使用できないタグ <${name}> があります`);
  }
  for (const img of body.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=/.test(img[0])) errors.push(`${label}: alt の無い img があります`);
  }

  // ---- 禁止語・定型句（台帳と本文の両方を見る）----
  const haystack = [
    body,
    post.title,
    post.description,
    post.lead,
    post.leadQuestion,
    ...(post.tags ?? []),
    ...(post.faq ?? []).flatMap((item) => [item?.question, item?.answer]),
  ]
    .filter(Boolean)
    .join("\n");

  if (haystack.includes(FORBIDDEN_WORD)) {
    errors.push(`${label}: 禁止語（編集憲章§7.1）が含まれています`);
  }
  for (const phrase of FORBIDDEN_PHRASES) {
    if (haystack.includes(phrase)) warnings.push(`${label}: 定型句「${phrase}」があります（編集憲章§7.4）`);
  }
  for (const expression of RELATIVE_EXPRESSIONS) {
    if (haystack.includes(expression)) warnings.push(`${label}: 相対表現「${expression}」は数値化してください（§6.1）`);
  }
}

for (const orphan of bodyFiles.filter((slug) => !seenSlugs.has(slug))) {
  errors.push(`blog:${orphan}: 本文だけあって台帳に登録されていません`);
}

for (const warning of warnings) console.warn(`[WARN] ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`[NG] ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[OK] ${posts.length} blog posts validated`);
}
