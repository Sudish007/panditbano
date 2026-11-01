// Stage 7 — PWA (design.md §13; design-review MEDIUM 5, NIT 17; FEAT-109). Writes the three per-language manifests and
// dist/sw.js (assets/sw-template.js with the build hash, BASE_PATH, the language list and the precache list).
// Three manifests without `id` = three installable apps (one per language), each with a distinct short_name — recorded in
// docs/design.md "Deviations and notes".
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LANGS } from "./config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SW_TEMPLATE = join(ROOT, "assets", "sw-template.js");
export const PRECACHE_BUDGET = 2 * 1024 * 1024;

/** The manifest object of one language (design §13.1): relative start_url/scope, paper colours, 192/512/maskable icons, NO id. */
export function manifestFor(ui, lang, themeColors) {
  return {
    name: ui.site.name,
    short_name: ui.site.name,
    description: ui.site.description,
    lang,
    dir: "ltr",
    start_url: "./",
    scope: "../",
    display: "standalone",
    background_color: themeColors.light,
    theme_color: themeColors.light,
    icons: [
      { src: "../assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "../assets/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "../assets/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

export function writeManifests(out, ctx) {
  for (const lang of LANGS) out.set(`${lang}/manifest.webmanifest`, JSON.stringify(manifestFor(ctx.ui[lang], lang, ctx.themeColors), null, 2) + "\n");
}

/** dist file key → site href. */
const hrefOfFile = (R, file) => R.href(file.endsWith("/index.html") ? file.slice(0, -"index.html".length) : file === "index.html" ? "" : file);

/**
 * The precache list (class "static", design §13.2 + MEDIUM 5): hashed CSS/JS, fonts, icons, the manifests and every HTML
 * page whose route is classified precache: "static" (root redirect, 404, offline pages, home pages, section indexes).
 * Returns { urls (sorted, site-absolute), bytes }.
 */
export function precacheList(out, { R, pages }) {
  const urls = new Set();
  let bytes = 0;
  const add = (file) => {
    const body = out.get(file);
    if (body === undefined) throw new Error(`precache: ${file} is not in the build output`);
    const u = hrefOfFile(R, file);
    if (!urls.has(u)) { urls.add(u); bytes += Buffer.isBuffer(body) ? body.length : Buffer.byteLength(String(body), "utf8"); }
  };
  for (const file of out.keys()) {
    if (file.startsWith("assets/css/") || file.startsWith("assets/js/") || file.startsWith("assets/icons/")) add(file);
    else if (file.startsWith("fonts/") && file.endsWith(".woff2")) add(file);
    else if (file.endsWith("/manifest.webmanifest")) add(file);
  }
  for (const p of pages) if (p.precache === "static") add(p.file);
  return { urls: [...urls].sort(), bytes };
}

/** sw.js text from the template (exported so the unit test can check the placeholders are all replaced). */
export function renderServiceWorker(template, { hash, basePath, langs = LANGS, precache }) {
  const missing = ["__PB_HASH__", "__PB_BASE__", "__PB_LANGS__", "__PB_PRECACHE__"].filter((p) => !template.includes(p));
  if (missing.length) throw new Error(`sw-template.js lacks placeholders: ${missing.join(", ")}`);
  return template
    .replace("__PB_HASH__", hash)
    .replace("__PB_BASE__", basePath)
    .replace("__PB_LANGS__", JSON.stringify(langs))
    .replace("__PB_PRECACHE__", JSON.stringify(precache));
}

/** Stage 7 entry: manifests + sw.js into `out`; returns { precache: {count, bytes}, swBytes }. */
export function stagePwa(out, ctx, { pages }) {
  writeManifests(out, ctx);
  const { urls, bytes } = precacheList(out, { R: ctx.R, pages });
  const sw = renderServiceWorker(readFileSync(SW_TEMPLATE, "utf8"), { hash: ctx.hash, basePath: ctx.R.BASE_PATH, precache: urls });
  out.set("sw.js", sw);
  return { precache: { count: urls.length, bytes, budget: PRECACHE_BUDGET }, swBytes: Buffer.byteLength(sw, "utf8") };
}
