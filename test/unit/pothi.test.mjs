// FEAT-106: pothi route (design.md §15; mocks decision 9) — no chrome, one card per step of every part, toolbar, courtesy line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI, t } from "../../build/templates/lib.mjs";
import { pothiPage } from "../../build/templates/pages/pothi.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: { pothi: ["./pothi.abc.mjs"] }, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const occasionsById = new Map(data.occasions.map((o) => [o.id, o]));
const routeOf = (lang, slug) => R.routesFor(lang, data).find((r) => r.pageType === "pothi" && r.params.slug === slug);
const page = (lang, slug) => pothiPage(ctx, { route: routeOf(lang, slug), occ: occasionsById.get(slug), data, derived, occasionsById }).toString();
const count = (s, re) => (s.match(re) || []).length;

test("no header/footer/nav markup, no rails, no verse tools; body.pothi; data-page pothi; modules = pothi", () => {
  const s = page("hi", "vivah");
  assert.ok(!s.includes("<header") && !s.includes("<footer") && !s.includes('class="site-head"') && !s.includes('class="nav"'));
  assert.ok(!s.includes('class="rail') && !s.includes("verse-tools") && !s.includes('class="chip'));
  assert.ok(s.includes('<body class="pothi">') && s.includes('data-page="pothi"'));
  assert.ok(s.includes('<script type="application/json" id="pb-modules">["./pothi.abc.mjs"]</script>'));
  assert.ok(s.includes("<!--pb-offline-urls:vivah-->"));
  assert.equal(count(s, /<h1[\s>]/g), 1);
  assert.ok(s.includes("<h1>विवाह (बियाह) — पोथी</h1>"));
  assert.ok(s.includes("<title>विवाह (बियाह) — पोथी — पंडित बनो</title>"));
});

test("toolbar: back link to the occasion, A−/A+ stepper with a live <output> 100%, Print, Save offline (hidden until offline.mjs)", () => {
  const s = page("hi", "vivah");
  const bar = s.slice(s.indexOf('<div class="container pothi-bar"'), s.indexOf("<main"));
  assert.ok(bar.includes('role="toolbar"'));
  assert.ok(bar.includes('href="/panditbano/hi/occasions/vivah/">← अवसर पृष्ठ पर वापस</a>'));
  assert.ok(bar.includes('<button type="button" data-size="-" aria-label="अक्षर छोटे">A−</button><output data-size-out aria-live="polite">100%</output><button type="button" data-size="+" aria-label="अक्षर बड़े">A+</button>'));
  assert.ok(bar.includes("data-print") && bar.includes(">छापें</button>"));
  assert.ok(/data-save-offline="vivah"[^>]*hidden>/.test(bar));
});

test("one .pothi-step card per step of every part, in order, with number + locator, action, mantra, says; pothi mantra ids unique", () => {
  const s = page("hi", "vivah");
  const cards = [...s.matchAll(/<section class="pothi-step" id="p(\d+)">([\s\S]*?)<\/section>/g)];
  assert.deepEqual(cards.map((m) => m[1]), ["1", "2", "3", "4", "5", "6"]);
  assert.ok(cards[1][2].includes('<p class="no">चरण 2 / 6 · पूर्वांग</p>'), "step without a mantra: number + part only");
  assert.ok(cards[2][2].includes('<p class="no">चरण 3 / 6 · पूर्वांग · VS 36.3</p>'));
  assert.ok(cards[3][2].includes('<p class="no">चरण 4 / 6 · मुख्य विधि · PGS 1.8.1</p>'), "locator from the step's mantra");
  assert.ok(cards[0][2].includes("<h2>पवित्रीकरण</h2>") && cards[0][2].includes('<p class="act">'));
  assert.ok(cards[0][2].includes('<p class="mantra" lang="sa" id="pm-1-pad-apavitrah-pavitro-va"'));
  assert.ok(cards[2][2].includes('id="pm-3-vs-36-3"') && cards[2][2].includes('<span class="sr" lang="sa">'), "svara-marked mantra keeps the plain sr text");
  for (const [, , body] of cards) assert.ok(body.includes('<p class="label">पंडित जी कहते हैं</p>'));
  assert.ok(cards[4][2].includes('पाठ: <a href="/panditbano/hi/texts/rudrashtadhyayi/1/">रुद्राष्टाध्यायी — अध्याय 1</a>'), "textRefs in the pothi");
  assert.ok(!s.includes('id="arth-') && !s.includes('id="pada-') && !s.includes('class="src"'), "no meanings, word split or source lines");
  const ids = [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "all ids unique");
  const sp = page("hi", "satyanarayan-puja");
  assert.equal(count(sp, /class="pothi-step"/g), 2);
  assert.ok(sp.includes('<p class="no">चरण 2 / 2</p>'), "no part, no locator → number alone");
});

test("print courtesy line present (owner-droppable UI string) in every language; title block states parts and the only-actions line", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = page(lang, "vivah");
    assert.ok(s.includes(`<p class="meta pothi-foot print-only">${t(lang, "foot.print_courtesy")}</p>`), lang);
    assert.ok(s.includes(t(lang, "pothi.only")), lang);
    assert.ok(s.includes(`<html lang="${lang}"`));
  }
  const en = page("en", "vivah");
  assert.ok(en.includes("Preliminary rites (purvanga) · Main rites · Closing rites (uttaranga) · 6 steps · "));
});
