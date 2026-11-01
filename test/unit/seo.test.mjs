// FEAT-109: SEO files and structured data (design §17) — sitemap with hi/en/x-default alternates and bho as ordinary
// URLs, robots.txt disallowing _dev/ and _reports/, JSON-LD per page type that parses (WebSite without SearchAction while the
// flag is false; BreadcrumbList; HowTo + HowToStep; Article; DefinedTerm), og:image / twitter metas, og:locale hi_IN/en_IN only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pageMeta, robotsTxt, unesc, SITEMAP_SPLIT_AT, writeSitemaps } from "../../build/seo.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { fixtureBuild } from "./_fixture-build.mjs";

const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const nodesOf = (doc) => (doc["@graph"] ? doc["@graph"] : [doc]);

test("pageMeta reads title (without the site suffix), description and crumbs back from the HTML", () => {
  const html = '<title>विवाह (बियाह) — पंडित बनो</title><meta name="description" content="a &amp; b"><ol class="crumbs"><li><a href="/panditbano/hi/">मुखपृष्ठ</a></li><li><a href="/panditbano/hi/occasions/">अवसर</a></li></ol>';
  assert.deepEqual(pageMeta(html, "पंडित बनो"), { title: "विवाह (बियाह)", description: "a & b", crumbs: [{ href: "/panditbano/hi/", label: "मुखपृष्ठ" }, { href: "/panditbano/hi/occasions/", label: "अवसर" }] });
  assert.equal(unesc("&lt;b&gt; &quot;x&quot; &#39;y&#39;"), "<b> \"x\" 'y'");
});

test("robots.txt allows /, disallows _dev/ and _reports/ under BASE_PATH, names the absolute sitemap", () => {
  const r = robotsTxt(R);
  assert.match(r, /^User-agent: \*\nAllow: \/\n/);
  assert.ok(r.includes("Disallow: /panditbano/_dev/") && r.includes("Disallow: /panditbano/_reports/"));
  assert.ok(r.includes("Sitemap: https://sudish007.github.io/panditbano/sitemap.xml"));
});

test("sitemap splits into an index + per-language files only above 45,000 URLs", () => {
  const mk = (n) => ["hi", "en", "bho"].flatMap((lang) => Array.from({ length: n }, (_, i) => ({ lang, route: { lang, path: `x${i}/`, sitePath: `${lang}/x${i}/`, abs: `https://sudish007.github.io/panditbano/${lang}/x${i}/`, sitemap: true } })));
  const small = new Map();
  assert.deepEqual(writeSitemaps(small, { pages: mk(3), R }).files, ["sitemap.xml"]);
  assert.ok(!small.has("sitemap-hi.xml"));
  const big = new Map();
  assert.deepEqual(writeSitemaps(big, { pages: mk(SITEMAP_SPLIT_AT + 1), R }).files, ["sitemap.xml", "sitemap-hi.xml", "sitemap-en.xml", "sitemap-bho.xml"]);
  assert.ok(big.get("sitemap.xml").includes("<sitemapindex") && big.get("sitemap.xml").includes("/panditbano/sitemap-bho.xml</loc>"));
});

test("fixture build: sitemap has hi/en/x-default alternates, bho URLs as plain entries, no noindex pages; robots present", async () => {
  const b = await fixtureBuild();
  const sm = b.read("sitemap.xml");
  assert.ok(sm.startsWith('<?xml version="1.0" encoding="UTF-8"?>') && sm.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  const urls = [...sm.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  assert.equal(urls.length, b.report.seo.urls);
  const vivahHi = urls.find((u) => u.includes("<loc>https://sudish007.github.io/panditbano/hi/occasions/vivah/</loc>"));
  assert.ok(vivahHi, "hi vivah listed");
  assert.ok(vivahHi.includes('hreflang="hi" href="https://sudish007.github.io/panditbano/hi/occasions/vivah/"'));
  assert.ok(vivahHi.includes('hreflang="en" href="https://sudish007.github.io/panditbano/en/occasions/vivah/"'));
  assert.ok(vivahHi.includes('hreflang="x-default" href="https://sudish007.github.io/panditbano/hi/occasions/vivah/"'));
  assert.ok(!/hreflang="(bho|bh)"/.test(sm), "no bho/bh hreflang anywhere");
  const vivahBho = urls.find((u) => u.includes("<loc>https://sudish007.github.io/panditbano/bho/occasions/vivah/</loc>"));
  assert.ok(vivahBho && !vivahBho.includes("<xhtml:link"), "bho page is an ordinary <url> entry");
  assert.ok(!sm.includes("/offline/</loc>") && !sm.includes("404.html"), "noindex pages are not listed");
  assert.ok(b.read("robots.txt").includes("Disallow: /panditbano/_reports/"));
});

test("fixture build: JSON-LD per page type parses; WebSite without SearchAction; HowTo steps; DefinedTerm; Article; BreadcrumbList", async () => {
  const b = await fixtureBuild();
  const home = ld(b.read("hi/index.html"));
  assert.equal(home.length, 1);
  const ws = nodesOf(home[0]).find((n) => n["@type"] === "WebSite");
  assert.ok(ws && ws.inLanguage === "hi" && ws.url === "https://sudish007.github.io/panditbano/hi/");
  assert.ok(!("potentialAction" in ws), "no SearchAction while features.search is false (MEDIUM 6)");
  const occ = nodesOf(ld(b.read("hi/occasions/vivah/index.html"))[0]);
  const howto = occ.find((n) => n["@type"] === "HowTo");
  assert.ok(howto && howto.step.length > 5 && howto.step.every((s) => s["@type"] === "HowToStep" && s.text));
  assert.ok(occ.find((n) => n["@type"] === "BreadcrumbList").itemListElement.length >= 2);
  const part = nodesOf(ld(b.read("hi/occasions/vivah/purvang/index.html"))[0]).find((n) => n["@type"] === "HowTo");
  assert.ok(part && part.step.length < howto.step.length, "a part lists only its own steps");
  const term = nodesOf(ld(b.read("en/glossary/kalash/index.html"))[0]).find((n) => n["@type"] === "DefinedTerm");
  assert.ok(term && term.termCode === "kalash" && term.inDefinedTermSet.url === "https://sudish007.github.io/panditbano/en/glossary/");
  for (const f of ["hi/learn/l0-01-purohit-kaun/index.html", "bho/kathas/satyanarayan-vrat-katha/index.html", "hi/reference/sankalpa/index.html", "en/about/index.html"]) {
    assert.ok(nodesOf(ld(b.read(f))[0]).some((n) => n["@type"] === "Article"), `${f}: Article`);
  }
  assert.equal(ld(b.read("hi/offline/index.html")).length, 0, "offline page carries no JSON-LD");
});

test("fixture build: og:image + alt + twitter:card on indexed pages; og:locale only hi_IN / en_IN", async () => {
  const b = await fixtureBuild();
  const hi = b.read("hi/occasions/vivah/index.html");
  assert.ok(hi.includes('<meta property="og:image" content="https://sudish007.github.io/panditbano/og/hi/occasions-vivah.png">'));
  assert.ok(hi.includes('<meta property="og:image:width" content="1200">') && hi.includes('<meta property="og:image:height" content="630">'));
  assert.ok(hi.includes('<meta property="og:image:alt" content="विवाह (बियाह)">') && hi.includes('<meta name="twitter:card" content="summary_large_image">'));
  assert.ok(hi.includes('<meta property="og:locale" content="hi_IN">'));
  assert.ok(b.read("en/occasions/vivah/index.html").includes('<meta property="og:locale" content="en_IN">'));
  assert.ok(!b.read("bho/occasions/vivah/index.html").includes('property="og:locale"'), "no og:locale for bho (R4 §10)");
  assert.ok(!b.read("hi/offline/index.html").includes('property="og:image"'), "noindex pages carry no og:image");
  assert.ok(b.has("og/hi/occasions-vivah.png"), "the referenced image exists");
});
