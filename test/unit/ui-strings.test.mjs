// FEAT-102: UI string tables — key parity hi/en/bho, Appendix B keys present, Bhojpuri passes the hard forbidden list,
// Latin digits only (decisions.md §9 rule 5; design-review NIT 13), Bhojpuri imperatives in -ीं.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadUI, t } from "../../build/templates/lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const UI = {};
for (const l of ["hi", "en", "bho"]) UI[l] = JSON.parse(readFileSync(join(ROOT, "content", "ui", `${l}.json`), "utf8"));
const forbidden = JSON.parse(readFileSync(join(ROOT, "content", "forbidden-hi-in-bho.json"), "utf8"));

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
const flat = { hi: flatten(UI.hi), en: flatten(UI.en), bho: flatten(UI.bho) };

const APPENDIX_B = [
  "site.name", "site.tagline",
  ...["learn", "occasions", "texts", "kathas", "glossary", "search", "home"].map((k) => `nav.${k}`),
  ...["label", "light", "dark", "system"].map((k) => `theme.${k}`),
  "lang.label", "lang.hi.long", "lang.hi.short", "lang.en.long", "lang.en.short", "lang.bho.long", "lang.bho.short",
  ...["listen", "stop", "note", "none", "speed", "repeat", "speaking", "failed", "name"].map((k) => `voice.${k}`),
  ...["label", "iast", "easy", "off"].map((k) => `translit.${k}`),
  ...["label", "save", "saved", "print", "back", "size"].map((k) => `pothi.${k}`),
  ...["saved_list", "remove", "quota", "failed", "retry", "update", "reload", "offline_title", "offline_body"].map((k) => `offline.${k}`),
  "storage.note", "svara.on", "svara.off",
  ...["says", "action", "meaning", "explain", "pada", "vinyog", "note", "source", "variants", "phalashruti"].map((k) => `verse.${k}`),
  "layer.vedic", "layer.paddhati", "layer.lok",
  ...["intro", "when", "roles", "samagri", "vidhi", "variants", "faq", "sources"].map((k) => `occasion.sections.${k}`),
  ...["clear", "clear_confirm", "print", "must"].map((k) => `samagri.${k}`),
  ...["check", "result", "unanswered", "show_answers"].map((k) => `quiz.${k}`),
  ...["label", "placeholder", "none", "count", "load_failed"].map((k) => `search.${k}`),
  ...["about", "sources", "corrections", "privacy", "sections", "more", "shubhvela", "note_hi", "note_translation", "licences", "print_courtesy"].map((k) => `foot.${k}`),
  ...["tradition", "no_dates", "health_note", "grief_note", "astrology_note"].map((k) => `honesty.${k}`),
  "ext.label", "skip.label", "notfound.title", "notfound.body",
  "shubhvela.panchang", "shubhvela.festivals", "shubhvela.muhurat",
  ...["occasions", "mantras", "verses", "terms", "chapters"].map((k) => `counts.${k}`),
  "foot.privacy_line",
];

test("identical key sets in hi, en and bho", () => {
  const hi = Object.keys(flat.hi).sort();
  assert.deepEqual(Object.keys(flat.en).sort(), hi);
  assert.deepEqual(Object.keys(flat.bho).sort(), hi);
});

test("every Appendix B key exists and every value is a non-empty string", () => {
  for (const k of APPENDIX_B) assert.ok(k in flat.hi, `missing key ${k}`);
  for (const l of ["hi", "en", "bho"]) for (const [k, v] of Object.entries(flat[l])) assert.ok(typeof v === "string" && v.trim(), `${l}:${k} empty`);
});

test("no Devanagari digits in UI values (Latin digits only)", () => {
  for (const l of ["hi", "en", "bho"]) for (const [k, v] of Object.entries(flat[l])) assert.ok(!/[\u0966-\u096F]/.test(v), `${l}:${k} has a Devanagari digit`);
});

test("Bhojpuri values pass the hard forbidden-Hindi list and the nukta pattern", () => {
  const hard = new Set(forbidden.hard.map((x) => x.hi));
  const hits = [];
  for (const [k, v] of Object.entries(flat.bho)) {
    const tokens = v.split(/[\s।?!,;:()“”"'·—–\-\/]+/).map((w) => w.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, "")).filter(Boolean);
    for (const w of tokens) if (hard.has(w)) hits.push(`${k}: ${w}`);
    if (/[\u0958-\u095A\u095B\u095E]|[\u0915\u0916\u0917\u091C\u092B]\u093C/.test(v)) hits.push(`${k}: nukta outside ड़/ढ़`);
  }
  assert.deepEqual(hits, []);
});

test("Bhojpuri imperatives use -ीं and the display names are the decided ones", () => {
  assert.equal(flat.bho["site.name"], "पंडित बनीं");
  assert.equal(flat.hi["site.name"], "पंडित बनो");
  assert.equal(flat.en["site.name"], "Pandit Bano");
  for (const k of ["nav.learn", "nav.search", "voice.listen", "voice.stop", "pothi.print", "pothi.save"]) assert.ok(flat.bho[k].endsWith("ीं"), `${k} = ${flat.bho[k]}`);
  assert.deepEqual([flat.bho["theme.light"], flat.bho["theme.dark"], flat.bho["theme.system"]], ["हलुक", "गहिर", "सिस्टम"]);
  assert.deepEqual([flat.hi["theme.light"], flat.hi["theme.dark"], flat.hi["theme.system"]], ["हल्की", "गहरी", "सिस्टम"]);
});

test("footer note strings follow NIT 12 (collects no data + privacy link; en/bho translation note)", () => {
  assert.ok(flat.hi["foot.privacy_line"].includes("कोई डेटा नहीं जुटाती"));
  assert.ok(flat.en["foot.privacy_line"].includes("collects no data"));
  assert.ok(flat.en["foot.note_translation"].includes("awaiting native review"));
  assert.ok(/GitHub/.test(flat.bho["foot.note_translation"]));
});

test("t() substitutes vars and throws on a missing key", () => {
  loadUI(join(ROOT, "content"));
  assert.equal(t("hi", "theme.light"), "हल्की");
  assert.equal(t("en", "counts.occasions", { n: 12 }), "12 occasions");
  // singular via the "<key>_one" sibling when n is 1 in any script (FIX-1a: "1 terms" on a glossary letter group)
  assert.equal(t("en", "counts.terms", { n: 1 }), "1 term");
  assert.equal(t("en", "counts.terms", { n: "1" }), "1 term");
  assert.equal(t("hi", "counts.kathas", { n: "१" }), "१ कथा");
  assert.equal(t("hi", "counts.kathas", { n: "२" }), "२ कथाएँ");
  assert.ok(t("hi", "learn.level_n", { n: "१" }).includes("१"), "no _one sibling → the plain string with {n} substituted");
  assert.throws(() => t("hi", "nope.key"), /missing/);
});
