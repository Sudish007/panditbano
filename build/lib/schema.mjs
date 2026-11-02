// Hand-written validators (design.md §10.2–10.5, §10.9; plan.md §2.5). One function per record type returning
// { ok, errors: [{ path, message }] }. Unknown keys fail (so authored iast/easy/vinyog keys cannot hide), string
// caps and enums are enforced, URLs must be https: (http: only for the government portals without TLS), dates are
// YYYY-MM-DD, and no JSON string may contain an HTML tag (Markdown only in .md files; JSON prose supports
// [[term]], **, *, [t](url) only).
import { isDevanagariOnly } from "./deva.mjs";

export const ID_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const LANGS = ["hi", "en", "bho"];
export const HTTP_ALLOW = ["usvv.ac.in", "upsanskritseva.in", "gretil.sub.uni-goettingen.de"];
export const SEARCH_HOSTS = ["duckduckgo.com", "www.google.com", "www.bing.com"];
export const FORBIDDEN_QUERY = /^(tag|ref|affid|aff|utm_.*)$/i;
export const KINDS = ["vedic", "puranic", "paddhati", "folk", "author"];
export const LAYERS = ["vedic", "paddhati", "lok"];
export const GROUPS = ["foundations", "daily", "birth", "marriage", "home", "death", "kathas", "vrats", "festivals", "shanti"];
export const COPYRIGHT = ["pd", "in-copyright", "uncertain"];
export const TEXT_LANGS = ["sa", "awa", "hi"];
export const VERSE_KINDS = ["shloka", "chaupai", "doha", "soratha", "chhand", "stanza", "sutra", "mantra", "prose"];
export const SENSITIVE = ["grief", "health", "pregnancy", "astrology"];
export const REVIEW_STATES = ["draft", "reviewed"];
export const SOURCE_PROJECTS = ["wikisource", "sanskritdocuments", "gretil", "vhp", "archive", "stotranidhi", "kavitakosh", "titus", "iitk", "shubhvela", "publisher", "research", "government", "other"];
export const SOURCE_KINDS = ["copy", "verify", "link", "scan", "sequence", "edition", "portal", "reference"];
export const CAPS = { title: 120, lede: 300, action: 1000, meaning: 4000, explanation: 8000, prose: 12000, short: 400, devanagari: 6000 };

const HTML_RE = /<\/?[a-zA-Z][^>]*>|<!--/;

// ---------------------------------------------------------------- mini type system
const str = (o = {}) => ({ t: "str", ...o });
const tri = (o = {}) => ({ t: "tri", ...o });
const bool = () => ({ t: "bool" });
const int = (min, max) => ({ t: "int", min, max });
const arr = (item, o = {}) => ({ t: "arr", item, ...o });
const obj = (fields, required = Object.keys(fields), o = {}) => ({ t: "obj", fields, required, ...o });
const en = (values) => ({ t: "str", enum: values });
const id = () => ({ t: "str", pattern: ID_RE, patternName: "id ^[a-z0-9][a-z0-9-]{1,63}$" });
const date = () => ({ t: "str", pattern: DATE_RE, patternName: "date YYYY-MM-DD" });
const url = () => ({ t: "url" });
const oneOf = (...specs) => ({ t: "oneOf", specs });
const nul = () => ({ t: "null" });

export function isAllowedUrl(u) {
  let p;
  try { p = new URL(u); } catch { return false; }
  if (p.protocol === "https:") return true;
  return p.protocol === "http:" && HTTP_ALLOW.some((h) => p.hostname === h || p.hostname.endsWith("." + h));
}

function check(v, spec, path, errors, ctx) {
  const E = (message) => errors.push({ path, message });
  switch (spec.t) {
    case "null":
      if (v !== null) E("must be null");
      return;
    case "oneOf": {
      for (const s of spec.specs) {
        const e = [];
        check(v, s, path, e, ctx);
        if (!e.length) return;
      }
      E(`matches none of: ${spec.specs.map((s) => s.t).join(" | ")}`);
      return;
    }
    case "bool":
      if (typeof v !== "boolean") E("must be true or false");
      return;
    case "int":
      if (!Number.isInteger(v)) return E("must be an integer");
      if (spec.min !== undefined && v < spec.min) E(`must be ≥ ${spec.min}`);
      if (spec.max !== undefined && v > spec.max) E(`must be ≤ ${spec.max}`);
      return;
    case "str": {
      if (typeof v !== "string") return E("must be a string");
      if (!spec.allowEmpty && !v.trim()) return E("must not be empty");
      if (HTML_RE.test(v)) E("HTML tags are not allowed in JSON strings");
      if (spec.max && v.length > spec.max) E(`longer than ${spec.max} characters (${v.length})`);
      if (spec.enum && !spec.enum.includes(v)) E(`must be one of ${spec.enum.join(" | ")} (got ${JSON.stringify(v)})`);
      if (spec.pattern && !spec.pattern.test(v)) E(`does not match ${spec.patternName || spec.pattern}`);
      if (spec.deva) {
        const r = isDevanagariOnly(v, { placeholders: !!spec.placeholders });
        if (!r.ok) errors.push({ path, rule: "G3", message: `not Devanagari-only: ${r.bad.map((b) => `${JSON.stringify(b.ch)} ${b.code}${b.message ? " " + b.message : ""}`).join(", ")}` });
      }
      if (spec.notPrefix && v.startsWith(spec.notPrefix)) E(`must not start with "${spec.notPrefix}" (reserved)`);
      return;
    }
    case "url": {
      if (typeof v !== "string") return E("must be a URL string");
      if (!isAllowedUrl(v)) E(`must be an https: URL (http: only for ${HTTP_ALLOW.join(", ")})`);
      return;
    }
    case "tri": {
      if (!v || typeof v !== "object" || Array.isArray(v)) return E("must be an object {hi, en, bho}");
      for (const k of Object.keys(v)) if (!LANGS.includes(k) && !(spec.extra || []).includes(k)) E(`unknown language key "${k}"`);
      for (const l of LANGS) {
        const s = v[l];
        if (typeof s !== "string" || !s.trim()) { errors.push({ path: `${path}.${l}`, rule: "G2", message: "missing or empty (id parity: hi, en and bho are all required)" }); continue; }
        if (HTML_RE.test(s)) errors.push({ path: `${path}.${l}`, message: "HTML tags are not allowed in JSON strings" });
        if (spec.max && s.length > spec.max) errors.push({ path: `${path}.${l}`, message: `longer than ${spec.max} characters (${s.length})` });
      }
      return;
    }
    case "arr": {
      if (!Array.isArray(v)) return E("must be an array");
      if (spec.min !== undefined && v.length < spec.min) E(`needs at least ${spec.min} item(s)`);
      if (spec.max !== undefined && v.length > spec.max) E(`more than ${spec.max} items (${v.length})`);
      v.forEach((x, i) => check(x, spec.item, `${path}[${i}]`, errors, ctx));
      if (spec.unique) {
        const seen = new Set();
        for (const x of v) {
          const k = typeof x === "object" && x ? x[spec.unique] : x;
          if (seen.has(k)) E(`duplicate ${spec.unique === true ? "value" : spec.unique} ${JSON.stringify(k)}`);
          seen.add(k);
        }
      }
      return;
    }
    case "obj": {
      if (!v || typeof v !== "object" || Array.isArray(v)) return E("must be an object");
      for (const k of Object.keys(v)) if (!(k in spec.fields)) errors.push({ path: `${path}.${k}`, message: spec.unknownHint?.[k] || "unknown key" });
      for (const k of spec.required) if (v[k] === undefined) errors.push({ path: `${path}.${k}`, message: "required" });
      for (const [k, s] of Object.entries(spec.fields)) if (v[k] !== undefined) check(v[k], s, `${path}.${k}`, errors, ctx);
      if (spec.extra) spec.extra(v, path, errors, ctx);
      return;
    }
    default:
      throw new Error(`schema: unknown spec ${spec.t}`);
  }
}

function run(value, spec, ctx = {}) {
  const errors = [];
  check(value, spec, "$", errors, ctx);
  return { ok: errors.length === 0, errors };
}

const DERIVED_HINT = { iast: "derived at build — never authored (design §22)", easy: "derived at build — never authored", vinyog: "derived at build — never authored", ariaPlain: "derived at build — never authored" };

// ---------------------------------------------------------------- shared pieces
const review = obj({ hi: en(REVIEW_STATES), bho: en(REVIEW_STATES), en: en(REVIEW_STATES) }, []);
const sourceRef = obj({ ref: id(), retrieved: date(), modified: oneOf(bool(), str({ max: CAPS.short })), locator: str({ max: CAPS.short }), url: url() }, ["ref", "retrieved"]);
const checked = arr(obj({ ref: id(), retrieved: date(), note: str({ max: CAPS.short }), url: url() }, ["ref", "retrieved"]), { max: 10 });
const pada = arr(obj({ sa: str({ deva: true, max: 200 }), gloss: tri({ max: CAPS.short }), note: tri({ max: CAPS.short }) }, ["sa", "gloss"]), { min: 1, max: 400 });
const variants = arr(obj({ reading: str({ max: CAPS.devanagari }), note: tri({ max: CAPS.short }), source: id() }, ["reading", "source"]), { max: 20 });
const permission = obj({ from: str({ max: 200 }), date: date(), scope: str({ max: CAPS.short }) });

const mantraFields = {
  id: id(), kind: en(KINDS), lang: en(TEXT_LANGS), text: str({ max: 120 }), locator: str({ max: 200 }), title: tri({ max: CAPS.title }),
  devanagari: str({ deva: true, max: CAPS.devanagari }), svara: bool(), variants, pada, meaning: tri({ max: CAPS.meaning }),
  explanation: tri({ max: CAPS.explanation }), note: tri({ max: CAPS.short }), phalashruti: bool(), source: sourceRef, checkedAgainst: checked,
  copyright: en(COPYRIGHT), reproduce: bool(), copyrightBasis: str({ max: CAPS.short }), linkOut: url(), permission,
  tags: arr(id(), { max: 30, unique: true }), review, deity: str({ max: 80 }),
};
export const mantraSpec = obj(mantraFields, ["id", "kind", "devanagari", "svara", "meaning", "source", "copyright", "reproduce", "copyrightBasis"], { unknownHint: DERIVED_HINT });
export const validateMantra = (v) => run(v, mantraSpec);

const verseFields = {
  v: int(1, 2000), devanagari: str({ deva: true, max: CAPS.devanagari }), svara: bool(), verseKind: en(VERSE_KINDS), speaker: str({ deva: true, max: 80 }),
  pada, meaning: tri({ max: CAPS.meaning }), explanation: tri({ max: CAPS.explanation }), note: tri({ max: CAPS.short }), phalashruti: bool(),
  variants, source: sourceRef, checkedAgainst: checked, locator: str({ max: 120 }), tags: arr(id(), { max: 30, unique: true }),
};
export const verseSpec = obj(verseFields, ["v", "devanagari", "svara"], { unknownHint: DERIVED_HINT });
export const validateVerse = (v) => run(v, verseSpec);

export const chapterSpec = obj({
  text: id(), n: int(0, 999), title: tri({ max: CAPS.title }), intro: tri({ max: CAPS.explanation }), locator: str({ max: 200 }),
  source: sourceRef, checkedAgainst: checked, verses: arr(verseSpec, { min: 1, max: 1200, unique: "v" }), review, note: tri({ max: CAPS.short }),
}, ["text", "n", "title", "source", "verses"]);
export const validateChapter = (v) => run(v, chapterSpec);

export const textSpec = obj({
  id: id(), title: tri({ max: CAPS.title }), intro: tri({ max: CAPS.explanation }), lang: en(TEXT_LANGS), kind: en(KINDS), deity: str({ max: 80 }),
  author: tri({ max: CAPS.short }), source: sourceRef, checkedAgainst: checked, attributionCaveat: tri({ max: CAPS.short }),
  chapters: arr(obj({ n: int(0, 999), title: tri({ max: CAPS.title }), verseCount: int(1, 1200), locator: str({ max: 200 }) }, ["n", "title", "verseCount"]), { min: 1, max: 200, unique: "n" }),
  vidhiOccasionId: id(), phase: int(1, 3), copyright: en(COPYRIGHT), reproduce: bool(), copyrightBasis: str({ max: CAPS.short }), linkOut: url(), permission,
  tags: arr(id(), { max: 30, unique: true }), review,
}, ["id", "title", "intro", "source", "chapters", "phase", "copyright", "reproduce", "copyrightBasis"]);
export const validateText = (v) => run(v, textSpec);

function checkSearchUrl(u, path, errors) {
  let p;
  try { p = new URL(u); } catch { return errors.push({ path, message: "searchUrl is not a URL" }); }
  if (p.protocol !== "https:") errors.push({ path, message: "searchUrl must be https:" });
  if (!SEARCH_HOSTS.includes(p.hostname)) errors.push({ path, message: `searchUrl host must be one of ${SEARCH_HOSTS.join(", ")}` });
  for (const k of p.searchParams.keys()) if (FORBIDDEN_QUERY.test(k)) errors.push({ path, message: `searchUrl query parameter "${k}" is not allowed (affiliate/tracking)` });
}

const panditSays = obj({ sa: str({ deva: true, placeholders: true, max: CAPS.devanagari }), hi: str({ max: CAPS.action }), en: str({ max: CAPS.action }), bho: str({ max: CAPS.action }) }, ["hi", "en", "bho"]);
const step = obj({
  n: int(1, 200), part: id(), layer: en(LAYERS), action: tri({ max: CAPS.action }), mantraIds: arr(id(), { max: 60, unique: true }),
  textRefs: arr(obj({ text: id(), chapter: oneOf(int(0, 999), arr(int(0, 999), { min: 1, max: 50 })), note: tri({ max: CAPS.short }) }, ["text", "chapter"]), { max: 20 }),
  panditSays, note: tri({ max: CAPS.action }), important: bool(), samagriIds: arr(id(), { max: 30, unique: true }), minutes: int(0, 600),
}, ["n", "layer", "action"]);
export const occasionSpec = obj({
  id: id(), code: str({ pattern: /^[A-Z]{1,2}\d{2}[a-z]?$/, patternName: "R2 code like M00 / F01" }), group: en(GROUPS), phase: int(1, 3),
  title: tri({ max: CAPS.title }), lede: tri({ max: CAPS.lede }), overview: tri({ max: CAPS.explanation }),
  when: obj({ rules: tri({ max: CAPS.explanation }), shubhvela: obj({ muhurat: oneOf(nul(), id()), festival: oneOf(nul(), id()), vrat: oneOf(nul(), id()) }, []) }, ["rules"]),
  roles: arr(obj({ role: tri({ max: CAPS.short }), does: tri({ max: CAPS.action }) }), { min: 1, max: 30 }),
  samagri: arr(obj({ id: id(), item: tri({ max: CAPS.short }), qty: str({ max: 80 }), note: tri({ max: CAPS.short }), must: bool(), searchUrl: str({ max: 500 }) }, ["id", "item", "qty"], { extra: (v, path, errors) => v.searchUrl !== undefined && checkSearchUrl(v.searchUrl, `${path}.searchUrl`, errors) }), { min: 1, max: 150, unique: "id" }),
  parts: arr(obj({ id: id(), title: tri({ max: CAPS.title }), summary: tri({ max: CAPS.lede }) }, ["id", "title"]), { max: 12, unique: "id" }),
  steps: arr(step, { min: 1, max: 200, unique: "n" }),
  variants: arr(obj({ region: str({ max: 60 }), what: tri({ max: CAPS.action }), source: id() }, ["region", "what"]), { max: 40 }),
  faq: arr(obj({ q: tri({ max: CAPS.short }), a: tri({ max: CAPS.action }) }), { max: 40 }),
  sources: arr(id(), { min: 1, max: 40, unique: true }), sensitive: arr(en(SENSITIVE), { max: 4, unique: true }),
  kathaId: id(), textIds: arr(id(), { max: 20, unique: true }), tags: arr(id(), { max: 30, unique: true }), review,
}, ["id", "code", "group", "phase", "title", "lede", "overview", "when", "roles", "samagri", "steps", "sources"], { unknownHint: DERIVED_HINT });
export const validateOccasion = (v) => run(v, occasionSpec);

export const kathaSpec = obj({
  id: id(), title: tri({ max: CAPS.title }), lede: tri({ max: CAPS.lede }), deity: str({ max: 80 }), textId: id(),
  puranicSource: obj({ ref: id(), locator: str({ max: 200 }) }), caveat: tri({ max: CAPS.short }),
  adhyayas: arr(obj({ n: int(1, 99), title: tri({ max: CAPS.title }), verseRefs: arr(str({ pattern: /^[a-z0-9-]+-\d+-\d+$/, patternName: "<textSlug>-<n>-<v>" }), { max: 400, unique: true }) }, ["n", "title"]), { min: 1, max: 99, unique: "n" }),
  vidhiOccasionId: id(), phase: int(1, 3), tags: arr(id(), { max: 30, unique: true }), review,
}, ["id", "title", "lede", "deity", "puranicSource", "adhyayas", "vidhiOccasionId", "phase"]);
export const validateKatha = (v) => run(v, kathaSpec);

export const LESSON_ID_RE = /^l[0-4]-\d{2}-[a-z0-9][a-z0-9-]*$/;
const option = obj({ id: str({ pattern: /^[a-d]$/, patternName: "a|b|c|d" }), text: tri({ max: CAPS.short }) });
const question = obj({
  q: tri({ max: CAPS.short }), options: arr(option, { min: 2, max: 4, unique: "id" }), answer: str({ pattern: /^[a-d]$/, patternName: "a|b|c|d" }),
  feedback: obj({ ok: tri({ max: CAPS.short }), no: tri({ max: CAPS.short }) }),
}, ["q", "options", "answer", "feedback"], { extra: (v, path, errors) => Array.isArray(v.options) && typeof v.answer === "string" && !v.options.some((o) => o && o.id === v.answer) && errors.push({ path: `${path}.answer`, message: "answer must be one of the option ids" }) });
export const lessonSpec = obj({
  id: str({ pattern: ID_RE, patternName: "id", notPrefix: "level-" }), level: int(0, 4), order: int(1, 99), title: tri({ max: CAPS.title }), summary: tri({ max: CAPS.lede }), minutes: int(1, 240),
  quiz: arr(question, { min: 3, max: 20 }),
  related: obj({ occasions: arr(id(), { max: 20, unique: true }), mantras: arr(id(), { max: 40, unique: true }), terms: arr(id(), { max: 40, unique: true }), texts: arr(id(), { max: 20, unique: true }), lessons: arr(id(), { max: 20, unique: true }) }, []),
  tags: arr(id(), { max: 30, unique: true }), review,
}, ["id", "level", "order", "title", "summary", "quiz"], { extra: (v, path, errors) => typeof v.id === "string" && !LESSON_ID_RE.test(v.id) && errors.push({ path: `${path}.id`, message: "lesson id must be l<level>-<nn>-<slug> (plan.md §2.8)" }) });
export const validateLesson = (v) => run(v, lessonSpec);

export const levelsSpec = arr(obj({ level: int(0, 4), title: tri({ max: CAPS.title }), summary: tri({ max: CAPS.lede }) }), { min: 1, max: 5, unique: "level" });
export const validateLevels = (v) => run(v, levelsSpec);

export const termSpec = obj({
  id: id(), definition: tri({ max: CAPS.meaning }), related: arr(id(), { max: 20, unique: true }), notes: str({ max: CAPS.short }),
  sources: arr(id(), { max: 10, unique: true }), occasions: arr(id(), { max: 20, unique: true }), review,
}, ["id", "definition"]);
export const validateTerm = (v) => run(v, termSpec);

/** UI tables: nested objects whose leaves are non-empty strings without HTML. */
export function validateUI(v) {
  const errors = [];
  const walk = (o, path) => {
    if (!o || typeof o !== "object" || Array.isArray(o)) return errors.push({ path, message: "must be an object of strings" });
    for (const [k, x] of Object.entries(o)) {
      const p = `${path}.${k}`;
      if (typeof x === "string") {
        if (!x.trim()) errors.push({ path: p, message: "empty string" });
        if (HTML_RE.test(x)) errors.push({ path: p, message: "HTML tags are not allowed" });
      } else walk(x, p);
    }
  };
  walk(v, "$");
  return { ok: errors.length === 0, errors };
}

const sourceEntry = obj({
  id: id(), project: en(SOURCE_PROJECTS), title: str({ max: 300 }), url: url(), retrieved: date(), licence: str({ max: 300 }), kind: en(SOURCE_KINDS),
  secondSourceAvailable: bool(), note: str({ max: 1000 }), titles: arr(str({ max: 200 }), { max: 20, unique: true }), wikisourceLang: en(["sa", "hi"]),
  encoders: str({ max: 300 }), item: str({ max: 200 }), publisher: str({ max: 200 }), year: str({ max: 20 }), locator: str({ max: 300 }),
}, ["id", "project", "title", "url", "retrieved", "licence", "kind", "secondSourceAvailable", "titles"]);
/** sources.json: { "_meta": {...}, "sources": [ {…}, … ] } with unique ids each equal to its key. */
export function validateSources(v) {
  const r = run(v, obj({ _meta: obj({ written: date(), note: str({ max: 2000 }), attributionLines: str({ max: 2000 }) }, []), sources: arr(sourceEntry, { min: 1, max: 2000, unique: "id" }) }, ["sources"]));
  return r;
}

const institution = obj({
  // course / duration are hi/en/bho (FIX-1a: the Level 0 table read English-only on hi/bho)
  id: id(), name: str({ max: 200 }), names: arr(str({ max: 200 }), { max: 10, unique: true }), course: tri({ max: 300 }), duration: tri({ max: 200 }),
  url: url(), urls: arr(url(), { max: 5 }), status: en(["fact", "to-confirm", "uncertain"]), note: str({ max: 600 }),
}, ["id", "name", "course", "url", "status"]);
export function validateInstitutions(v) {
  return run(v, obj({ _meta: obj({ written: date(), source: str({ max: 400 }), note: str({ max: 1000 }) }, []), institutions: arr(institution, { min: 1, max: 100, unique: "id" }) }, ["institutions"]));
}

export function validateLatinAllow(v) {
  return run(v, obj({ _meta: obj({ written: date(), note: str({ max: 1000 }) }, []), allow: arr(str({ max: 60 }), { min: 1, max: 2000, unique: true }) }, ["allow"]));
}

export function validateShubhvelaIds(v) {
  return run(v, obj({ _note: str({ max: 600 }), muhurat: arr(id(), { min: 1, unique: true }), festivals: arr(id(), { min: 1, unique: true }), vrats: arr(id(), { min: 1, unique: true }), copied: date(), from: str({ pattern: /^[0-9a-f]{7,40}$/, patternName: "git short hash" }) }, ["muhurat", "festivals", "vrats", "copied", "from"]));
}

/** Front matter of a Markdown file (first line JSON): {title, summary} (design §10.4). */
export function validateFrontMatter(v) {
  return run(v, obj({ title: str({ max: CAPS.title }), summary: str({ max: CAPS.lede }), slug: id(), review: en(REVIEW_STATES) }, ["title", "summary"]));
}

export const VALIDATORS = {
  mantra: validateMantra, verse: validateVerse, chapter: validateChapter, text: validateText, occasion: validateOccasion, katha: validateKatha,
  lesson: validateLesson, levels: validateLevels, term: validateTerm, ui: validateUI, sources: validateSources, institutions: validateInstitutions,
  latinAllow: validateLatinAllow, shubhvelaIds: validateShubhvelaIds, frontMatter: validateFrontMatter,
};
