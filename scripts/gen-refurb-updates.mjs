// 全面改修済みの寺院を data/temple-updates.json へ「全面改稿」エントリとして反映する。
// 再実行しても重複しない（update_id で冪等）。
import { readdir, readFile, writeFile } from "node:fs/promises";

const DATE = "2026-07-19";
const gradeLabels = { T1: "充実", T2: "標準", T3: "基礎情報" };

const temples = JSON.parse(await readFile("data/temples.json", "utf8"));
const nameBySlug = new Map(temples.map((t) => [t.slug, t.name]));
const updates = JSON.parse(await readFile("data/temple-updates.json", "utf8"));
const existingIds = new Set(updates.map((u) => u.update_id));

const factsFiles = (await readdir("data/temples")).filter((f) => f.endsWith(".json"));
let added = 0;
for (const file of factsFiles.sort()) {
  const slug = file.replace(/\.json$/, "");
  const updateId = `${DATE}-refurb-${slug}`;
  if (existingIds.has(updateId)) continue;
  const facts = JSON.parse(await readFile(`data/temples/${file}`, "utf8"));
  const name = nameBySlug.get(slug);
  if (!name) continue;
  updates.push({
    update_id: updateId,
    date: DATE,
    temple_slug: slug,
    title: `${name}のページを全面改稿しました`,
    summary: `深掘り調査に基づき本文・出典・「これから調べること」を全面的に書き直し、宗派と本尊の解説、地域とのつながり、よくある質問を新設しました（充実度${facts.grade}・${gradeLabels[facts.grade] || ""}）。`,
  });
  added += 1;
}

await writeFile("data/temple-updates.json", JSON.stringify(updates, null, 2) + "\n", "utf8");
console.log(`updates追加 ${added}件（既存${existingIds.size}件）`);
