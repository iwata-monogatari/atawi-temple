import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const policy = JSON.parse(await readFile(new URL("../data/reference-link-health.json", import.meta.url), "utf8"));
const unavailable = new Map(policy.unavailable.map((entry) => [entry.url, entry]));
const decodeAttribute = (value) => value.replaceAll("&amp;", "&").replaceAll("&#38;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

// Apply only the reviewed URLs. Never infer a dead link from a hostname or request error.
export function repairReferenceLinks(html) {
  let replaced = 0;
  let disabled = 0;
  const output = html.replace(/<a\b([^>]*?)\s+href=(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi, (match, before, quote, href, after, content) => {
    let url;
    try { url = new URL(decodeAttribute(href), "https://temple.atawi.link"); } catch { return match; }
    const fragment = url.hash;
    url.hash = "";
    const replacement = policy.replacements[url.href];
    if (replacement) {
      replaced++;
      return `<a${before} href="${escapeAttribute(replacement + fragment)}"${after}>${content}</a>`;
    }
    const entry = unavailable.get(url.href);
    if (!entry) return match;
    disabled++;
    const discovery = entry.discoveryUrl
      ? ` <a href="${escapeAttribute(entry.discoveryUrl)}" target="_blank" rel="noopener noreferrer">${escapeAttribute(entry.discoveryLabel)}</a>`
      : "";
    return `<span class="unavailable-reference" data-original-url="${escapeAttribute(url.href)}" title="元の参照URL：${escapeAttribute(url.href)}">${content}</span><small class="reference-link-note">（参照先のページが見つかりません・${policy.checkedOn}確認）</small>${discovery}`;
  });
  return { html: output, replaced, disabled };
}

export async function repairBuiltReferenceLinks(directory) {
  const root = directory instanceof URL ? fileURLToPath(directory) : directory;
  let pages = 0, replaced = 0, disabled = 0;
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!entry.name.endsWith(".html")) continue;
      const original = await readFile(file, "utf8");
      const result = repairReferenceLinks(original);
      if (result.html !== original) {
        await writeFile(file, result.html);
        pages++;
        replaced += result.replaced;
        disabled += result.disabled;
      }
    }
  }
  await walk(root);
  console.log(`[link repair] ${pages} pages: ${replaced} moved references, ${disabled} unavailable references annotated`);
}
