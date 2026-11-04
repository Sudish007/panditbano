// Stage 9 — OG images (design.md §11.7 as amended by design-review MEDIUM 2 and MEDIUM 3; FEAT-109), modelled on
// Shubhvela's web/src/og/render.mjs: text layers are rendered by sharp/libvips (Pango shapes Devanagari correctly) with the
// repo TTFs passed as `fontfile`; the geometry (paper, frame, kumkum rule, diya panel, language chip) comes from
// assets/og-template.svg through @resvg/resvg-js; the layers are composited and written as a palette-quantised PNG.
// Own images only for the MEDIUM 3 page types (route og: "own"); every other page links its type default (rendered once per
// language). Failures fall back to the type default and are counted (non-fatal). Budgets: dist/og ≤ 60 MB and the stage
// ≤ 45 s, asserted in build.json (fatal when CI=true — build/report.mjs).
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { pageMeta } from "./seo.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const OG_W = 1200, OG_H = 630;
export const OG_BYTES_BUDGET = 60 * 1024 * 1024;
export const OG_SECONDS_BUDGET = 45;
export const TITLE_MAX = 70;
const BATCH = 16;

// Text colours = the light-theme --ink / --ink-2 tokens, read from tokens.css (no colour literal outside it — brief §7).
function lightToken(name) {
  const css = readFileSync(join(ROOT, "assets", "css", "tokens.css"), "utf8");
  const i = css.indexOf(':root, :root[data-theme="light"]');
  const block = css.slice(i, css.indexOf("}", i));
  const m = new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(block);
  if (!m) throw new Error(`tokens.css: --${name} missing in the light block`);
  return m[1];
}
const INK = lightToken("ink"), INK2 = lightToken("ink-2");
// Text boxes of assets/og-template.svg (CSS px of the 1200×630 canvas)
const BOX = { title: { x: 72, y: 168, w: 760, h: 300 }, site: { x: 72, y: 508, w: 600, h: 56 }, lang: { x: 1040, y: 508, w: 88, h: 40 } };
// Pango matches the Pango font description against the TTF's name-table family (nameID 1 = "Noto Sans Devanagari SemiBold",
// style "Regular"), so the description must use that full family name: "Noto Sans Devanagari 600 <size>" does NOT match the
// static SemiBold file and silently falls back to a system face (measured 2026-11-01: fallback metrics = a bogus family's).
const FONTS = {
  deva: { family: "Noto Sans Devanagari SemiBold", file: resolve(ROOT, "fonts", "noto-sans-devanagari", "src", "NotoSansDevanagari-SemiBold.ttf") },
  latin: { family: "Noto Sans SemiBold", file: resolve(ROOT, "fonts", "noto-sans", "src", "NotoSans-SemiBold.ttf") },
};
const TEMPLATE = join(ROOT, "assets", "og-template.svg");

const escapeMarkup = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hasDeva = (s) => /[\u0900-\u097F]/.test(s);
const fontFor = (text, lang) => (lang === "en" && !hasDeva(text) ? FONTS.latin : FONTS.deva);

/** Title cap (design §11.7): ≤ TITLE_MAX characters, ellipsis when cut. */
export function capTitle(s, max = TITLE_MAX) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if ([...t].length <= max) return t;
  return [...t].slice(0, max - 1).join("").trimEnd() + "…";
}

// FEAT-110: the cold-cache OG stage crashed the Windows build intermittently with STATUS_HEAP_CORRUPTION (0xC0000374).
// Two mitigations, both kept: Pango text runs (which register `fontfile` with fontconfig on every call) are rendered one at
// a time through this queue, and every composite receives its own copy of the layer pixels (see layerAt). Compositing and
// PNG encoding stay parallel (BATCH); the measured cost is unchanged (93 images in 1.4–1.6 s).
let textQueue = Promise.resolve();
const serial = (fn) => { const p = textQueue.then(fn, fn); textQueue = p.catch(() => {}); return p; };

/** One text run as a raw RGBA layer (Pango wraps at `width`); raw output skips a PNG encode/decode per layer (≈ 10× faster). */
function textLayer({ text, lang, size, color, width, align = "left" }) {
  const f = fontFor(text, lang);
  return serial(async () => {
    const img = sharp({ text: { text: `<span foreground="${color}">${escapeMarkup(text)}</span>`, font: `${f.family} ${size}`, fontfile: f.file, width, align, rgba: true, dpi: 72 } });
    const r = await img.raw().toBuffer({ resolveWithObject: true });
    return { input: r.data, raw: { width: r.info.width, height: r.info.height, channels: r.info.channels }, width: r.info.width, height: r.info.height };
  });
}

/** Shrink the font size (−4 steps) until the wrapped run fits the box height, never below minSize. */
async function fitText(layer, box, minSize) {
  let size = layer.size;
  for (;;) {
    const r = await textLayer({ ...layer, size, width: box.w });
    if ((r.height <= box.h && r.width <= box.w) || size <= minSize) return { ...r, size };
    size -= 4;
  }
}

/** Proves the bundled TTFs are the faces Pango uses: the rendered pixels of the real family must differ from a
    nonexistent family's fallback. Pixel hashes are required because Linux font substitutes can have identical metrics. */
export async function fontProbe() {
  const probe = (family, file, text) => serial(async () => {
    const r = await sharp({ text: { text, font: `${family} 40`, fontfile: file, width: 1000, rgba: true, dpi: 72 } }).raw().toBuffer({ resolveWithObject: true });
    return {
      metrics: `${r.info.width}x${r.info.height}`,
      hash: createHash("sha256").update(r.data).digest("hex").slice(0, 12),
    };
  });
  const deva = await probe(FONTS.deva.family, FONTS.deva.file, "श्राद्ध क्ष ज्ञ");
  const devaBogus = await probe("Pb Nonexistent Family", FONTS.deva.file, "श्राद्ध क्ष ज्ञ");
  const latin = await probe(FONTS.latin.family, FONTS.latin.file, "Pandit Bano");
  const latinBogus = await probe("Pb Nonexistent Family", FONTS.latin.file, "Pandit Bano");
  return {
    deva: deva.metrics,
    devaBogus: devaBogus.metrics,
    latin: latin.metrics,
    latinBogus: latinBogus.metrics,
    matched: deva.hash !== devaBogus.hash && latin.hash !== latinBogus.hash,
  };
}

let baseCache = null;
/** The geometry template rasterised once per process (resvg; no text, no system fonts). */
export function basePng() {
  if (!baseCache) {
    const svg = readFileSync(TEMPLATE, "utf8");
    const r = new Resvg(svg, { fitTo: { mode: "width", value: OG_W }, font: { loadSystemFonts: false } });
    baseCache = Buffer.from(r.render().asPng());
  }
  return baseCache;
}

// Each composite gets its OWN copy of the layer pixels: the cached footer layers were shared by the 16 concurrent composites
// of a batch, and that sharing is where the Windows heap corruption reproduced (≈ 1 run in 8 with shared Buffers; 0 in 40
// with copies — FEAT-110). ≈ 0.2 MB per image, freed with the composite.
const layerAt = (r, left, top) => ({ input: Buffer.from(r.input), raw: r.raw, left: Math.round(left), top: Math.round(top) });

const footerCache = new Map();
/** Site-name and language-chip layers are identical for every image of a language: rendered once per process. */
async function footerLayers(site, lang) {
  const key = `${lang}|${site}`;
  if (!footerCache.has(key)) {
    footerCache.set(key, (async () => {
      const s = await fitText({ text: site, lang, size: 28, color: INK2 }, BOX.site, 18);
      const l = await textLayer({ text: lang, lang: "en", size: 20, color: INK2, width: BOX.lang.w, align: "centre" });
      return [layerAt(s, BOX.site.x, BOX.site.y + (BOX.site.h - s.height) / 2), layerAt(l, BOX.lang.x + (BOX.lang.w - l.width) / 2, BOX.lang.y + (BOX.lang.h - l.height) / 2)];
    })());
  }
  return footerCache.get(key);
}

// Palette PNG (≈ 12 KB each): compressionLevel 4 + effort 3 + no dither measured 11–17 ms/image in batches of 16 against
// 31 ms for the compressionLevel 9 default — the OG stage budget is 45 s for ≈ 2,000 images (design §23, MEDIUM 3).
const PNG_OPTS = { palette: true, compressionLevel: 4, quality: 90, effort: 3, dither: 0 };

/** Render one 1200×630 OG PNG: title (fit to the title box), site name, language chip label. */
export async function renderOg({ title, site, lang }) {
  const t = await fitText({ text: capTitle(title), lang, size: 56, color: INK }, BOX.title, 30);
  const layers = [layerAt(t, BOX.title.x, BOX.title.y), ...(await footerLayers(site, lang))];
  return sharp(basePng()).composite(layers).png(PNG_OPTS).toBuffer();
}

// ---------------------------------------------------------------- plan
const slugOfPath = (path) => (path.replace(/\/+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "home");
const DEFAULT_TITLE_KEY = { mantra: "nav.texts", "chapter-part": "nav.texts", term: "nav.glossary", pothi: "pothi.label", offline: "offline.offline_title", "not-found": "notfound.title", "sources-project": "sources.registry" };
const uiGet = (ui, key) => key.split(".").reduce((o, k) => (o ? o[k] : undefined), ui);

/**
 * Decide the image of every page before rendering (so the head metas can be injected first). Returns
 * { files: Map(ogFile → {title, site, lang, kind}), forPage: Map(page.file → ogFile) }.
 */
export function ogPlan(pages, { ctx, out }) {
  const files = new Map();
  const forPage = new Map();
  for (const p of pages) {
    if (!p.lang || !p.route) continue;
    const ui = ctx.ui[p.lang];
    const site = ui.site.name;
    if (p.route.og === "own") {
      const html = out.get(p.file);
      const meta = typeof html === "string" ? pageMeta(html, site) : { title: "" };
      const title = p.pageType === "home" ? ui.site.tagline : meta.title || site;
      const file = `og/${p.lang}/${slugOfPath(p.route.path)}.png`;
      files.set(file, { title, site, lang: p.lang, kind: "own" });
      forPage.set(p.file, file);
    } else {
      const file = `og/${p.lang}/default-${p.pageType}.png`;
      if (!files.has(file)) files.set(file, { title: uiGet(ui, DEFAULT_TITLE_KEY[p.pageType] || "") || ui.site.tagline, site, lang: p.lang, kind: "default" });
      forPage.set(p.file, file);
    }
  }
  return { files, forPage };
}

/** Cache key of one image: title + site + lang + template + font files (so a font or template change re-renders everything). */
let assetHashCache = null;
function assetHash() {
  if (!assetHashCache) {
    const h = createHash("sha256");
    h.update(readFileSync(TEMPLATE));
    for (const f of [FONTS.deva.file, FONTS.latin.file]) if (existsSync(f)) h.update(readFileSync(f));
    assetHashCache = h.digest("hex").slice(0, 12);
  }
  return assetHashCache;
}
export const ogKey = (spec) => createHash("sha256").update(`${assetHash()}|${spec.lang}|${spec.site}|${capTitle(spec.title)}`).digest("hex").slice(0, 16);

/** Previous dist/og/manifest.json → { key → Buffer } for the files that still exist (local rebuild cache; CI has none). */
export function loadOgCache(distDir) {
  const cache = new Map();
  const manifestPath = join(distDir, "og", "manifest.json");
  if (!existsSync(manifestPath)) return cache;
  try {
    const m = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const [file, key] of Object.entries(m.files || {})) {
      const p = join(distDir, file);
      if (existsSync(p)) cache.set(key, readFileSync(p));
    }
  } catch { /* ignore a broken cache */ }
  return cache;
}

/**
 * Stage 9 entry: render every planned image into `out` (defaults first, then own images in batches of BATCH; a failed own
 * image receives the bytes of its language's type default). Returns the og section of build.json.
 */
export async function stageOg(out, plan, { cache = new Map(), batch = BATCH } = {}) {
  const t0 = performance.now();
  const stats = { images: 0, own: 0, defaults: 0, failed: 0, cached: 0, bytes: 0, seconds: 0, budget: { bytes: OG_BYTES_BUDGET, seconds: OG_SECONDS_BUDGET }, failures: [], fontMatched: null, fontProbe: null };
  try { const fp = await fontProbe(); stats.fontMatched = fp.matched; stats.fontProbe = fp; } catch (err) { stats.fontMatched = false; stats.failures.push(`font probe: ${err.message}`); }
  const manifest = { files: {} };
  const fallbackFor = new Map(); // lang → default PNG buffer usable when an own image fails
  const render = async (file, spec) => {
    const key = ogKey(spec);
    let png = cache.get(key);
    if (png) stats.cached++;
    else png = await renderOg(spec);
    out.set(file, png);
    manifest.files[file] = key;
    stats.images++;
    stats.bytes += png.length;
    if (spec.kind === "own") stats.own++; else stats.defaults++;
    return png;
  };
  const entries = [...plan.files.entries()];
  // defaults first (sequential: one per language per type, few of them) so a fallback exists for every language
  for (const [file, spec] of entries.filter(([, s]) => s.kind === "default")) {
    try {
      const png = await render(file, spec);
      if (!fallbackFor.has(spec.lang)) fallbackFor.set(spec.lang, png);
    } catch (err) { stats.failed++; stats.failures.push(`${file}: ${err.message}`); }
  }
  const own = entries.filter(([, s]) => s.kind === "own");
  for (let i = 0; i < own.length; i += batch) {
    await Promise.all(own.slice(i, i + batch).map(async ([file, spec]) => {
      try { await render(file, spec); }
      catch (err) {
        stats.failed++;
        if (stats.failures.length < 20) stats.failures.push(`${file}: ${err.message}`);
        const fb = fallbackFor.get(spec.lang) || [...fallbackFor.values()][0];
        if (fb) { out.set(file, fb); stats.bytes += fb.length; }
      }
    }));
  }
  out.set("og/manifest.json", JSON.stringify(manifest) + "\n");
  stats.seconds = Math.round((performance.now() - t0) / 100) / 10;
  return stats;
}
