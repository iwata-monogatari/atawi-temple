// 寺院個別ページの本文字数を dist/ のビルド済みHTMLから計測する。
// 対象: .temple-lead + .temple-main-content 配下のテキスト。
// 除外: 出典パネル(.sources-panel)・調査中プレースホルダ(.pending-*)・図版キャプション・script。
// 空白類は除いて数える。結果は data/refurb-baseline.json（--out指定可）。
import { readFile, writeFile, readdir } from "node:fs/promises";
import { parse } from "parse5";

const outPath = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "data/refurb-baseline.json";

const EXCLUDE_CLASS = /(?:^|\s)(sources-panel|pending-block|pending-inline|pending-photo|monogatari-panel)(?:\s|$)/;
const EXCLUDE_TAG = new Set(["script", "style", "figcaption", "table", "iframe"]);

function classAttr(node) {
  const attr = (node.attrs || []).find((a) => a.name === "class");
  return attr ? attr.value : "";
}

function collectText(node, out) {
  if (node.nodeName === "#text") {
    out.push(node.value);
    return;
  }
  if (EXCLUDE_TAG.has(node.nodeName)) return;
  if (EXCLUDE_CLASS.test(classAttr(node))) return;
  for (const child of node.childNodes || []) collectText(child, out);
}

function findAll(node, pred, acc = []) {
  if (pred(node)) acc.push(node);
  for (const child of node.childNodes || []) findAll(child, pred, acc);
  return acc;
}

function countChars(html) {
  const doc = parse(html);
  const targets = findAll(doc, (n) => {
    const cls = classAttr(n);
    return /(?:^|\s)temple-lead(?:\s|$)/.test(cls) || /(?:^|\s)temple-main-content(?:\s|$)/.test(cls);
  });
  const parts = [];
  for (const t of targets) collectText(t, parts);
  return parts.join("").replace(/\s+/g, "").length;
}

const slugs = (await readdir("dist/temples", { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const result = {};
for (const slug of slugs.sort()) {
  try {
    const html = await readFile(`dist/temples/${slug}/index.html`, "utf8");
    result[slug] = countChars(html);
  } catch {
    // ページなし（detail_page:false等）は記録しない
  }
}

await writeFile(outPath, JSON.stringify({
  measured_from: "dist (origin/main baseline build)",
  note: "temple-lead + temple-main-content から sources-panel / pending-* / figcaption / table / script を除外し、空白を除いた文字数",
  chars: result,
}, null, 2) + "\n", "utf8");

const values = Object.values(result);
console.log(`measured ${values.length} pages; min=${Math.min(...values)} max=${Math.max(...values)} avg=${Math.round(values.reduce((a, b) => a + b, 0) / values.length)}`);
