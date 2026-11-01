// FEAT-105: verse renderer, reading-settings card, mantra page and mantras index (design.md §4.4, §7, §8, §9.3–9.4, §27
// items 1, 4, 5; design-review MEDIUM 4, NIT 13).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI, t } from "../../build/templates/lib.mjs";
import { verseBlock, verseFull, padaSpans, splitBars, withMarker, verseNumber, svaraLegend, sourcesSection } from "../../build/templates/components/verse.mjs";
import { readingSettings, learnHrefFor } from "../../build/templates/components/reading-settings.mjs";
import { mantraPage } from "../../build/templates/pages/mantra.mjs";
import { mantrasIndexPage, mantraGroups, incipit } from "../../build/templates/pages/mantras-index.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
import { loadContent } from "../../build/lib/load.mjs";
import { derive } from "../../build/lib/derive.mjs";
import { stripSvara, splitPadas } from "../../build/lib/deva.mjs";
import { ariaPlain } from "../../build/lib/translit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
loadUI(join(ROOT, "content"));
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });
const ctx = { R, features: { search: false }, hash: "abc123def456", assets: { css: "assets/css/site.abc123def456.css", js: "assets/js/app.abc123def456.mjs" }, modules: { mantra: ["./translit.abc.mjs", "./voice.abc.mjs"] }, themeColors: { light: "#F8ECD4", dark: "#171209" } };
const data = loadContent(join(ROOT, "test", "fixtures", "content-sample"));
const derived = derive(data, { R });
const occasionsById = new Map(data.occasions.map((o) => [o.id, o]));
const rec = (id) => derived.mantraById.get(id);
const routeOf = (lang, type, params) => R.routesFor(lang, data).find((r) => r.pageType === type && (!params || Object.entries(params).every(([k, v]) => r.params[k] === v)));
const pageArgs = (lang, id) => ({ route: routeOf(lang, "mantra", { mantraId: id }), rec: rec(id), mantras: data.mantras, derived, occasionsById, sources: data.sources });

/** Direct children tags+classes of the first element matching `<cls` (shallow, by tag balance). */
function children(html, openTag) {
  const i = html.indexOf(openTag);
  assert.ok(i >= 0, `no ${openTag}`);
  let depth = 0, j = i;
  const re = /<(\/?)([a-z0-9]+)([^>]*)>/g;
  re.lastIndex = i;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const selfClosing = /\/>$/.test(m[0]) || ["br", "use", "input", "meta", "link"].includes(m[2]);
    if (m[1]) { depth--; if (depth === 0) { j = m.index; break; } continue; }
    if (depth === 1 && !selfClosing) { const c = /class="([^"]*)"/.exec(m[3]); out.push(`${m[2]}${c ? "." + c[1].split(/\s+/)[0] : ""}`); }
    if (!selfClosing) depth++;
  }
  return { tags: out, inner: html.slice(i, j) };
}
const textOf = (html) => html.replace(/<[^>]+>/g, "");
const padaTexts = (html, cls) => { const i = html.indexOf(`<p class="${cls}"`); const j = html.indexOf("</p>", i); return [...html.slice(i, j).matchAll(/<span class="pada">([\s\S]*?)<\/span>(?=<span class="pada">|<\/span>|$)/g)].map((m) => textOf(m[1]).replace(/\u00a0/g, " ").trim()); };

test("verse block: fixed child order, .deva[aria-hidden] + .sr iff svara:true, data-plain == stripSvara, lang follows the text", () => {
  const g = verseBlock(rec("vs-36-3"), "hi").toString();
  assert.deepEqual(children(g, '<div class="verse"').tags, ["p.mantra", "p.iast", "p.roman-easy", "div.verse-tools"]);
  assert.deepEqual(children(g, '<p class="mantra"').tags, ["span.deva", "span.sr"]);
  assert.ok(g.includes('<span class="deva" aria-hidden="true">'));
  const plain = /data-plain="([^"]+)"/.exec(g)[1];
  assert.equal(plain, ariaPlain(rec("vs-36-3").devanagari));
  assert.equal(plain, stripSvara(rec("vs-36-3").devanagari).replace(/\s+/g, " ").trim());
  const sr = /<span class="sr" lang="sa">([^<]+)<\/span>/.exec(g);
  assert.ok(sr && sr[1].length > 0 && sr[1] === plain, ".sr carries exactly the plain text");
  assert.ok(!/aria-label="[^"]*"[^>]*class="mantra"|class="mantra"[^>]*aria-label=/.test(g), "no aria-label on the paragraph (MEDIUM 4)");
  assert.ok(g.includes('<p class="mantra" lang="sa" id="m-vs-36-3"'));
  assert.ok(g.includes('<p class="iast" lang="sa-Latn">') && g.includes('<p class="roman-easy" lang="sa-Latn">'));
  // svara:false → no .sr, .deva not aria-hidden, data-plain still present
  const p = verseBlock(rec("pad-apavitrah-pavitro-va"), "hi").toString();
  assert.ok(!p.includes('class="sr"') && p.includes('<span class="deva">') && p.includes("data-plain="));
  assert.deepEqual(children(p, '<p class="mantra"').tags, ["span.deva"]);
  assert.ok(p.includes('class="svara-flag off"') && p.includes(t("hi", "svara.off")), "visible svara note when svara:false (§27 item 5)");
  // lang follows the text record's lang (awa / hi), default sa
  const awa = verseBlock({ ...rec("pad-apavitrah-pavitro-va"), id: "x-1", lang: "awa", svara: false }, "en").toString();
  assert.ok(awa.includes('<p class="mantra" lang="awa" id="m-x-1"'));
  const hiText = verseBlock(rec("pad-apavitrah-pavitro-va"), "en", { textLang: "hi", id: "v-9" }).toString();
  assert.ok(hiText.includes('<p class="mantra" lang="hi" id="v-9"'));
});

test("verse tools: ▶ hidden until voice.mjs, accessible name with Latin digits (NIT 13), svara flag, voice note, ⚙ link, status slot", () => {
  const g = verseBlock(rec("vs-36-3"), "hi").toString();
  const btn = /<button class="btn btn-ghost" type="button" data-listen="m-vs-36-3" aria-pressed="false" aria-label="([^"]+)"[^>]*hidden>/.exec(g);
  assert.ok(btn, "listen button present and hidden");
  assert.equal(btn[1], "सुनें — श्लोक 3, मशीन की आवाज़");
  assert.ok(!/[\u0966-\u096F]/.test(btn[1]), "Latin digits in the accessible name");
  assert.ok(g.includes('<span class="svara-flag">' + t("hi", "svara.on")));
  assert.ok(g.includes('<span class="note">' + t("hi", "voice.note")));
  assert.ok(g.includes('href="#reading-settings"'));
  assert.ok(g.includes('role="status" data-vstatus'));
  for (const lang of ["en", "bho"]) {
    const s = verseBlock(rec("vs-36-3"), lang).toString();
    assert.ok(s.includes(`aria-label="${t(lang, "voice.aria", { n: "3" })}"`), lang);
  }
  // a record without a derivable number names the verse by its title
  const p = verseBlock(rec("pad-apavitrah-pavitro-va"), "hi").toString();
  assert.ok(p.includes(`aria-label="${t("hi", "voice.aria_title", { title: "पवित्रीकरण मंत्र" })}"`));
  assert.equal(verseNumber({ id: "vs-36-3" }), 3);
  assert.equal(verseNumber({ id: "pgs-1-8-1" }), 1);
  assert.equal(verseNumber({ id: "vs-36-14-16" }), null, "ranges carry no single number");
  assert.equal(verseNumber({ id: "pad-x" }, 7), 7);
});

test("§27 item 1: one pada per line over ≥ 20 mantras — every line ends with । ॥ (or the marker / the last pada), none starts with a danda; IAST mirrors", () => {
  const base = [...data.mantras.map((m) => m.devanagari), ...data.texts.flatMap((tx) => tx.allChapters.flatMap((c) => (c.verses || []).map((v) => v.devanagari)))];
  const synth = [
    "ॐ नमः शिवाय",
    "क । ख । ग ॥",
    "तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।\nधियो यो नः प्रचोदयात् ॥",
    "अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम् । होतारं रत्नधातमम् ॥ १ ॥",
    "शान्तिः शान्तिः शान्तिः ॥",
    "वक्रतुण्ड महाकाय सूर्यकोटिसमप्रभ ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
    "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः । सर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत् ॥",
    "असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मामृतं गमय ॥",
    "ॐ पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते ।",
    "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत । अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥ ७ ॥",
    "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥",
  ];
  const cases = [...base, ...synth];
  assert.ok(cases.length >= 20, `${cases.length} fixture mantras`);
  let n = 0;
  cases.forEach((dev, i) => {
    const html = verseBlock({ id: `t-${i}`, devanagari: dev, svara: /[\u0951-\u0954]/.test(dev), title: { hi: "x", en: "x", bho: "x" } }, "hi", { n: i + 1 }).toString();
    const padas = padaTexts(html, "mantra");
    assert.ok(padas.length >= 1, `no padas for ${dev}`);
    padas.forEach((p, k) => {
      n++;
      assert.ok(!/^[।॥]/.test(p), `line starts with a danda: "${p}" (${dev})`);
      const last = k === padas.length - 1;
      assert.ok(/[।॥]$/.test(p) || /॥\s*[०-९]+\s*॥$/.test(p) || last, `line does not end at a danda: "${p}" (${dev})`);
      assert.ok(!/[।॥]\s+\S/.test(p.replace(/॥\s*[०-९]+\s*॥$/, "")), `a pada boundary survived inside a line: "${p}"`);
    });
    const bars = padaTexts(html, "iast");
    assert.equal(bars.length, padas.length, `IAST lines ${bars.length} ≠ Devanagari lines ${padas.length} for ${dev}`);
    bars.forEach((b) => assert.ok(!/^\|/.test(b), `IAST line starts with a bar: "${b}"`));
    // no plain space before a danda / bar (NBSP joins), and Devanagari digits in the hi marker
    const mantra = html.slice(html.indexOf('<span class="deva"'), html.indexOf('<p class="iast"')).replace(/<span class="sr"[^>]*>[^<]*<\/span>/, "");
    assert.ok(!/ [।॥]/.test(textOf(mantra)), `plain space before a danda in ${dev}`);
    if (/<span class="nb vn">/.test(mantra)) assert.ok(/<span class="nb vn">॥\u00a0[०-९]+\u00a0॥<\/span>/.test(mantra), `hi marker not in Devanagari digits: ${dev}`);
  });
  assert.ok(n >= 30, `${n} lines checked`);
  // en pages number the Devanagari marker in Latin digits and the IAST marker always in Latin digits
  const en = verseBlock(rec("vs-36-3"), "en").toString();
  assert.ok(en.includes('<span class="nb vn">॥\u00a03\u00a0॥</span>') && en.includes('<span class="nb vn">||\u00a03\u00a0||</span>'));
  assert.deepEqual(splitBars("a | b || 3 ||"), ["a |", "b || 3 ||"]);
  assert.deepEqual(splitBars("oṃ namaḥ"), ["oṃ namaḥ"]);
  assert.equal(withMarker("क ॥", 3, "hi"), "क ॥ ३ ॥");
  assert.equal(withMarker("क ॥ ३ ॥", 3, "hi"), "क ॥ ३ ॥", "an existing number is kept");
  assert.equal(withMarker("क ।", 3, "hi"), "क ।", "a half-verse ending in । is not renumbered");
  assert.equal(padaSpans("क । ख ॥", splitPadas).toString(), '<span class="pada">क\u00a0।</span><span class="pada">ख\u00a0॥</span>');
});

test("no raw < from data: every record string is escaped in the block, the pieces and the page", () => {
  const bad = { ...rec("vs-36-3"), id: "vs-36-3", title: { hi: "<b>x</b>", en: "<b>x</b>", bho: "<b>x</b>" }, locator: '<img src=x onerror="1">', devanagari: "क <script>alert(1)</script> ख ॥", svara: false,
    pada: [{ sa: "<i>", gloss: { hi: "<u>", en: "<u>", bho: "<u>" } }], meaning: { hi: "<em>m", en: "<em>m", bho: "<em>m" }, explanation: { hi: "<s>e", en: "<s>e", bho: "<s>e" }, variants: [{ reading: "<q>", note: { hi: "<n>", en: "<n>", bho: "<n>" }, source: "ws-syv-36" }] };
  const s = verseFull(bad, "hi", { ctx, derived, occasionsById, sources: data.sources }).toString();
  for (const needle of ["<b>", "<script", "<img", "<i>", "<u>", "<em>", "<s>", "<q>", "<n>"]) assert.ok(!s.includes(needle), `${needle} reached the HTML`);
  assert.ok(s.includes("&lt;script&gt;") && s.includes("&lt;img src=x"));
  const page = mantraPage(ctx, { ...pageArgs("hi", "vs-36-3"), rec: bad }).toString();
  assert.ok(!page.includes("<script>alert") && !page.includes("<img src=x") && !page.includes("<b>x</b>") && page.includes("&lt;b&gt;x&lt;/b&gt;"));
});

test("verseFull keeps the fixed order: block → pada → meaning/explanation → vinyog → variants → source line", () => {
  const s = verseFull(rec("vs-36-3"), "hi", { ctx, derived, occasionsById, sources: data.sources }).toString();
  const order = ['<div class="verse">', '<section class="card" id="pada-vs-36-3"', '<section class="prose" id="arth-vs-36-3"', 'id="h-arth-vs-36-3-x"', '<section class="card" id="vinyog-vs-36-3"', '<p class="src">'].map((x) => s.indexOf(x));
  assert.ok(order.every((x) => x >= 0), `missing piece: ${order}`);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(s.includes('href="/panditbano/hi/occasions/vivah/purvang/#step-3">विवाह (बियाह) → चरण 3</a>'), "vinyog links the occasion step");
  // explanation Markdown links render as external links with the marker
  const pgs = verseFull(rec("pgs-1-8-1"), "hi", { ctx, derived, occasionsById, sources: data.sources }).toString();
  assert.ok(pgs.includes('<a href="https://sa.wikisource.org/wiki/पारस्करगृह्यसूत्रम्" rel="external noopener">पारस्कर गृह्यसूत्र<svg class="ext-ic"'));
  // phalashruti frame (§7.9)
  const ph = verseFull({ ...rec("pad-apavitrah-pavitro-va"), phalashruti: true }, "hi", { ctx, derived, occasionsById, sources: data.sources }).toString();
  assert.ok(ph.includes(`<p class="label">${t("hi", "verse.phalashruti")}</p>`));
});

test("reading-settings card: radiogroup with one aria-checked, stepper 0.9× with aria-live output, Repeat aria-pressed, lesson link, storage note", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const s = readingSettings(ctx, lang).toString();
    assert.ok(s.includes('id="reading-settings"') && s.includes("data-reading-settings"));
    const radios = [...s.matchAll(/<button type="button" role="radio" aria-checked="(true|false)" tabindex="(0|-1)" data-value="(iast|easy|off)">/g)];
    assert.equal(radios.length, 3);
    assert.equal(radios.filter((m) => m[1] === "true").length, 1);
    assert.deepEqual(radios.map((m) => m[3]), ["iast", "easy", "off"]);
    assert.ok(s.includes('<div class="seg" role="radiogroup" aria-labelledby="reading-settings-translit" data-translit>'));
    assert.ok(s.includes('<output data-rate-out aria-live="polite">0.9×</output>'));
    assert.ok(s.includes('data-rate="-"') && s.includes('data-rate="+"'));
    assert.ok(s.includes(`<button class="btn" type="button" data-repeat aria-pressed="false">${t(lang, "voice.repeat")}</button>`));
    // FEAT-110: the pronunciation link follows the corpus — Level 1 when it exists, the Learn index when any level does, none otherwise
    assert.ok(!s.includes(t(lang, "voice.lesson") + "</a>") && !s.includes("data-lesson-href"), `${lang}: no lesson link without learnHref`);
    const withL1 = readingSettings({ ...ctx, learnHref: (l) => learnHrefFor(ctx.R, [{ level: 0 }, { level: 1 }], l) }, lang).toString();
    assert.ok(withL1.includes(`data-lesson-href="/panditbano/${lang}/learn/level-1/"`) && withL1.includes(`<a href="/panditbano/${lang}/learn/level-1/">${t(lang, "voice.lesson")}</a>`));
    assert.equal(learnHrefFor(ctx.R, [{ level: 0 }], lang), `/panditbano/${lang}/learn/`);
    assert.equal(learnHrefFor(ctx.R, [], lang), null);
    assert.ok(s.includes(t(lang, "storage.note")));
    assert.ok(s.includes('data-voice-name hidden') && s.includes('role="status" data-voice-status'));
    assert.ok(s.includes(`data-l-none="${t(lang, "voice.none")}"`));
    assert.ok(!/[\u0966-\u096F]/.test(s), "Latin digits only in UI");
  }
});

test("mantra page: three rails, verse-row with pada card, group list with aria-current, #sources, svara legend only with svara, no pagination bar (§27 item 4)", () => {
  const s = mantraPage(ctx, pageArgs("hi", "vs-36-3")).toString();
  assert.equal((s.match(/<h1[\s>]/g) || []).length, 1);
  assert.ok(s.includes('<h1>गायत्री मंत्र</h1>'));
  assert.ok(s.includes('data-page="mantra"'));
  assert.ok(s.includes('<div class="layout has-both">') && s.includes('<aside class="rail rail-left">') && s.includes('<aside class="rail rail-right">'));
  assert.ok(s.includes('<div class="verse-row">'));
  assert.ok(s.indexOf('<section class="card" id="pada"') > s.indexOf('<p class="src">'), "source line sits under the verse, before the word-split card");
  assert.ok(s.includes('<details class="rail-fold card"><summary><h2 class="rail-h">शुक्ल यजुर्वेद — अध्याय 36 · 1 मंत्र</h2></summary>'));
  assert.ok(s.includes('href="/panditbano/hi/mantras/vs-36-3/" aria-current="page"'));
  assert.ok(s.includes('<section id="sources" aria-labelledby="h-sources">'));
  assert.ok(s.includes('data-source="ws-syv-36"') && s.includes('data-source="sd-syv-sandhya"'));
  assert.ok(s.includes('rel="external license noopener">CC BY-SA 4.0<svg'), "licence link");
  assert.ok(s.includes('class="card svara-legend"'), "svara legend rail on a svara-marked page (§27 item 5)");
  assert.ok(s.includes('id="reading-settings"'));
  assert.ok(!/class="progress"|class="bar"|pb-modules">\[\]/.test(s), "no progress bar dressed as pagination (§27 item 4); modules registered");
  assert.ok(s.includes('<script type="application/json" id="pb-modules">["./translit.abc.mjs","./voice.abc.mjs"]</script>'));
  assert.ok(s.includes('<a href="/panditbano/hi/mantras/">कर्मकांड के मंत्र</a>') && !s.includes("<li>गायत्री मंत्र</li>"), "crumbs list ancestors only");
  // paddhati mantra: no svara legend, visible "not shown" note in the head meta and the tools row
  const p = mantraPage(ctx, pageArgs("hi", "pad-apavitrah-pavitro-va")).toString();
  assert.ok(!p.includes("svara-legend"));
  assert.ok(p.includes('<span class="svara-flag off">' + t("hi", "svara.off")));
  // en / bho render with their strings
  for (const lang of ["en", "bho"]) {
    const x = mantraPage(ctx, pageArgs(lang, "vs-36-3")).toString();
    assert.ok(x.startsWith(`<!DOCTYPE html>\n<html lang="${lang}"`));
    assert.ok(x.includes(t(lang, "verse.settings")) && x.includes(t(lang, "mantras.group_vs", { n: "36" })));
  }
});

test("mantras index: groups by VS adhyaya / kind with computed counts, cards link every mantra, incipits are svara-less", () => {
  const groups = mantraGroups(data.mantras, "hi");
  assert.deepEqual(groups.map((g) => g.key), ["vs-36", "vedic-other", "paddhati"]);
  assert.deepEqual(groups.map((g) => g.items.length), [1, 1, 1]);
  const s = mantrasIndexPage(ctx, { route: routeOf("hi", "mantras-index"), mantras: data.mantras }).toString();
  assert.ok(s.includes(`<h1>${t("hi", "mantras.title")}</h1>`));
  assert.ok(s.includes("3 मंत्र") && s.includes("3 समूह"));
  for (const m of data.mantras) assert.ok(s.includes(`href="/panditbano/hi/mantras/${m.id}/"`), m.id);
  assert.equal((s.match(/class="card card-link mantra-card"/g) || []).length, 3);
  assert.ok(s.includes('<div class="grid grid-md-2 grid-lg-3 grid-xl-4">'));
  assert.ok(s.includes('<h2 id="h-g-vs-36">शुक्ल यजुर्वेद — अध्याय 36</h2>'));
  assert.ok(!/[\u0951-\u0954]/.test(incipit(rec("vs-36-3"))) && incipit(rec("vs-36-3")).endsWith("…"));
  assert.ok(!s.includes('class="mantra"'), "index cards use .incipit, not .mantra blocks");
});

test("svara legend and sources section render in all three languages with escaped marks", () => {
  for (const lang of ["hi", "en", "bho"]) {
    const l = svaraLegend(lang).toString();
    assert.ok(l.includes('<span class="mark" lang="sa">क॑</span>') && l.includes(t(lang, "svara_legend.title")));
    assert.ok(!l.includes("{svarita}") && !l.includes("{nasal}"));
    const src = sourcesSection([rec("vs-36-3"), rec("pgs-1-8-1")], lang, { sources: data.sources }).toString();
    assert.equal((src.match(/<li data-source=/g) || []).length, 4, "one line per distinct source ref");
  }
});
