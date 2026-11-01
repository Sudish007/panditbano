// Route table as data (design.md §3.2, §11.5, §13.2). One entry per route pattern; every entry carries
// pageType, phase, precache class ("static" | "runtime" | "none"), sitemap flag and og class
// ("own" | "type-default"). `routesFor(lang, data)` expands the patterns against the loaded content;
// `alternates(route)` gives the three language URLs; `href()`/`abs()` prefix BASE_PATH / SITE_ORIGIN.
// Precache "static" (FEAT-109, design §13.2 + design-review MEDIUM 5): root redirect, 404, the offline pages, the three
// home pages, the seven section indexes (learn, occasions, mantras, texts, kathas, glossary, reference) and the manifests;
// every other HTML page is "runtime" (cached when visited or saved). OG "own" per design-review MEDIUM 3: home, indexes,
// occasion (+parts), katha (+adhyaya), text, chapter, level, lesson, reference, static, glossary index, search; the rest
// use the per-type default image.
import config, { LANGS, DEFAULT_LANG } from "../config.mjs";

const list = (x) => (Array.isArray(x) ? x : []);

/** Route patterns. `pattern` is language-relative (no leading slash); "" is the language home. */
export const ROUTES = [
  { pageType: "root-redirect", pattern: "", lang: false, phase: 1, precache: "static", sitemap: false, og: "type-default", expand: () => [{}] },
  { pageType: "not-found", pattern: "404.html", lang: false, phase: 1, precache: "static", sitemap: false, og: "type-default", expand: () => [{}] },
  { pageType: "home", pattern: "", phase: 1, precache: "static", sitemap: true, og: "own", expand: () => [{}] },
  { pageType: "offline", pattern: "offline/", phase: 1, precache: "static", sitemap: false, og: "type-default", expand: () => [{}] },
  { pageType: "learn-index", pattern: "learn/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.levels).length ? [{}] : []) },
  { pageType: "learn-level", pattern: "learn/level-{level}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.levels).map((l) => ({ level: l.level })) },
  { pageType: "lesson", pattern: "learn/{lessonId}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.lessons).map((l) => ({ lessonId: l.id })) },
  { pageType: "occasions-index", pattern: "occasions/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.occasions).length ? [{}] : []) },
  { pageType: "occasion", pattern: "occasions/{slug}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.occasions).map((o) => ({ slug: o.slug })) },
  { pageType: "occasion-part", pattern: "occasions/{slug}/{part}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.occasions).flatMap((o) => list(o.parts).map((p) => ({ slug: o.slug, part: p.slug }))) },
  { pageType: "pothi", pattern: "occasions/{slug}/pothi/", phase: 1, precache: "runtime", sitemap: true, og: "type-default", expand: (d) => list(d.occasions).map((o) => ({ slug: o.slug })) },
  { pageType: "mantras-index", pattern: "mantras/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.mantras).length ? [{}] : []) },
  { pageType: "mantra", pattern: "mantras/{mantraId}/", phase: 1, precache: "runtime", sitemap: true, og: "type-default", expand: (d) => list(d.mantras).map((m) => ({ mantraId: m.id })) },
  { pageType: "texts-index", pattern: "texts/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.texts).length ? [{}] : []) },
  { pageType: "text", pattern: "texts/{textSlug}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.texts).map((t) => ({ textSlug: t.slug })) },
  { pageType: "chapter", pattern: "texts/{textSlug}/{n}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.texts).flatMap((t) => list(t.chapters).map((c) => ({ textSlug: t.slug, n: c.n }))) },
  { pageType: "chapter-part", pattern: "texts/{textSlug}/{n}/p{k}/", phase: 1, precache: "runtime", sitemap: true, og: "type-default", expand: (d) => list(d.texts).flatMap((t) => list(t.chapters).flatMap((c) => list(c.parts).slice(1).map((_, i) => ({ textSlug: t.slug, n: c.n, k: i + 2 })))) },
  { pageType: "kathas-index", pattern: "kathas/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.kathas).length ? [{}] : []) },
  { pageType: "katha", pattern: "kathas/{slug}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.kathas).map((k) => ({ slug: k.slug })) },
  { pageType: "katha-adhyaya", pattern: "kathas/{slug}/{n}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.kathas).flatMap((k) => list(k.adhyayas).map((a) => ({ slug: k.slug, n: a.n }))) },
  { pageType: "glossary-index", pattern: "glossary/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.terms).length ? [{}] : []) },
  { pageType: "term", pattern: "glossary/{termId}/", phase: 1, precache: "runtime", sitemap: true, og: "type-default", expand: (d) => list(d.terms).filter((t) => t.published !== false).map((t) => ({ termId: t.id })) },
  { pageType: "reference", pattern: "reference/", phase: 1, precache: "static", sitemap: true, og: "own", expand: (d) => (list(d.reference).length ? [{}] : []) },
  { pageType: "reference-page", pattern: "reference/{slug}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.reference).map((r) => ({ slug: r.slug })) },
  { pageType: "search", pattern: "search/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => (d.features?.searchPage ? [{}] : []) },
  { pageType: "static", pattern: "{slug}/", phase: 1, precache: "runtime", sitemap: true, og: "own", expand: (d) => list(d.statics).map((s) => ({ slug: s.slug })) },
  // files (no HTML page)
  { pageType: "manifest", pattern: "manifest.webmanifest", phase: 1, precache: "static", sitemap: false, og: "type-default", file: true, expand: () => [{}] },
  { pageType: "sw", pattern: "sw.js", lang: false, phase: 1, precache: "none", sitemap: false, og: "type-default", file: true, expand: () => [{}] },
  { pageType: "robots", pattern: "robots.txt", lang: false, phase: 1, precache: "none", sitemap: false, og: "type-default", file: true, expand: () => [{}] },
  { pageType: "sitemap", pattern: "sitemap.xml", lang: false, phase: 1, precache: "none", sitemap: false, og: "type-default", file: true, expand: () => [{}] },
  { pageType: "search-shard", pattern: "search/{lang}/{shard}.json", lang: false, phase: 3, precache: "runtime", sitemap: false, og: "type-default", file: true, expand: () => [] },
  { pageType: "dev-fonts", pattern: "_dev/fonts.html", lang: false, phase: 1, precache: "none", sitemap: false, og: "type-default", file: true, expand: () => [{}] },
];

export const STATIC_SLUGS = ["about", "sources", "privacy"];
export const REFERENCE_SLUGS = ["panchang-basics", "muhurat-rules", "gotra-pravara", "dhyana-shlokas", "sutak-patak", "sankalpa", "verification", "bibliography"];
export const OCCASION_GROUPS = ["foundations", "daily", "birth", "marriage", "home", "death", "kathas", "vrats", "festivals", "shanti"];
export const NAV_SECTIONS = ["learn", "occasions", "texts", "kathas", "glossary"];

/** Lesson ids are `l<level>-<nn>-<slug>`; the `level-` prefix is reserved for level pages (design-review NIT 17). */
export function isLessonId(id) {
  return typeof id === "string" && /^[a-z0-9][a-z0-9-]{1,63}$/.test(id) && !id.startsWith("level-");
}

export function fill(pattern, params = {}) {
  return pattern.replace(/\{(\w+)\}/g, (_, k) => {
    if (params[k] === undefined || params[k] === null) throw new Error(`route param ${k} missing for ${pattern}`);
    return String(params[k]);
  });
}

/** Build the helper set for a given BASE_PATH / SITE_ORIGIN (tests use both "/panditbano/" and "/"). */
export function createRoutes({ BASE_PATH, SITE_ORIGIN } = config) {
  const href = (path = "") => BASE_PATH + String(path).replace(/^\/+/, "");
  const abs = (path = "") => SITE_ORIGIN + href(path);
  /** Language-relative page path → site path (e.g. ("en", "offline/") → "en/offline/"). */
  const langPath = (lang, pagePath = "") => `${lang}/${pagePath}`;
  /** A concrete route: {pageType, lang, path (lang-relative), params, sitePath}. */
  const page = (route, lang, params) => {
    const path = fill(route.pattern, params);
    const sitePath = route.lang === false ? path : langPath(lang, path);
    return { pageType: route.pageType, lang: route.lang === false ? null : lang, path, params, sitePath, href: href(sitePath), abs: abs(sitePath), precache: route.precache, sitemap: route.sitemap, og: route.og, file: !!route.file };
  };
  /** All concrete pages/files for one language given the loaded data (lang-less routes only for DEFAULT_LANG). */
  const routesFor = (lang, data = {}) => {
    const out = [];
    for (const r of ROUTES) {
      if (r.lang === false && lang !== DEFAULT_LANG) continue;
      for (const params of r.expand(data)) out.push(page(r, lang, params));
    }
    return out;
  };
  /** Three language URLs (site-relative hrefs) of the same page; lang-less pages return the same href for all. */
  const alternates = (route) => {
    const out = {};
    for (const l of LANGS) out[l] = route.lang === null ? href(route.sitePath) : href(langPath(l, route.path));
    return out;
  };
  /** hreflang set per page: hi, en, x-default only (never bho/bh — design §17). */
  const hreflangs = (route) => {
    const alt = alternates(route);
    return [
      { hreflang: "hi", href: abs(alt.hi.slice(BASE_PATH.length)) },
      { hreflang: "en", href: abs(alt.en.slice(BASE_PATH.length)) },
      { hreflang: "x-default", href: abs(alt.hi.slice(BASE_PATH.length)) },
    ];
  };
  return { href, abs, langPath, page, routesFor, alternates, hreflangs, BASE_PATH, SITE_ORIGIN };
}

const bound = createRoutes(config);
export const { href, abs, langPath, routesFor, alternates, hreflangs } = bound;
export default bound;
