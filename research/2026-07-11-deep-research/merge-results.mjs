// ATAWI TEMPLE: リサーチ結果を data/temples.json へマージする
// usage: node merge-results.mjs <repoDir> <resultsDir>
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoDir = process.argv[2];
const resultsDir = process.argv[3];
const templesPath = path.join(repoDir, "data", "temples.json");

const temples = JSON.parse(await readFile(templesPath, "utf8"));
const bySlug = new Map(temples.map((t) => [t.slug, t]));

const files = (await readdir(resultsDir)).filter((f) => f.endsWith(".json")).sort();
const stats = { files: 0, found: 0, notFound: 0, unknownSlug: [], errors: [] };
const enrichedSlugs = [];

const isStr = (v) => typeof v === "string" && v.trim() !== "";

for (const file of files) {
  let items;
  try {
    items = JSON.parse(await readFile(path.join(resultsDir, file), "utf8"));
  } catch (e) {
    stats.errors.push(`${file}: parse error ${e.message}`);
    continue;
  }
  stats.files++;
  if (!Array.isArray(items)) { stats.errors.push(`${file}: not an array`); continue; }

  for (const item of items) {
    const t = bySlug.get(item.slug);
    if (!t) { stats.unknownSlug.push(`${file}:${item.slug}`); continue; }
    if (t.slug === "kokubunji-mitsuke") continue; // お手本ページは触らない

    // research_todos は found に関わらず反映（既定値よりも具体的なため）
    if (Array.isArray(item.research_todos) && item.research_todos.length > 0) {
      t.research_todos = item.research_todos.filter(isStr);
    }

    if (!item.found) {
      stats.notFound++;
      // 調べた記録として、有用な出典のみ追加（「見つからなかった」系noteは追加しない）
      continue;
    }
    stats.found++;
    enrichedSlugs.push(t.slug);

    if (Array.isArray(item.aliases_add)) {
      for (const a of item.aliases_add) {
        if (isStr(a) && !t.aliases.includes(a.trim()) && a.trim() !== t.name) t.aliases.push(a.trim());
      }
    }
    if (isStr(item.main_deity)) t.main_deity = item.main_deity.trim();
    if (isStr(item.founded_period)) t.founded_period = item.founded_period.trim();
    if (isStr(item.heritage_status)) t.heritage_status = item.heritage_status.trim();
    if (isStr(item.history_summary)) t.history_summary = item.history_summary.trim();
    if (Array.isArray(item.historical_sections)) {
      const secs = item.historical_sections.filter((s) => s && isStr(s.heading) && isStr(s.body));
      if (secs.length > 0) t.historical_sections = secs;
    }
    if (Array.isArray(item.cultural_assets)) {
      const assets = item.cultural_assets.filter((a) => a && isStr(a.name) && isStr(a.summary));
      for (const a of assets) if (!isStr(a.designation)) a.designation = "公開資料より";
      if (assets.length > 0) t.cultural_assets = assets;
    }
    if (isStr(item.pilgrimage)) {
      t.pilgrimage_note = item.pilgrimage.trim();
    }
    if (Array.isArray(item.sources)) {
      const existingUrls = new Set(t.sources.map((s) => s.url).filter(Boolean));
      const existingTitles = new Set(t.sources.map((s) => s.title));
      for (const s of item.sources) {
        if (!s || !isStr(s.title) || !isStr(s.note)) continue;
        if (s.url && existingUrls.has(s.url)) continue;
        if (existingTitles.has(s.title)) continue;
        const src = { title: s.title.trim(), type: isStr(s.type) ? s.type.trim() : "民間二次情報", note: s.note.trim() };
        if (isStr(s.url)) src.url = s.url.trim();
        t.sources.push(src);
        if (src.url) existingUrls.add(src.url);
        existingTitles.add(src.title);
      }
    }
    t.detail_status = "公開情報調査済み";
    t.last_verified_at = "2026-07-11";
  }
}

await writeFile(templesPath, JSON.stringify(temples, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ ...stats, enrichedCount: enrichedSlugs.length }, null, 2));
console.log("enriched:", enrichedSlugs.join(","));
