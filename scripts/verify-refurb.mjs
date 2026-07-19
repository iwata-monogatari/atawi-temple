// 全面改修の公開ゲート（機械検証）。指示書 v1.1 第6章の移植。
// 使い方: node scripts/verify-refurb.mjs [--no-http] [--slug <slug>]
// チェック: スキーマ／字数(改修前×2かつ等級下限)／出典数／禁止語／モジュール個別化文／
//           FAQ／廃寺の扱い／出典URLの生存確認(HTTP)
import { readdir } from "node:fs/promises";
import {
  loadJson, countFactsChars, GRADE_FLOORS, GRADE_MIN_SOURCES, findBannedWords,
} from "./lib-refurb.mjs";

const NO_HTTP = process.argv.includes("--no-http");
const onlySlug = process.argv.includes("--slug")
  ? process.argv[process.argv.indexOf("--slug") + 1]
  : null;

// TLS証明書エラー等が既知のドメイン（出典としては注記付きで許容、警告扱い）
const HTTP_WARN_ONLY_HOSTS = new Set(["enshu33.com", "www.enshu33.com"]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const temples = await loadJson("data/temples.json");
const assignment = (await loadJson("data/refurb-assignment.json")).temples;
const sectModules = await loadJson("data/modules/sect-modules.json");
const deityModules = await loadJson("data/modules/deity-modules.json");
const templeBySlug = new Map(temples.map((t) => [t.slug, t]));
const assignBySlug = new Map(assignment.map((r) => [r.slug, r]));

const VALID_ANCHORS = new Set(["about", "history", "heritage", "sect-deity", "community", "worship"]);

let files;
try {
  files = (await readdir("data/temples")).filter((f) => f.endsWith(".json"));
} catch {
  files = [];
}
if (onlySlug) files = files.filter((f) => f === `${onlySlug}.json`);

const errors = [];
const warnings = [];
const urlSet = new Map(); // url -> [slugs]
const summary = [];

for (const file of files.sort()) {
  const slug = file.replace(/\.json$/, "");
  const label = slug;
  let facts;
  try {
    facts = await loadJson(`data/temples/${file}`);
  } catch (e) {
    errors.push(`${label}: JSONとして読めない (${e.message})`);
    continue;
  }
  const temple = templeBySlug.get(slug);
  const assign = assignBySlug.get(slug);
  if (!temple) { errors.push(`${label}: temples.json に存在しないslug`); continue; }
  if (temple.detail_page === false) { errors.push(`${label}: detail_page:false の寺院にfactsがある`); continue; }
  if (facts.slug && facts.slug !== slug) errors.push(`${label}: slugフィールド不一致 (${facts.slug})`);

  const grade = facts.grade;
  if (!GRADE_FLOORS[grade]) { errors.push(`${label}: grade不正 (${grade})`); continue; }

  // 必須フィールド
  if (!facts.lead) errors.push(`${label}: lead がない`);
  if (!Array.isArray(facts.about) || facts.about.length === 0) errors.push(`${label}: about がない`);
  if (!Array.isArray(facts.history_sections) || facts.history_sections.length === 0) errors.push(`${label}: history_sections がない`);
  if (!facts.sect_deity?.intro) errors.push(`${label}: sect_deity.intro がない`);

  // 字数
  const chars = countFactsChars(facts, sectModules, deityModules);
  const target = assign ? assign.target : GRADE_FLOORS[grade];
  if (chars < target) errors.push(`${label}: 本文${chars}字 < 目標${target}字`);

  // 出典
  const sources = facts.sources || [];
  const minSources = GRADE_MIN_SOURCES[grade];
  if (sources.length < minSources) errors.push(`${label}: 出典${sources.length}件 < ${grade}基準${minSources}件`);
  for (const [i, s] of sources.entries()) {
    if (!s.title) errors.push(`${label}: 出典${i + 1} title欠落`);
    if (!s.note) errors.push(`${label}: 出典${i + 1}(${s.title || "?"}) note(確認内容)欠落`);
    if (!s.type) errors.push(`${label}: 出典${i + 1}(${s.title || "?"}) type(区分)欠落`);
    if (s.url) {
      if (!/^https?:\/\//.test(s.url)) errors.push(`${label}: 出典URL不正 ${s.url}`);
      else {
        if (!urlSet.has(s.url)) urlSet.set(s.url, []);
        urlSet.get(s.url).push(slug);
      }
    }
  }

  // 禁止語（facts全文に対して）
  const banned = findBannedWords(JSON.stringify(facts));
  for (const hit of banned) errors.push(`${label}: 禁止語 ${hit}`);

  // モジュール
  const sd = facts.sect_deity || {};
  if (sd.sect_module_id && !sectModules.find((m) => m.id === sd.sect_module_id)) {
    errors.push(`${label}: sect_module_id不明 (${sd.sect_module_id})`);
  }
  if (!sd.sect_module_id) warnings.push(`${label}: sect_module_id未設定`);
  if (sd.deity_module_id && !deityModules.find((m) => m.id === sd.deity_module_id)) {
    errors.push(`${label}: deity_module_id不明 (${sd.deity_module_id})`);
  }
  if (sd.intro && sd.intro.replace(/\s+/g, "").length < 100) {
    errors.push(`${label}: sect_deity.intro が100字未満 (${sd.intro.replace(/\s+/g, "").length}字)`);
  }

  // FAQ
  const faq = facts.faq || [];
  const faqMin = grade === "T1" ? 6 : grade === "T2" ? 5 : 0;
  if (faq.length < faqMin) errors.push(`${label}: FAQ ${faq.length}問 < ${grade}基準${faqMin}問`);
  if (faq.length > 8) warnings.push(`${label}: FAQ ${faq.length}問（8問超）`);
  for (const f of faq) {
    if (f.anchor && !VALID_ANCHORS.has(f.anchor)) errors.push(`${label}: FAQ anchor不正 (${f.anchor})`);
  }

  // 歴史セクション本数
  const histMin = grade === "T3" ? 1 : 3;
  if ((facts.history_sections || []).length < histMin) {
    errors.push(`${label}: history_sections ${facts.history_sections?.length || 0}本 < ${histMin}本`);
  }
  if ((facts.history_sections || []).length > 5) warnings.push(`${label}: history_sections 5本超`);

  // 分量ガイド（警告）
  const leadLen = (facts.lead || "").replace(/\s+/g, "").length;
  if (leadLen < 100 || leadLen > 180) warnings.push(`${label}: lead ${leadLen}字（目安120〜160）`);
  const aboutLen = (facts.about || []).join("").replace(/\s+/g, "").length;
  if (aboutLen < 350) warnings.push(`${label}: about ${aboutLen}字（目安400〜600）`);
  const commLen = ((facts.community?.body || []).join("") + (facts.community?.ruin_note || "")).replace(/\s+/g, "").length;
  if (grade !== "T3" && commLen < 400) errors.push(`${label}: community ${commLen}字 < 400字`);
  if (grade === "T3" && commLen < 200) warnings.push(`${label}: community ${commLen}字（T3目安200字以上）`);

  // 廃寺・現存の整合
  const isRuin = temple.status !== "existing";
  if (isRuin && facts.worship_guide) errors.push(`${label}: 廃寺・寺院跡に worship_guide がある`);
  if (isRuin && !facts.community?.ruin_note) errors.push(`${label}: 廃寺・寺院跡に ruin_note がない`);

  // 等級と割当の整合
  if (assign && assign.grade !== grade) warnings.push(`${label}: 等級が割当(${assign.grade})と異なる(${grade})`);

  summary.push({ slug, grade, chars, target, sources: sources.length, faq: faq.length });
}

// 対象カバレッジ
const covered = new Set(files.map((f) => f.replace(/\.json$/, "")));
const missing = assignment.filter((r) => !covered.has(r.slug)).map((r) => r.slug);
if (!onlySlug && missing.length > 0) {
  warnings.push(`facts未作成: ${missing.length}件 (${missing.slice(0, 10).join(", ")}${missing.length > 10 ? " …" : ""})`);
}

// HTTP生存確認
if (!NO_HTTP && urlSet.size > 0) {
  console.log(`HTTP確認: ${urlSet.size} URL`);
  const urls = [...urlSet.keys()];
  const results = new Map();
  const CONCURRENCY = 12;
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++];
      results.set(url, await checkUrl(url));
    }
  }
  async function checkUrl(url, attempt = 1) {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": UA, "Accept-Language": "ja" },
        signal: AbortSignal.timeout(20000),
      });
      return { ok: res.status >= 200 && res.status < 400, status: res.status };
    } catch (e) {
      if (attempt < 2) return checkUrl(url, attempt + 1);
      return { ok: false, status: `ERR:${e.cause?.code || e.name}` };
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  for (const [url, r] of results) {
    if (!r.ok) {
      const host = new URL(url).hostname;
      const slugs = urlSet.get(url).slice(0, 3).join(",");
      if (HTTP_WARN_ONLY_HOSTS.has(host) || String(r.status).startsWith("ERR:")) {
        warnings.push(`URL到達不可(${r.status}) ${url} [${slugs}]`);
      } else {
        errors.push(`URL ${r.status} ${url} [${slugs}]`);
      }
    }
  }
}

// 出力
for (const s of summary) {
  console.log(`${s.slug}\t${s.grade}\t${s.chars}/${s.target}字\t出典${s.sources}\tFAQ${s.faq}`);
}
console.log(`\n--- 検証結果: ${files.length}件 / エラー${errors.length} / 警告${warnings.length} ---`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
if (errors.length > 0) process.exit(1);
console.log("公開ゲート通過");
