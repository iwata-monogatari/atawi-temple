// 改修facts共通ロジック: 本文字数カウント・読み込み。
// 字数定義は docs/refurb-2026-07-19-spec.md と一致させること（機械検証の正本）。
import { readFile } from "node:fs/promises";

export async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const strip = (s) => String(s ?? "").replace(/\s+/g, "");

export function countFactsChars(facts, sectModules, deityModules) {
  const parts = [];
  parts.push(facts.lead);
  for (const p of facts.about || []) parts.push(p);
  for (const h of facts.history_sections || []) parts.push(h.heading, h.body);
  for (const c of facts.cultural_assets || []) parts.push(c.name, c.summary);
  if (facts.sect_deity) {
    parts.push(facts.sect_deity.intro);
    const sect = (sectModules || []).find((m) => m.id === facts.sect_deity.sect_module_id);
    const deity = (deityModules || []).find((m) => m.id === facts.sect_deity.deity_module_id);
    for (const p of sect?.body || []) parts.push(p);
    for (const p of deity?.body || []) parts.push(p);
  }
  for (const p of facts.community?.body || []) parts.push(p);
  parts.push(facts.community?.ruin_note);
  const wg = facts.worship_guide;
  if (wg) {
    for (const e of wg.annual_events || []) parts.push(e.name, e.timing, e.note);
    for (const n of wg.visit_notes || []) parts.push(n);
    for (const n of wg.pending || []) parts.push(n);
  }
  for (const f of facts.faq || []) parts.push(f.q, f.a);
  return parts.map(strip).join("").length;
}

export const GRADE_FLOORS = { T1: 6000, T2: 4500, T3: 2500 };
export const GRADE_MIN_SOURCES = { T1: 12, T2: 8, T3: 5 };

// 禁止語: 不動産語彙 + 現代の御朱印文化（御朱印状/御朱印高/御朱印地=江戸期の歴史用語は許容）+ 観光語彙
export const BANNED_PATTERNS = [
  { re: /売却|査定|空き家|実家じまい|不動産|住み替え|資産価値|仲介|買取|リフォーム/g, label: "不動産語彙" },
  { re: /御朱印(?![状高地])/g, label: "御朱印（現代のスタンプ収集文化）" },
  { re: /拝観料|拝観時間|映えスポット|モデルコース/g, label: "観光語彙" },
  { re: /今回の調査では|本稿では|当サイトの調査で/g, label: "執筆プロセス自己言及" },
];

export function findBannedWords(text) {
  const hits = [];
  for (const { re, label } of BANNED_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(`${label}: ${[...new Set(m)].join(", ")}`);
  }
  return hits;
}
