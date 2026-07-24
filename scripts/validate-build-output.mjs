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
  if (!(pickupIndex >= 0 && districtIndex > pickupIndex && updatesIndex > districtIndex)) {
    errors.push("index: primary flow must be pickup temples, districts, then recent updates");
  }
  if (indexHtml.includes("菩提寺を確認したら、実家も一度だけ見ておく")) {
    errors.push("index: related service promotion must not interrupt the primary discovery flow");
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
