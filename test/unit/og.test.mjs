// FEAT-109: OG images (design §11.7 as amended by design-review MEDIUM 2 + MEDIUM 3) — hi/bho/en PNGs exist for the fixture
// Vivah page at 1200×630, mantra pages share the per-type default, build.json carries the og numbers under budget, the title
// cap and the cache key behave. Pixel-level Devanagari shaping is proven by the step reading the PNGs (acceptance criterion 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { capTitle, ogKey, ogPlan, OG_BYTES_BUDGET, OG_SECONDS_BUDGET, TITLE_MAX, renderOg } from "../../build/og.mjs";
import { fixtureBuild, pngSize } from "./_fixture-build.mjs";

test("capTitle keeps ≤ 70 characters and appends an ellipsis when cut (code points, not UTF-16 units)", () => {
  assert.equal(capTitle("  विवाह   (बियाह) "), "विवाह (बियाह)");
  const long = "क".repeat(80);
  const cut = capTitle(long);
  assert.equal([...cut].length, TITLE_MAX);
  assert.ok(cut.endsWith("…"));
  assert.equal(capTitle("x".repeat(70)), "x".repeat(70));
});

test("ogKey changes with title, language and site name; ogPlan gives own images to MEDIUM 3 types and defaults to the rest", () => {
  const k = (t, lang = "hi", site = "पंडित बनो") => ogKey({ title: t, lang, site });
  assert.notEqual(k("a"), k("b"));
  assert.notEqual(k("a", "hi"), k("a", "en"));
  assert.equal(k("a"), k("a"));
  const ctx = { ui: { hi: { site: { name: "पंडित बनो", tagline: "टैगलाइन" }, nav: { texts: "मंत्र" }, pothi: { label: "पोथी" } } } };
  const out = new Map([["hi/index.html", "<title>x — पंडित बनो</title>"], ["hi/occasions/vivah/index.html", "<title>विवाह — पंडित बनो</title>"], ["hi/mantras/vs-36-3/index.html", "<title>गायत्री — पंडित बनो</title>"], ["hi/mantras/vs-1-1/index.html", "<title>इषे त्वा — पंडित बनो</title>"]]);
  const pages = [
    { lang: "hi", file: "hi/index.html", pageType: "home", route: { og: "own", path: "" } },
    { lang: "hi", file: "hi/occasions/vivah/index.html", pageType: "occasion", route: { og: "own", path: "occasions/vivah/" } },
    { lang: "hi", file: "hi/mantras/vs-36-3/index.html", pageType: "mantra", route: { og: "type-default", path: "mantras/vs-36-3/" } },
    { lang: "hi", file: "hi/mantras/vs-1-1/index.html", pageType: "mantra", route: { og: "type-default", path: "mantras/vs-1-1/" } },
    { lang: null, file: "404.html", pageType: "not-found", route: null },
  ];
  const plan = ogPlan(pages, { ctx, out });
  assert.deepEqual([...plan.files.keys()].sort(), ["og/hi/default-mantra.png", "og/hi/home.png", "og/hi/occasions-vivah.png"]);
  assert.equal(plan.files.get("og/hi/home.png").title, "टैगलाइन", "home shows the tagline");
  assert.equal(plan.files.get("og/hi/occasions-vivah.png").title, "विवाह");
  assert.equal(plan.files.get("og/hi/default-mantra.png").title, "मंत्र");
  assert.equal(plan.forPage.get("hi/mantras/vs-1-1/index.html"), "og/hi/default-mantra.png");
  assert.ok(!plan.forPage.has("404.html"));
});

test("renderOg produces a 1200×630 PNG for Devanagari and Latin titles (sharp text layers + resvg geometry)", async () => {
  for (const spec of [{ title: "श्राद्ध — क्ष त्र ज्ञ द्ध ह्म", site: "पंडित बनो", lang: "hi" }, { title: "Wedding (vivah) — the complete North Indian wedding, from tilak to chaturthi karma", site: "Pandit Bano", lang: "en" }]) {
    const png = await renderOg(spec);
    assert.deepEqual(pngSize(png), { width: 1200, height: 630 });
    assert.ok(png.length > 3000 && png.length < 80000, `${spec.lang}: ${png.length} bytes`);
  }
});

test("fixture build: vivah OG PNGs in hi/bho/en at 1200×630; mantra pages use the type default; build.json og numbers under budget", async () => {
  const b = await fixtureBuild();
  for (const l of ["hi", "bho", "en"]) {
    const f = `og/${l}/occasions-vivah.png`;
    assert.ok(b.has(f), f);
    assert.deepEqual(pngSize(b.bytes(f)), { width: 1200, height: 630 });
    assert.ok(b.read(`${l}/occasions/vivah/index.html`).includes(`/panditbano/${f}">`));
  }
  assert.ok(b.has("og/hi/default-mantra.png"));
  assert.ok(b.read("hi/mantras/vs-36-3/index.html").includes('property="og:image" content="https://sudish007.github.io/panditbano/og/hi/default-mantra.png"'));
  assert.ok(!b.has("og/hi/mantras-vs-36-3.png"), "no own image for a mantra page (MEDIUM 3)");
  assert.ok(b.has("og/hi/default-term.png") && b.has("og/hi/default-pothi.png") && b.has("og/manifest.json"));
  const og = b.report.og;
  assert.ok(og.images > 0 && og.own > 0 && og.defaults > 0 && og.failed === 0, JSON.stringify(og));
  assert.equal(og.fontMatched, true, `Pango used the bundled TTFs (MEDIUM 2): ${JSON.stringify(og.fontProbe)}`);
  assert.ok(og.bytes <= OG_BYTES_BUDGET && og.seconds <= OG_SECONDS_BUDGET);
  assert.equal(b.report.budgets.og.bytesCap, OG_BYTES_BUDGET);
  assert.ok(!b.report.budgets.violations.some((v) => v.startsWith("og")), "no og budget violation");
  assert.equal(typeof b.report.text.lli, "number");
  assert.equal(typeof b.report.text.fallbackSvara, "number");
});
