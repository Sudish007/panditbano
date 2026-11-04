// Stage 10 — budgets and the build report (design.md §23, §11.1 stage 10, §12; FEAT-109; FIX-1a). Measures the finished
// output map. Per-page rules (orchestrator decision 2026-11-02, the owner-side amendment of brief §7 — docs/design.md
// "Deviations and notes", docs/CONTENT-RULES.md): (a) CSS + JS per page ≤ 150 KB uncompressed (the code-bloat tripwire);
// (b) HTML + CSS + JS per page ≤ 150 KB gzip level 6 — the bytes GitHub Pages transfers — pothi routes included, no
// exemptions; (c) warning only: uncompressed HTML per page, with the ten heaviest pages listed (both figures) in build.json.
// Data JSON ≤ 300 KB per file, fonts ≤ 450 KB in total, service-worker precache ≤ 2 MB, OG bytes/seconds (build/og.mjs),
// the ḹ count in the generated IAST and the U+0953/U+0954 fallback-svara count. Budget violations are fatal when CI=true
// and warnings locally (build.mjs decides); the per-module JS caps of design §12 are reported as warnings only.
import { gzipSync } from "node:zlib";
import { OG_BYTES_BUDGET, OG_SECONDS_BUDGET } from "./og.mjs";
import { PRECACHE_BUDGET } from "./pwa.mjs";

/** (a) CSS + JS per page, uncompressed. */
export const CODE_BUDGET = 150 * 1024;
/** (b) HTML + CSS + JS per page, gzip level 6. */
export const PAGE_GZIP_BUDGET = 150 * 1024;
/** (c) uncompressed HTML per page — reported, never fatal (the content IS the HTML; Devanagari is 3 bytes a character). */
export const PAGE_HTML_NOTE = 150 * 1024;
/** Kept for callers that still read the old name: the gzip cap is the per-page rule now. */
export const PAGE_BUDGET = PAGE_GZIP_BUDGET;
export const GZIP_LEVEL = 6;
export const HEAVIEST_LISTED = 10;
export const DATA_JSON_BUDGET = 300 * 1024;
export const FONTS_BUDGET = 450 * 1024;
/** design §12 size caps (unminified) per client module, bytes. */
export const MODULE_CAPS = { app: 6, translit: 2, voice: 6, checklist: 2, tracker: 2, quiz: 3, expand: 1, offline: 4, pothi: 2, search: 6, sankalpa: 2, "deva-norm": 2 };

const sizeOf = (body) => (Buffer.isBuffer(body) ? body.length : Buffer.byteLength(String(body), "utf8"));
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/** Sum of ḹ (U+1E39) in every generated IAST string and of the U+0953/U+0954 fallback marks counted by derive(). */
export function textCounts(derived) {
  let lli = 0, fallback = 0;
  const seen = new Set();
  const take = (rec) => {
    if (!rec || seen.has(rec)) return;
    seen.add(rec);
    if (typeof rec.iast === "string") lli += (rec.iast.match(/\u1E39/g) || []).length;
    if (typeof rec.svaraFallback === "number") fallback += rec.svaraFallback;
  };
  for (const m of derived.mantraById?.values() || []) take(m);
  for (const v of derived.verseById?.values() || []) take(v.verse);
  return { lli, fallbackSvara: fallback };
}

/**
 * Compute every budget over the output map. `pages` = stageRender's list (file, pageType, lang); `ctx.assets` names the
 * hashed CSS/JS; `ctx.modules[pageType]` the page modules. Returns { budgets, ok } where budgets.violations is the fatal list.
 */
export function measureBudgets(out, { pages, ctx, og, precache }) {
  const violations = [];
  const warnings = [];
  const gz = (body) => gzipSync(Buffer.isBuffer(body) ? body : Buffer.from(String(body), "utf8"), { level: GZIP_LEVEL }).length;
  const css = sizeOf(out.get(ctx.assets.css) || "");
  const appJs = sizeOf(out.get(ctx.assets.js) || "");
  const cssGz = gz(out.get(ctx.assets.css) || "");
  const appJsGz = gz(out.get(ctx.assets.js) || "");
  const moduleBytes = {};
  const moduleGz = {};
  for (const [file, body] of out) {
    const m = /^assets\/js\/([A-Za-z0-9_-]+)\.[0-9a-f]{12}\.mjs$/.exec(file);
    if (m) { moduleBytes[m[1]] = sizeOf(body); moduleGz[m[1]] = gz(body); }
  }
  // per-page payload: (a) code uncompressed, (b) HTML+CSS+JS gzip, (c) HTML uncompressed (note only)
  const measured = [];
  const codeOffenders = [];
  const gzipOffenders = [];
  let maxCode = { file: null, bytes: 0 };
  let maxGzip = { file: null, bytes: 0 };
  let maxHtml = { file: null, bytes: 0 };
  let htmlOver = 0;
  for (const p of pages) {
    const html = out.get(p.file);
    if (html === undefined) continue;
    const modNames = (ctx.modules?.[p.pageType] || []).map((rel) => /^\.\/([A-Za-z0-9_-]+)\./.exec(rel)?.[1]).filter(Boolean);
    const code = css + appJs + modNames.reduce((a, n) => a + (moduleBytes[n] || 0), 0);
    const htmlBytes = sizeOf(html);
    const gzip = gz(html) + cssGz + appJsGz + modNames.reduce((a, n) => a + (moduleGz[n] || 0), 0);
    const row = { file: p.file, pageType: p.pageType, html: htmlBytes, code, uncompressed: htmlBytes + code, gzip };
    measured.push(row);
    if (code > maxCode.bytes) maxCode = { file: p.file, bytes: code };
    if (gzip > maxGzip.bytes) maxGzip = { file: p.file, bytes: gzip };
    if (htmlBytes > maxHtml.bytes) maxHtml = { file: p.file, bytes: htmlBytes };
    if (code > CODE_BUDGET) codeOffenders.push({ file: p.file, bytes: code });
    if (gzip > PAGE_GZIP_BUDGET) gzipOffenders.push({ file: p.file, bytes: gzip });
    if (htmlBytes > PAGE_HTML_NOTE) htmlOver++;
  }
  for (const o of codeOffenders) violations.push(`page ${o.file}: CSS+JS ${kb(o.bytes)} > ${kb(CODE_BUDGET)} uncompressed (rule a)`);
  for (const o of gzipOffenders) violations.push(`page ${o.file}: HTML+CSS+JS ${kb(o.bytes)} > ${kb(PAGE_GZIP_BUDGET)} gzip (rule b)`);
  const heaviest = measured.sort((a, b) => b.uncompressed - a.uncompressed).slice(0, HEAVIEST_LISTED);
  if (htmlOver) warnings.push(`${htmlOver} page(s) carry more than ${kb(PAGE_HTML_NOTE)} of uncompressed HTML (rule c, note only); heaviest ${maxHtml.file} ${kb(maxHtml.bytes)} HTML, ${kb(maxGzip.bytes)} gzip max on ${maxGzip.file}`);
  // data JSON (search shards and any other JSON a page loads; manifests and reports excluded)
  let maxJson = { file: null, bytes: 0 };
  for (const [file, body] of out) {
    if (!file.endsWith(".json") || file.startsWith("_reports/") || file === "og/manifest.json") continue;
    const bytes = sizeOf(body);
    if (bytes > maxJson.bytes) maxJson = { file, bytes };
    if (bytes > DATA_JSON_BUDGET) violations.push(`data JSON ${file}: ${kb(bytes)} > ${kb(DATA_JSON_BUDGET)}`);
  }
  // modules (warnings only)
  const modulesOver = [];
  for (const [name, bytes] of Object.entries(moduleBytes)) {
    const cap = MODULE_CAPS[name];
    if (cap && bytes > cap * 1024) { modulesOver.push({ name, bytes, cap: cap * 1024 }); warnings.push(`module ${name}.mjs: ${kb(bytes)} > ${cap} KB cap (design §12; warning only)`); }
  }
  // fonts
  let fonts = 0;
  for (const [file, body] of out) if (file.startsWith("fonts/") && file.endsWith(".woff2")) fonts += sizeOf(body);
  if (fonts > FONTS_BUDGET) violations.push(`fonts ${kb(fonts)} > ${kb(FONTS_BUDGET)}`);
  // precache
  if (precache && precache.bytes > PRECACHE_BUDGET) violations.push(`sw precache ${kb(precache.bytes)} > ${kb(PRECACHE_BUDGET)} (${precache.count} URLs)`);
  // og
  if (og) {
    if (og.bytes > OG_BYTES_BUDGET) violations.push(`og ${kb(og.bytes)} > ${kb(OG_BYTES_BUDGET)}`);
    if (og.seconds > OG_SECONDS_BUDGET) violations.push(`og stage ${og.seconds} s > ${OG_SECONDS_BUDGET} s`);
    if (og.failed) warnings.push(`og: ${og.failed} image(s) fell back to the type default`);
    if (og.fontMatched === false) violations.push("og: Pango could not render non-empty text with the bundled TTF fontfiles — Devanagari would be tofu/mis-shaped (MEDIUM 2)");
  }
  const budgets = {
    page: {
      // (a) code uncompressed, (b) gzip, (c) HTML note — plus the ten heaviest pages with both figures for the verification report
      cap: PAGE_GZIP_BUDGET, gzipLevel: GZIP_LEVEL, css, appJs, cssGz, appJsGz,
      code: { cap: CODE_BUDGET, max: maxCode, over: codeOffenders.length },
      gzip: { cap: PAGE_GZIP_BUDGET, max: maxGzip, over: gzipOffenders.length },
      html: { note: PAGE_HTML_NOTE, max: maxHtml, over: htmlOver, fatal: false },
      max: maxGzip, over: gzipOffenders.length,
      heaviest,
    },
    dataJson: { cap: DATA_JSON_BUDGET, max: maxJson },
    modules: { caps: Object.fromEntries(Object.entries(MODULE_CAPS).map(([k, v]) => [k, v * 1024])), bytes: moduleBytes, over: modulesOver, fatal: false },
    fonts: { cap: FONTS_BUDGET, bytes: fonts },
    precache: precache ? { cap: PRECACHE_BUDGET, bytes: precache.bytes, count: precache.count } : null,
    og: og ? { bytesCap: OG_BYTES_BUDGET, secondsCap: OG_SECONDS_BUDGET, bytes: og.bytes, seconds: og.seconds, failed: og.failed } : null,
    violations,
    warnings,
  };
  return { budgets, ok: violations.length === 0 };
}
