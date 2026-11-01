#!/usr/bin/env node
// Pandit Bano static generator — skeleton with the stage order of design.md §11.1 and stage timers.
// Stages: 1 load · 2 gate (FEAT-104) · 3 derive · 4 render · 5 assets (content hash) · 6 search (FEAT-301) ·
// 7 pwa (FEAT-109; minimal manifest here) · 8 seo files · 9 og (FEAT-109) · 10 report. Everything is collected in
// memory and written to DIST at the end; on a gate FAIL only dist/_reports/gate.json is written (design-review NIT 14).
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname, relative, sep, basename, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import config, { LANGS } from "./config.mjs";
import { createRoutes, OCCASION_GROUPS } from "./lib/routes.mjs";
import { setUI, tidy } from "./templates/lib.mjs";
import { homePage } from "./templates/pages/home.mjs";
import { notFoundPage } from "./templates/pages/not-found.mjs";
import { offlinePage } from "./templates/pages/offline.mjs";
import { rootRedirectPage } from "./templates/pages/root-redirect.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = createRoutes(config);

/** Page modules loaded per page type by app.mjs (hashed at build; design §12). Later FEATs add entries. */
const PAGE_MODULES = {};

// ---------------------------------------------------------------- helpers
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const posix = (p) => p.split(sep).join("/");

/** JSON.parse with file:line:col in the error (design §11.1 stage 1). */
export function parseJsonFile(file) {
  const text = readFileSync(file, "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    const m = /position (\d+)/.exec(err.message);
    let line = 1, col = 1;
    if (m) {
      const pos = Number(m[1]);
      const before = text.slice(0, pos);
      line = before.split("\n").length;
      col = pos - before.lastIndexOf("\n");
    }
    throw new Error(`${posix(relative(ROOT, file))}:${line}:${col}: ${err.message}`);
  }
}

/** --paper of the light and dark blocks of tokens.css (for <meta name="theme-color"> and the manifest). */
export function paperColours(tokensCss) {
  const pick = (selector) => {
    const i = tokensCss.indexOf(selector);
    const block = tokensCss.slice(i, tokensCss.indexOf("}", i));
    return /--paper:\s*(#[0-9A-Fa-f]{6})/.exec(block)[1];
  };
  return { light: pick(':root, :root[data-theme="light"]'), dark: pick(':root[data-theme="dark"]') };
}

const hash12 = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 12);

// ---------------------------------------------------------------- stages
function stageLoad() {
  const ui = {};
  for (const l of LANGS) {
    const file = join(config.CONTENT_DIR, "ui", `${l}.json`);
    ui[l] = parseJsonFile(file);
    setUI(l, ui[l]);
  }
  // Content collections (occasions, mantras, …) are loaded by build/lib/load.mjs from FEAT-104 onward.
  const data = { ui, features: { searchPage: config.features.search } };
  return data;
}

function stageGate() {
  // FEAT-104 wires build/gate.mjs here; until then the gate has nothing to check.
  return { ok: true, findings: [] };
}

function stageDerive(data) {
  const groups = {};
  for (const g of OCCASION_GROUPS) groups[g] = (data.occasions || []).filter((o) => o.group === g).length;
  const counts = {
    occasions: (data.occasions || []).length,
    mantras: (data.mantras || []).length,
    verses: (data.texts || []).reduce((n, t) => n + (t.chapters || []).reduce((m, c) => m + (c.verses || []).length, 0), 0),
    terms: (data.terms || []).length,
    chapters: (data.texts || []).reduce((n, t) => n + (t.chapters || []).length, 0),
    kathas: (data.kathas || []).length,
    lessons: (data.lessons || []).length,
    levels: (data.levels || []).length,
    groupCount: Object.values(groups).filter((n) => n > 0).length,
    groups,
  };
  return { counts };
}

function computeHash() {
  const h = createHash("sha256");
  for (const dir of ["content", "build", "assets"]) {
    for (const f of walk(join(ROOT, dir))) {
      h.update(posix(relative(ROOT, f)));
      h.update(readFileSync(f));
    }
  }
  return h.digest("hex").slice(0, 12);
}

function stageAssets(out, hash) {
  const tokens = readFileSync(join(ROOT, "assets", "css", "tokens.css"), "utf8");
  const site = readFileSync(join(ROOT, "assets", "css", "site.css"), "utf8");
  const css = `assets/css/site.${hash}.css`;
  out.set(css, tokens + "\n" + site);
  const jsDir = join(ROOT, "assets", "js");
  const jsMap = {};
  for (const f of walk(jsDir).filter((p) => p.endsWith(".mjs"))) {
    const name = basename(f, ".mjs");
    jsMap[name] = `${name}.${hash}.mjs`;
    out.set(`assets/js/${jsMap[name]}`, readFileSync(f));
  }
  const modules = {};
  for (const [pageType, names] of Object.entries(PAGE_MODULES)) modules[pageType] = names.map((n) => `./${jsMap[n]}`);
  for (const f of walk(join(ROOT, "fonts")).filter((p) => p.endsWith(".woff2") || basename(p) === "OFL.txt")) {
    out.set(posix(relative(ROOT, f)), readFileSync(f));
  }
  for (const f of walk(join(ROOT, "assets", "icons"))) out.set(posix(relative(ROOT, f)), readFileSync(f));
  // dev page: font paths were relative to assets/dev/; in dist it sits at _dev/fonts.html
  const dev = readFileSync(join(ROOT, "assets", "dev", "fonts.html"), "utf8").replaceAll("../../fonts/", "../fonts/");
  out.set("_dev/fonts.html", dev);
  return { css, js: `assets/js/${jsMap.app}`, modules, themeColors: paperColours(tokens) };
}

function stageRender(out, ctx, data, derived) {
  const pages = [];
  for (const lang of LANGS) {
    for (const route of R.routesFor(lang, data)) {
      if (route.file) continue;
      let html = null;
      switch (route.pageType) {
        case "root-redirect": html = rootRedirectPage(ctx); break;
        case "not-found": html = notFoundPage(ctx, { route }); break;
        case "home": html = homePage(ctx, { route, counts: derived.counts, groups: data.groups || [], featured: data.featured || [] }); break;
        case "offline": html = offlinePage(ctx, { route }); break;
        default: break; // templates for the other page types arrive with FEAT-105…108
      }
      if (html === null) continue;
      const file = route.sitePath.endsWith("/") || route.sitePath === "" ? `${route.sitePath}index.html` : route.sitePath;
      out.set(file, tidy(html.toString()));
      pages.push({ pageType: route.pageType, lang: route.lang, file });
    }
  }
  return pages;
}

function stagePwa(out, ctx) {
  // Minimal per-language manifest so no page links a missing file; FEAT-109 completes it (icons purpose, sw.js).
  for (const lang of LANGS) {
    const ui = ctx.ui[lang];
    const manifest = {
      name: ui.site.name,
      short_name: ui.site.name,
      description: ui.site.description,
      lang,
      dir: "ltr",
      start_url: "./",
      scope: "../",
      display: "standalone",
      background_color: ctx.themeColors.light,
      theme_color: ctx.themeColors.light,
      icons: [
        { src: "../assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "../assets/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "../assets/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };
    out.set(`${lang}/manifest.webmanifest`, JSON.stringify(manifest, null, 2) + "\n");
  }
}

function writeAll(out) {
  rmSync(config.DIST, { recursive: true, force: true });
  for (const [rel, body] of out) {
    const file = join(config.DIST, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
}

// ---------------------------------------------------------------- main
export async function build() {
  const t0 = performance.now();
  const timings = {};
  const timed = (name, fn) => { const s = performance.now(); const r = fn(); timings[name] = Math.round(performance.now() - s); return r; };

  const data = timed("load", stageLoad);
  const gate = timed("gate", stageGate);
  if (!gate.ok) {
    rmSync(config.DIST, { recursive: true, force: true });
    mkdirSync(join(config.DIST, "_reports"), { recursive: true });
    writeFileSync(join(config.DIST, "_reports", "gate.json"), JSON.stringify(gate, null, 2));
    for (const f of gate.findings) console.error(`GATE FAIL ${f.rule} ${f.file}: ${f.message}`);
    process.exit(3);
  }
  const derived = timed("derive", () => stageDerive(data));
  const hash = timed("hash", computeHash);
  const out = new Map();
  const assets = timed("assets", () => stageAssets(out, hash));
  const ctx = { R, ui: data.ui, features: config.features, hash, assets: { css: assets.css, js: assets.js }, modules: assets.modules, themeColors: assets.themeColors };
  const pages = timed("render", () => stageRender(out, ctx, data, derived));
  timed("search", () => null);
  timed("pwa", () => stagePwa(out, ctx));
  timed("seo", () => null); // robots.txt + sitemap.xml: FEAT-109 (root redirect and 404 are rendered as routes)
  timed("og", () => null);
  const report = {
    hash,
    basePath: config.BASE_PATH,
    siteOrigin: config.SITE_ORIGIN,
    pages: pages.length,
    pagesByType: pages.reduce((m, p) => ((m[p.pageType] = (m[p.pageType] || 0) + 1), m), {}),
    files: out.size + 1,
    counts: derived.counts,
    gate: { ok: true, flags: gate.findings.length },
    timings,
    totalMs: Math.round(performance.now() - t0),
  };
  out.set("_reports/build.json", JSON.stringify(report, null, 2) + "\n");
  timed("write", () => writeAll(out));
  console.log(`build ${hash}: ${pages.length} pages, ${out.size} files → ${posix(relative(ROOT, config.DIST))} (${report.totalMs} ms; ${Object.entries(timings).map(([k, v]) => `${k} ${v}`).join(", ")})`);
  return report;
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  build().catch((err) => {
    console.error(`build failed: ${err.message}`);
    process.exit(2);
  });
}
