import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const errors = [];

async function readBuiltFile(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    errors.push(`build output: missing ${path}`);
    return "";
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(entryPath);
    }
  }
  return files;
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&#34;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function sitemapPathToFile(pathname) {
  const normalizedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  if (normalizedPath.endsWith("/")) {
    return path.join("dist", normalizedPath, "index.html");
  }
  if (path.extname(normalizedPath)) {
    return path.join("dist", normalizedPath);
  }
  return path.join("dist", normalizedPath, "index.html");
}

const toyodaHtml = await readBuiltFile("dist/areas/toyoda/index.html");
const chionsaiHtml = await readBuiltFile("dist/temples/chionsai-hitokoto/index.html");
const indexHtml = await readBuiltFile("dist/index.html");
const searchHtml = await readBuiltFile("dist/search/index.html");
const sitemapXml = await readBuiltFile("dist/sitemap.xml");
const templesJson = JSON.parse(await readFile("data/temples.json", "utf8"));
const priorityPortalSource = await readFile("src/lib/portal-priority-articles.ts", "utf8");
const priorityPortalSlugs = [...priorityPortalSource.matchAll(/^\s{2}"([a-z-]+-\d{2})": o\(/gm)].map((match) => match[1]);
const expectedToyodaHeroImage = "/images/temples/gyokoji-ikeda/gyokoji-ikeda-03-main-hall.webp";
const expectedChionsaiHeroImage = "/assets/temples/chionsai-hitokoto/748700946_37058201220492041_8019282847618984703_n.jpg";
const requiredToyodaTempleNames = [
  "行興寺",
  "松向寺",
  "智恩齋",
  "安楽寺",
  "豊田院",
  "正医寺",
  "福王寺",
  "林昌寺",
  "興徳寺",
  "養福寺",
  "妙法寺",
  "誓渡院",
  "大圓寺",
  "大蔵寺",
];

if (priorityPortalSlugs.length < 30 || priorityPortalSlugs.length > 50) {
  errors.push(`priority portal: expected 30–50 individually edited articles, found ${priorityPortalSlugs.length}`);
}

const priorityCompositionIds = new Set();
const priorityIllustrationLayouts = new Set();
const prioritySceneSignatures = new Set();

for (const slug of priorityPortalSlugs) {
  const category = slug.replace(/-\d{2}$/, "");
  const html = await readBuiltFile(`dist/topics/${category}/${slug}/index.html`);
  if (!html.includes("重点個別編集記事")) {
    errors.push(`priority portal: ${slug} is missing the editorial badge`);
  }
  if (!html.includes("主題に直接対応する一次情報")) {
    errors.push(`priority portal: ${slug} is missing the primary-source disclosure`);
  }
  if (!html.includes("確認先・参考情報")) {
    errors.push(`priority portal: ${slug} is missing individual guidance or sources`);
  }
  const longformSections = [...html.matchAll(/<section class="article-section longform-section"[^>]*>([\s\S]*?)<\/section>/g)];
  const sectionLengths = longformSections.map((match) => match[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&[^;]+;/g, "")
    .replace(/\s+/g, "")
    .length);
  const bodyLength = sectionLengths.reduce((total, length) => total + length, 0);
  const compositionIds = [...html.matchAll(/data-composition-id="([^"]+)"/g)].map((match) => match[1]);
  const illustrationScenes = [...html.matchAll(/data-illustration-layout="([^"]+)"[^>]*data-scene-seed="([^"]+)"/g)];
  const illustrationCount = compositionIds.length;
  if (longformSections.length !== 4) {
    errors.push(`priority portal: ${slug} must have 4 longform sections, found ${longformSections.length}`);
  }
  if (bodyLength < 4000) {
    errors.push(`priority portal: ${slug} longform body must be at least 4000 characters, found ${bodyLength}`);
  }
  sectionLengths.forEach((length, index) => {
    if (length < 1000) {
      errors.push(`priority portal: ${slug} section ${index + 1} must be at least 1000 characters, found ${length}`);
    }
  });
  if (illustrationCount < 3) {
    errors.push(`priority portal: ${slug} must have at least 3 illustrations, found ${illustrationCount}`);
  }
  for (const compositionId of compositionIds) {
    if (priorityCompositionIds.has(compositionId)) {
      errors.push(`priority portal: duplicated illustration composition ${compositionId}`);
    }
    priorityCompositionIds.add(compositionId);
  }
  for (const scene of illustrationScenes) {
    priorityIllustrationLayouts.add(scene[1]);
    const signature = `${scene[1]}:${scene[2]}:${slug}`;
    if (prioritySceneSignatures.has(signature)) {
      errors.push(`priority portal: duplicated rich illustration scene ${signature}`);
    }
    prioritySceneSignatures.add(signature);
  }
}

if (priorityCompositionIds.size !== priorityPortalSlugs.length * 3) {
  errors.push(`priority portal: expected ${priorityPortalSlugs.length * 3} unique illustration compositions, found ${priorityCompositionIds.size}`);
}
if (priorityIllustrationLayouts.size < 15) {
  errors.push(`priority portal: expected 15 rich illustration layouts, found ${priorityIllustrationLayouts.size}`);
}
if (prioritySceneSignatures.size !== priorityPortalSlugs.length * 3) {
  errors.push(`priority portal: expected ${priorityPortalSlugs.length * 3} rich illustration scenes, found ${prioritySceneSignatures.size}`);
}

if (toyodaHtml) {
  if (!toyodaHtml.includes(expectedToyodaHeroImage)) {
    errors.push(`areas/toyoda: expected fixed hero image ${expectedToyodaHeroImage}`);
  }

  for (const name of requiredToyodaTempleNames) {
    if (!toyodaHtml.includes(name)) {
      errors.push(`areas/toyoda: missing required temple name "${name}"`);
    }
  }

  if (toyodaHtml.includes("temple-card-photo--placeholder")) {
    errors.push("areas/toyoda: no-photo cards must render as text cards, not empty photo placeholders");
  }

  if (!toyodaHtml.includes("temple-card--no-photo")) {
    errors.push("areas/toyoda: expected no-photo cards to use temple-card--no-photo");
  }
}

if (chionsaiHtml) {
  if (!chionsaiHtml.includes(expectedChionsaiHeroImage)) {
    errors.push(`temples/chionsai-hitokoto: expected restored hero image ${expectedChionsaiHeroImage}`);
  }

  if (!chionsaiHtml.includes("智恩齋")) {
    errors.push("temples/chionsai-hitokoto: missing temple name");
  }
}

if (indexHtml) {
  const pickupIndex = indexHtml.indexOf("ピックアップ寺院");
  const districtIndex = indexHtml.indexOf("9地区から探す");
  const updatesIndex = indexHtml.indexOf("更新情報");
  // 2026-08-21 に9地区の導線をトップ寄りへ移した（commit bf78ff4f）。
  // 期待する順序は「9地区 → ピックアップ寺院 → 更新情報」。
  if (!(districtIndex >= 0 && pickupIndex > districtIndex && updatesIndex > pickupIndex)) {
    errors.push("index: primary flow must be districts, pickup temples, then recent updates");
  }
  if (indexHtml.includes("菩提寺を確認したら、実家も一度だけ見ておく")) {
    errors.push("index: related service promotion must not interrupt the primary discovery flow");
  }
  const priorityIndexLink = indexHtml.indexOf("/topics/#priority-guides");
  const discoveryIndex = indexHtml.indexOf("discovery-actions");
  if (!(priorityIndexLink >= 0 && discoveryIndex > priorityIndexLink)) {
    errors.push("index: priority 50-guide entry must appear prominently before discovery actions");
  }
  if (!indexHtml.includes("法要・帰省・実家を考える50の重点ガイド")) {
    errors.push("index: missing priority 50-guide heading");
  }
}

if (searchHtml) {
  const dataMatch = searchHtml.match(/data-temples="([^"]*)"/);
  if (!dataMatch) {
    errors.push("search: missing embedded temple search data");
  } else {
    try {
      const searchData = JSON.parse(decodeHtmlAttribute(dataMatch[1]));
      if (!Array.isArray(searchData)) {
        errors.push("search: embedded temple search data must be an array");
      } else if (searchData.length !== templesJson.length) {
        errors.push(`search: embedded temple count ${searchData.length} does not match data/temples.json ${templesJson.length}`);
      } else if (!searchData.some((temple) => temple.slug === "anrakuji-tateno"
        && temple.main_deity.includes("薬師如来")
        && temple.main_deity_status === "未確認")) {
        errors.push("search: historical deity information and current confirmation status must be kept separate");
      }
    } catch (error) {
      errors.push(`search: embedded temple search data is not valid JSON (${error.message})`);
    }
  }
}

if (sitemapXml) {
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (locs.length === 0) {
    errors.push("sitemap: no URLs found");
  }
  for (const loc of locs) {
    const url = new URL(loc);
    const filePath = sitemapPathToFile(url.pathname);
    if (!await fileExists(filePath)) {
      errors.push(`sitemap: ${url.pathname} does not map to a built file (${filePath})`);
    }
  }
}

for (const filePath of await listHtmlFiles("dist")) {
  const html = await readFile(filePath, "utf8");
  const relativePath = path.relative("dist", filePath).replaceAll("\\", "/");
  const imgTags = html.match(/<img\b[^>]*>/g) || [];
  for (const tag of imgTags) {
    if (!/\balt\s*=/.test(tag)) {
      errors.push(`${relativePath}: image tag is missing alt attribute`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[NG] ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("[OK] build output validated");
}
