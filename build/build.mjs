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
import { loadContent, parseJsonFile } from "./lib/load.mjs";
import { runGate, writeReport, formatFindings } from "./gate.mjs";
import { derive } from "./lib/derive.mjs";
export { parseJsonFile };
import { homePage } from "./templates/pages/home.mjs";
import { notFoundPage } from "./templates/pages/not-found.mjs";
import { offlinePage } from "./templates/pages/offline.mjs";
import { rootRedirectPage } from "./templates/pages/root-redirect.mjs";
import { mantraPage } from "./templates/pages/mantra.mjs";
import { mantrasIndexPage } from "./templates/pages/mantras-index.mjs";
import { occasionPage, occasionPartPage } from "./templates/pages/occasion.mjs";
import { pothiPage } from "./templates/pages/pothi.mjs";
import { occasionsIndexPage } from "./templates/pages/occasions-index.mjs";
import { textsIndexPage } from "./templates/pages/texts-index.mjs";
import { textPage } from "./templates/pages/text.mjs";
import { chapterPage } from "./templates/pages/chapter.mjs";
import { kathasIndexPage } from "./templates/pages/kathas-index.mjs";
import { kathaPage } from "./templates/pages/katha.mjs";
import { kathaAdhyayaPage } from "./templates/pages/katha-adhyaya.mjs";
import { learnIndexPage } from "./templates/pages/learn-index.mjs";
import { learnLevelPage } from "./templates/pages/learn-level.mjs";
import { lessonPage } from "./templates/pages/lesson.mjs";
import { glossaryIndexPage } from "./templates/pages/glossary-index.mjs";
import { termPage } from "./templates/pages/term.mjs";
import { referencePage } from "./templates/pages/reference.mjs";
import { referencePagePage } from "./templates/pages/reference-page.mjs";
import { staticPage } from "./templates/pages/static.mjs";
import { searchPage } from "./templates/pages/search.mjs";
import { embedOfflineManifests } from "./lib/offline.mjs";
import { nameIndex } from "./templates/components/names.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = createRoutes(config);

/** Page modules loaded per page type by app.mjs (hashed at build; design §12). Later FEATs add entries. */
export const PAGE_MODULES = {
  mantra: ["translit", "voice"],
  occasion: ["translit", "voice", "checklist", "tracker"],
  "occasion-part": ["translit", "voice", "checklist", "tracker"],
  pothi: ["pothi"],
  chapter: ["translit", "voice", "expand", "tracker"],
  "chapter-part": ["translit", "voice", "expand", "tracker"],
  katha: ["translit", "voice", "checklist", "tracker"],
  "katha-adhyaya": ["translit", "voice"],
  "learn-index": ["quiz"],
  "learn-level": ["quiz"],
  lesson: ["translit", "voice", "quiz"],
  "reference-page": ["translit", "voice", "sankalpa"],
};

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
  const data = loadContent(config.CONTENT_DIR, { label: "content" });
  for (const l of LANGS) {
    if (!data.ui[l]) throw new Error(`content/ui/${l}.json missing`);
    setUI(l, data.ui[l]);
  }
  // the search PAGE exists from Phase 1 (browse mode while features.search is false — design-review MEDIUM 6); the engine is the flag
  data.features = { searchPage: true, search: config.features.search };
  return data;
}

function stageGate(data) {
  // design §10.7: FAIL → exit 3 after writing dist/_reports/gate.json (the only dist write on failure — NIT 14)
  return runGate(data, { phase: process.env.PB_PHASE || 1, R });
}

function stageDerive(data) {
  const d = derive(data, { R });
  for (const g of OCCASION_GROUPS) d.counts.groups[g] = d.counts.groups[g] || 0;
  return d;
}

/** Group cards for the home page (design §27 item 3): up to 4 example chips per group in the page language. */
function homeGroups(groups, lang) {
  return groups.map((g) => ({ id: g.id, examples: g.examples.map((e) => ({ title: e.title[lang], href: e.href(lang) })) }));
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
  const occasionsById = new Map(data.occasions.map((o) => [o.id, o]));
  const occasionsBySlug = new Map(data.occasions.map((o) => [o.slug, o]));
  const textsBySlug = new Map(data.texts.map((x) => [x.slug, x]));
  const kathasBySlug = new Map(data.kathas.map((k) => [k.slug, k]));
  for (const lang of LANGS) {
    for (const route of R.routesFor(lang, data)) {
      if (route.file) continue;
      let html = null;
      switch (route.pageType) {
        case "root-redirect": html = rootRedirectPage(ctx); break;
        case "not-found": html = notFoundPage(ctx, { route }); break;
        case "home": html = homePage(ctx, { route, counts: derived.counts, groups: homeGroups(derived.groups, route.lang), featured: data.featured || [] }); break;
        case "offline": html = offlinePage(ctx, { route }); break;
        case "mantras-index": html = mantrasIndexPage(ctx, { route, mantras: data.mantras }); break;
        case "mantra": html = mantraPage(ctx, { route, rec: derived.mantraById.get(route.params.mantraId), mantras: data.mantras, derived, occasionsById, sources: data.sources }); break;
        case "occasions-index": html = occasionsIndexPage(ctx, { route, occasions: data.occasions, counts: derived.counts }); break;
        case "occasion": html = occasionPage(ctx, { route, occ: occasionsBySlug.get(route.params.slug), data, derived, occasionsById }); break;
        case "occasion-part": {
          const occ = occasionsBySlug.get(route.params.slug);
          html = occasionPartPage(ctx, { route, occ, part: occ.parts.find((p) => p.slug === route.params.part), data, derived, occasionsById });
          break;
        }
        case "pothi": html = pothiPage(ctx, { route, occ: occasionsBySlug.get(route.params.slug), data, derived, occasionsById }); break;
        case "texts-index": html = textsIndexPage(ctx, { route, texts: data.texts, counts: derived.counts }); break;
        case "text": html = textPage(ctx, { route, text: textsBySlug.get(route.params.textSlug), data, derived, occasionsById }); break;
        case "chapter":
        case "chapter-part": {
          const text = textsBySlug.get(route.params.textSlug);
          const chapter = text.chapters.find((c) => c.n === route.params.n);
          html = chapterPage(ctx, { route, text, chapter, k: route.params.k || 1, data, derived, occasionsById });
          break;
        }
        case "kathas-index": html = kathasIndexPage(ctx, { route, kathas: data.kathas }); break;
        case "katha": html = kathaPage(ctx, { route, katha: kathasBySlug.get(route.params.slug), data, derived, occasionsById }); break;
        case "katha-adhyaya": {
          const katha = kathasBySlug.get(route.params.slug);
          html = kathaAdhyayaPage(ctx, { route, katha, adhyaya: katha.adhyayas.find((a) => a.n === route.params.n), data, derived, occasionsById });
          break;
        }
        case "learn-index": html = learnIndexPage(ctx, { route, data, counts: derived.counts }); break;
        case "learn-level": html = learnLevelPage(ctx, { route, level: data.levels.find((l) => l.level === route.params.level), data }); break;
        case "lesson": html = lessonPage(ctx, { route, lesson: data.lessons.find((l) => l.id === route.params.lessonId), data, derived }); break;
        case "glossary-index": html = glossaryIndexPage(ctx, { route, terms: derived.glossaryPages }); break;
        case "term": html = termPage(ctx, { route, term: derived.glossaryPages.find((g) => g.id === route.params.termId), data, derived }); break;
        case "reference": html = referencePage(ctx, { route, data }); break;
        case "reference-page": html = referencePagePage(ctx, { route, ref: data.reference.find((r) => r.slug === route.params.slug), data, derived }); break;
        case "static": html = staticPage(ctx, { route, page: data.statics.find((s) => s.slug === route.params.slug), data, derived }); break;
        case "search": html = searchPage(ctx, { route, data, derived }); break;
        default: throw new Error(`no template for page type "${route.pageType}" (${route.sitePath})`);
      }
      if (html === null) continue;
      const file = route.sitePath.endsWith("/") || route.sitePath === "" ? `${route.sitePath}index.html` : route.sitePath;
      out.set(file, tidy(html.toString()));
      pages.push({ pageType: route.pageType, lang: route.lang, file, href: route.href });
    }
  }
  return pages;
}

/** One representative URL per pageType for tools/audit.py --pages all-types (FEAT-103): the DEFAULT_LANG page
 *  (or the lang-less page) — the audit substitutes the language segment for --langs en,bho. */
export function samplePages(pages, defaultLang = config.DEFAULT_LANG) {
  const out = {};
  for (const p of pages) {
    const cur = out[p.pageType];
    if (!cur || (p.lang === defaultLang && cur.lang !== defaultLang)) out[p.pageType] = p;
  }
  return Object.fromEntries(Object.entries(out).map(([k, p]) => [k, p.href]));
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
  const gate = timed("gate", () => stageGate(data));
  writeReport(gate, config.DIST); // always written (design-review NIT 14); the previous dist/ is otherwise untouched on FAIL
  if (!gate.ok) {
    console.error(formatFindings(gate.findings.filter((f) => f.level === "FAIL")));
    console.error(`gate FAIL: ${gate.counts.FAIL} FAIL, ${gate.counts.FLAG} FLAG — only dist/_reports/gate.json was written`);
    process.exit(3);
  }
  if (gate.counts.FLAG) console.log(`gate: 0 FAIL, ${gate.counts.FLAG} FLAG (dist/_reports/gate.json)`);
  const derived = timed("derive", () => stageDerive(data));
  const hash = timed("hash", computeHash);
  const out = new Map();
  const assets = timed("assets", () => stageAssets(out, hash));
  const ctx = { R, ui: data.ui, features: config.features, hash, assets: { css: assets.css, js: assets.js }, modules: assets.modules, themeColors: assets.themeColors, names: nameIndex(data.sources, data.institutions) };
  const pages = timed("render", () => stageRender(out, ctx, data, derived));
  // MEDIUM 5: #pb-offline-urls {id, hash, bytes, urls} on occasion / part / pothi pages, bytes from the rendered output
  const offline = timed("offline", () => embedOfflineManifests(out, { R, ctx, occasions: data.occasions }));
  if (offline.missing.length) throw new Error(`offline manifest: ${offline.missing.length} URL(s) have no dist file — ${offline.missing.slice(0, 3).join("; ")}`);
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
    samplePages: samplePages(pages),
    pageList: pages.map((p) => ({ pageType: p.pageType, lang: p.lang, href: p.href })),
    files: out.size + 1,
    counts: derived.counts,
    offlineManifests: offline.embedded,
    gate: { ok: true, flags: gate.counts.FLAG },
    timings,
    totalMs: Math.round(performance.now() - t0),
  };
  out.set("_reports/build.json", JSON.stringify(report, null, 2) + "\n");
  timed("write", () => { writeAll(out); writeReport(gate, config.DIST); });
  console.log(`build ${hash}: ${pages.length} pages, ${out.size} files → ${posix(relative(ROOT, config.DIST))} (${report.totalMs} ms; ${Object.entries(timings).map(([k, v]) => `${k} ${v}`).join(", ")})`);
  return report;
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  build().catch((err) => {
    console.error(`build failed: ${err.message}`);
    process.exit(2);
  });
}
