// FEAT-102: route table completeness, href()/abs() with both BASE_PATH values, alternates and hreflang set (design §3, §11.5, §17, §24).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUTES, createRoutes, isLessonId, fill, NAV_SECTIONS, OCCASION_GROUPS } from "../../build/lib/routes.mjs";
import { fromEnv } from "../../build/config.mjs";

const PAGE_TYPES = ["root-redirect", "not-found", "home", "offline", "learn-index", "learn-level", "lesson", "occasions-index", "occasion", "occasion-part", "pothi", "mantras-index", "mantra", "texts-index", "text", "chapter", "chapter-part", "kathas-index", "katha", "katha-adhyaya", "glossary-index", "term", "reference", "reference-page", "search", "static", "manifest", "sw", "robots", "sitemap", "search-shard", "dev-fonts"];

test("every route has pageType, phase, precache, sitemap and og classes", () => {
  for (const r of ROUTES) {
    assert.ok(typeof r.pageType === "string" && r.pageType, "pageType");
    assert.ok([1, 2, 3].includes(r.phase), `${r.pageType} phase`);
    assert.ok(["static", "runtime", "none"].includes(r.precache), `${r.pageType} precache`);
    assert.equal(typeof r.sitemap, "boolean", `${r.pageType} sitemap`);
    assert.ok(["own", "type-default"].includes(r.og), `${r.pageType} og`);
    assert.equal(typeof r.expand, "function", `${r.pageType} expand`);
  }
  assert.deepEqual(ROUTES.map((r) => r.pageType).sort(), [...PAGE_TYPES].sort());
  assert.equal(new Set(ROUTES.map((r) => r.pattern + (r.lang === false ? "!" : ""))).size, ROUTES.length, "duplicate pattern");
});

test("href/abs with BASE_PATH /panditbano/ and /", () => {
  const a = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
  assert.equal(a.href("hi/occasions/vivah/"), "/panditbano/hi/occasions/vivah/");
  assert.equal(a.href("/hi/"), "/panditbano/hi/");
  assert.equal(a.href(""), "/panditbano/");
  assert.equal(a.abs("hi/"), "https://sudish007.github.io/panditbano/hi/");
  const b = createRoutes({ BASE_PATH: "/", SITE_ORIGIN: "https://panditbano.in" });
  assert.equal(b.href("hi/occasions/vivah/"), "/hi/occasions/vivah/");
  assert.equal(b.abs("en/"), "https://panditbano.in/en/");
});

test("config validates BASE_PATH and SITE_ORIGIN (design §21)", () => {
  assert.equal(fromEnv({}).BASE_PATH, "/panditbano/");
  assert.equal(fromEnv({ BASE_PATH: "/" }).BASE_PATH, "/");
  assert.throws(() => fromEnv({ BASE_PATH: "panditbano/" }), /BASE_PATH/);
  assert.throws(() => fromEnv({ BASE_PATH: "/panditbano" }), /BASE_PATH/);
  assert.throws(() => fromEnv({ SITE_ORIGIN: "http://example.com" }), /SITE_ORIGIN/);
  assert.throws(() => fromEnv({ SITE_ORIGIN: "https://example.com/" }), /SITE_ORIGIN/);
  assert.equal(fromEnv({}).features.search, false);
});

test("routesFor expands the shell pages and the data-driven ones", () => {
  const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
  const hi = R.routesFor("hi", {});
  const types = hi.map((r) => r.pageType);
  assert.ok(types.includes("root-redirect") && types.includes("not-found") && types.includes("home") && types.includes("offline"));
  assert.ok(!types.includes("occasion"));
  const en = R.routesFor("en", {});
  assert.ok(!en.map((r) => r.pageType).includes("root-redirect"), "lang-less routes only once");
  const withData = R.routesFor("en", { occasions: [{ slug: "vivah", parts: [{ slug: "purvang" }] }], texts: [{ slug: "rudri", chapters: [{ n: 5, parts: [[], [], []] }] }] });
  const paths = withData.map((r) => r.sitePath);
  assert.ok(paths.includes("en/occasions/"));
  assert.ok(paths.includes("en/occasions/vivah/"));
  assert.ok(paths.includes("en/occasions/vivah/purvang/"));
  assert.ok(paths.includes("en/occasions/vivah/pothi/"));
  assert.ok(paths.includes("en/texts/rudri/5/"));
  assert.ok(paths.includes("en/texts/rudri/5/p2/") && paths.includes("en/texts/rudri/5/p3/"));
  const home = hi.find((r) => r.pageType === "home");
  assert.equal(home.href, "/panditbano/hi/");
  assert.equal(home.abs, "https://sudish007.github.io/panditbano/hi/");
});

test("alternates give hi/en/bho URLs; hreflang set is exactly hi, en, x-default", () => {
  const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
  const page = R.routesFor("bho", { occasions: [{ slug: "vivah" }] }).find((r) => r.pageType === "occasion");
  assert.deepEqual(R.alternates(page), { hi: "/panditbano/hi/occasions/vivah/", en: "/panditbano/en/occasions/vivah/", bho: "/panditbano/bho/occasions/vivah/" });
  const hl = R.hreflangs(page);
  assert.deepEqual(hl.map((h) => h.hreflang), ["hi", "en", "x-default"]);
  assert.ok(!hl.some((h) => h.hreflang === "bho" || h.hreflang === "bh"));
  assert.equal(hl[2].href, "https://sudish007.github.io/panditbano/hi/occasions/vivah/");
  assert.equal(hl[1].href, "https://sudish007.github.io/panditbano/en/occasions/vivah/");
});

test("lesson-id validator reserves the level- prefix (NIT 17)", () => {
  assert.ok(isLessonId("l0-01-who-is-a-purohit"));
  assert.ok(!isLessonId("level-0"));
  assert.ok(!isLessonId("Level 1"));
  assert.ok(!isLessonId(""));
});

test("fill() throws on a missing param; constants", () => {
  assert.equal(fill("occasions/{slug}/", { slug: "vivah" }), "occasions/vivah/");
  assert.throws(() => fill("occasions/{slug}/", {}), /slug/);
  assert.deepEqual(NAV_SECTIONS, ["learn", "occasions", "texts", "kathas", "glossary"]);
  assert.equal(OCCASION_GROUPS.length, 10);
});
