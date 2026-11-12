import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { onRequest } from "../functions/_middleware.js";

const origin = "https://temple.atawi.link";
const root = path.resolve("dist");
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith(".html")) files.push(file);
  }
}
await walk(root);
const redirects = new Map((await readFile("public/_redirects", "utf8")).split(/\r?\n/).filter(line => line && !line.startsWith("#")).map(line => line.trim().split(/\s+/).slice(0, 2)));
const checked = new Map();
const errors = [];
async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}
async function targetExists(url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return false; }
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root + path.sep) && target !== root) return false;
  if (await exists(path.join(target, "index.html"))) return true;
  // Directories alone are not published files.
  if (!pathname.endsWith("/") && (await exists(target + ".html") || await exists(target) && path.extname(target))) return true;
  const redirect = redirects.get(pathname);
  if (redirect) return targetExists(new URL(redirect, origin));
  const response = await onRequest({ request: new Request(url), next: () => new Response("Not Found", { status: 404 }) });
  if (response.status >= 300 && response.status < 400) {
    const destination = new URL(response.headers.get("location"), url);
    return destination.origin !== origin || destination.pathname !== pathname && targetExists(destination);
  }
  return false;
}
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (relative.startsWith("admin/") || relative === "404.html") continue;
  const source = "/" + (relative.endsWith("index.html") ? relative.slice(0, -10) : relative);
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/<a\b[^>]*?\s+href=(["'])(.*?)\1/gi)) {
    const href = match[2].replaceAll("&amp;", "&").replaceAll("&#38;", "&");
    if (/[{}$]/.test(href)) continue; // Client-generated template links are checked by their data validators.
    let url;
    try { url = new URL(href, origin + source); } catch { continue; }
    if (url.origin !== origin || /^\/(api|admin)\//.test(url.pathname)) continue;
    const key = url.pathname;
    if (!checked.has(key)) checked.set(key, await targetExists(url));
    if (!checked.get(key)) errors.push(`${source} -> ${href}`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  throw new Error(`${errors.length} internal references have no built file or redirect`);
}
console.log(`[OK] ${files.length} built HTML files; ${checked.size} internal paths have a file or verified redirect`);
