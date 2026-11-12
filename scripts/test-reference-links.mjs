import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequest } from "../functions/_middleware.js";
import { repairReferenceLinks } from "./repair-reference-links.mjs";

const policy = JSON.parse(await readFile(new URL("../data/reference-link-health.json", import.meta.url), "utf8"));
for (const [old, target] of Object.entries(policy.replacements)) {
  const result = repairReferenceLinks(`<p>出典：<a class="source" href="${old}#section" target="_blank"><strong>原資料名</strong></a>。過去の確認記録。</p>`);
  assert.equal(result.replaced, 1);
  assert.equal(result.disabled, 0);
  assert.ok(result.html.includes(`href="${target}#section"`));
  assert.ok(result.html.includes("<strong>原資料名</strong>"));
  assert.ok(result.html.endsWith("。過去の確認記録。</p>"));
}
for (const entry of policy.unavailable) {
  const result = repairReferenceLinks(`<a href='${entry.url}'>原資料名</a>`);
  assert.equal(result.disabled, 1, entry.url);
  assert.ok(!result.html.includes(`href="${entry.url}"`));
  assert.ok(!result.html.includes(`href='${entry.url}'`));
  assert.ok(result.html.includes(`data-original-url="${entry.url}"`));
  assert.ok(result.html.includes("原資料名"));
  assert.ok(result.html.includes(policy.checkedOn));
  if (entry.discoveryUrl) assert.ok(result.html.includes(`href="${entry.discoveryUrl}"`));
  assert.equal(repairReferenceLinks(result.html).html, result.html, "The repair must be idempotent");
}
for (const html of [
  '<a href="https://example.com/">Untested source</a>',
  '<a href="/temples/fukuoji-jonosaki/">福王寺</a>',
  '<a href="/api/board-posts">API</a>',
  '<script type="application/ld+json">{"citation":"https://jodo-ss.com/temple_list/"}</script>',
  '<a data-href="https://jodo-ss.com/temple_list/" href="https://example.com/">Unrelated link</a>',
]) assert.equal(repairReferenceLinks(html).html, html);

for (const [from, to] of [
  ["/temples/fukuoji-shinmeicho", "/temples/fukuoji-jonosaki/"],
  ["/topics/haka/hakajimai-cost", "/topics/ohaka/ohaka-14/"],
  ["/topics/haka/kaisou-kyoka-flow", "/topics/ohaka/ohaka-16/"],
  ["/topics/dan/ridan-jitsumu", "/guide/danka/"],
]) {
  for (const suffix of ["", "/"]) {
    const response = await onRequest({ request: new Request(`https://temple.atawi.link${from}${suffix}?fga_internal=1`), next() { throw Error("Must redirect"); } });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), `https://temple.atawi.link${to}?fga_internal=1`);
  }
}
console.log(`[OK] ${Object.keys(policy.replacements).length} moved URLs, ${policy.unavailable.length} unavailable URLs; citation preservation, idempotence, unrelated links and 8 legacy paths validated`);
