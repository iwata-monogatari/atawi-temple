import { pathToFileURL } from "node:url";
import ts from "typescript";
import fs from "node:fs/promises";
import path from "node:path";

const sourceFile = "src/lib/research-articles.ts";
const tempFile = path.resolve(".astro", `research-validation-${process.pid}.mjs`);

await fs.mkdir(path.dirname(tempFile), { recursive: true });
const source = await fs.readFile(sourceFile, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
await fs.writeFile(tempFile, transpiled.outputText, "utf8");

const { researchArticles, articlePlainText } = await import(`${pathToFileURL(tempFile).href}?v=${Date.now()}`);
const failures = [];
const strip = (value) => value.replace(/\s/g, "");
const prohibitedEditorialPhrases = [
  "ATAWI TEMPLEは、確認済み",
  "品質基準",
  "制作目標",
  "内部指示",
  "この記事を量産",
  "文字数を満たす",
  "今後の優先課題",
];

for (const article of researchArticles) {
  const bodyChars = strip(article.sections.flatMap((section) => section.paragraphs).join("")).length;
  const fullChars = strip(articlePlainText(article)).length;
  const headingCount = article.sections.length;
  const figureCount = article.sections.filter((section) => section.figure).length;
  const requiredFigures = Math.ceil(bodyChars / 2000);

  if (bodyChars < 6000) failures.push(`${article.slug}: 本文 ${bodyChars}字（6000字未満）`);
  if (headingCount > Math.floor(bodyChars / 1000)) {
    failures.push(`${article.slug}: 見出し ${headingCount}個（本文1000字につき1個を超過）`);
  }
  if (figureCount < requiredFigures) {
    failures.push(`${article.slug}: 図版 ${figureCount}点（本文${bodyChars}字には${requiredFigures}点必要）`);
  }
  if (article.sources.length < 3) failures.push(`${article.slug}: 出典が3件未満`);
  if (strip(article.abstract).length < 200) failures.push(`${article.slug}: 要旨が200字未満`);
  if (article.keywords.length < 4) failures.push(`${article.slug}: キーワードが4語未満`);
  if (!article.sections.some((section) => section.heading.includes("結論"))) {
    failures.push(`${article.slug}: 結論節がない`);
  }
  if (!article.verificationStatus) failures.push(`${article.slug}: 検証状態がない`);
  const kanjiNumeralPattern =
    /[〇一二三四五六七八九十百千]+(?:年|年度|月|日|メートル|センチメートル|基|棟|例|冊|種類|側面|分類|段階)/u;
  const kanjiNumeralMatch = articlePlainText(article).match(kanjiNumeralPattern);
  if (kanjiNumeralMatch) {
    failures.push(`${article.slug}: 数字「${kanjiNumeralMatch[0]}」が漢数字表記`);
  }
  for (const section of article.sections) {
    if (/^[一二三四五六七八九十]\s/u.test(section.heading)) {
      failures.push(`${article.slug}: 章番号「${section.heading}」が漢数字表記`);
    }
  }
  for (const source of article.sources) {
    if (!source.url.startsWith("https://")) failures.push(`${article.slug}: HTTPSでない出典 ${source.url}`);
    if (!source.accessed) failures.push(`${article.slug}: 出典確認日がない ${source.title}`);
    if (!source.publisher) failures.push(`${article.slug}: 出版者がない ${source.title}`);
    if (!source.note) failures.push(`${article.slug}: 資料の使用範囲がない ${source.title}`);
  }
  for (const phrase of prohibitedEditorialPhrases) {
    if (articlePlainText(article).includes(phrase)) {
      failures.push(`${article.slug}: 編集工程向けの文言「${phrase}」が本文に含まれる`);
    }
  }

  console.log(
    `✓ ${article.slug}: 本文${bodyChars}字／総文字${fullChars}字／見出し${headingCount}／図版${figureCount}／出典${article.sources.length}`,
  );
}

await fs.rm(tempFile, { force: true });

if (failures.length) {
  console.error("\n研究記事の品質検査に失敗しました:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\n研究記事 ${researchArticles.length}本が品質基準を通過しました。`);
