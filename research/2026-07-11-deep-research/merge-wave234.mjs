// ATAWI TEMPLE: waves 2-4 のリサーチ結果を data/temples.json へマージする
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const repoDir = process.argv[2];
const researchDir = process.argv[3]; // research/2026-07-11-deep-research
const templesPath = path.join(repoDir, "data", "temples.json");

const temples = JSON.parse(await readFile(templesPath, "utf8"));
const bySlug = new Map(temples.map((t) => [t.slug, t]));
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const stats = { wave2: 0, pilgrimage: 0, wave3: 0, wave4opendata: 0, wave4heritage: 0, skippedKokubunji: 0 };

const SECT_PORTAL_HOSTS = ["sotozen-navi.com", "rinnou.net", "houkouji.or.jp", "jishu.or.jp", "yugyoji.or.jp",
  "otera.jodo.or.jp", "jodo.or.jp", "temple.nichiren.or.jp", "nichiren.or.jp", "nichirenshoshu.or.jp",
  "chisan.or.jp", "daigoji.or.jp", "negoroji.org", "senjuji.or.jp", "hongwanji.or.jp"];

function hostOf(url) {
  try { return new URL(url).host; } catch { return ""; }
}

function mergeSections(existing, incoming) {
  const out = Array.isArray(existing) ? [...existing] : [];
  const headings = new Set(out.map((s) => s.heading));
  for (const s of incoming || []) {
    if (!s || !isStr(s.heading) || !isStr(s.body)) continue;
    if (headings.has(s.heading)) {
      // 同見出しは本文が長い方を採用（統合版で上書きされている可能性が高い）
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

// ---------- Wave 2: deep-*.json (統合版 historical_sections/summary) ----------
const wave2Dir = path.join(researchDir, "wave2-results");
const wave2Files = (await readdir(wave2Dir)).filter((f) => f.startsWith("deep-"));
for (const file of wave2Files.sort()) {
  const items = JSON.parse(await readFile(path.join(wave2Dir, file), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") { stats.skippedKokubunji++; continue; }
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;
    stats.wave2++;
    mergeAliases(t, item.aliases_add);
    if (isStr(item.main_deity)) t.main_deity = item.main_deity.trim();
    if (isStr(item.founded_period)) t.founded_period = item.founded_period.trim();
    if (isStr(item.heritage_status)) t.heritage_status = item.heritage_status.trim();
    if (isStr(item.history_summary) && item.history_summary.length > (t.history_summary || "").length) {
      t.history_summary = item.history_summary.trim();
    }
    t.historical_sections = mergeSections(t.historical_sections, item.historical_sections);
    t.cultural_assets = mergeAssets(t.cultural_assets, item.cultural_assets);
    if (isStr(item.pilgrimage) && !t.pilgrimage_note) t.pilgrimage_note = item.pilgrimage.trim();
    mergeTodos(t, item.research_todos);
    mergeSources(t, item.sources);
    t.detail_status = "深掘り調査済み";
    t.last_verified_at = "2026-07-11";
  }
}

// ---------- Wave 2: pilgrimage-map.json (霊場・札所の訂正含む) ----------
const pmPath = path.join(wave2Dir, "pilgrimage-map.json");
const pilgrimageMap = JSON.parse(await readFile(pmPath, "utf8"));
for (const item of pilgrimageMap) {
  if (item.slug === "kokubunji-mitsuke") continue;
  const t = bySlug.get(item.slug);
  if (!t || !isStr(item.pilgrimage)) continue;
  stats.pilgrimage++;
  t.pilgrimage_note = item.pilgrimage.trim();
  mergeSources(t, item.sources);
}
// 慈恩寺の誤り訂正（史跡霊場会公式で確認済み）: history_summary内の誤った札所番号記述を除去
{
  const j = bySlug.get("jionji-mitsuke");
  if (j && j.history_summary.includes("遠州三十三観音霊場の第19番札所とされています")) {
    j.history_summary = j.history_summary.replace(
      "遠州三十三観音霊場の第19番札所とされています。",
      "遠江四十九薬師霊場の第49番（結願）札所です。"
    );
  }
}
// 金台寺の読み仮名（時宗公式一覧で確認）
{
  const k = bySlug.get("kindaiji-tenryu");
  if (k) {
    if (!k.aliases.includes("こんたいじ")) k.aliases.push("こんたいじ");
    if (!k.research_todos) k.research_todos = [];
    if (!k.research_todos.some((x) => x.includes("読み"))) {
      k.research_todos.push("要確認: 台帳の読み「きんだいじ」と時宗公式一覧の読み「こんたいじ」の相違");
    }
  }
}

// ---------- Wave 3: 宗派公式サイト横断（soto-1, soto-3, myoshinji, hokoji-jishu, jodo-shinshu, nichiren-shingon）----------
const wave3Dir = path.join(researchDir, "wave3-results");
const wave3Files = (await readdir(wave3Dir)).filter((f) => f.endsWith(".json"));
for (const file of wave3Files.sort()) {
  const items = JSON.parse(await readFile(path.join(wave3Dir, file), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") continue;
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;
    stats.wave3++;
    mergeAliases(t, item.aliases_add);
    // 空欄のみ補完（宗派公式は既存の一般Web調査より優先度が高いため上書き可）
    if (isStr(item.main_deity)) t.main_deity = item.main_deity.trim();
    if (isStr(item.founded_period)) t.founded_period = item.founded_period.trim();
    if (isStr(item.history_summary) && item.history_summary.length > (t.history_summary || "").length) {
      t.history_summary = item.history_summary.trim();
    }
    t.historical_sections = mergeSections(t.historical_sections, item.historical_sections);
    if (isStr(item.pilgrimage) && !t.pilgrimage_note) t.pilgrimage_note = item.pilgrimage.trim();
    mergeTodos(t, item.research_todos);
    mergeSources(t, item.sources);

    // danka_info: annual_events（宗派公式に行事記載があれば）
    if (isStr(item.annual_events)) {
      t.danka_info = t.danka_info || {};
      t.danka_info.annual_events = t.danka_info.annual_events || [];
      if (!t.danka_info.annual_events.some((e) => e.note === item.annual_events)) {
        t.danka_info.annual_events.push({ name: "年中行事", timing: "", note: item.annual_events.trim() });
      }
    }
    // danka_info.official_site: 宗派ポータル自体は寺院公式ではないので、
    // sources内で type が寺院公式系のものだけを候補にする
    for (const s of item.sources || []) {
      if (!s || !isStr(s.url)) continue;
      const host = hostOf(s.url);
      if (SECT_PORTAL_HOSTS.some((h) => host.endsWith(h))) continue;
      if (!/寺院公式/.test(s.type || "")) continue;
      t.danka_info = t.danka_info || {};
      if (!t.danka_info.official_site) {
        t.danka_info.official_site = { status: "あり", url: s.url.trim(), checked_at: "2026-07-11" };
      }
    }
    t.last_verified_at = "2026-07-11";
  }
}

// ---------- Wave 4: opendata.json ----------
const wave4Dir = path.join(researchDir, "wave4-results");
{
  const items = JSON.parse(await readFile(path.join(wave4Dir, "opendata.json"), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") continue;
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;
    stats.wave4opendata++;
    t.cultural_assets = mergeAssets(t.cultural_assets, item.cultural_assets_add);
    mergeSources(t, item.sources);
  }
}

// ---------- Wave 4: heritage-db.json ----------
{
  const items = JSON.parse(await readFile(path.join(wave4Dir, "heritage-db.json"), "utf8"));
  for (const item of items) {
    if (item.slug === "kokubunji-mitsuke") continue;
    const t = bySlug.get(item.slug);
    if (!t || !item.found) continue;
    stats.wave4heritage++;
    t.cultural_assets = mergeAssets(t.cultural_assets, item.cultural_assets_add);
    mergeAliases(t, item.aliases_add);
    mergeSources(t, item.sources);
    // facts は文化財関連の補足として1セクションにまとめる
    const factTexts = (item.facts || []).filter((f) => f && isStr(f.text)).map((f) => f.text.trim());
    if (factTexts.length > 0) {
      t.historical_sections = mergeSections(t.historical_sections, [
        { heading: "文化財資料からの補足", body: factTexts.join(" ") },
      ]);
    }
    if (item.corrections && typeof item.corrections === "object") {
      for (const [k, v] of Object.entries(item.corrections)) {
        if (isStr(v)) mergeTodos(t, [`${k}: ${v}`], "要確認（文化財DB照合）: ");
      }
    }
    mergeTodos(t, item.research_todos);
  }
}

// ---------- 檀家向け方針: 現代の御朱印(スタンプ収集)言及を除去。江戸期「御朱印地・御朱印高」等の史料上の朱印状は歴史事実として残す ----------
const GOSHUIN_STRIP = [
  { slug: "kindaiji-tenryu", find: "遠江四十九薬師霊場の札所尊としては薬師如来の御朱印記録があります", to: "遠江四十九薬師霊場の札所尊は薬師如来です" },
  { slug: "jushouji-hiruike", find: "参拝記録サイトには当寺の御朱印の投稿がありますが、寺院公式の御朱印情報は確認できていません。", to: "" },
  { slug: "kotokuji-morishita", find: "御朱印は庫裡で受け付けているとされます。", to: "" },
  { slug: "ichiunsai-shimonobe", find: "巡拝者に御朱印を授与していることが参拝記録からも確認できます。", to: "" },
  { slug: "honshoji-kounodai", find: "参拝記録サイトのホトカミでは、本尊を日蓮宗の定式に沿った「久遠実成本師釈迦牟尼仏」と紹介し、御朱印の頒布に対応している旨の参拝報告が掲載されています。", to: "" },
  { slug: "hoonan-kaminobe", find: "現在は御朱印の授与に対応するほか、ご詠歌や写経・写仏の活動が行われています。", to: "現在はご詠歌や写経・写仏の活動が行われています。" },
  { slug: "hoonan-kaminobe", find: "御朱印の授与のほか、ご祈祷やお墓・納骨堂についても相談を受け付けています。", to: "ご祈祷やお墓・納骨堂についても相談を受け付けています。" },
  { slug: "kindaiji-tenryu", find: "同資料の備考には金台寺が「省光寺の管理」と記されており、参拝記録サイトにも遠江四十九薬師霊場の御朱印（南無薬師如来）の記録があります。", to: "同資料の備考には金台寺が「省光寺の管理」と記されています。" },
];
for (const rule of GOSHUIN_STRIP) {
  const t = bySlug.get(rule.slug);
  if (!t) continue;
  if (isStr(t.main_deity)) t.main_deity = t.main_deity.replace(rule.find, rule.to).trim();
  if (isStr(t.history_summary)) t.history_summary = t.history_summary.replace(rule.find, rule.to).trim();
  for (const sec of t.historical_sections || []) {
    if (isStr(sec.body)) sec.body = sec.body.replace(rule.find, rule.to).trim();
  }
}
// hoonan-kaminobe の danka_info.annual_events からも御朱印言及を除去
{
  const t = bySlug.get("hoonan-kaminobe");
  if (t?.danka_info?.annual_events) {
    for (const e of t.danka_info.annual_events) {
      if (isStr(e.note)) e.note = e.note.replace("（御朱印の授与にも対応）", "").trim();
    }
  }
}

// 御朱印文化を主題とする「発見専用」ランク出典（口コミ・御朱印帳ブログ等）を出典一覧から除去。
// 事実自体は宗派公式・行政資料の出典で既に裏付け済みのため、これらの重複citationは不要。
const GOSHUIN_SOURCE_TITLES = [
  "正眼院の御朱印・アクセス情報（ホトカミ）",
  "一雲斎（静岡県磐田市）｜気まぐれ書店員の御朱印帳",
  "【磐田市】福田の「妙福寺」紹介記事（Yahoo!ニュース エキスパート）",
  "本性寺の御朱印・アクセス情報（ホトカミ）",
  "行興寺の御朱印・アクセス情報（ホトカミ）",
];
for (const t of temples) {
  t.sources = t.sources.filter((s) => !GOSHUIN_SOURCE_TITLES.includes(s.title) && !/^Omairi（おまいり）/.test(s.title || ""));
}
// hoonan-kaminobe: 正当な宗派公式出典(soutozen-navi)のnoteテキストからのみ御朱印言及を除去
{
  const t = bySlug.get("hoonan-kaminobe");
  for (const s of t?.sources || []) {
    if (isStr(s.note)) s.note = s.note.replace("・御朱印授与", "").trim();
  }
}
// research_todos: 御朱印・御首題を調査項目として掲げること自体が檀家向け方針(観光客向け情報の排除)に反するため除去
for (const t of temples) {
  if (Array.isArray(t.research_todos)) {
    t.research_todos = t.research_todos.filter((todo) => !/御朱印|御首題/.test(todo));
  }
}

await writeFile(templesPath, JSON.stringify(temples, null, 2) + "\n", "utf8");
console.log(JSON.stringify(stats, null, 2));
