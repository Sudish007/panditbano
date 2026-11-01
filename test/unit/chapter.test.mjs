// FEAT-107: texts index, text landing and the chapter view (design.md §3.2, §4.5, §7.8, §27 items 1, 4, 5; brief §6.1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI } from "../../build/templates/lib.mjs";
import { textsIndexPage, textCounts } from "../../build/templates/pages/texts-index.mjs";
import { textPage } from "../../build/templates/pages/text.mjs";
import { chapterPage, partOf, neighbours } from "../../build/templates/pages/chapter.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive, PART_SIZE } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const MODULES = { chapter: ["./translit.abc.mjs", "./voice.abc.mjs", "./expand.abc.mjs", "./tracker.abc.mjs"], "chapter-part": ["./translit.abc.mjs", "./voice.abc.mjs", "./expand.abc.mjs", "./tracker.abc.mjs"] };
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: MODULES, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const SAMPLE = join(ROOT, "test", "fixtures", "content-sample");
const count = (s, re) => (s.match(re) || []).length;
const TRI = (s) => ({ hi: s, en: s, bho: s });

function corpus(withSynthetic = false) {
  const data = loadContent(SAMPLE);
  if (withSynthetic) {
    const text = data.texts.find((x) => x.id === "rudrashtadhyayi");
    const verses = Array.from({ length: 95 }, (_, i) => ({ v: i + 1, svara: false, verseKind: "mantra", devanagari: `नमो देवाय ${i + 1 === 7 ? "महते" : "शिवाय"} नमः । नमः शम्भवे च मयोभवे च ॥`, meaning: TRI(`अर्थ ${i + 1}`) }));
    text.chapters.push({ n: 3, title: TRI("तृतीय अध्याय — परीक्षा"), verseCount: 95 });
    text.chapterFiles.push({ text: "rudrashtadhyayi", n: 3, _n: 3, _file: "texts/rudrashtadhyayi/3.json", _dir: "rudrashtadhyayi", title: TRI("तृतीय अध्याय — परीक्षा"), source: { ref: "ws-rudrashtadhyayi", retrieved: "2026-10-31" }, verses });
  }
  const derived = derive(data, { R });
  const occasionsById = new Map(data.occasions.map((o) => [o.id, o]));
  const routes = Object.fromEntries(["hi", "en", "bho"].map((l) => [l, R.routesFor(l, data)]));
  const routeOf = (lang, type, params) => routes[lang].find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
  const text = (slug) => data.texts.find((x) => x.slug === slug);
  const chapter = (lang, slug, n, k = 1) => {
    const tx = text(slug);
    const route = k > 1 ? routeOf(lang, "chapter-part", { textSlug: slug, n, k }) : routeOf(lang, "chapter", { textSlug: slug, n });
    assert.ok(route, `route for ${slug}/${n}/p${k} (${lang})`);
    return chapterPage(ctx, { route, text: tx, chapter: tx.chapters.find((c) => c.n === n), k, data, derived, occasionsById }).toString();
  };
  return { data, derived, occasionsById, routes, routeOf, text, chapter };
}

test("fixture chapter (3 verses) renders ONE part: no part pager text, no rel prev/next to parts, 3 .verse-item with stable #v{n} anchors", () => {
  const C = corpus();
  const s = C.chapter("hi", "rudrashtadhyayi", 1);
  assert.equal(count(s, /<h1[\s>]/g), 1);
  assert.ok(s.includes("<h1>प्रथम अध्याय — गणपति और शिवसंकल्प</h1>"));
  assert.deepEqual([...s.matchAll(/<article class="verse-item" id="v(\d+)">/g)].map((m) => m[1]), ["1", "2", "3"]);
  assert.ok(!s.includes("मंत्र 1–3 · कुल 3"), "single part → no part pager text (§27 item 4)");
  assert.ok(!s.includes('<link rel="prev"') && !s.includes('<link rel="next"'), "chapter 2 is unpublished → no neighbours");
  assert.ok(!/class="pager-part"/.test(s));
  assert.ok(s.includes('<div class="layout has-both">') && s.includes('class="rail rail-left"') && s.includes('class="rail rail-right"'));
  assert.ok(s.includes('data-page="chapter"'));
  // navigator: in-page links with data-step for tracker.mjs; 3 entries
  assert.deepEqual([...s.matchAll(/<a href="#v(\d+)" data-step="\d+"/g)].map((m) => m[1]), ["1", "2", "3"]);
  // the rail chapter list marks the current chapter and lists only the published one
  const rail = s.slice(s.indexOf('id="chapters"'), s.indexOf("</details>", s.indexOf('id="chapters"')));
  assert.equal(count(rail, /<li>/g), 1);
  assert.ok(rail.includes('href="/panditbano/hi/texts/rudrashtadhyayi/1/" aria-current="page"'));
});

test("verse items: verseBlock + <details class=\"meaning\"> closed by default; mantra paragraphs keep lang=\"sa\"; Expand/Collapse buttons carry aria-controls + aria-expanded; no progress bar", () => {
  const C = corpus();
  for (const lang of ["hi", "en", "bho"]) {
    const s = C.chapter(lang, "rudrashtadhyayi", 1);
    assert.equal(count(s, /<details class="meaning" id="meaning-\d+">/g), 3, `${lang}: three closed meaning panels`);
    assert.equal(count(s, /<details class="meaning"[^>]*\sopen/g), 0);
    assert.equal(count(s, /<p class="mantra" lang="sa" id="m-rudrashtadhyayi-1-\d+"/g), 3, `${lang}: lang="sa" on every mantra paragraph`);
    assert.ok(s.includes('<button class="btn btn-ghost" type="button" data-expand="open" aria-controls="verses" aria-expanded="false">'));
    assert.ok(s.includes('<button class="btn btn-ghost" type="button" data-expand="close" aria-controls="verses" aria-expanded="false">'));
    assert.ok(s.includes('id="verses"'));
    assert.ok(!s.includes('class="progress"') && !s.includes('class="bar"'), "§27 item 4: no pagination bar");
    assert.ok(s.includes('id="reading-settings"') && s.includes('class="card svara-legend"'), "reading settings + svara legend (fixture verses have svara)");
    assert.ok(s.includes('<section id="sources"'));
    assert.ok(s.includes("संस्कृत विकिस्रोत") || s.includes("Sanskrit Wikisource"), "attribution line rendered");
  }
  // verse markers follow the page language's digits (§27 item 1)
  assert.ok(C.chapter("hi", "rudrashtadhyayi", 1).includes("॥\u00a0१\u00a0॥"), "hi marker in Devanagari digits, NBSP-joined");
  assert.ok(C.chapter("en", "rudrashtadhyayi", 1).includes("॥\u00a01\u00a0॥"), "en marker in Latin digits");
  // meaning text is inside the panel
  const hi = C.chapter("hi", "rudrashtadhyayi", 1);
  assert.ok(hi.includes("गणों के पति, प्रियों के पति"));
});

test("synthetic 95-verse chapter: 3 parts (40/40/15) routed as /3/, /3/p2/, /3/p3/ with rel prev/next; navigator links …/p2/#v57 across parts; pager text, no bar", () => {
  const C = corpus(true);
  const tx = C.text("rudrashtadhyayi");
  const ch = tx.chapters.find((c) => c.n === 3);
  assert.equal(ch.parts.length, 3);
  assert.deepEqual(ch.parts.map((p) => p.length), [PART_SIZE, PART_SIZE, 15]);
  assert.equal(partOf(ch, 57), 2);
  assert.equal(partOf(ch, 81), 3);
  const paths = C.routes.hi.filter((r) => (r.pageType === "chapter" || r.pageType === "chapter-part") && r.params.textSlug === "rudrashtadhyayi").map((r) => r.path);
  assert.deepEqual(paths, ["texts/rudrashtadhyayi/1/", "texts/rudrashtadhyayi/3/", "texts/rudrashtadhyayi/3/p2/", "texts/rudrashtadhyayi/3/p3/"]);
  const p1 = C.chapter("hi", "rudrashtadhyayi", 3, 1), p2 = C.chapter("hi", "rudrashtadhyayi", 3, 2), p3 = C.chapter("hi", "rudrashtadhyayi", 3, 3);
  assert.equal(count(p1, /<article class="verse-item"/g), 40);
  assert.equal(count(p2, /<article class="verse-item"/g), 40);
  assert.equal(count(p3, /<article class="verse-item"/g), 15);
  assert.ok(p1.includes('<link rel="prev" href="/panditbano/hi/texts/rudrashtadhyayi/1/">'), "part 1 prev = previous published chapter");
  assert.ok(p1.includes('<link rel="next" href="/panditbano/hi/texts/rudrashtadhyayi/3/p2/">'));
  assert.ok(p2.includes('<link rel="prev" href="/panditbano/hi/texts/rudrashtadhyayi/3/">') && p2.includes('<link rel="next" href="/panditbano/hi/texts/rudrashtadhyayi/3/p3/">'));
  assert.ok(p3.includes('<link rel="prev" href="/panditbano/hi/texts/rudrashtadhyayi/3/p2/">') && !p3.includes('<link rel="next"'));
  // pager as text + link (§27 item 4)
  assert.ok(p1.includes("मंत्र 1–40 · कुल 95") && p2.includes("मंत्र 41–80 · कुल 95") && p3.includes("मंत्र 81–95 · कुल 95"));
  assert.ok(p2.includes('rel="prev" href="/panditbano/hi/texts/rudrashtadhyayi/3/">← पिछला पृष्ठ') && p2.includes('rel="next" href="/panditbano/hi/texts/rudrashtadhyayi/3/p3/">अगला पृष्ठ →'));
  assert.ok(!p2.includes('class="progress"') && !p2.includes('class="bar"'));
  // the navigator spans all parts: verse 57 links to p2 from part 1, in-page on part 2
  assert.ok(p1.includes('<a href="/panditbano/hi/texts/rudrashtadhyayi/3/p2/#v57"'), "p1 navigator → p2/#v57");
  assert.ok(p2.includes('<a href="#v57" data-step="57"'), "p2 navigator in-page");
  assert.ok(p2.includes('<a href="/panditbano/hi/texts/rudrashtadhyayi/3/#v1"') && p2.includes('<a href="/panditbano/hi/texts/rudrashtadhyayi/3/p3/#v81"'));
  assert.equal(count(p1, /<ol class="vnav">/g), 1);
  assert.equal(count(p1.slice(p1.indexOf('<ol class="vnav">'), p1.indexOf("</ol>", p1.indexOf('<ol class="vnav">'))), /<li>/g), 95);
  // anchors are stable across parts: v57 exists only on p2
  assert.ok(!p1.includes('id="v57"') && p2.includes('<article class="verse-item" id="v57">') && !p3.includes('id="v57"'));
  // page meta names the part
  assert.ok(p2.includes("पृष्ठ 2/3"));
  const nb = neighbours(ctx, "en", tx, ch, 3);
  assert.equal(nb.next, null);
  assert.equal(nb.prev.kind, "part");
});

test("unpublished chapter 2 is neither routed nor counted: texts index shows 1 अध्याय · 3 श्लोक; text page lists one chapter card; no /2/ route", () => {
  const C = corpus();
  const tx = C.text("rudrashtadhyayi");
  assert.equal(tx.allChapters.length, 2);
  assert.equal(tx.chapters.length, 1);
  assert.equal(textCounts("hi", tx), "1 अध्याय · 3 श्लोक");
  assert.equal(textCounts("en", tx), "1 chapters · 3 verses");
  assert.ok(!C.routes.hi.some((r) => r.path === "texts/rudrashtadhyayi/2/"));
  const idx = textsIndexPage(ctx, { route: C.routeOf("hi", "texts-index"), texts: C.data.texts, counts: C.derived.counts }).toString();
  assert.equal(count(idx, /<h1[\s>]/g), 1);
  assert.ok(idx.includes("<h1>मंत्र और पाठ</h1>"));
  assert.ok(idx.includes("1 अध्याय · 3 श्लोक") && idx.includes("1 अध्याय · 2 श्लोक"), "both fixture texts with computed counts");
  assert.equal(count(idx, /class="card card-link text-card"/g), 2);
  assert.ok(idx.includes('href="/panditbano/hi/mantras/"') && idx.includes(">3 मंत्र<"), "mantras card with the computed count");
  assert.ok(!idx.includes("texts/rudrashtadhyayi/2/"));
  const page = textPage(ctx, { route: C.routeOf("hi", "text", { textSlug: "rudrashtadhyayi" }), text: tx, data: C.data, derived: C.derived, occasionsById: C.occasionsById }).toString();
  assert.equal(count(page, /class="card card-link chapter-card"/g), 1);
  assert.ok(page.includes('href="/panditbano/hi/texts/rudrashtadhyayi/1/"') && !page.includes("texts/rudrashtadhyayi/2/"));
  assert.ok(page.includes("<h1>रुद्राष्टाध्यायी</h1>") && page.includes('id="sources"'));
  // the Satyanarayan text links its vidhi occasion
  const sn = textPage(ctx, { route: C.routeOf("hi", "text", { textSlug: "satyanarayan-vrat-katha-sanskrit" }), text: C.text("satyanarayan-vrat-katha-sanskrit"), data: C.data, derived: C.derived, occasionsById: C.occasionsById }).toString();
  assert.ok(sn.includes('href="/panditbano/hi/occasions/satyanarayan-puja/"'));
});

test("every text page type renders in hi/en/bho with one h1 and no raw < from data", () => {
  const C = corpus();
  for (const lang of ["hi", "en", "bho"]) {
    const pages = [
      textsIndexPage(ctx, { route: C.routeOf(lang, "texts-index"), texts: C.data.texts, counts: C.derived.counts }).toString(),
      textPage(ctx, { route: C.routeOf(lang, "text", { textSlug: "satyanarayan-vrat-katha-sanskrit" }), text: C.text("satyanarayan-vrat-katha-sanskrit"), data: C.data, derived: C.derived, occasionsById: C.occasionsById }).toString(),
      C.chapter(lang, "satyanarayan-vrat-katha-sanskrit", 1),
    ];
    for (const s of pages) {
      assert.equal(count(s, /<h1[\s>]/g), 1, lang);
      assert.ok(s.includes(`<html lang="${lang}"`));
      assert.ok(!s.includes("undefined") && !s.includes("[object Object]"), `${lang}: no leaked undefined/object`);
    }
    // speaker line and shloka kind label on the Satyanarayan chapter
    assert.ok(pages[2].includes('<p class="speaker" lang="sa">व्यास उवाच</p>'));
  }
});
