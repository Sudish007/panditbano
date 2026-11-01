// Shared helpers for the integration tests (design.md §24 "Integration"; FEAT-110). They run AFTER `npm run build`
// (test/run.mjs: unit → build → integration) and read dist/ — or the directory named by DIST, the same variable the build
// honours — plus dist/_reports/build.json for the page list, BASE_PATH and SITE_ORIGIN. No HTML parser: regex over the
// generated markup, which the templates keep regular (one tag per attribute order, double-quoted attributes).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DIST = resolve(process.env.DIST || join(ROOT, "dist"));

if (!existsSync(join(DIST, "_reports", "build.json"))) {
  throw new Error(`${join(DIST, "_reports", "build.json")} missing — run \`npm run build\` first (npm test does)`);
}
export const BUILD = JSON.parse(readFileSync(join(DIST, "_reports", "build.json"), "utf8"));
export const BASE_PATH = BUILD.basePath;
export const SITE_ORIGIN = BUILD.siteOrigin;
export const LANGS = ["hi", "en", "bho"];

const posix = (p) => p.split(sep).join("/");

/** Every file under dist/ as a dist-relative posix path (sorted). */
export function distFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(posix(p.slice(DIST.length + 1)));
    }
  };
  walk(DIST);
  return out;
}
export const FILES = new Set(distFiles());

/** Pages of build.json#pageList (pageType, lang, href) with their dist file and HTML. */
export function pages() {
  return BUILD.pageList.map((p) => {
    const file = hrefToFile(p.href);
    return { ...p, file, html: readFileSync(join(DIST, file), "utf8") };
  });
}

/** Site-relative href (BASE_PATH + path) or absolute SITE_ORIGIN URL → dist-relative file path ("" / "x/" → index.html). */
export function hrefToFile(href) {
  let h = String(href);
  if (h.startsWith(SITE_ORIGIN)) h = h.slice(SITE_ORIGIN.length);
  h = h.split("#")[0].split("?")[0];
  if (!h.startsWith(BASE_PATH)) return null;
  h = h.slice(BASE_PATH.length);
  try { h = decodeURIComponent(h); } catch (e) { /* keep as is */ }
  if (h === "" || h.endsWith("/")) h += "index.html";
  return h;
}

export const count = (s, re) => (s.match(re) || []).length;
/** `name="…"` attribute value of a tag string. */
export const attr = (tag, name) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
