// FEAT-108: static pages (about / sources / privacy) and the reference index + page with the sankalpa worked example —
// design.md §3.2, §4.8, §9.3, §10.10; R4 §6.3; brief §14.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI, t } from "../../build/templates/lib.mjs";
import { staticPage, licenceUrl, FONTS, BUILD_TOOLS, STORAGE_KEYS } from "../../build/templates/pages/static.mjs";
import { referencePage } from "../../build/templates/pages/reference.mjs";
import { referencePagePage, slotted, sankalpaOccasion } from "../../build/templates/pages/reference-page.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: { "reference-page": ["./translit.abc.mjs", "./voice.abc.mjs", "./sankalpa.abc.mjs"] }, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const stat = (lang, slug) => staticPage(ctx, { route: routeOf(lang, "static", { slug }), page: data.statics.find((s) => s.slug === slug), data, derived }).toString();
const refIndex = (lang) => referencePage(ctx, { route: routeOf(lang, "reference"), data }).toString();
const refPage = (lang, slug) => referencePagePage(ctx, { route: routeOf(lang, "reference-page", { slug }), ref: data.reference.find((r) => r.slug === slug), data, derived }).toString();
const count = (s, re) => (s.match(re) || []).length;

test("sources page lists every registry entry with a licence link, the fonts block (three faces, OFL link + OFL.txt) and the build-tools line", () => {
  const entries = [...data.sources.values()];
  assert.ok(entries.length >= 80);
  for (const lang of ["hi", "en", "bho"]) {
    const s = stat(lang, "sources");
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.equal(count(s, /<li data-source="/g), entries.length, `${lang}: one row per registry entry`);
    for (const e of entries) {
      const row = s.slice(s.indexOf(`<li data-source="${e.id}">`), s.indexOf("</li>", s.indexOf(`<li data-source="${e.id}">`)));
      assert.ok(row.includes('rel="license external noopener"'), `${lang}: ${e.id} has a licence link`);
      assert.ok(row.includes(`href="${e.url}"`), `${lang}: ${e.id} title linked to its URL`);
    }
    assert.ok(s.includes('id="fonts"'), `${lang}: fonts block`);
    for (const f of FONTS) assert.ok(s.includes(`<strong lang="en">${f.family}</strong>`) && s.includes(`fonts/${f.dir}/OFL.txt`), `${lang}: ${f.family} with its OFL.txt`);
    assert.ok(s.includes('href="https://openfontlicense.org/"'), `${lang}: openfontlicense.org`);
    assert.ok(s.includes('id="tools"'), `${lang}: tools block`);
    for (const x of BUILD_TOOLS) assert.ok(s.includes(`href="${x.url}"`) && s.includes(`>${x.licence}</span>`), `${lang}: ${x.name} ${x.licence}`);
    assert.ok(s.includes('id="owner-decision"'), `${lang}: the one neutral §14 sentence`);
    assert.ok(s.includes('data-page="static"'));
  }
  const hi = stat("hi", "sources");
  assert.ok(hi.includes("यह साइट सभी पारम्परिक पाठ पूर्ण रूप में देती है"));
  assert.equal(count(hi, /पूर्ण रूप में देती है/g), 1, "the §14 sentence appears once (the fixture prose does not repeat it)");
  assert.equal(licenceUrl({ licence: "CC BY-SA 4.0 (transcription); work itself public domain" }), "https://creativecommons.org/licenses/by-sa/4.0/");
  assert.equal(licenceUrl({ licence: "CC BY-NC-SA 4.0 (encoding)" }), "https://creativecommons.org/licenses/by-nc-sa/4.0/");
  assert.equal(licenceUrl({ licence: "public domain (1886)" }), "https://creativecommons.org/publicdomain/mark/1.0/");
  assert.equal(licenceUrl({ licence: "institutional page", url: "https://x.example/" }), "https://x.example/");
});

test("privacy page carries the GitHub IP sentence with the Privacy Statement link, the Issues sentence and the §9.3 storage-keys table", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = stat(lang, "privacy");
    assert.ok(s.includes('id="github"') && s.includes("GitHub Pages") && s.includes("IP"), `${lang}: GitHub IP sentence`);
    assert.ok(s.includes('href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"'), `${lang}: privacy statement link`);
    assert.ok(s.includes("GitHub Issues"), `${lang}: Issues sentence`);
    assert.equal(count(s, /<tr><td><code>pb-/g), STORAGE_KEYS.length, `${lang}: every storage key listed`);
    for (const k of ["pb-theme", "pb-lang", "pb-translit", "pb-quiz:", "pb-sankalpa", "pb-saved", "pb-check:", "pb-font-pct"]) assert.ok(s.includes(k), `${lang}: ${k}`);
  }
  assert.ok(stat("en", "privacy").includes("GitHub logs visitors&#39; IP addresses for security"), "apostrophe escaped by html``");
  assert.ok(stat("hi", "privacy").includes("GitHub सुरक्षा के लिए आगंतुकों का IP पता"));
});

test("about page: prose with resolved {{count}} placeholders, right rail with the other static + reference pages", () => {
  const s = stat("hi", "about");
  assert.ok(s.includes("<h1>इस साइट के बारे में</h1>"));
  assert.ok(s.includes('<span class="count" data-count="occasions">2</span>') && s.includes('<span class="count" data-count="mantras">3</span>'), "computed counts");
  assert.ok(!s.includes("unresolved"));
  assert.ok(s.includes('href="/panditbano/hi/sources/"') && s.includes('href="/panditbano/hi/privacy/"') && !s.includes('href="/panditbano/hi/about/"><span class="t">'), "rail lists the other static pages");
  assert.ok(s.includes('href="/panditbano/hi/reference/sankalpa/"'), "rail lists the reference pages");
  assert.ok(!s.includes('id="registry"') && !s.includes('id="stored"'), "no generated blocks on about");
});

test("reference index: one card per reference page + the Shubhvela card; reference page: prose-wide with the table in .table-wrap, on-page nav, others rail", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = refIndex(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.equal(count(s, /class="card card-link ref-card"/g), data.reference.length, `${lang}: ref cards`);
    assert.ok(s.includes(`href="/panditbano/${lang}/reference/sankalpa/"`));
    assert.ok(s.includes('class="card shubhvela-card"') && s.includes("sudish007.github.io/shubhvela/"), `${lang}: Shubhvela card`);
    assert.ok(s.includes('data-page="reference"'));
  }
  const s = refPage("hi", "sankalpa");
  assert.equal(count(s, /<h1[\s>]/g), 1);
  assert.ok(s.includes("<h1>संकल्प</h1>"));
  assert.ok(s.includes('<article class="prose-wide ref-prose" id="content"') && s.includes('<div class="table-wrap"><table>'), "table inside .table-wrap");
  assert.ok(s.includes('<div class="layout has-right">') && s.includes('data-page="reference-page"'));
  assert.ok(s.includes('href="/panditbano/hi/reference/">संदर्भ</a>'), "breadcrumb leads back to the index");
});

test("sankalpa worked example: two ≤ 60-char fields, याद रखें / भूल जाएँ, slots filled by textContent; the sankalp occasion's placeholder lines when present", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = refPage(lang, "sankalpa");
    assert.ok(s.includes('data-sankalpa-form'), `${lang}: form hook`);
    assert.equal(count(s, /<input type="text" name="(gotra|name)" data-sankalpa-input="(gotra|name)" maxlength="60"/g), 2, `${lang}: two fields`);
    assert.ok(s.includes("data-sankalpa-remember") && s.includes("data-sankalpa-forget") && s.includes("data-sankalpa-status"), `${lang}: buttons + status`);
    assert.ok(s.includes('<span class="slot" data-sankalpa="gotra"') && s.includes('<span class="slot" data-sankalpa="name"'), `${lang}: slots in the example line`);
    assert.ok(s.includes(t(lang, "storage.note")), `${lang}: storage note`);
    assert.ok(s.includes('id="reading-settings"'), `${lang}: reading settings for the sankalpa lines`);
  }
  assert.equal(sankalpaOccasion(data), null, "fixture has no sankalp occasion");
  // with a sankalp occasion: its panditSays.sa placeholders become slots, one pada per line, unknown keys keep "[key]"
  const occ = { id: "sankalp", slug: "sankalp", group: "foundations", title: { hi: "संकल्प", en: "Sankalpa", bho: "संकल्प" }, steps: [{ n: 1, action: { hi: "संकल्प बोलें", en: "Say the sankalpa", bho: "संकल्प बोलीं" }, panditSays: { sa: "अद्य {tithi} तिथौ {gotra}गोत्रः {name}शर्माहं । करिष्ये ॥" } }] };
  const d2 = { ...data, occasions: [...data.occasions, occ] };
  assert.equal(sankalpaOccasion(d2), occ);
  const s2 = referencePagePage(ctx, { route: routeOf("hi", "reference-page", { slug: "sankalpa" }), ref: data.reference.find((r) => r.slug === "sankalpa"), data: d2, derived }).toString();
  assert.ok(s2.includes('<div class="verse sankalpa-line" data-step="1">'), "occasion line rendered");
  assert.ok(s2.includes('data-sankalpa="tithi" data-empty="[तिथि]">[तिथि]</span>') && s2.includes('data-sankalpa="gotra"') && s2.includes('data-sankalpa="name"'), "slots with labels");
  assert.equal(count(s2, /<span class="pada">/g) >= 2, true, "one pada per line (§27 item 1)");
  assert.ok(s2.includes('href="/panditbano/hi/occasions/sankalp/"'), "link to the occasion");
  const r = slotted("x {zzz} y", "hi").toString();
  assert.ok(r.includes('data-sankalpa="zzz" data-empty="[zzz]">[zzz]</span>'), "unknown key → [key]");
  assert.ok(slotted("<b>{gotra}", "hi").toString().startsWith("&lt;b&gt;"), "escaped");
});
