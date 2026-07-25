import fs from "node:fs";
import ts from "typescript";

const files = process.argv.slice(2);

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
  );
  const articles = Object.values(module).find((value) => Array.isArray(value));
  if (!articles) continue;

  console.log(file);
  for (const article of articles) {
    const paragraphs = article.sections.flatMap((section) => section.paragraphs);
    const otherParagraphs = new Set(
      articles
        .filter((candidate) => candidate !== article)
        .flatMap((candidate) =>
          candidate.sections.flatMap((section) => section.paragraphs),
        ),
    );
    const total = paragraphs.reduce((sum, paragraph) => sum + paragraph.length, 0);
    const duplicated = paragraphs
      .filter((paragraph) => otherParagraphs.has(paragraph))
      .reduce((sum, paragraph) => sum + paragraph.length, 0);
    console.log(
      `${article.slug}: ${((duplicated / total) * 100).toFixed(1)}% (${duplicated}/${total})`,
    );
  }
}
