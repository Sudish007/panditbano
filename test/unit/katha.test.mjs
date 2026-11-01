// FEAT-107: kathas index, katha landing (vidhi embed) and the adhyaya page ({{verse:}} → <details class="mula">) —
// design.md §3.2, §4.6, §11.3, §13.2; plan §2.5; decisions.md §2.3.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI } from "../../build/templates/lib.mjs";
import { kathasIndexPage, verseRefCount } from "../../build/templates/pages/kathas-index.mjs";
import { kathaPage, readingMinutes } from "../../build/templates/pages/katha.mjs";
import { kathaAdhyayaPage, mulaPanel, retelling } from "../../build/templates/pages/katha-adhyaya.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const MODULES = { katha: ["./translit.abc.mjs", "./voice.abc.mjs", "./checklist.abc.mjs", "./tracker.abc.mjs"], "katha-adhyaya": ["./translit.abc.mjs", "./voice.abc.mjs"] };
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: MODULES, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const occasionsById = new Map(data.occasions.map((o) => [o.id, o]));
const katha = data.kathas.find((k) => k.id === "satyanarayan-vrat-katha");
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const landing = (lang) => kathaPage(ctx, { route: routeOf(lang, "katha", { slug: katha.slug }), katha, data, derived, occasionsById }).toString();
const adhyaya = (lang, n = 1) => kathaAdhyayaPage(ctx, { route: routeOf(lang, "katha-adhyaya", { slug: katha.slug, n }), katha, adhyaya: katha.adhyayas.find((a) => a.n === n), data, derived, occasionsById }).toString();
const index = (lang) => kathasIndexPage(ctx, { route: routeOf(lang, "kathas-index"), kathas: data.kathas }).toString();
const count = (s, re) => (s.match(re) || []).length;

test("katha landing: caveat present (.caveat from katha.json), one h1, adhyaya nav with one chip per adhyaya + विधि, rails", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = landing(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.equal(count(s, /<p class="caveat" id="caveat">/g), 1, `${lang}: caveat`);
    assert.ok(s.includes(katha.caveat[lang].slice(0, 30)), `${lang}: caveat text`);
    const nav = s.slice(s.indexOf('<nav class="katha-nav"'), s.indexOf("</nav>", s.indexOf('<nav class="katha-nav"')));
    assert.equal(count(nav, /<a /g), katha.adhyayas.length + 1, `${lang}: one chip per adhyaya plus the vidhi chip`);
    assert.ok(nav.includes('href="/panditbano/' + lang + '/kathas/satyanarayan-vrat-katha/1/"') && nav.includes('href="#vidhi"'));
    assert.ok(!nav.includes("aria-current"), "no adhyaya is current on the landing");
    assert.ok(s.includes('<div class="layout has-both">') && s.includes('id="adhyayas-rail"') && s.includes('id="tracker"'), `${lang}: left rail = adhyaya list + step tracker`);
    assert.ok(s.includes('data-page="katha"'));
  }
  const hi = landing("hi");
  assert.ok(hi.includes("<h1>सत्यनारायण व्रत कथा</h1>"));
  assert.ok(hi.includes(">1 अध्याय<") && hi.includes(">2 श्लोक<"), "computed adhyaya / verse counts");
  assert.ok(hi.includes("रेवाखण्ड, अध्याय २३३–२३७"), "Puranic locator");
});

test("vidhi occasion embedded ONCE with the FEAT-106 components: #vidhi, when + roles, layer legend, step cards, samagri rail, offline placeholder", () => {
  const s = landing("hi");
  assert.equal(count(s, /<section id="vidhi"/g), 1);
  assert.equal(count(s, /data-vidhi="satyanarayan-puja"/g), 1);
  assert.equal(count(s, /<article class="step[^"]*" id="step-1">/g), 1);
  assert.equal(count(s, /<article class="step[^"]*" id="step-2">/g), 1);
  assert.equal(count(s, /<section class="card when" id="when"/g), 1);
  assert.equal(count(s, /<section class="card" id="roles"/g), 1);
  assert.equal(count(s, /class="chips layers"/g), 1);
  assert.equal(count(s, /id="samagri" data-checklist="satyanarayan-puja"/g), 1, "samagri checklist in the right rail");
  assert.ok(s.includes("<!--pb-offline-urls:satyanarayan-puja-->"), "offline manifest placeholder for the vidhi occasion");
  assert.ok(s.includes('data-save-offline="satyanarayan-puja"'));
  assert.ok(s.includes('href="/panditbano/hi/occasions/satyanarayan-puja/"') && s.includes('href="/panditbano/hi/occasions/satyanarayan-puja/pothi/"'));
  assert.ok(s.includes("पूजा विधि — "), "vidhi heading names the occasion");
  // the vidhi's steps carry verses → reading settings in the rail; sources include the Puranic source and the occasion's
  assert.ok(s.includes('id="reading-settings"'));
  assert.ok(s.includes('data-source="ws-skanda-reva-index"'));
  assert.ok(s.includes('<section id="sources"'));
  // the Sanskrit text card links the text and its published chapter
  assert.ok(s.includes('href="/panditbano/hi/texts/satyanarayan-vrat-katha-sanskrit/"') && s.includes('href="/panditbano/hi/texts/satyanarayan-vrat-katha-sanskrit/1/"'));
});

test("adhyaya page: {{verse:}} resolves to the fixture verse block inside <details class=\"mula\">; dropcap; term link; one h1; nav marks the adhyaya", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = adhyaya(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.equal(count(s, /<details class="mula" id="mula-satyanarayan-vrat-katha-sanskrit-1-(1|2)" data-verse=/g), 2, `${lang}: two mula panels`);
    assert.ok(s.includes('<p class="mantra" lang="sa" id="m-satyanarayan-vrat-katha-sanskrit-1-1"'), `${lang}: mantra paragraph with lang="sa"`);
    assert.ok(s.includes("एकदा नैमिषारण्ये ऋषयः शौनकादयः") && s.includes("व्रतेन तपसा किंवा"), "fixture verse text");
    assert.ok(!s.includes("unresolved"), `${lang}: no unresolved placeholder`);
    assert.ok(s.includes('<article class="prose dropcap retelling" id="retelling"') && s.includes('<p class="dropcap">'), `${lang}: drop cap on the first paragraph`);
    assert.equal(count(s, /<p class="dropcap">/g), 1);
    assert.ok(s.includes('class="term"') && s.includes('/glossary/kalash/'), `${lang}: [[kalash]] → glossary link`);
    const nav = s.slice(s.indexOf('<nav class="katha-nav"'), s.indexOf("</nav>", s.indexOf('<nav class="katha-nav"')));
    assert.ok(nav.includes(`href="/panditbano/${lang}/kathas/satyanarayan-vrat-katha/1/" aria-current="page"`));
    assert.ok(nav.includes(`href="/panditbano/${lang}/kathas/satyanarayan-vrat-katha/#vidhi"`));
    assert.ok(s.includes('data-page="katha-adhyaya"'));
    assert.ok(s.includes('id="reading-settings"'), "verses on the page → reading settings");
    assert.ok(!s.includes('<link rel="prev"') && !s.includes('<link rel="next"'), "single adhyaya → no neighbours");
    assert.ok(s.includes('<section id="sources"') && s.includes('data-source="ws-skanda-reva-index"') && s.includes('data-source="ws-skanda-reva-233"'));
  }
  const hi = adhyaya("hi");
  assert.ok(hi.includes("<h1>पहला अध्याय — नारद का प्रश्न</h1>"));
  assert.ok(hi.includes("॥\u00a0१\u00a0॥") && hi.includes("अर्थ: एक बार नैमिषारण्य में"), "verse marker + meaning inside the panel");
  assert.ok(hi.includes('href="/panditbano/hi/texts/satyanarayan-vrat-katha-sanskrit/1/#v1"'), "panel links the chapter verse anchor");
  const en = adhyaya("en");
  assert.ok(en.includes("॥\u00a01\u00a0॥"), "en marker uses Latin digits");
  // the panel resolver returns null for an unknown id and the retelling throws on it
  assert.equal(mulaPanel("nope-9-9", { ctx, lang: "hi", derived, sources: data.sources }), null);
  assert.throws(() => retelling({ body: "x\n{{verse:nope-9-9}}\n" }, { ctx, lang: "hi", derived, sources: data.sources }), /unresolved/);
});

test("kathas index: one card per katha with computed adhyaya / verse counts; reading time ≥ 1", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = index(lang);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    assert.equal(count(s, /class="card card-link katha-card"/g), data.kathas.length);
    assert.ok(s.includes(`href="/panditbano/${lang}/kathas/satyanarayan-vrat-katha/"`));
  }
  assert.ok(index("hi").includes(">1 अध्याय · 2 श्लोक<"));
  assert.equal(verseRefCount(katha), 2);
  assert.equal(readingMinutes(""), 1);
  assert.equal(readingMinutes(Array(400).fill("शब्द").join(" ")), 2);
});
