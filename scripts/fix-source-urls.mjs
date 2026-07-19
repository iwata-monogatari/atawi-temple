// facts ファイル内の既知の死亡URLを安定URL（Wayback アーカイブ等）へ一括差し替える。
// 静岡県サイトは2026年5〜7月の改編で宗教法人名簿ページ・PDFが404化したため、
// 2026-05-12 時点のアーカイブ版（令和5年3月31日現在の名簿）を参照する。
import { readdir, readFile, writeFile } from "node:fs/promises";

const REPLACEMENTS = new Map([
  [
    "https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/011/670/meibo4.pdf",
    "https://web.archive.org/web/20260512043736/https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/011/670/meibo4.pdf",
  ],
  [
    "https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/011/670/hyoushi4.pdf",
    "https://web.archive.org/web/20260512043736/https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/011/670/hyoushi4.pdf",
  ],
  [
    "https://www.pref.shizuoka.jp/kensei/gyoseikaikaku/kouekihoujin/1002313/1011670.html",
    "https://web.archive.org/web/20260512043736/https://www.pref.shizuoka.jp/kensei/gyoseikaikaku/kouekihoujin/1002313/1011670.html",
  ],
]);
const ARCHIVE_NOTE = "県サイト改編により2026年5月時点のアーカイブ版を参照";

const files = (await readdir("data/temples")).filter((f) => f.endsWith(".json"));
let touched = 0;
for (const file of files) {
  const path = `data/temples/${file}`;
  const facts = JSON.parse(await readFile(path, "utf8"));
  let changed = false;
  for (const s of facts.sources || []) {
    if (s.url && REPLACEMENTS.has(s.url)) {
      s.url = REPLACEMENTS.get(s.url);
      if (!String(s.note || "").includes(ARCHIVE_NOTE)) {
        s.note = s.note ? `${s.note}（${ARCHIVE_NOTE}）` : ARCHIVE_NOTE;
      }
      changed = true;
    }
  }
  if (changed) {
    await writeFile(path, JSON.stringify(facts, null, 1) + "\n", "utf8");
    touched += 1;
  }
}
console.log(`URL差し替え: ${touched}ファイル`);
