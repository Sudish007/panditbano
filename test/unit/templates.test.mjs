// FEAT-102: template helpers and the shell (design.md §4.1, §5.2, §11.2, §17, §22; design-review MEDIUM 6, NIT 11/12).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { esc, html, raw, loadUI, t, extLink } from "../../build/templates/lib.mjs";
import { layout, HEAD_SCRIPT } from "../../build/templates/layout.mjs";
import { homePage } from "../../build/templates/pages/home.mjs";
import { notFoundPage } from "../../build/templates/pages/not-found.mjs";
import { offlinePage } from "../../build/templates/pages/offline.mjs";
import { rootRedirectPage, ROOT_SCRIPT } from "../../build/templates/pages/root-redirect.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ctx = (features = { search: false }) => ({ R, features, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: {}, themeColors: { light: "#F8ECD4", dark: "#171209" } });
const routeOf = (lang, type) => R.routesFor(lang, {}).find((r) => r.pageType === type);
const MOTIF = /#(m-[a-z0-9-]+|i-om)\b/;

test("esc() escapes <>&\"' and html`` escapes interpolations but not Raw", () => {
  assert.equal(esc(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  const out = html`<p title="${"a\"b"}">${"<script>"}${raw("<b>ok</b>")}${["x", raw("<i>")]}</p>`.toString();
  assert.equal(out, `<p title="a&quot;b">&lt;script&gt;<b>ok</b>x<i></p>`);
  assert.equal(html`${null}${undefined}${false}${0}`.toString(), "0");
});

test("shell: lang/data attributes, head metadata, hreflang set, theme-color ×2, preload ×2, head script", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = homePage(ctx(), { route: routeOf(lang, "home"), counts: {} }).toString();
    assert.ok(s.startsWith("<!DOCTYPE html>\n<html lang=\"" + lang + "\""), lang);
    assert.ok(s.includes(`data-base="/panditbano/" data-lang="${lang}" data-page="home" data-theme="light" data-translit="iast"`));
    assert.ok(s.includes(HEAD_SCRIPT));
    assert.ok(!/maximum-scale|user-scalable/.test(s));
    assert.ok(s.includes(`<link rel="canonical" href="https://sudish007.github.io/panditbano/${lang}/">`));
    const hl = [...s.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(hl, ["hi", "en", "x-default"]);
    assert.equal((s.match(/<meta name="theme-color"/g) || []).length, 2);
    assert.equal((s.match(/<link rel="preload"/g) || []).length, 2);
    assert.ok(s.includes(`<title>${t(lang, "site.tagline")} — ${t(lang, "site.name")}</title>`));
    assert.equal((s.match(/<h1[\s>]/g) || []).length, 1, "one h1");
    assert.ok(s.includes('<a class="skip" href="#main">'));
    assert.ok(s.includes('<main id="main"'));
    assert.ok(s.includes(`<link rel="manifest" href="/panditbano/${lang}/manifest.webmanifest">`));
  }
});

test("header: five nav links, language control with aria-current, theme button with three distinct icons (NIT 11)", () => {
  const s = homePage(ctx(), { route: routeOf("hi", "home"), counts: {} }).toString();
  const head = s.slice(s.indexOf("<header"), s.indexOf("</header>"));
  for (const k of ["learn", "occasions", "texts", "kathas", "glossary"]) assert.ok(head.includes(`>${t("hi", `nav.${k}`)}</a>`), k);
  assert.ok(head.includes('<a href="/panditbano/hi/" lang="hi" hreflang="hi" data-lang="hi" aria-current="true">'));
  assert.ok(head.includes('<a href="/panditbano/en/" lang="en" hreflang="en" data-lang="en">'));
  const btn = head.slice(head.indexOf("<button"), head.indexOf("</button>"));
  assert.ok(btn.includes("data-theme-toggle") && btn.includes('aria-live="polite"'));
  assert.deepEqual([...btn.matchAll(/<use href="#(i-[a-z]+)"/g)].map((m) => m[1]), ["i-sun", "i-moon", "i-auto"]);
  assert.ok(btn.includes('data-l-light="थीम: हल्की"') && btn.includes('data-l-dark="थीम: गहरी"') && btn.includes('data-l-system="थीम: सिस्टम"'));
  assert.ok(head.includes('class="band"'));
  assert.ok(/<header[\s\S]*<svg class="band"[\s\S]*<\/header>/.test(s), "band sits inside the header box");
});

test("features.search=false → no [data-search] anywhere; true → search control present (MEDIUM 6)", () => {
  const off = homePage(ctx(), { route: routeOf("hi", "home"), counts: {} }).toString();
  assert.ok(!off.includes("data-search"));
  assert.ok(!notFoundPage(ctx(), { route: routeOf("hi", "not-found") }).toString().includes("data-search"));
  const on = homePage(ctx({ search: true }), { route: routeOf("hi", "home"), counts: {} }).toString();
  assert.ok((on.match(/data-search/g) || []).length >= 2);
});

test("footer: four columns, licences, note line (hi authored / en+bho translation), privacy sentence + link (NIT 12); no motif", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = homePage(ctx(), { route: routeOf(lang, "home"), counts: {} }).toString();
    const foot = s.slice(s.indexOf("<footer"), s.indexOf("</footer>"));
    assert.equal((foot.match(/<h2 class="label">/g) || []).length, 3);
    assert.ok(foot.includes(t(lang, "foot.licences")));
    assert.ok(foot.includes(esc(lang === "hi" ? t(lang, "foot.note_hi") : t(lang, "foot.note_translation"))));
    assert.ok(foot.includes(`${t(lang, "foot.privacy_line")} <a href="/panditbano/${lang}/privacy/">${t(lang, "foot.privacy")}</a>`));
    assert.ok(!MOTIF.test(foot), `footer carries a motif in ${lang}`);
    assert.ok(foot.includes('rel="external noopener"') && foot.includes('<use href="#i-ext"/>'));
    // help links keep the same order on every page (WCAG 3.2.6)
    const order = ["foot.about", "foot.sources", "foot.corrections", "foot.privacy"].map((k) => foot.indexOf(t(lang, k)));
    assert.deepEqual([...order].sort((a, b) => a - b), order);
  }
});

test("404 and offline pages: no chrome, no sacred motif, trilingual 404, Occasions link", () => {
  const nf = notFoundPage(ctx(), { route: routeOf("hi", "not-found") }).toString();
  assert.ok(!MOTIF.test(nf), "404 carries a motif");
  assert.ok(!nf.includes("<header") && !nf.includes("<footer"));
  for (const lang of ["hi", "en", "bho"]) assert.ok(nf.includes(`<section class="block" lang="${lang}">`), lang);
  assert.ok(nf.includes('href="/panditbano/en/occasions/"'));
  assert.ok(nf.includes('<meta name="robots" content="noindex">'));
  assert.ok(!nf.includes('rel="canonical"'));
  for (const lang of ["hi", "en", "bho"]) {
    const off = offlinePage(ctx(), { route: routeOf(lang, "offline") }).toString();
    assert.ok(!MOTIF.test(off), `offline ${lang} carries a motif`);
    assert.ok(off.includes(`<h1>${t(lang, "offline.offline_title")}</h1>`));
    assert.ok(off.includes("data-saved-list"));
  }
});

test("root redirect: meta refresh to hi/, canonical hi/, 6-line persisted-language script", () => {
  const s = rootRedirectPage(ctx()).toString();
  assert.ok(s.includes('<meta http-equiv="refresh" content="0; url=hi/">'));
  assert.ok(s.includes('<link rel="canonical" href="https://sudish007.github.io/panditbano/hi/">'));
  assert.ok(s.includes(ROOT_SCRIPT));
  assert.equal(ROOT_SCRIPT.trim().split("\n").length, 6);
  assert.ok(/l!=='hi'&&l!=='en'&&l!=='bho'/.test(ROOT_SCRIPT));
});

test("extLink marks external links with rel, icon and sr text (UI-20)", () => {
  const s = extLink("en", "https://example.org/x", "Example").toString();
  assert.equal(s, `<a href="https://example.org/x" rel="external noopener">Example<svg class="ext-ic" aria-hidden="true" focusable="false"><use href="#i-ext"/></svg><span class="sr"> (external link)</span></a>`);
});

test("home: group tiles for the ten groups, counts omitted at 0, Shubhvela panel with no_dates sentence, hidden saved list", () => {
  const s = homePage(ctx(), { route: routeOf("hi", "home"), counts: { occasions: 0, groups: {} } }).toString();
  assert.equal((s.match(/class="card group-card"/g) || []).length, 10);
  assert.ok(!s.includes("0 अवसर") && !s.includes("0 पृष्ठ"));
  assert.ok(s.includes(t("hi", "honesty.no_dates")));
  assert.ok(s.includes('class="saved-list" data-saved-list hidden'));
  const withCounts = homePage(ctx(), { route: routeOf("en", "home"), counts: { occasions: 12, groupCount: 3, groups: { marriage: 4 } }, groups: [{ id: "marriage", examples: [{ title: "Vivah", href: "/panditbano/en/occasions/vivah/" }] }] }).toString();
  assert.ok(withCounts.includes("12 occasions") && withCounts.includes("4 pages"));
  assert.ok(withCounts.includes('<a class="chip" href="/panditbano/en/occasions/vivah/">Vivah</a>'));
  assert.ok(!/<h[1-6][^>]*>\s*\d/.test(withCounts), "no heading starts with a literal count");
});

test("template layout() escapes data: a title with < never reaches the page unescaped", () => {
  const s = layout(ctx(), { route: routeOf("hi", "home"), title: "<b>x</b>", description: 'a"b', body: html`${"<script>alert(1)</script>"}` }).toString();
  assert.ok(!s.includes("<b>x</b>") && s.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(!s.includes("<script>alert"));
});
