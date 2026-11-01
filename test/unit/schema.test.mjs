// FEAT-104: hand-written validators (design §10.9; plan §2.5) — one failing case per rule class plus the sample records pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateMantra, validateOccasion, validateText, validateChapter, validateKatha, validateLesson, validateLevels, validateTerm, validateUI,
  validateSources, validateInstitutions, validateLatinAllow, validateShubhvelaIds, validateFrontMatter, isAllowedUrl, ID_RE, LESSON_ID_RE,
} from "../../build/lib/schema.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const S = join(ROOT, "test", "fixtures", "content-sample");
const J = (p) => JSON.parse(readFileSync(join(S, p), "utf8"));
const C = (p) => JSON.parse(readFileSync(join(ROOT, "content", p), "utf8"));
const msgs = (r) => r.errors.map((e) => `${e.path}: ${e.message}`).join("\n");
const fails = (r, re, label) => assert.ok(!r.ok && r.errors.some((e) => re.test(`${e.path}: ${e.message}`)), `${label}: expected an error matching ${re}; got\n${msgs(r)}`);

const mantra = () => J("mantras/foundations/vs-36-3.json");
const occasion = () => J("occasions/marriage/vivah.json");
const text = () => J("texts/rudrashtadhyayi/text.json");
const chapter = () => J("texts/rudrashtadhyayi/1.json");
const katha = () => J("kathas/satyanarayan-vrat-katha/katha.json");
const lesson = () => J("learn/l0-01-purohit-kaun.json");

test("the sample records and the registries validate", () => {
  for (const [name, r] of [
    ["mantra", validateMantra(mantra())], ["pgs", validateMantra(J("mantras/marriage/pgs-1-8-1.json"))], ["occasion", validateOccasion(occasion())],
    ["satyanarayan-puja", validateOccasion(J("occasions/kathas/satyanarayan-puja.json"))], ["text", validateText(text())], ["chapter", validateChapter(chapter())],
    ["chapter2", validateChapter(J("texts/rudrashtadhyayi/2.json"))], ["katha", validateKatha(katha())], ["lesson", validateLesson(lesson())],
    ["levels", validateLevels(J("learn/levels.json"))], ["term", validateTerm(J("glossary/vivah.json"))],
    ["ui hi", validateUI(C("ui/hi.json"))], ["ui en", validateUI(C("ui/en.json"))], ["ui bho", validateUI(C("ui/bho.json"))],
    ["sources", validateSources(C("sources.json"))], ["institutions", validateInstitutions(C("institutions.json"))],
    ["latin-allow", validateLatinAllow(C("latin-allow.json"))], ["shubhvela-ids", validateShubhvelaIds(C("shubhvela-ids.json"))],
    ["front matter", validateFrontMatter({ title: "T", summary: "S" })],
  ]) assert.ok(r.ok, `${name}:\n${msgs(r)}`);
});

test("unknown keys fail (authored iast/easy/vinyog/ariaPlain carry the derived-at-build hint)", () => {
  const m = mantra(); m.iast = "x"; m.bogus = 1;
  const r = validateMantra(m);
  fails(r, /\$\.iast: derived at build/, "iast");
  fails(r, /\$\.bogus: unknown key/, "bogus");
  const o = occasion(); o.steps[0].foo = true;
  fails(validateOccasion(o), /steps\[0\]\.foo: unknown key/, "nested unknown key");
});

test("required keys, enums, id pattern, date, https-only URL, caps, no HTML", () => {
  let m = mantra(); delete m.source; fails(validateMantra(m), /\$\.source: required/, "required");
  m = mantra(); m.kind = "modern"; fails(validateMantra(m), /\$\.kind: must be one of vedic/, "enum");
  m = mantra(); m.id = "VS-36-3"; fails(validateMantra(m), /\$\.id: does not match id/, "id pattern");
  m = mantra(); m.source.retrieved = "31-10-2026"; fails(validateMantra(m), /retrieved: does not match date/, "date");
  m = mantra(); m.linkOut = "http://example.com/x"; fails(validateMantra(m), /\$\.linkOut: must be an https: URL/, "https only");
  m = mantra(); m.linkOut = "http://usvv.ac.in/x"; assert.ok(validateMantra(m).ok, "http allow-list host passes");
  m = mantra(); m.meaning.en = "x".repeat(4001); fails(validateMantra(m), /meaning\.en: longer than 4000/, "cap");
  m = mantra(); m.meaning.en = "see <a href='x'>this</a>"; fails(validateMantra(m), /meaning\.en: HTML tags/, "no HTML");
  m = mantra(); m.svara = "yes"; fails(validateMantra(m), /\$\.svara: must be true or false/, "bool");
  assert.ok(ID_RE.test("vs-36-3") && !ID_RE.test("a") && !ID_RE.test("-x") && !ID_RE.test("x".repeat(65)));
  assert.ok(isAllowedUrl("https://sa.wikisource.org/wiki/x") && isAllowedUrl("http://upsanskritseva.in/Web/Paurohitya") && !isAllowedUrl("http://example.org/") && !isAllowedUrl("ftp://x"));
});

test("Devanagari-only fields and panditSays.sa placeholders (G3 rule id on the error)", () => {
  const m = mantra(); m.devanagari = "भूर्भुवः स्वः S";
  const r = validateMantra(m);
  assert.ok(r.errors.some((e) => e.rule === "G3" && /devanagari: not Devanagari-only/.test(`${e.path}: ${e.message}`)), msgs(r));
  const o = occasion(); o.steps[1].panditSays.sa = "{गोत्र} गोत्रः"; assert.ok(validateOccasion(o).ok, "placeholders allowed in panditSays.sa");
  const o2 = occasion(); o2.steps[0].panditSays.sa = "ॐ {x}"; fails(validateOccasion(o2), /panditSays\.sa: not Devanagari-only/, "Latin inside a placeholder");
  const m2 = mantra(); m2.pada[0].sa = "{तत्}"; fails(validateMantra(m2), /pada\[0\]\.sa: not Devanagari-only/, "no placeholders in pada");
});

test("trilingual fields need hi, en and bho (G2 rule id); unknown language keys fail", () => {
  const m = mantra(); delete m.meaning.bho;
  const r = validateMantra(m);
  assert.ok(r.errors.some((e) => e.rule === "G2" && e.path === "$.meaning.bho"), msgs(r));
  const m2 = mantra(); m2.meaning.fr = "x"; fails(validateMantra(m2), /meaning: unknown language key "fr"/, "unknown lang");
});

test("occasion: samagri searchUrl host allow-list and forbidden params; parts/steps/textRefs shapes", () => {
  let o = occasion(); o.samagri[0].searchUrl = "https://www.amazon.in/s?k=kalash&tag=aff-21";
  let r = validateOccasion(o);
  fails(r, /searchUrl host must be one of duckduckgo\.com/, "host");
  fails(r, /query parameter "tag" is not allowed/, "tag param");
  o = occasion(); o.samagri[0].searchUrl = "https://www.google.com/search?q=kalash&utm_source=x"; fails(validateOccasion(o), /"utm_source" is not allowed/, "utm");
  o = occasion(); o.samagri[0].searchUrl = "http://duckduckgo.com/?q=kalash"; fails(validateOccasion(o), /searchUrl must be https:/, "https");
  o = occasion(); o.steps = []; fails(validateOccasion(o), /\$\.steps: needs at least 1/, "≥1 step");
  o = occasion(); o.samagri = []; fails(validateOccasion(o), /\$\.samagri: needs at least 1/, "≥1 samagri");
  o = occasion(); o.sources = []; fails(validateOccasion(o), /\$\.sources: needs at least 1/, "≥1 source");
  o = occasion(); delete o.when; fails(validateOccasion(o), /\$\.when: required/, "when");
  o = occasion(); o.steps[4].textRefs = [{ text: "rudrashtadhyayi" }]; fails(validateOccasion(o), /textRefs\[0\]\.chapter: required/, "textRefs chapter");
  o = occasion(); o.steps[4].textRefs = [{ text: "rudrashtadhyayi", chapter: [1, 2] }]; assert.ok(validateOccasion(o).ok, "chapter list allowed");
  o = occasion(); o.sensitive = ["karma"]; fails(validateOccasion(o), /sensitive\[0\]: must be one of grief/, "sensitive enum");
  o = occasion(); o.steps[0].layer = "folk"; fails(validateOccasion(o), /layer: must be one of vedic \| paddhati \| lok/, "layer enum");
  o = occasion(); o.when.shubhvela.muhurat = 5; fails(validateOccasion(o), /shubhvela\.muhurat: matches none of: null \| str/, "shubhvela id or null");
  o = occasion(); o.steps[1].n = 1; fails(validateOccasion(o), /\$\.steps: duplicate n 1/, "unique step numbers");
});

test("text / chapter / katha / lesson / levels / glossary specifics", () => {
  let t = text(); t.lang = "mr"; fails(validateText(t), /\$\.lang: must be one of sa \| awa \| hi/, "text lang");
  t = text(); t.chapters[0].verseCount = 0; fails(validateText(t), /verseCount: must be ≥ 1/, "verseCount");
  let c = chapter(); c.verses[0].verseKind = "haiku"; fails(validateChapter(c), /verseKind: must be one of shloka/, "verseKind");
  c = chapter(); c.verses[1].v = 1; fails(validateChapter(c), /\$\.verses: duplicate v 1/, "unique verse numbers");
  c = chapter(); c.verses[0].iast = "x"; fails(validateChapter(c), /verses\[0\]\.iast: derived at build/, "no authored iast on verses");
  let k = katha(); k.adhyayas[0].verseRefs = ["bad ref"]; fails(validateKatha(k), /verseRefs\[0\]: does not match <textSlug>-<n>-<v>/, "verseRefs pattern");
  k = katha(); delete k.vidhiOccasionId; fails(validateKatha(k), /\$\.vidhiOccasionId: required/, "katha vidhi");
  let l = lesson(); l.id = "level-0-intro"; fails(validateLesson(l), /\$\.id: must not start with "level-"/, "level- prefix reserved (NIT 17)");
  l = lesson(); l.id = "intro-lesson"; fails(validateLesson(l), /lesson id must be l<level>-<nn>-<slug>/, "lesson id scheme");
  assert.ok(LESSON_ID_RE.test("l0-01-purohit-kaun") && !LESSON_ID_RE.test("l5-01-x"));
  l = lesson(); l.quiz = l.quiz.slice(0, 2); fails(validateLesson(l), /\$\.quiz: needs at least 3/, "≥3 questions");
  l = lesson(); l.quiz[0].answer = "d"; fails(validateLesson(l), /answer must be one of the option ids/, "answer in options");
  l = lesson(); l.quiz[0].options.push({ id: "a", text: { hi: "x", en: "x", bho: "x" } }); fails(validateLesson(l), /options: duplicate id "a"/, "unique option ids");
  fails(validateLevels([{ level: 0, title: { hi: "x", en: "x", bho: "x" }, summary: { hi: "x", en: "x", bho: "x" } }, { level: 0, title: { hi: "y", en: "y", bho: "y" }, summary: { hi: "y", en: "y", bho: "y" } }]), /duplicate level 0/, "levels unique");
  fails(validateTerm({ id: "x", definition: { hi: "a", en: "b" } }), /definition\.bho: missing/, "glossary parity");
});

test("UI tables, sources registry, institutions, Shubhvela ids", () => {
  fails(validateUI({ a: { b: "" } }), /\$\.a\.b: empty string/, "ui empty");
  fails(validateUI({ a: "<b>x</b>" }), /\$\.a: HTML tags/, "ui html");
  const s = C("sources.json"); s.sources.push({ ...s.sources[0] }); fails(validateSources(s), /\$\.sources: duplicate id/, "duplicate source id");
  const s2 = C("sources.json"); s2.sources[0].project = "random"; fails(validateSources(s2), /project: must be one of wikisource/, "project enum");
  const s3 = C("sources.json"); delete s3.sources[0].titles; fails(validateSources(s3), /titles: required/, "titles required (G16/UI-19)");
  const i = C("institutions.json"); i.institutions[0].url = "ftp://x"; fails(validateInstitutions(i), /url: must be an https: URL/, "institution url");
  const sv = C("shubhvela-ids.json"); sv.from = "HEAD"; fails(validateShubhvelaIds(sv), /from: does not match git short hash/, "from hash");
  const sv2 = C("shubhvela-ids.json"); sv2.copied = "today"; fails(validateShubhvelaIds(sv2), /copied: does not match date/, "copied date");
});
