// FEAT-106: occasion page (design.md §4.3, §9.1, §13.2, §16.1, §27), occasions index, samagri / when / step components and
// the offline manifest (design-review MEDIUM 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI, t } from "../../build/templates/lib.mjs";
import { occasionPage, occasionPartPage, occasionEnv, sutraBlock, PGS_SUTRA_ID, regionLabel } from "../../build/templates/pages/occasion.mjs";
import { occasionsIndexPage } from "../../build/templates/pages/occasions-index.mjs";
import { splitAction, stepTitle, textRefs } from "../../build/templates/components/step.mjs";
import { samagriCard } from "../../build/templates/components/samagri.mjs";
import { whenCard, shubhvelaLinks } from "../../build/templates/components/when.mjs";
import { embedOfflineManifests, offlineUrls, fileOf } from "../../build/lib/offline.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const MODULES = { mantra: ["./translit.abc.mjs", "./voice.abc.mjs"], occasion: ["./translit.abc.mjs", "./voice.abc.mjs", "./checklist.abc.mjs", "./tracker.abc.mjs"], "occasion-part": ["./translit.abc.mjs", "./voice.abc.mjs", "./checklist.abc.mjs", "./tracker.abc.mjs"], pothi: ["./pothi.abc.mjs"] };
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: MODULES, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const occasionsById = new Map(data.occasions.map((o) => [o.id, o]));
const occ = (id) => occasionsById.get(id);
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const base = (lang, id) => occasionPage(ctx, { route: routeOf(lang, "occasion", { slug: id }), occ: occ(id), data, derived, occasionsById }).toString();
const part = (lang, id, p) => occasionPartPage(ctx, { route: routeOf(lang, "occasion-part", { slug: id, part: p }), occ: occ(id), part: occ(id).parts.find((x) => x.id === p), data, derived, occasionsById }).toString();
const index = (lang) => occasionsIndexPage(ctx, { route: routeOf(lang, "occasions-index"), occasions: data.occasions, counts: derived.counts }).toString();
const count = (s, re) => (s.match(re) || []).length;
const order = (s, ids) => ids.map((id) => s.indexOf(`id="${id}"`));

test("section order #intro #when #roles #vidhi #variants #faq #sources; one h1; .sections chips in that order", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = base(lang, "vivah");
    const pos = order(s, ["intro", "when", "roles", "vidhi", "variants", "faq", "sources"]);
    assert.ok(pos.every((p) => p > 0), `every section present (${lang}): ${pos}`);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, `section order ${lang}`);
    assert.equal(count(s, /<h1[\s>]/g), 1);
    const nav = s.slice(s.indexOf('<nav class="sections"'), s.indexOf("</nav>", s.indexOf('<nav class="sections"')));
    assert.deepEqual([...nav.matchAll(/href="#([a-z]+)"/g)].map((m) => m[1]), ["intro", "when", "roles", "samagri", "vidhi", "variants", "faq", "sources"]);
    assert.ok(s.includes('<div class="layout has-both">') && s.includes('class="rail rail-left"') && s.includes('class="rail rail-right"'));
    assert.ok(s.includes(`data-page="occasion"`));
  }
  // satyanarayan-puja: no variants / faq → neither section nor chip
  const sp = base("hi", "satyanarayan-puja");
  assert.ok(!sp.includes('id="variants"') && !sp.includes('id="faq"') && !sp.includes('href="#variants"'));
  assert.ok(sp.includes('id="vidhi"') && sp.includes('id="step-1"') && sp.includes('id="step-2"'), "single-part occasion renders its steps on the base route");
});

test("breadcrumbs: ancestors only — the page's own name appears once, in the h1 (UI-15)", () => {
  const s = base("hi", "vivah");
  const crumbs = s.slice(s.indexOf('<ol class="crumbs">'), s.indexOf("</ol>", s.indexOf('<ol class="crumbs">')));
  assert.ok(!crumbs.includes("विवाह (बियाह)"));
  assert.equal(count(crumbs, /<li>/g), 2);
  const p = part("hi", "vivah", "mukhya");
  const pc = p.slice(p.indexOf('<ol class="crumbs">'), p.indexOf("</ol>", p.indexOf('<ol class="crumbs">')));
  assert.ok(pc.includes('href="/panditbano/hi/occasions/vivah/">विवाह (बियाह)</a>'));
  assert.ok(p.includes("<h1>विवाह (बियाह) — मुख्य विधि</h1>"));
  assert.ok(!pc.includes("मुख्य विधि"));
});

test("multi-part: base route = overview + parts list with step counts; part routes = steps with rel prev/next; same rails", () => {
  const s = base("hi", "vivah");
  assert.ok(s.includes('class="part-cards grid'));
  assert.equal(count(s, /class="card card-link part-card"/g), 3);
  assert.ok(s.includes(">3 चरण<") && s.includes(">1 चरण<") && s.includes(">2 चरण<"));
  assert.ok(!s.includes('class="step two"') && !s.includes('class="step"'), "no step cards on the multi-part base route");
  const p1 = part("hi", "vivah", "purvang"), p2 = part("hi", "vivah", "mukhya"), p3 = part("hi", "vivah", "uttarang");
  assert.ok(!p1.includes('rel="prev"') && p1.includes('<link rel="next" href="/panditbano/hi/occasions/vivah/mukhya/">') && p1.includes('rel="next" href="/panditbano/hi/occasions/vivah/mukhya/"'));
  assert.ok(p2.includes('<link rel="prev" href="/panditbano/hi/occasions/vivah/purvang/">') && p2.includes('<link rel="next" href="/panditbano/hi/occasions/vivah/uttarang/">'));
  assert.ok(p3.includes('<link rel="prev" href="/panditbano/hi/occasions/vivah/mukhya/">') && !p3.includes('rel="next"'));
  assert.deepEqual([...p1.matchAll(/<article class="step[^"]*" id="step-(\d+)"/g)].map((m) => m[1]), ["1", "2", "3"]);
  assert.deepEqual([...p2.matchAll(/<article class="step[^"]*" id="step-(\d+)"/g)].map((m) => m[1]), ["4"]);
  for (const s2 of [s, p1, p2, p3]) {
    assert.ok(s2.includes('id="samagri" data-checklist="vivah"'), "samagri rail on every route");
    assert.ok(s2.includes('id="tracker"') && count(s2, /data-step="\d+"/g) === 6, "tracker lists all six steps");
    assert.ok(s2.includes(`data-page="${s2 === s ? "occasion" : "occasion-part"}"`));
  }
  // the tracker marks the current part and links in-page for steps on this page, to the part route otherwise
  assert.ok(p2.includes('href="/panditbano/hi/occasions/vivah/mukhya/" aria-current="page"'));
  assert.ok(p2.includes('<a href="#step-4" data-step="4">') && p2.includes('<a href="/panditbano/hi/occasions/vivah/purvang/#step-1" data-step="1">'));
  assert.ok(s.includes('<a href="/panditbano/hi/occasions/vivah/mukhya/#step-4" data-step="4">'));
});

test("every step: number chip, h3 title, one layer chip; verses via verseFull with unique ids; says callout; note; important → haldi", () => {
  const p = part("hi", "vivah", "purvang");
  const steps = [...p.matchAll(/<article class="(step[^"]*)" id="step-(\d+)">([\s\S]*?)<\/article>/g)];
  assert.equal(steps.length, 3);
  for (const [, cls, n, body] of steps) {
    assert.ok(body.includes(`<span class="step-no">${n}</span>`), `number chip ${n}`);
    assert.equal(count(body, /<h3>/g), 1, `one h3 in step ${n}`);
    assert.equal(count(body, /class="chip chip-(vedic|paddhati|lok)"/g), 1, `one layer chip in step ${n}`);
    assert.ok(body.includes('<p class="label">पंडित जी कहते हैं</p>'), `says in step ${n}`);
    if (body.includes('class="verse"')) assert.ok(cls.includes("two"), `step ${n} with a verse is .two`);
  }
  assert.ok(p.includes('<p class="mantra" lang="sa" id="m-s1-pad-apavitrah-pavitro-va"') && p.includes('id="m-s3-vs-36-3"'), "verse ids carry the step number");
  assert.ok(p.includes('class="chip chip-paddhati">पद्धति<') && p.includes('class="chip chip-vedic">वैदिक<'));
  assert.ok(p.includes('<p class="sa" lang="sa">ॐ अपवित्रः पवित्रो वा सर्वावस्थां गतोऽपि वा</p>'));
  assert.ok(p.includes("<strong>टिप्पणी:</strong>") && p.includes('href="/panditbano/hi/reference/sankalpa/"'), "note with a resolved internal link");
  assert.ok(p.includes('<a href="#sg-vivah-kalash">कलश (तांबे या मिट्टी का)</a>'), "step samagri link");
  const m = part("hi", "vivah", "mukhya");
  assert.ok(m.includes('<article class="step two important" id="step-4">') && m.includes('class="chip chip-haldi">मुख्य चरण<'));
  // vinyog on the occasion page never lists the occasion itself
  assert.ok(!/vinyog[\s\S]*?occasions\/vivah\//.test(m.slice(m.indexOf('id="vinyog-'), m.indexOf("</section>", m.indexOf('id="vinyog-')))) || !m.includes('id="vinyog-'));
  // lok steps carry no verse and the chip reads लोकाचार
  const u = part("hi", "vivah", "uttarang");
  assert.ok(u.includes('class="chip chip-lok">लोकाचार<'));
});

test("textRefs render as पाठ: <text> — अध्याय n links that resolve to a route; an unknown text is a build error", () => {
  const u = part("hi", "vivah", "uttarang");
  const m = /<p class="text-ref">पाठ: <a href="([^"]+)">रुद्राष्टाध्यायी — अध्याय 1<\/a><\/p>/.exec(u);
  assert.ok(m, "text-ref rendered");
  const hrefs = new Set(R.routesFor("hi", data).map((r) => r.href));
  assert.ok(hrefs.has(m[1]), `${m[1]} is a real route`);
  assert.equal(m[1], "/panditbano/hi/texts/rudrashtadhyayi/1/");
  const en = part("en", "vivah", "uttarang");
  assert.ok(en.includes("Recite: ") && en.includes("Rudrashtadhyayi — adhyaya 1</a>"));
  const env = occasionEnv(ctx, "hi", { occ: occ("vivah"), data, derived, occasionsById });
  assert.throws(() => textRefs(ctx, "hi", { n: 9, textRefs: [{ text: "nope", chapter: 1 }] }, { textsById: env.textsById, mdCtx: env.mdCtx }).toString(), /not in the corpus/);
  // an unpublished chapter falls back to the text page
  assert.equal(textRefs(ctx, "hi", { n: 9, textRefs: [{ text: "rudrashtadhyayi", chapter: 7 }] }, { textsById: env.textsById, mdCtx: env.mdCtx }).toString().includes('href="/panditbano/hi/texts/rudrashtadhyayi/"'), true);
});

test("PGS I.8.11–13 .sutra block exactly once per page, inside #variants, with the Wikisource cite", () => {
  const s = base("hi", "vivah");
  assert.equal(count(s, /class="sutra"/g), 1);
  assert.equal(count(s, /data-sutra="pgs-1-8-11-13"/g), 1);
  const v = s.slice(s.indexOf('id="variants"'), s.indexOf('id="faq"'));
  assert.ok(v.includes('class="sutra"') && v.includes('id="sutra-pgs"') && v.includes("ग्रामवचनं च कुर्युः"));
  assert.ok(v.includes("पारस्कर गृह्यसूत्र 1.8.11–13") && v.includes('rel="external noopener"'));
  assert.ok(v.includes("<h3 class=\"m0\">मिथिला</h3>"), "region label from the UI table");
  assert.equal(regionLabel("en", "mithila"), "Mithila");
  assert.equal(regionLabel("en", "somewhere-else"), "somewhere-else");
  for (const lang of ["en", "bho"]) assert.equal(count(base(lang, "vivah"), /class="sutra"/g), 1);
  // with a corpus record the block uses it (and still appears once)
  const env = occasionEnv(ctx, "hi", { occ: occ("vivah"), data, derived, occasionsById });
  const fake = { ...derived.mantraById.get("pgs-1-8-1"), id: PGS_SUTRA_ID, locator: "PGS 1.8.11–13" };
  const withRec = sutraBlock({ ...env, mantraById: new Map([[PGS_SUTRA_ID, fake]]) }).toString();
  assert.ok(withRec.includes('id="sutra-pgs"') && withRec.includes("PGS 1.8.11–13") && !withRec.includes("verse-tools"));
  const sp = base("hi", "satyanarayan-puja");
  assert.equal(count(sp, /class="sutra"/g), 0, "no variants → no sutra");
});

test("sensitive[] → one caveat per kind from the UI strings (G15 at render); an unknown kind throws", () => {
  const o = { ...occ("vivah"), sensitive: ["grief", "pregnancy", "health"] };
  const s = occasionPage(ctx, { route: routeOf("hi", "occasion", { slug: "vivah" }), occ: o, data, derived, occasionsById }).toString();
  assert.ok(s.includes(`<p class="caveat" data-sensitive="grief">${t("hi", "honesty.grief_note")}</p>`));
  assert.equal(count(s, /data-sensitive="health"/g), 1, "pregnancy and health share one note");
  assert.ok(!base("hi", "vivah").includes('class="caveat"'));
  const bad = { ...occ("vivah"), sensitive: ["money"] };
  assert.throws(() => occasionPage(ctx, { route: routeOf("hi", "occasion", { slug: "vivah" }), occ: bad, data, derived, occasionsById }).toString(), /honesty\.money_note missing/);
});

test("FAQ as <details class=faq>; #sources lists the occasion's registry sources + the page's mantra sources as attribution lines", () => {
  const s = base("hi", "vivah");
  assert.equal(count(s, /<details class="faq">/g), 1);
  assert.ok(s.includes("<summary>क्या सात फेरे और सप्तपदी एक ही हैं?</summary>"));
  const src = s.slice(s.indexOf('<section id="sources"'), s.indexOf("</section>", s.indexOf('<section id="sources"')));
  for (const ref of ["ws-pgs", "ia-sbe29", "ia-vivah-mvf", "research-r1"]) assert.ok(src.includes(`data-source="${ref}"`), ref);
  const p = part("hi", "vivah", "purvang");
  const ps = p.slice(p.indexOf('<section id="sources"'), p.indexOf("</section>", p.indexOf('<section id="sources"')));
  assert.ok(ps.includes('data-source="ws-vs-36"') || ps.includes('data-source="ws-'), "mantra sources of the part's steps");
  assert.ok(src.includes('rel="external noopener"'), "every attribution title is a link");
});

test("when card: rules, no_dates sentence, Shubhvela links with data-sv / data-sv-id and the external marker", () => {
  const s = base("hi", "vivah");
  const w = s.slice(s.indexOf('id="when"'), s.indexOf("</section>", s.indexOf('id="when"')));
  assert.ok(w.includes(t("hi", "honesty.no_dates")));
  assert.ok(w.includes('href="https://sudish007.github.io/shubhvela/hi/muhurat/" rel="external noopener" class="btn" data-sv="muhurat" data-sv-id="marriage"'));
  assert.ok(w.includes('href="https://sudish007.github.io/shubhvela/hi/panchang/new-delhi/" rel="external noopener" class="btn" data-sv="panchang"'));
  assert.ok(!w.includes('data-sv="festival"') && !w.includes('data-sv="vrat"'));
  const sp = base("bho", "satyanarayan-puja");
  assert.ok(sp.includes('href="https://sudish007.github.io/shubhvela/bho/vrat/satyanarayan/" rel="external noopener" class="btn" data-sv="vrat" data-sv-id="satyanarayan"'));
  assert.equal(shubhvelaLinks("en", { shubhvela: { festival: "diwali" } }).length, 2);
  assert.ok(shubhvelaLinks("en", { shubhvela: { festival: "diwali" } })[0].toString().includes('href="https://sudish007.github.io/shubhvela/en/festivals/"'));
  assert.ok(whenCard(ctx, "en", occ("vivah"), {}).toString().startsWith('<section class="card when" id="when"'));
});

test("samagri card: details.rail-fold, 24-px checkbox per item with data-item, qty, must chip, note, nofollow search link, storage note, Print + Clear", () => {
  const s = samagriCard(ctx, "hi", occ("vivah")).toString();
  assert.ok(s.startsWith('<details class="rail-fold card samagri" id="samagri" data-checklist="vivah" data-l-confirm="इस अवसर की सभी टिक हटा दें?">'));
  assert.equal(count(s, /<input type="checkbox" id="sg-vivah-[a-z]+" data-item="[a-z]+">/g), 5);
  assert.equal(count(s, /class="chip chip-haldi">आवश्यक</g), 4);
  assert.ok(s.includes('<span class="qty"><span class="sr">मात्रा: </span>100 ग्राम</span>'));
  assert.ok(s.includes('<p class="small note">लाजा होम के लिए; वधू का भाई चार भागों में बाँटता है।</p>'));
  assert.ok(s.includes('rel="external noopener nofollow"') && s.includes("duckduckgo.com"));
  assert.ok(s.includes(t("hi", "storage.note")));
  assert.ok(s.includes("data-print-samagri") && s.includes("data-clear-checks"));
  const clear = s.slice(s.indexOf("<button class=\"btn\" type=\"button\" data-clear-checks>"), s.indexOf("</button>", s.indexOf("data-clear-checks")));
  assert.ok(!clear.includes("<svg"), "Clear has no motif");
  assert.ok(s.includes("सामग्री सूची · 5 वस्तुएँ"));
});

test("stepTitle / splitAction: head before the dash, plain text for the rail, long dash-less actions are cut at a word", () => {
  assert.deepEqual(splitAction("पवित्रीकरण — पंडित मंत्र पढ़कर जल छिड़कता है।"), { head: "पवित्रीकरण", tail: "पंडित मंत्र पढ़कर जल छिड़कता है।" });
  assert.deepEqual(splitAction("कथा के पहले अध्याय का पाठ।"), { head: "कथा के पहले अध्याय का पाठ।", tail: "" });
  const long = splitAction("शांति के लिए [रुद्राष्टाध्यायी](/texts/rudrashtadhyayi/) के पहले अध्याय (शिवसंकल्प) का पाठ।");
  assert.ok(long.head.endsWith("…") && long.head.length <= 73 && long.tail.startsWith("शांति"));
  assert.equal(stepTitle(occ("vivah").steps[4], "hi"), "शांति के लिए रुद्राष्टाध्यायी के पहले अध्याय…");
  assert.equal(stepTitle(occ("vivah").steps[0], "en"), "Pavitrikarana");
  // a label before a colon is a head too (C1A-01 integrate: 448 of the 1a step actions are written "label: prose")
  assert.deepEqual(splitAction("पहली पाँच ऋचाएँ (VS 25.14–18): कल्याणकारी संकल्प आएँ, देवताओं की सुमति हो।"), { head: "पहली पाँच ऋचाएँ (VS 25.14–18)", tail: "कल्याणकारी संकल्प आएँ, देवताओं की सुमति हो।" });
  assert.deepEqual(splitAction("Two shanti mantras: 'dyauh shantih' (VS 36.17) and 'yato yatah samihase' (VS 36.22); then the pandit says — om."), { head: "Two shanti mantras", tail: "'dyauh shantih' (VS 36.17) and 'yato yatah samihase' (VS 36.22); then the pandit says — om." });
  // a colon after a sentence boundary is not a label: the long action is still cut at a word
  const sent = splitAction("आसन पर पूर्व या उत्तर मुख बैठें। [[achaman]]: दाहिनी हथेली में आचमनी से थोड़ा जल लें और अँगूठे की जड़ से तीन बार पिएँ।");
  assert.ok(sent.head.endsWith("…") && sent.tail.startsWith("आसन"));
  // a head that is only a [[term]] mark keeps a rail label through the mdCtx term display form
  const mdCtx = { term: (id) => (id === "pranayam" ? { display: "प्राणायाम", alt: null, href: "#" } : null) };
  assert.equal(stepTitle({ action: { hi: "[[pranayam]]: यजमान श्वास रोकता है; पंडित व्याहृतियाँ पढ़ता है।" } }, "hi", mdCtx), "प्राणायाम");
  assert.equal(stepTitle({ action: { hi: "[[pranayam]]: यजमान श्वास रोकता है; पंडित व्याहृतियाँ पढ़ता है।" } }, "hi"), "");
});

test("occasions index: ten groups in the §3.3 order, computed counts, tiles for filled groups, honest line for empty ones", () => {
  const s = index("hi");
  const ids = [...s.matchAll(/<section id="([a-z]+)" class="occ-group"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["foundations", "daily", "birth", "marriage", "home", "death", "kathas", "vrats", "festivals", "shanti"]);
  assert.equal(count(s, /class="card card-link occ-card"/g), 2);
  assert.ok(s.includes(">2 अवसर<") && s.includes(">2 समूह<"));
  assert.equal(count(s, /class="meta m0">इस समूह के पृष्ठ अगले चरण में जुड़ेंगे।</g), 8);
  assert.equal(count(s, /<h1[\s>]/g), 1);
  assert.ok(s.includes('href="/panditbano/hi/occasions/vivah/"') && s.includes('href="/panditbano/hi/occasions/satyanarayan-puja/"'));
  assert.ok(s.includes(">6 चरण · 3 भाग<"));
  assert.ok(!/<h[1-6][^>]*>\s*\d/.test(s), "no heading starts with a literal count");
});

test("offline manifest: placeholder on occasion/part/pothi pages; embed yields JSON with id, hash, bytes and hashed assets + 5 fonts", async () => {
  const { pothiPage } = await import("../../build/templates/pages/pothi.mjs");
  const out = new Map();
  for (const lang of ["hi", "en"]) {
    out.set(`${lang}/occasions/vivah/index.html`, base(lang, "vivah"));
    for (const p of ["purvang", "mukhya", "uttarang"]) out.set(`${lang}/occasions/vivah/${p}/index.html`, part(lang, "vivah", p));
    out.set(`${lang}/occasions/vivah/pothi/index.html`, pothiPage(ctx, { route: routeOf(lang, "pothi", { slug: "vivah" }), occ: occ("vivah"), data, derived, occasionsById }).toString());
    for (const id of ["pad-apavitrah-pavitro-va", "vs-36-3", "pgs-1-8-1"]) out.set(`${lang}/mantras/${id}/index.html`, "<html>mantra</html>");
  }
  assert.ok(out.get("hi/occasions/vivah/index.html").includes("<!--pb-offline-urls:vivah-->"));
  out.set(ctx.assets.css, "css".repeat(100));
  out.set(ctx.assets.js, Buffer.from("js"));
  for (const m of new Set(Object.values(MODULES).flat())) out.set(`assets/js/${m.slice(2)}`, "m");
  const fonts = ["fonts/noto-sans/NotoSans-Regular.woff2", "fonts/noto-sans/NotoSans-SemiBold.woff2", "fonts/noto-sans-devanagari/NotoSansDevanagari-Regular.woff2", "fonts/noto-sans-devanagari/NotoSansDevanagari-SemiBold.woff2", "fonts/tiro-devanagari-sanskrit/TiroDevanagariSanskrit-Regular.woff2"];
  for (const f of fonts) out.set(f, Buffer.alloc(1000));
  const r = embedOfflineManifests(out, { R, ctx, occasions: data.occasions });
  assert.equal(r.embedded, 10);
  assert.deepEqual(r.missing, []);
  const html = out.get("hi/occasions/vivah/purvang/index.html");
  assert.ok(!html.includes("<!--pb-offline-urls"));
  const m = /<script type="application\/json" id="pb-offline-urls">([^<]+)<\/script>/.exec(html);
  assert.ok(m, "manifest script present");
  const man = JSON.parse(m[1]);
  assert.equal(man.id, "vivah");
  assert.equal(man.hash, ctx.hash);
  assert.ok(Number.isInteger(man.bytes) && man.bytes > 5000);
  assert.ok(man.urls.includes("/panditbano/hi/occasions/vivah/") && man.urls.includes("/panditbano/hi/occasions/vivah/pothi/") && man.urls.includes("/panditbano/hi/occasions/vivah/mukhya/"));
  assert.ok(man.urls.includes("/panditbano/hi/mantras/vs-36-3/") && man.urls.includes("/panditbano/hi/mantras/pgs-1-8-1/"));
  assert.ok(man.urls.includes(`/panditbano/${ctx.assets.css}`) && man.urls.includes(`/panditbano/${ctx.assets.js}`));
  assert.ok(man.urls.includes("/panditbano/assets/js/checklist.abc.mjs") && man.urls.includes("/panditbano/assets/js/pothi.abc.mjs") && man.urls.includes("/panditbano/assets/js/voice.abc.mjs"));
  assert.equal(man.urls.filter((u) => u.endsWith(".woff2")).length, 5);
  assert.equal(new Set(man.urls).size, man.urls.length, "no duplicate urls");
  // bytes = the sum of the dist sizes of the listed files, after embedding (fixed point)
  const sum = man.urls.reduce((n, u) => { const b = out.get(fileOf(u, "/panditbano/")); return n + (Buffer.isBuffer(b) ? b.length : Buffer.byteLength(b)); }, 0);
  assert.equal(man.bytes, sum);
  // the same page in English lists English URLs; the pothi page carries the manifest too
  const en = JSON.parse(/id="pb-offline-urls">([^<]+)</.exec(out.get("en/occasions/vivah/index.html"))[1]);
  assert.ok(en.urls[0] === "/panditbano/en/occasions/vivah/");
  assert.ok(out.get("hi/occasions/vivah/pothi/index.html").includes('id="pb-offline-urls"'));
  assert.equal(offlineUrls(occ("satyanarayan-puja"), "hi", { R, ctx, out }).filter((u) => u.includes("/mantras/")).length, 1);
});

test("hi/en/bho render without a missing UI string; en page uses English labels", () => {
  for (const lang of ["hi", "en", "bho"]) {
    for (const id of ["vivah", "satyanarayan-puja"]) base(lang, id);
    for (const p of ["purvang", "mukhya", "uttarang"]) part(lang, "vivah", p);
    index(lang);
  }
  const en = base("en", "vivah");
  assert.ok(en.includes("<h2 id=\"h-when\">When</h2>") && en.includes("Samagri list · 5 items") && en.includes('<html lang="en"'));
});
