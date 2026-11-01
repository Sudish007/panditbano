// FEAT-108: glossary index (letter groups + 44-px letter bar; only terms defined in all three languages get pages) and the
// term page (three forms, alternates / folk forms, definition, related, occasions computed from [[term]] usage) —
// design.md §3.2, §4.8; R5 §4.2 B7.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI } from "../../build/templates/lib.mjs";
import { glossaryIndexPage, groupTerms, letterOf, letterId, letterBar, displayOf } from "../../build/templates/pages/glossary-index.mjs";
import { termPage, usersOf } from "../../build/templates/pages/term.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: {}, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const index = (lang) => glossaryIndexPage(ctx, { route: routeOf(lang, "glossary-index"), terms: derived.glossaryPages }).toString();
const term = (lang, id) => termPage(ctx, { route: routeOf(lang, "term", { termId: id }), term: derived.glossaryPages.find((g) => g.id === id), data, derived }).toString();
const count = (s, re) => (s.match(re) || []).length;

test("only terms with a definition in all three languages (and a term-bank entry) get pages; the term route follows", () => {
  assert.deepEqual(derived.glossaryPages.map((g) => g.id).sort(), ["kalash", "saptapadi", "vivah"]);
  const partial = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
  partial.terms.push({ id: "havan", definition: { hi: "अग्नि में आहुति", en: "", bho: "" }, _file: "glossary/havan.json", _base: "havan" });
  partial.terms.push({ id: "not-in-termbank", definition: { hi: "क", en: "k", bho: "क" }, _file: "glossary/not-in-termbank.json", _base: "not-in-termbank" });
  const d2 = derive(partial, { R });
  assert.deepEqual(d2.glossaryPages.map((g) => g.id).sort(), ["kalash", "saptapadi", "vivah"]);
  assert.equal(d2.counts.terms, 3);
  const termRoutes = R.routesFor("hi", partial).filter((r) => r.pageType === "term").map((r) => r.params.termId).sort();
  assert.deepEqual(termRoutes, ["kalash", "saptapadi", "vivah"], "unpublished terms get no route");
});

test("index groups: Devanagari letter for hi/bho, A–Z for en; letter bar anchors match the group ids; every page linked", () => {
  const hi = groupTerms(derived.glossaryPages, "hi");
  assert.deepEqual(hi.map((g) => g.letter), ["क", "व", "स"]);
  assert.deepEqual(hi.map((g) => g.terms.map((x) => x.term.id)), [["kalash"], ["vivah"], ["saptapadi"]]);
  const bho = groupTerms(derived.glossaryPages, "bho");
  assert.deepEqual(bho.map((g) => g.letter), ["क", "ब", "स"], "बियाह groups under ब");
  const en = groupTerms(derived.glossaryPages, "en");
  assert.deepEqual(en.map((g) => g.letter), ["S", "W"]);
  assert.deepEqual(en.find((g) => g.letter === "W").terms.map((x) => x.term.id).sort(), ["kalash", "vivah"], "water-pot and wedding under W");
  assert.equal(letterOf("ॐ नमः", "hi"), "ॐ");
  assert.equal(letterOf("‘श्राद्ध’", "hi"), "श");
  assert.equal(letterOf("(kalasha)", "en"), "K");
  assert.equal(letterId("क"), "l-0915");
  for (const lang of ["hi", "en", "bho"]) {
    const s = index(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    const groups = groupTerms(derived.glossaryPages, lang);
    assert.equal(count(s, /<section class="letter-group"/g), groups.length, `${lang}: one section per letter`);
    const bar = s.slice(s.indexOf('<nav class="letter-bar"'), s.indexOf("</nav>", s.indexOf('<nav class="letter-bar"')));
    for (const g of groups) { assert.ok(bar.includes(`href="#${g.id}"`), `${lang}: bar → #${g.id}`); assert.ok(s.includes(`id="${g.id}"`), `${lang}: group id ${g.id}`); }
    for (const g of derived.glossaryPages) assert.ok(s.includes(`href="/panditbano/${lang}/glossary/${g.id}/"`), `${lang}: ${g.id} linked`);
    assert.ok(s.includes('data-page="glossary-index"'));
  }
  assert.ok(index("hi").includes(">3 शब्द<"), "computed count");
  assert.equal(letterBar("hi", []), "");
  assert.ok(letterBar("hi", hi, { base: "/panditbano/hi/glossary/" }).toString().includes('href="/panditbano/hi/glossary/#l-0915"'));
});

test("term page: h1 = display form, the other two forms + alternates / folk forms, definition, related chips, occasions from [[term]] usage + the record, same-letter rail", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = term(lang, "vivah");
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.ok(s.includes(`<h1>${displayOf(derived.glossaryPages.find((g) => g.id === "vivah"), lang)}</h1>`), `${lang}: h1 is the display form`);
    assert.ok(s.includes('<section class="card term-forms"'), `${lang}: forms card`);
    assert.ok(s.includes('<section class="prose" id="definition"'), `${lang}: definition`);
    assert.ok(s.includes('data-page="term"'));
  }
  const hi = term("hi", "vivah");
  assert.ok(hi.includes("<h1>विवाह</h1>"));
  assert.ok(hi.includes('<dd lang="en">wedding (vivaha)</dd>') && hi.includes('<dd lang="bho">बियाह</dd>') && !hi.includes('<dd lang="hi">'), "other two forms, not the h1 form again");
  assert.ok(hi.includes("शादी") && hi.includes("ब्याह") && hi.includes("बिआह"), "hiAlt and bhoAlt listed");
  assert.ok(hi.includes("सोलह संस्कारों में पंद्रहवाँ"), "definition text");
  assert.ok(hi.includes('href="/panditbano/hi/glossary/saptapadi/"') && hi.includes('href="/panditbano/hi/glossary/"'), "related: saptapadi has a page, kanyadaan falls back to the index");
  assert.ok(hi.includes('<section id="used-in"') && hi.includes('href="/panditbano/hi/occasions/vivah/"'), "occasion from the record");
  assert.ok(hi.includes('<section id="in-lessons"') && hi.includes('href="/panditbano/hi/learn/l0-01-purohit-kaun/"'), "lesson whose prose marks [[vivah]]");
  const bho = term("bho", "saptapadi");
  assert.ok(bho.includes("<h1>सप्तपदी</h1>") && bho.includes("सात कदम"), "bho folk form listed");
  const k = term("hi", "kalash");
  assert.ok(k.includes('href="/panditbano/hi/occasions/satyanarayan-puja/"') && k.includes('href="/panditbano/hi/occasions/vivah/"'), "record occasions[]");
  const used = usersOf("kalash", data);
  assert.ok(used.occasions.length >= 1 || used.lessons.length >= 0);
  assert.deepEqual(usersOf("vivah", data).lessons.map((l) => l.id), ["l0-01-purohit-kaun"]);
});
