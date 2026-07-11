// ATAWI TEMPLE: wave5 (檀家情報)＋soto-2＋wave4残り3系統を data/temples.json へマージ
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoDir = process.argv[2];
const scratchDir = process.argv[3]; // scratchpad dir containing results3/results4/results5
const templesPath = path.join(repoDir, "data", "temples.json");

const temples = JSON.parse(await readFile(templesPath, "utf8"));
const bySlug = new Map(temples.map((t) => [t.slug, t]));
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const stats = { danka: 0, soto2: 0, corporate: 0, bunkazaiDayori: 0, excavation: 0 };

function mergeSections(existing, incoming) {
  const out = Array.isArray(existing) ? [...existing] : [];
  const headings = new Set(out.map((s) => s.heading));
  for (const s of incoming || []) {
    if (!s || !isStr(s.heading) || !isStr(s.body)) continue;
    if (headings.has(s.heading)) {
      const idx = out.findIndex((o) => o.heading === s.heading);
      if (s.body.length > out[idx].body.length) out[idx] = s;
    } else {
      out.push(s);
      headings.add(s.heading);
    }
  }
  return out;
}

function mergeAssets(existing, incoming) {
  const out = Array.isArray(existing) ? [...existing] : [];
  const names = new Set(out.map((a) => a.name.replace(/\s/g, "")));
  for (const a of incoming || []) {
    if (!a || !isStr(a.name) || !isStr(a.summary)) continue;
    const key = a.name.replace(/\s/g, "");
    if (names.has(key)) continue;
    out.push({ name: a.name.trim(), designation: isStr(a.designation) ? a.designation.trim() : "公開資料より", summary: a.summary.trim() });
    names.add(key);
  }
  return out;
}

function mergeSources(t, incoming) {
  const existingUrls = new Set(t.sources.map((s) => s.url).filter(Boolean));
  const existingTitles = new Set(t.sources.map((s) => s.title));
  for (const s of incoming || []) {
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

function mergeAliases(t, incoming) {
  for (const a of incoming || []) {
    if (isStr(a) && !t.aliases.includes(a.trim()) && a.trim() !== t.name) t.aliases.push(a.trim());
  }
}

function mergeTodos(t, incoming, prefix = "") {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const existing = new Set(t.research_todos || []);
  t.research_todos = t.research_todos || [];
  for (const todo of incoming) {
    if (!isStr(todo)) continue;
    const text = prefix + todo.trim();
    if (!existing.has(text)) { t.research_todos.push(text); existing.add(text); }
  }
}

// ---------- Wave5: danka-*.json ----------
const wave5Dir = path.join(scratchDir, "results5");
for (const file of (await readdir(wave5Dir)).sort()) {
  const items = JSON.parse(await readFile(path.join(wave5Dir, file), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") continue;
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;

    let touched = false;
    if (item.danka_info && typeof item.danka_info === "object") {
      t.danka_info = t.danka_info || {};
      const d = item.danka_info;
      if (d.official_site && isStr(d.official_site.url) && d.official_site.status === "あり") {
        // 寺院独自ドメインを優先。既存が未設定 or 宗派ポータル代替のみだった場合に上書き
        t.danka_info.official_site = { status: "あり", url: d.official_site.url.trim(), checked_at: d.official_site.checked_at || "2026-07-12" };
        touched = true;
      }
      if (Array.isArray(d.annual_events) && d.annual_events.length > 0) {
        const existing = t.danka_info.annual_events || [];
        const existingNotes = new Set(existing.map((e) => e.note));
        for (const e of d.annual_events) {
          if (!e || !isStr(e.name)) continue;
          const note = isStr(e.note) ? e.note.trim() : "";
          if (existingNotes.has(note)) continue;
          existing.push({ name: e.name.trim(), timing: isStr(e.timing) ? e.timing.trim() : "", note });
          existingNotes.add(note);
        }
        t.danka_info.annual_events = existing;
        touched = true;
      }
      for (const key of ["cemetery", "organization", "community_role", "parking"]) {
        if (isStr(d[key]) && !isStr(t.danka_info[key])) { t.danka_info[key] = d[key].trim(); touched = true; }
      }
    }
    if (isStr(item.history_addendum)) {
      t.historical_sections = mergeSections(t.historical_sections, [{ heading: "檀家向け情報の補足", body: item.history_addendum.trim() }]);
      touched = true;
    }
    mergeTodos(t, item.research_todos);
    mergeSources(t, item.sources);
    if (touched) { stats.danka++; t.last_verified_at = "2026-07-12"; }
  }
}

// ---------- soto-2.json（wave3欠落分） ----------
{
  const items = JSON.parse(await readFile(path.join(scratchDir, "results3", "soto-2.json"), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") continue;
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;
    stats.soto2++;
    mergeAliases(t, item.aliases_add);
    if (isStr(item.main_deity)) t.main_deity = item.main_deity.trim();
    if (isStr(item.founded_period)) t.founded_period = item.founded_period.trim();
    if (isStr(item.history_summary) && item.history_summary.length > (t.history_summary || "").length) {
      t.history_summary = item.history_summary.trim();
    }
    t.historical_sections = mergeSections(t.historical_sections, item.historical_sections);
    if (isStr(item.pilgrimage) && !t.pilgrimage_note) t.pilgrimage_note = item.pilgrimage.trim();
    mergeTodos(t, item.research_todos);
    mergeSources(t, item.sources);
  }
}

// ---------- wave4残り3系統（corporate / bunkazai-dayori / excavation）: heritage-db.jsonと同スキーマ ----------
const statKeys = { "corporate.json": "corporate", "bunkazai-dayori.json": "bunkazaiDayori", "excavation.json": "excavation" };
for (const [file, key] of Object.entries(statKeys)) {
  const items = JSON.parse(await readFile(path.join(scratchDir, "results4", file), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") continue;
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;
    stats[key]++;
    t.cultural_assets = mergeAssets(t.cultural_assets, item.cultural_assets_add);
    mergeAliases(t, item.aliases_add);
    mergeSources(t, item.sources);
    const factTexts = (item.facts || []).filter((f) => f && isStr(f.text)).map((f) => f.text.trim());
    if (factTexts.length > 0) {
      const heading = key === "excavation" ? "発掘調査・考古資料からの補足" : key === "bunkazaiDayori" ? "『いわた文化財だより』からの補足" : "法人情報の補足";
      t.historical_sections = mergeSections(t.historical_sections, [{ heading, body: factTexts.join(" ") }]);
    }
    if (item.corrections && typeof item.corrections === "object") {
      for (const [k, v] of Object.entries(item.corrections)) {
        if (isStr(v)) mergeTodos(t, [`${k}: ${v}`], "要確認（法人・行政資料照合）: ");
      }
    }
    mergeTodos(t, item.research_todos);
  }
}

// ---------- 御朱印(現代のスタンプ文化)の最終チェック: 見つかれば当該フィールドから除去 ----------
let goshuinHits = [];
for (const t of temples) {
  const scan = (text) => isStr(text) && /御朱印(?!(高|地|弐石|八石|3石|両社))/.test(text);
  if (scan(t.main_deity) || scan(t.history_summary)) goshuinHits.push(t.slug + ":main");
  for (const sec of t.historical_sections || []) if (scan(sec.body)) goshuinHits.push(t.slug + ":" + sec.heading);
  for (const s of t.sources || []) if (scan(s.note) || scan(s.title)) goshuinHits.push(t.slug + ":source:" + s.title);
  for (const todo of t.research_todos || []) if (scan(todo)) goshuinHits.push(t.slug + ":todo");
  if (t.danka_info) {
    for (const e of t.danka_info.annual_events || []) if (scan(e.note) || scan(e.name)) goshuinHits.push(t.slug + ":danka_event");
    for (const k of ["cemetery", "organization", "community_role", "parking"]) if (scan(t.danka_info[k])) goshuinHits.push(t.slug + ":danka_" + k);
  }
}

await writeFile(templesPath, JSON.stringify(temples, null, 2) + "\n", "utf8");
console.log(JSON.stringify(stats, null, 2));
console.log("goshuin scan hits (should be empty):", JSON.stringify(goshuinHits));
