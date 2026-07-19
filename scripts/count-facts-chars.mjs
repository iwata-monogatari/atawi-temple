// 使い方: node scripts/count-facts-chars.mjs <slug>
// data/temples/<slug>.json の本文字数と目標達成状況を表示する（執筆エージェントの自己検証用）。
import { loadJson, countFactsChars, GRADE_FLOORS, GRADE_MIN_SOURCES, findBannedWords } from "./lib-refurb.mjs";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/count-facts-chars.mjs <slug>");
  process.exit(1);
}

const facts = await loadJson(`data/temples/${slug}.json`);
const sectModules = await loadJson("data/modules/sect-modules.json");
const deityModules = await loadJson("data/modules/deity-modules.json");
const assignment = await loadJson("data/refurb-assignment.json");
const row = assignment.temples.find((t) => t.slug === slug);

const chars = countFactsChars(facts, sectModules, deityModules);
const target = row ? row.target : GRADE_FLOORS[facts.grade] || 0;
const srcN = (facts.sources || []).length;
const srcMin = GRADE_MIN_SOURCES[facts.grade] || 0;
const banned = findBannedWords(JSON.stringify(facts));

console.log(`slug=${slug} grade=${facts.grade} chars=${chars} target=${target} ${chars >= target ? "OK" : "NG(不足" + (target - chars) + "字)"}`);
console.log(`sources=${srcN}/${srcMin} ${srcN >= srcMin ? "OK" : "NG"}  faq=${(facts.faq || []).length}問`);
if (banned.length) console.log("禁止語検出: " + banned.join(" / "));
