// FEAT-104: derived data (design §10.6, §11.6, §16.1; decisions §7.2) — counts, vinyog, pagination at 40, unpublished chapter
// excluded, Shubhvela year-less URLs, attribution-line patterns per project, term forms.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../../build/lib/load.mjs";
import { derive, paginate, isPublished, shubhvelaUrl, attributionLine, attributionPattern, termForms, PART_SIZE } from "../../build/lib/derive.mjs";
import { createRoutes } from "../../build/lib/routes.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SAMPLE = join(ROOT, "test", "fixtures", "content-sample");
const R = createRoutes({ BASE_PATH: "/panditbano/", SITE_ORIGIN: "https://sudish007.github.io" });

test("counts come from the data; unpublished chapter 2 is excluded from verses/chapters", () => {
  const data = loadContent(SAMPLE);
  const d = derive(data, { R });
  assert.deepEqual({ ...d.counts, groups: undefined }, { occasions: 2, mantras: 3, verses: 5, terms: 3, chapters: 2, texts: 2, kathas: 1, lessons: 1, levels: 1, groupCount: 2, groups: undefined });
  assert.deepEqual(d.counts.groups, { marriage: 1, kathas: 1 });
  assert.deepEqual(d.publishedChapters, ["rudrashtadhyayi-1", "satyanarayan-vrat-katha-sanskrit-1"]);
  assert.deepEqual(d.unpublishedChapters, [{ text: "rudrashtadhyayi", n: 2, missing: 2 }]);
  const rudri = data.texts.find((t) => t.id === "rudrashtadhyayi");
  assert.equal(rudri.chapters.length, 1, "routes see only the published chapter");
  assert.equal(rudri.allChapters.length, 2);
  // routes expand from the derived shapes
  const paths = R.routesFor("hi", data).map((r) => r.sitePath);
  assert.ok(paths.includes("hi/texts/rudrashtadhyayi/1/") && !paths.includes("hi/texts/rudrashtadhyayi/2/"));
  assert.ok(paths.includes("hi/occasions/vivah/purvang/") && paths.includes("hi/occasions/vivah/pothi/") && paths.includes("hi/kathas/satyanarayan-vrat-katha/1/") && paths.includes("hi/glossary/saptapadi/") && paths.includes("hi/learn/level-0/"));
});

test("iast/easy/ariaPlain are derived on mantras and verses; vinyog lists the steps that use a mantra", () => {
  const data = loadContent(SAMPLE);
  const d = derive(data, { R });
  const g = d.mantraById.get("vs-36-3");
  assert.equal(g.iast, "bhūrbhuvaḥ svaḥ tatsaviturvareṇyaṃ bhargo devasya dhīmahi | dhiyo yo naḥ pracodayāt ||");
  assert.equal(g.easy, "bhoorbhuvah svah tatsaviturvarenyam bhargo devasya dheemahi | dhiyo yo nah prachodayaat ||");
  assert.equal(g.ariaPlain, "भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि । धियो यो नः प्रचोदयात् ॥");
  assert.deepEqual(g.vinyog.map((v) => [v.occasionId, v.step, v.part]), [["vivah", 3, "purvang"]]);
  assert.deepEqual(d.vinyog["pad-apavitrah-pavitro-va"].map((v) => v.occasionId).sort(), ["satyanarayan-puja", "vivah"]);
  const v = data.texts.find((t) => t.id === "rudrashtadhyayi").chapters[0].verses[0];
  assert.equal(v.id, "rudrashtadhyayi-1-1");
  assert.match(v.iast, /^gaṇānāṃ tvā gaṇapatiṃ havāmahe/);
  assert.equal(g.svaraFallback, 0);
});

test("pagination: ≤ 40 verses per part; 95 verses → 3 parts (40/40/15)", () => {
  const verses = Array.from({ length: 95 }, (_, i) => ({ v: i + 1 }));
  const parts = paginate(verses);
  assert.equal(PART_SIZE, 40);
  assert.deepEqual(parts.map((p) => p.length), [40, 40, 15]);
  assert.deepEqual(paginate(verses.slice(0, 40)).map((p) => p.length), [40]);
  assert.deepEqual(paginate([]).map((p) => p.length), [0]);
  assert.ok(isPublished({ verses: [{ meaning: { hi: "a", en: "b", bho: "c" } }] }));
  assert.ok(!isPublished({ verses: [{ meaning: { hi: "a", en: "b" } }] }));
  assert.ok(!isPublished({ verses: [] }));
});

test("Shubhvela URLs are year-less and language-to-language (design §16.1)", () => {
  assert.equal(shubhvelaUrl("hi", "muhurat", "marriage"), "https://sudish007.github.io/shubhvela/hi/muhurat/");
  assert.equal(shubhvelaUrl("en", "festival", "diwali"), "https://sudish007.github.io/shubhvela/en/festivals/");
  assert.equal(shubhvelaUrl("bho", "vrat", "satyanarayan"), "https://sudish007.github.io/shubhvela/bho/vrat/satyanarayan/");
  assert.equal(shubhvelaUrl("hi", "panchang"), "https://sudish007.github.io/shubhvela/hi/panchang/new-delhi/");
  for (const u of [shubhvelaUrl("hi", "muhurat", "marriage"), shubhvelaUrl("en", "festival", "diwali")]) assert.ok(!/20\d\d/.test(u), "no year baked in");
});

test("attribution line pattern per project and the W/S wording of decisions §7.2", () => {
  const data = loadContent(SAMPLE);
  const ws = data.sources.get("ws-syv-36"), sd = data.sources.get("sd-syv-sandhya"), gr = data.sources.get("gretil-garuda"), vhp = data.sources.get("vhp-vajasaneyi"), ia = data.sources.get("ia-sbe29"), scan = data.sources.get("ia-syv-nirnaya-1929");
  assert.deepEqual([ws, sd, gr, vhp, ia, scan].map(attributionPattern), ["W", "S", "G", "V", "B", "T"]);
  const w = attributionLine(ws, { retrieved: "2026-10-31", modified: false }, "en");
  assert.match(w.text, /^Source text: Sanskrit Wikisource, “शुक्लयजुर्वेदः\/अध्यायः ३६” \(https:\/\/sa\.wikisource\.org\/wiki\/.+\), retrieved 2026-10-31\. Transcription by Wikisource contributors, CC BY-SA 4\.0 \(https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/\); the work itself is in the public domain\. Unmodified\.$/);
  assert.match(attributionLine(ws, { retrieved: "2026-10-31", modified: true }, "hi").text, /^मूल पाठ: संस्कृत विकिस्रोत, .* को लिया गया। प्रतिलेखन विकिस्रोत योगदानकर्ताओं का, CC BY-SA 4\.0 .*deed\.hi\); मूल रचना सार्वजनिक अधिकार-क्षेत्र \(पब्लिक डोमेन\) में है। परिवर्तन: /);
  assert.match(attributionLine(ws, { retrieved: "2026-10-31" }, "bho").text, /के लिहल गइल। प्रतिलेखन विकिस्रोत के योगदान देवे वाला लोग के, .* मूल रचना पब्लिक डोमेन में बा। बिना बदलाव।$/);
  assert.match(attributionLine(sd, { checked: true }, "en").text, /^Checked against: sanskritdocuments\.org, “.+” \(https:\/\/sanskritdocuments\.org\/doc_veda\/shuklayajurvedIyasandhyA\.html\), prepared by volunteers\. Their file is for personal study and research; corrections to sanskrit@cheerful\.com\.$/);
  assert.match(attributionLine(gr, {}, "en").text, /^Source text: GRETIL \(SUB Göttingen\), .*encoding CC BY-NC-SA 4\.0/);
  assert.match(attributionLine(vhp, {}, "en").text, /^Recitation reference: Vedic Heritage Portal, IGNCA \(https:/);
  assert.match(attributionLine(ia, {}, "en").text, /^Sequence and ritual facts cross-checked with: .*No text from this edition is reproduced\.$/);
  assert.match(attributionLine(scan, { retrieved: "2026-10-31", checked: true }, "en").text, /^Transcribed from .*Internet Archive item ShuklaYajurvedaSamhita1929WLSPansikarNirnayaSagarPress .*public domain\), retrieved 2026-10-31; verified against a second source\.$/);
  assert.equal(attributionLine(null, {}, "en").pattern, "O");
});

test("termForms: display form per language and the first-use alternate (R5 B7)", () => {
  const data = loadContent(SAMPLE);
  const d = derive(data, { R });
  const vivah = d.termbankById.get("vivah");
  assert.deepEqual(termForms(vivah, "hi"), { display: "विवाह", alt: "शादी" });
  assert.deepEqual(termForms(vivah, "bho"), { display: "बियाह", alt: "बिआह" });
  assert.deepEqual(termForms(d.termbankById.get("saptapadi"), "bho"), { display: "सप्तपदी", alt: "सात कदम" });
  assert.equal(termForms(d.termbankById.get("kalash"), "hi").alt, null);
  assert.equal(d.glossaryPages.length, 3);
  assert.equal(d.groups.find((g) => g.id === "marriage").examples[0].href("en"), "/panditbano/en/occasions/vivah/");
});
