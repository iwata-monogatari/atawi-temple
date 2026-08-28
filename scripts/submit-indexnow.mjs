// dist/sitemap.xml の全URLを IndexNow（api.indexnow.org）へ一括送信する。
// Bing系のみに効きGoogleには届かないが、sitemap待ちの受け身から抜けるための常設の配管。
// 事前に npm run build で dist/sitemap.xml を作っておくこと。
import { readFile } from "node:fs/promises";

const HOST = "temple.atawi.link";
const KEY = "b1e187973a933a8dc40506963b3f397b";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const SITEMAP_PATH = "dist/sitemap.xml";
// IndexNowの1リクエスト上限は10,000URL。
const BATCH_SIZE = 10000;

let sitemap;
try {
  sitemap = await readFile(SITEMAP_PATH, "utf8");
} catch (error) {
  console.error(`[NG] ${SITEMAP_PATH} を読めない。先に npm run build を実行する。`, error);
  process.exit(1);
}

const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].trim())
  .filter((url) => url.startsWith(`https://${HOST}/`));

if (urlList.length === 0) {
  console.error(`[NG] ${SITEMAP_PATH} から ${HOST} のURLを抽出できなかった。`);
  process.exit(1);
}

console.log(`[INFO] ${SITEMAP_PATH} から ${urlList.length} 件のURLを抽出した。`);
console.log(`[INFO] keyLocation: ${KEY_LOCATION}`);

let failed = false;

for (let offset = 0; offset < urlList.length; offset += BATCH_SIZE) {
  const batch = urlList.slice(offset, offset + BATCH_SIZE);
  const batchNo = Math.floor(offset / BATCH_SIZE) + 1;

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });

    const body = (await response.text()).trim();

    // 200=受理、202=受理したがキー検証は保留。どちらも成功扱い。
    if (response.status === 200 || response.status === 202) {
      console.log(
        `[OK] batch ${batchNo}: ${batch.length} URLs, status=${response.status}${body ? `, body=${body}` : ""}`,
      );
    } else {
      failed = true;
      console.error(
        `[NG] batch ${batchNo}: ${batch.length} URLs, status=${response.status}${body ? `, body=${body}` : ""}`,
      );
    }
  } catch (error) {
    failed = true;
    console.error(`[NG] batch ${batchNo}: 送信に失敗した。`, error);
  }
}

process.exitCode = failed ? 1 : 0;
