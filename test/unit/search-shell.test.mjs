// FEAT-108 / design-review MEDIUM 6: while features.search is false the search page is a browse page — ten occasion groups,
// glossary letter bar, texts list, NO <input>, NO [data-search], no SearchAction JSON-LD; with the flag on, the §14.4 UI.
// Also: every FEAT-108 page type is rendered for the fixture corpus and lands in samplePages (tools/audit.py --pages all-types).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI } from "../../build/templates/lib.mjs";
import { searchPage } from "../../build/templates/pages/search.mjs";
import { homePage } from "../../build/templates/pages/home.mjs";
import { offlinePage } from "../../build/templates/pages/offline.mjs";
import { notFoundPage } from "../../build/templates/pages/not-found.mjs";
import { createRoutes, OCCASION_GROUPS } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";
import { samplePages, PAGE_MODULES } from "../../build/build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ctx = (features = { search: false }) => ({ R, features, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: {}, themeColors: { light: "#F8ECD4", dark: "#171209" } });
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
data.features = { searchPage: true, search: false };
const derived = derive(data, { R });
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const count = (s, re) => (s.match(re) || []).length;

test("features.search=false: /search/ is a browse page — ten groups with chips, letter bar, texts; no <input>, no [data-search], no SearchAction", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = searchPage(ctx(), { route: routeOf(lang, "search"), data, derived }).toString();
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.ok(!/<input\b/.test(s), `${lang}: no input`);
    assert.ok(!s.includes("data-search"), `${lang}: no [data-search]`);
    assert.ok(!s.includes("SearchAction"), `${lang}: no SearchAction JSON-LD`);
    assert.equal(count(s, /class="card group-card"/g), OCCASION_GROUPS.length, `${lang}: ten group cards`);
    assert.ok(s.includes('<nav class="letter-bar"') && s.includes(`href="/panditbano/${lang}/glossary/#l-`), `${lang}: letter bar anchors into the glossary`);
    assert.ok(s.includes('id="browse-texts"') && s.includes(`href="/panditbano/${lang}/texts/rudrashtadhyayi/"`), `${lang}: texts list`);
    assert.ok(s.includes('data-page="search"'));
    // the route exists while the flag is off (the page shell ships in Phase 1)
    assert.ok(routeOf(lang, "search"), `${lang}: search route present`);
  }
  const hi = searchPage(ctx(), { route: routeOf("hi", "search"), data, derived }).toString();
  assert.ok(hi.includes('href="/panditbano/hi/occasions/vivah/"'), "group card example chip");
  assert.ok(hi.includes("खोज-सूची अभी इस संस्करण में नहीं है"), "honest browse lede");
});

test("features.search=true: the §14.4 UI renders (type=search input, 100-char cap, aria-live count, results region) above the browse blocks", () => {
  const s = searchPage(ctx({ search: true }), { route: routeOf("hi", "search"), data, derived }).toString();
  assert.ok(s.includes('<input id="q" class="search-input" type="search" name="q" maxlength="100"') && s.includes("data-search"));
  assert.ok(s.includes('aria-live="polite" data-search-count') && s.includes('data-search-results'));
  assert.ok(s.includes('class="card group-card"'), "browse blocks stay as the empty-query view");
});

test("no [data-search] on home, offline and 404 while the flag is off; offline and 404 link Occasions", () => {
  const c = ctx();
  const home = homePage(c, { route: routeOf("hi", "home"), counts: derived.counts, groups: [], featured: [] }).toString();
  const off = offlinePage(c, { route: routeOf("hi", "offline") }).toString();
  const nf = notFoundPage(c, { route: routeOf("hi", "not-found") }).toString();
  for (const s of [home, off, nf]) assert.ok(!s.includes("data-search"));
  assert.ok(off.includes('href="/panditbano/hi/occasions/"') && nf.includes('href="/panditbano/hi/occasions/"'));
  assert.ok(!off.includes("/hi/search/") && !nf.includes("/hi/search/"));
});

test("samplePages covers the nine FEAT-108 page types for the fixture corpus; PAGE_MODULES wires quiz.mjs / sankalpa.mjs", () => {
  const pages = ["hi", "en", "bho"].flatMap((lang) => R.routesFor(lang, data).filter((r) => !r.file).map((r) => ({ pageType: r.pageType, lang: r.lang, href: r.href })));
  const sp = samplePages(pages);
  for (const type of ["learn-index", "learn-level", "lesson", "glossary-index", "term", "reference", "reference-page", "static", "search"]) assert.ok(sp[type] && sp[type].startsWith("/panditbano/hi/"), `${type} → ${sp[type]}`);
  assert.equal(sp["learn-level"], "/panditbano/hi/learn/level-0/");
  assert.equal(sp.lesson, "/panditbano/hi/learn/l0-01-purohit-kaun/");
  assert.equal(sp.search, "/panditbano/hi/search/");
  assert.deepEqual(PAGE_MODULES.lesson, ["translit", "voice", "quiz"]);
  assert.deepEqual(PAGE_MODULES["learn-index"], ["quiz"]);
  assert.deepEqual(PAGE_MODULES["learn-level"], ["quiz"]);
  assert.deepEqual(PAGE_MODULES["reference-page"], ["translit", "voice", "sankalpa"]);
});
