#!/usr/bin/env node
// Content gate (design.md §10.7–10.9; brief §6.6, §13.2, §14; design-review NIT 14). Rules G1–G21 plus the §10.9
// svara-fallback FLAG (G22). Levels: FAIL (blocks, exit 3), FLAG (listed), WARN (lane mode only: a reference whose
// target is in no known pool). Prints one line per finding "LEVEL  file  rule  message" and ALWAYS writes
// dist/_reports/gate.json — the only dist write on failure.
//
//   npm run gate                      validate CONTENT_DIR (default content/)
//   node build/gate.mjs --dir <path>  validate that directory instead
//   node build/gate.mjs --dir <path> --lane
//       lane mode (brief §13.2): ids not found in <dir> ∪ content/ ∪ every staging dir
//       .agents/tasks/v1-build/staging/<A|B|C>/<item-id>/ are WARN, not FAIL; duplicate ids across <dir> and content/
//       or any other staging dir are FAIL; registries missing in <dir> are taken from content/ (sources.json merged).
//   --phase <1|2|3>   current build phase for G7 (default PB_PHASE env or 1)   --staging <root>   --quiet
//   --dist <path>     where dist/_reports/gate.json is written (default DIST env or dist/; brief §15: flags, not $env:)
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent, poolOf, stagingDirs, sameDir } from "./lib/load.mjs";
import { VALIDATORS, SENSITIVE } from "./lib/schema.mjs";
import { isDevanagariOnly, countFallbackSvara } from "./lib/deva.mjs";
import { toIAST } from "./lib/translit.mjs";
import { isPublished, paginate } from "./lib/derive.mjs";
import { internalLinks, proseOnly, TERM_RE, PLACEHOLDER_RE, LINK_RE } from "./lib/md.mjs";
import { createRoutes } from "./lib/routes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const LANGS = ["hi", "en", "bho"];
export const DEFAULT_STAGING = join(ROOT, ".agents", "tasks", "v1-build", "staging");

// ---------------------------------------------------------------- helpers
const isTri = (o) => !!o && typeof o === "object" && !Array.isArray(o) && LANGS.some((l) => l in o) && Object.keys(o).every((k) => LANGS.includes(k) || k === "sa");
const DEVA_KEYS = new Set(["devanagari", "sa", "reading", "speaker"]);
const NON_PROSE_TRI = new Set(["title", "item", "role", "gloss"]);
/** Fields whose prose must link every named source/institution (G16); labels, options and glosses are exempt. */
const G16_KEYS = new Set(["body", "overview", "explanation", "rules", "action", "note", "a", "definition", "intro", "what", "does", "caveat", "summary", "lede", "meaning"]);

/** Every trilingual object in a record: [{ path, obj, key }] (skips Devanagari-only fields). */
function triFields(rec, path = "$", out = [], key = null) {
  if (!rec || typeof rec !== "object") return out;
  if (isTri(rec)) { out.push({ path, obj: rec, key }); return out; }
  if (Array.isArray(rec)) rec.forEach((x, i) => triFields(x, `${path}[${i}]`, out, key));
  else for (const [k, v] of Object.entries(rec)) if (!k.startsWith("_") && k !== "review") triFields(v, `${path}.${k}`, out, k);
  return out;
}

/** Devanagari-only string fields of a record: [{ path, text, placeholders }]. */
function devaFields(rec, path = "$", out = [], parentKey = null) {
  if (!rec || typeof rec !== "object") return out;
  if (Array.isArray(rec)) { rec.forEach((x, i) => devaFields(x, `${path}[${i}]`, out, parentKey)); return out; }
  for (const [k, v] of Object.entries(rec)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string" && DEVA_KEYS.has(k) && !(k === "sa" && parentKey === "pada" && false)) out.push({ path: `${path}.${k}`, text: v, placeholders: k === "sa" && parentKey === "panditSays" });
    else if (v && typeof v === "object") devaFields(v, `${path}.${k}`, out, k);
  }
  return out;
}

/** Devanagari-aware word boundary for the forbidden-list patterns (JS \b is ASCII-only). */
function devaPattern(src) {
  const B_L = "(?<![\\p{L}\\p{M}\\p{N}])", B_R = "(?![\\p{L}\\p{M}\\p{N}])";
  let s = src.replace(/^\\b/, B_L).replace(/\\b$/, B_R);
  s = s.replace(/\\b\|\\b/g, `${B_R}|${B_L}`).replace(/\\b(?=[\p{L}\p{M}])/gu, B_L).replace(/\\b/g, B_R);
  return new RegExp(s, "gu");
}
const tokenise = (s) => String(s).split(/[\s।॥?!,;:()"“”'‘’«»\-–—\/\[\]{}|*#…]+/u).map((w) => w.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, "")).filter(Boolean);
const wordRe = (w) => new RegExp(`(?<![\\p{L}\\p{M}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{M}])`, "u");

/** Prose fields per language of a record: [{ path, lang, text, key }]. */
function proseFields(rec) {
  const out = [];
  for (const f of triFields(rec)) for (const l of LANGS) if (typeof f.obj[l] === "string") out.push({ path: `${f.path}.${l}`, lang: l, text: f.obj[l], key: f.key });
  return out;
}

// honesty lint seeds (R4 §5.4)
const HONESTY = {
  hi: {
    cure: /(ठीक|दूर|नष्ट|नाश|समाप्त)\s*(कर(ता|ती|ते)|हो(ता|ती|ते))\s*(है|हैं)|रोग(मुक्त|नाश|हर)|संतान\s*(प्राप्ति|सुख)\s*(होती|होगी|मिलती)/u,
    disease: /गर्भ|बाँझ|बांझ|मधुमेह|शुगर|रक्तचाप|ब्लड\s*प्रेशर|मिर्गी|पागलपन|कैंसर|टीबी|लकवा|मोटापा|कद\s*बढ़/u,
    absolute: /निश्चित ही|अवश्य ही|गारंटी|सौ प्रतिशत|वैज्ञानिक रूप से सिद्ध/u,
    subject: /मंत्र|मन्त्र|जाप|जप|पूजा|व्रत|पाठ|हवन|यज्ञ|अनुष्ठान|स्तोत्र|चालीसा|उपाय/u,
  },
  bho: {
    cure: /(ठीक|दूर|नास|खतम)\s*(कर|हो)(ला|ले|ली|त)|रोग|संतान\s*(हो|मिल)|लरिका\s*(हो|मिल)/u,
    disease: /रोग|गर्भ|बाँझ|मधुमेह|शुगर|कैंसर|टीबी|लकवा|मिर्गी/u,
    absolute: /गारंटी|पक्का|सौ\s*प्रतिसत/u,
    subject: /मंत्र|जाप|जप|पूजा|बरत|व्रत|पाठ|हवन|जग्य|यज्ञ|अनुष्ठान|स्तोत्र|चालीसा|उपाय/u,
  },
  en: {
    cure: /\b(cure[sd]?|heal(s|ed)?|prevent(s|ed)?|treat(s|ed)?|diagnos\w*)\b/iu,
    disease: /\b(infertil\w*|concei\w*|pregnan\w*|impoten\w*|virilit\w*|menstru\w*|height|weight loss|blood pressure|diabet\w*|epilep\w*|insan\w*|cancer|tubercul\w*|paralys\w*)\b/iu,
    absolute: /\b(guarantee[sd]?|100\s?%|scientifically proven|doctors agree)\b/iu,
    subject: /\b(mantra|japa?|puja|vrat|path|havan|homa|yaj?na|observance|stotra|chalisa|remedy|upay)\b/iu,
  },
};
const sentences = (s) => String(s).split(/(?<=[।॥.!?])\s+|\n+/u).filter((x) => x.trim());

const COUNT_WORDS = /(?<![\p{L}\p{M}])([0-9]+|[०-९]+)\s*(अवसर|मंत्र|मन्त्र|श्लोक|शब्द|अध्याय|कथाएँ|कथा|पाठ|occasions?|mantras?|verses?|terms?|chapters?|kathas?|lessons?|pages?|glossary entries)(?![\p{L}\p{M}])/giu;

function stripLinks(s) {
  return String(s).replace(LINK_RE, " ").replace(PLACEHOLDER_RE, " ").replace(TERM_RE, " ");
}

// ---------------------------------------------------------------- the gate
/**
 * Run every rule over a loaded content dir.
 * @param data   loadContent() result
 * @param opts   { phase, lane, pools: [idPool…] (lane mode), registries: data of content/ (lane mode fallback), R }
 */
export function runGate(data, opts = {}) {
  const phase = Number(opts.phase || process.env.PB_PHASE || 1);
  const lane = !!opts.lane;
  const pools = opts.pools || [];
  const findings = [];
  const F = (file, rule, message) => findings.push({ level: "FAIL", file, rule, message });
  const FLAG = (file, rule, message) => findings.push({ level: "FLAG", file, rule, message });
  const WARN = (file, rule, message) => findings.push({ level: "WARN", file, rule, message });
  // unresolved reference: FAIL normally; in lane mode WARN when no pool has it
  const unresolved = (file, rule, what, id, poolKey) => {
    if (lane) {
      const found = pools.some((p) => p[poolKey] && p[poolKey].has(id));
      if (found) return;
      WARN(file, rule, `${what} "${id}" not found in this dir, content/ or any staging dir (lane mode — the integrate step re-checks)`);
    } else F(file, rule, `${what} "${id}" does not resolve`);
  };

  // registries (lane fallback to content/)
  const reg = (key) => data[key] ?? opts.registries?.[key] ?? null;
  const ui = Object.keys(data.ui).length === 3 ? data.ui : opts.registries?.ui || data.ui;
  const termbank = reg("termbank"), forbidden = reg("forbidden"), latinAllowFile = reg("latinAllow"), shubhvelaIds = reg("shubhvelaIds"), institutions = reg("institutions");
  const sources = new Map(opts.registries?.sources || []);
  for (const [k, v] of data.sources) sources.set(k, v);
  const own = { ...(opts.registries?.sourcesFile ? {} : {}), sources: [...sources.values()] };

  // ---- G1 schema + layout
  for (const f of data.unknownFiles) F(f, "G1", "unexpected file: not a record of the content layout (design §10.1)");
  const val = (kind, value, file) => {
    const r = VALIDATORS[kind](value);
    for (const e of r.errors) findings.push({ level: "FAIL", file, rule: e.rule || "G1", message: `${e.path}: ${e.message}` });
    return r.ok;
  };
  for (const l of LANGS) { if (!ui[l]) F(`ui/${l}.json`, "G1", "UI string table missing"); else val("ui", ui[l], `ui/${l}.json`); }
  if (!termbank) F("termbank.json", "G1", "term bank missing (copy research/termbank.json)");
  if (!forbidden) F("forbidden-hi-in-bho.json", "G1", "forbidden-word lists missing");
  if (!sources.size) F("sources.json", "G1", "source registry missing or empty");
  else val("sources", own, "sources.json");
  if (!latinAllowFile) F("latin-allow.json", "G1", "Latin allow-list missing"); else val("latinAllow", latinAllowFile, "latin-allow.json");
  if (!shubhvelaIds) F("shubhvela-ids.json", "G1", "Shubhvela id lists missing (node tools/shubhvela-ids.mjs)"); else val("shubhvelaIds", shubhvelaIds, "shubhvela-ids.json");
  if (institutions) val("institutions", institutions, "institutions.json");
  for (const m of data.mantras) val("mantra", stripMeta(m), m._file);
  for (const o of data.occasions) {
    val("occasion", stripMeta(o), o._file);
    if (o.group && o._dirGroup && o.group !== o._dirGroup) F(o._file, "G1", `group "${o.group}" but the file sits under occasions/${o._dirGroup}/`);
    if (o.id && o._file && !o._file.endsWith(`/${o.id}.json`)) F(o._file, "G1", `id "${o.id}" must equal the file name`);
  }
  for (const m of data.mantras) if (m.id && !m._file.endsWith(`/${m.id}.json`)) F(m._file, "G1", `id "${m.id}" must equal the file name`);
  for (const t of data.texts) {
    if (t._orphanChapters) { F(t._file, "G1", `chapter files exist but texts/${t._dir}/text.json is missing`); continue; }
    val("text", stripMeta(t), t._file);
    if (t.id !== t._dir) F(t._file, "G1", `id "${t.id}" must equal the folder name texts/${t._dir}/`);
    for (const c of t.chapterFiles) {
      val("chapter", stripMeta(c), c._file);
      if (c.text !== t.id) F(c._file, "G1", `chapter "text" must be "${t.id}"`);
      if (c.n !== c._n) F(c._file, "G1", `chapter n ${c.n} must equal the file name ${c._n}.json`);
    }
  }
  for (const k of data.kathas) {
    val("katha", stripMeta(k), k._file);
    if (k.id !== k._dir) F(k._file, "G1", `id "${k.id}" must equal the folder name kathas/${k._dir}/`);
  }
  if (data.levels) val("levels", data.levels, data.levelsFile);
  for (const l of data.lessons) { val("lesson", stripMeta(l), l._file); if (l.id !== l._base) F(l._file, "G1", `id "${l.id}" must equal the file name`); }
  for (const g of data.terms) { val("term", stripMeta(g), g._file); if (g.id !== g._base) F(g._file, "G1", `id "${g.id}" must equal the file name`); }
  for (const md of data.mdFiles) val("frontMatter", md.meta, md._file);
  // md language sets complete
  const mdSets = [
    ...data.kathas.flatMap((k) => Object.entries(k.md).map(([n, set]) => [`kathas/${k._dir}/${n}.*.md`, set])),
    ...data.lessons.map((l) => [`learn/${l._base}.*.md`, l.md]),
    ...data.reference.map((r) => [r._file, r.md]),
    ...data.statics.map((s) => [s._file, s.md]),
  ];
  for (const [file, set] of mdSets) for (const l of LANGS) if (!set[l]) F(file, "G2", `Markdown for "${l}" missing (id parity)`);
  for (const l of data.lessons) if (!Object.keys(l.md).length) F(l._file, "G2", "lesson prose learn/<id>.{hi,en,bho}.md missing");
  for (const k of data.kathas) for (const a of k.adhyayas || []) if (!k.md[a.n]) F(k._file, "G2", `adhyaya ${a.n} retelling kathas/${k._dir}/${a.n}.{hi,en,bho}.md missing`);

  // ---- G2 parity (generic) + UI key sets
  const allRecords = [
    ...data.mantras.map((r) => [r._file, r]), ...data.occasions.map((r) => [r._file, r]), ...data.texts.filter((t) => !t._orphanChapters).map((r) => [r._file, r]),
    ...data.texts.flatMap((t) => (t.chapterFiles || []).map((c) => [c._file, c])), ...data.kathas.map((r) => [r._file, r]), ...data.lessons.map((r) => [r._file, r]),
    ...data.terms.map((r) => [r._file, r]), ...(data.levels ? [[data.levelsFile, data.levels]] : []),
  ];
  for (const [file, rec] of allRecords) for (const f of triFields(stripMeta(rec))) for (const l of LANGS) if (typeof f.obj[l] !== "string" || !f.obj[l].trim()) F(file, "G2", `${f.path}.${l} missing or empty`);
  if (LANGS.every((l) => ui[l])) {
    const keys = Object.fromEntries(LANGS.map((l) => [l, flatKeys(ui[l]).sort()]));
    for (const l of ["en", "bho"]) {
      const miss = keys.hi.filter((k) => !keys[l].includes(k)), extra = keys[l].filter((k) => !keys.hi.includes(k));
      if (miss.length) F(`ui/${l}.json`, "G2", `keys missing vs hi: ${miss.slice(0, 10).join(", ")}${miss.length > 10 ? " …" : ""}`);
      if (extra.length) F(`ui/${l}.json`, "G2", `keys not in hi: ${extra.slice(0, 10).join(", ")}${extra.length > 10 ? " …" : ""}`);
    }
  }

  // ---- G3 Devanagari-only (explicit pass; schema reports the same for typed fields) + G22 svara fallback + translit
  for (const [file, rec] of allRecords) {
    for (const d of devaFields(stripMeta(rec))) {
      const r = isDevanagariOnly(d.text, { placeholders: d.placeholders });
      if (!r.ok && !findings.some((x) => x.file === file && x.rule === "G3" && x.message.startsWith(d.path.replace(/^\$\.?/, "$.")))) F(file, "G3", `${d.path}: not Devanagari-only: ${r.bad.map((b) => `${JSON.stringify(b.ch)} ${b.code}`).join(", ")}`);
    }
    const n = countFallbackSvara(JSON.stringify(devaFields(stripMeta(rec)).map((d) => d.text)));
    if (n) FLAG(file, "G22", `${n} occurrence(s) of U+0953/U+0954 (Tiro lacks them; Noto Sans Devanagari fallback — design §10.9)`);
  }
  const translitCheck = (file, id, text) => { try { toIAST(text, id); } catch (err) { F(file, "G3", err.message); } };
  for (const m of data.mantras) if (typeof m.devanagari === "string") translitCheck(m._file, m.id, m.devanagari);
  for (const t of data.texts) for (const c of t.chapterFiles || []) for (const v of c.verses || []) if (typeof v.devanagari === "string") translitCheck(c._file, `${t.id}-${c._n}-${v.v}`, v.devanagari);

  // ---- G4 sources
  const needSource = (file, src, what = "source") => {
    if (!src || typeof src !== "object") return null;
    const e = sources.get(src.ref);
    if (!e) { F(file, "G4", `${what}.ref "${src.ref}" is not in sources.json`); return null; }
    if (!e.url) F(file, "G4", `sources.json#${src.ref} has no url`);
    if (!src.retrieved) F(file, "G4", `${what}.retrieved missing`);
    return e;
  };
  const needChecked = (file, rec, entry) => {
    if (entry && entry.secondSourceAvailable && !(Array.isArray(rec.checkedAgainst) && rec.checkedAgainst.length)) F(file, "G4", `checkedAgainst required: sources.json#${entry.id} has secondSourceAvailable: true`);
    for (const c of rec.checkedAgainst || []) if (!sources.get(c.ref)) F(file, "G4", `checkedAgainst.ref "${c.ref}" is not in sources.json`);
    for (const v of rec.variants || []) if (v.source && !sources.get(v.source)) F(file, "G4", `variants[].source "${v.source}" is not in sources.json`);
  };
  for (const m of data.mantras) { const e = needSource(m._file, m.source); needChecked(m._file, m, e); }
  for (const t of data.texts.filter((t) => !t._orphanChapters)) {
    const e = needSource(t._file, t.source); needChecked(t._file, t, e);
    for (const c of t.chapterFiles) { const ce = needSource(c._file, c.source); needChecked(c._file, c, ce); for (const v of c.verses || []) { if (v.source) needSource(c._file, v.source, `verses[${v.v}].source`); needChecked(c._file, v, null); } }
  }
  for (const o of data.occasions) for (const s of o.sources || []) if (!sources.get(s)) F(o._file, "G4", `sources[] "${s}" is not in sources.json`);
  for (const o of data.occasions) for (const v of o.variants || []) if (v.source && !sources.get(v.source)) F(o._file, "G4", `variants[].source "${v.source}" is not in sources.json`);
  for (const k of data.kathas) if (k.puranicSource && !sources.get(k.puranicSource.ref)) F(k._file, "G4", `puranicSource.ref "${k.puranicSource.ref}" is not in sources.json`);
  for (const g of data.terms) for (const s of g.sources || []) if (!sources.get(s)) F(g._file, "G4", `sources[] "${s}" is not in sources.json`);

  // ---- id sets (this dir)
  const ids = poolOf(data);
  const has = (key, id) => ids[key].has(id);
  const ref = (file, rule, what, id, key) => { if (!has(key, id)) unresolved(file, rule, what, id, key); };

  // ---- G5 occasion completeness and references
  const referencedMantras = new Map(); // id → [occasion files]
  for (const o of data.occasions) {
    const partIds = new Set((o.parts || []).map((p) => p.id));
    const samagriIds = new Set((o.samagri || []).map((s) => s.id));
    for (const s of o.steps || []) {
      if (s.part && !partIds.has(s.part)) F(o._file, "G5", `steps[${s.n}].part "${s.part}" is not in parts[]`);
      for (const id of s.mantraIds || []) { ref(o._file, "G5", `steps[${s.n}] mantra`, id, "mantras"); if (!referencedMantras.has(id)) referencedMantras.set(id, []); referencedMantras.get(id).push(o._file); }
      for (const id of s.samagriIds || []) if (!samagriIds.has(id)) F(o._file, "G5", `steps[${s.n}].samagriIds "${id}" is not in samagri[]`);
      for (const tr of s.textRefs || []) {
        ref(o._file, "G5", `steps[${s.n}] textRefs.text`, tr.text, "texts");
        const chs = Array.isArray(tr.chapter) ? tr.chapter : [tr.chapter];
        for (const n of chs) if (has("texts", tr.text) || !lane) { if (!has("chapters", `${tr.text}-${n}`)) unresolved(o._file, "G5", `steps[${s.n}] textRefs chapter`, `${tr.text}-${n}`, "chapters"); }
        else if (!pools.some((p) => p.chapters.has(`${tr.text}-${n}`))) WARN(o._file, "G5", `steps[${s.n}] textRefs chapter "${tr.text}-${n}" not found in any pool (lane mode)`);
      }
    }
    if (o.parts && o.parts.length) for (const p of o.parts) if (!(o.steps || []).some((s) => s.part === p.id)) F(o._file, "G5", `parts[] "${p.id}" has no step`);
    if (o.kathaId) ref(o._file, "G5", "kathaId", o.kathaId, "kathas");
    for (const id of o.textIds || []) ref(o._file, "G5", "textIds", id, "texts");
  }
  for (const t of data.texts.filter((t) => !t._orphanChapters)) if (t.vidhiOccasionId) ref(t._file, "G5", "vidhiOccasionId", t.vidhiOccasionId, "occasions");
  for (const k of data.kathas) {
    ref(k._file, "G5", "vidhiOccasionId", k.vidhiOccasionId, "occasions");
    if (k.textId) ref(k._file, "G5", "textId", k.textId, "texts");
    for (const a of k.adhyayas || []) for (const vr of a.verseRefs || []) ref(k._file, "G5", `adhyayas[${a.n}].verseRefs`, vr, "verses");
  }
  for (const l of data.lessons) {
    const rel = l.related || {};
    for (const id of rel.occasions || []) ref(l._file, "G5", "related.occasions", id, "occasions");
    for (const id of rel.mantras || []) ref(l._file, "G5", "related.mantras", id, "mantras");
    for (const id of rel.texts || []) ref(l._file, "G5", "related.texts", id, "texts");
    for (const id of rel.lessons || []) ref(l._file, "G5", "related.lessons", id, "lessons");
    for (const id of rel.terms || []) if (!termbank?.terms?.some((t) => t.id === id)) F(l._file, "G5", `related.terms "${id}" is not in termbank.json`);
    if (Array.isArray(data.levels) && !data.levels.some((x) => x.level === l.level)) F(l._file, "G5", `level ${l.level} is not in learn/levels.json`);
  }
  for (const g of data.terms) {
    if (termbank && !termbank.terms.some((t) => t.id === g.id)) F(g._file, "G5", `glossary id "${g.id}" is not in termbank.json`);
    for (const id of g.related || []) if (termbank && !termbank.terms.some((t) => t.id === id)) F(g._file, "G5", `related "${id}" is not in termbank.json`);
    for (const id of g.occasions || []) ref(g._file, "G5", "occasions", id, "occasions");
  }

  // ---- G6 ritual-mantra depth
  const mantraById = new Map(data.mantras.map((m) => [m.id, m]));
  for (const [id, files] of referencedMantras) {
    const m = mantraById.get(id);
    if (!m) continue;
    if (!Array.isArray(m.pada) || !m.pada.length) F(m._file, "G6", `ritual mantra (used by ${files[0]}) needs pada[] with per-word meanings`);
    if (!isTri(m.explanation)) F(m._file, "G6", `ritual mantra (used by ${files[0]}) needs explanation {hi, en, bho}`);
  }

  // ---- G7 chapters
  for (const t of data.texts.filter((t) => !t._orphanChapters)) {
    const byN = new Map((t.chapterFiles || []).map((c) => [c._n, c]));
    let published = 0;
    for (const meta of t.chapters || []) {
      const c = byN.get(meta.n);
      if (!c) { FLAG(t._file, "G7", `chapter ${meta.n} is listed but texts/${t.id}/${meta.n}.json does not exist yet (not rendered)`); continue; }
      if (Array.isArray(c.verses) && meta.verseCount !== c.verses.length) F(t._file, "G7", `chapters[n=${meta.n}].verseCount ${meta.verseCount} ≠ ${c.verses.length} verses in ${c._file}`);
      if (isPublished(c)) published++;
      else { const missing = (c.verses || []).filter((v) => !isTri(v.meaning)).length; FLAG(c._file, "G7", `unpublished: ${missing} of ${(c.verses || []).length} verses have no meaning in all three languages (not rendered, not counted)`); }
    }
    for (const c of t.chapterFiles || []) if (!(t.chapters || []).some((m) => m.n === c._n)) F(c._file, "G7", `chapter ${c._n} is not listed in text.json#chapters`);
    if (!published && t.phase <= phase) F(t._file, "G7", `text has no published chapter and its phase (${t.phase}) is ≤ the current phase (${phase})`);
  }

  // ---- prose collections (JSON tri fields + Markdown bodies)
  const prose = []; // { file, path, lang, text, key, kind }
  for (const [file, rec] of allRecords) for (const p of proseFields(stripMeta(rec))) prose.push({ file, ...p, kind: "json", phalashruti: rec.phalashruti === true, isGlossary: file.startsWith("glossary/") });
  for (const [file, rec] of allRecords) for (const p of versePhalashruti(rec)) prose.push({ file, ...p, kind: "json", phalashruti: true });
  for (const md of data.mdFiles) {
    const lang = /\.(hi|en|bho)\.md$/.exec(md._file)[1];
    prose.push({ file: md._file, path: "body", lang, text: md.body, key: "body", kind: "md", phalashruti: false, isGlossary: false });
    prose.push({ file: md._file, path: "meta.title", lang, text: md.meta.title || "", key: "title", kind: "json", phalashruti: false, isGlossary: false });
    prose.push({ file: md._file, path: "meta.summary", lang, text: md.meta.summary || "", key: "summary", kind: "json", phalashruti: false, isGlossary: false });
  }
  for (const l of LANGS) if (ui[l]) for (const [k, v] of Object.entries(flatten(ui[l]))) prose.push({ file: `ui/${l}.json`, path: k, lang: l, text: v, key: k, kind: "ui", phalashruti: false, isGlossary: false });

  // ---- G8 Latin tokens in hi/bho prose
  const latinAllow = new Set([...(forbidden?.latinAllow || []), ...(latinAllowFile?.allow || []), "GitHub", "Shubhvela", "IAST", "PDF", "URL"].map((x) => x.toLowerCase()));
  for (const p of prose) {
    if (p.lang === "en" || p.kind === "ui") continue;
    const clean = stripLinks(p.text).replace(/https?:\/\/\S+/g, " ").replace(/[\w.-]+@[\w.-]+/g, " ");
    const bad = [...new Set((clean.match(/[A-Za-z][A-Za-z0-9'’.+-]*/g) || []).map((w) => w.replace(/[.'’+-]+$/, "")).filter((w) => w && !latinAllow.has(w.toLowerCase()) && !/^[A-Z]{1,2}$/.test(w)))];
    if (bad.length) F(p.file, "G8", `${p.path}: Latin token(s) in ${p.lang} prose: ${bad.slice(0, 8).join(", ")}${bad.length > 8 ? " …" : ""} (add proper names to content/latin-allow.json)`);
  }

  // ---- G9 forbidden Hindi in Bhojpuri
  if (forbidden) {
    const hard = new Set(forbidden.hard.map((x) => x.hi));
    const allow = new Set(forbidden.allow.map((x) => x.token));
    const soft = new Set(forbidden.soft.map((x) => x.hi).filter((w) => !allow.has(w)));
    const pats = forbidden.patterns.map((x) => ({ re: devaPattern(x.regex), bho: x.bho, src: x.regex }));
    for (const p of prose) {
      if (p.lang !== "bho") continue;
      const text = p.kind === "md" ? proseOnly(p.text) : stripLinks(p.text);
      const toks = tokenise(text);
      const h = [...new Set(toks.filter((w) => hard.has(w) && !allow.has(w)))];
      const s = [...new Set(toks.filter((w) => soft.has(w)))];
      if (h.length) F(p.file, "G9", `${p.path}: Hindi form(s) in Bhojpuri: ${h.join(", ")}`);
      if (s.length) FLAG(p.file, "G9", `${p.path}: review these token(s) (soft list): ${s.join(", ")}`);
      for (const pt of pats) { pt.re.lastIndex = 0; if (pt.re.test(text)) F(p.file, "G9", `${p.path}: Hindi pattern /${pt.src}/ → use ${pt.bho}`); }
    }
  }

  // ---- G10 nukta (bho) and pancham-varna (hi)
  const BHO_NUKTA = /[\u0958-\u095B\u095E\u095F]|(?<![\u0921\u0922])\u093C/u;
  const HI_PANCHAM = /\u0919\u094D[\u0915-\u0918]|\u091E\u094D[\u091A-\u091D]|\u0923\u094D[\u091F-\u0922]|\u0928\u094D[\u0924-\u0927]|\u092E\u094D[\u092A-\u092D]/u;
  for (const p of prose) {
    if (p.kind === "ui") continue;
    if (p.lang === "bho") { const m = BHO_NUKTA.exec(p.text); if (m) F(p.file, "G10", `${p.path}: nukta outside ड़/ढ़ near "${p.text.slice(Math.max(0, m.index - 6), m.index + 6)}"`); }
    if (p.lang === "hi") { const m = HI_PANCHAM.exec(p.text); if (m) F(p.file, "G10", `${p.path}: pancham-varna conjunct "${m[0]}" — Hindi prose uses the anusvara (IS 16500 §2.6.1.2; conjuncts only inside Sanskrit fields)`); }
  }

  // ---- G11 length ratio
  for (const [file, rec] of allRecords) for (const f of triFields(stripMeta(rec))) {
    const en = f.obj.en || "";
    if (en.length < 40) continue;
    for (const l of ["hi", "bho"]) {
      const r = (f.obj[l] || "").length / en.length;
      if (r < 0.6 || r > 1.8) FLAG(file, "G11", `${f.path}: ${l}:en length ratio ${r.toFixed(2)} outside 0.6–1.8`);
    }
  }
  for (const [file, set] of mdSets) if (set.en && set.en.body.length >= 200) for (const l of ["hi", "bho"]) if (set[l]) { const r = set[l].body.length / set.en.body.length; if (r < 0.6 || r > 1.8) FLAG(file, "G11", `${l}:en body length ratio ${r.toFixed(2)} outside 0.6–1.8`); }

  // ---- G12 internal links resolve
  const routePaths = routeSet(data, opts.R);
  for (const p of prose) {
    if (p.kind === "ui") continue;
    for (const link of internalLinks(p.text)) {
      const target = link.replace(/[?#].*$/, "").replace(/^\/+/, "").replace(/^(hi|en|bho)\//, "");
      if (!target) continue;
      if (routePaths.has(target)) continue;
      if (lane && (/^(occasions|mantras|texts|kathas|learn|glossary|reference)\/[a-z0-9-]+\//.test(target))) { WARN(p.file, "G12", `${p.path}: link "${link}" is not a page of this dir (lane mode)`); continue; }
      F(p.file, "G12", `${p.path}: internal link "${link}" does not resolve to a route (write lang-less paths like /occasions/vivah/)`);
    }
  }

  // ---- G13 glossary terms
  const tbIds = new Set((termbank?.terms || []).map((t) => t.id));
  const glossaryTerms = (termbank?.terms || []).filter((t) => ids.terms.has(t.id) || pools.some((p) => p.terms.has(t.id)));
  const byFile = new Map();
  for (const p of prose) {
    if (p.kind === "ui") continue;
    for (const m of p.text.matchAll(TERM_RE)) {
      if (!tbIds.has(m[1])) F(p.file, "G13", `${p.path}: [[${m[1]}]] is not a term-bank id`);
    }
    if (!byFile.has(p.file)) byFile.set(p.file, { marked: new Set(), text: { hi: "", bho: "" } });
    const slot = byFile.get(p.file);
    for (const m of p.text.matchAll(TERM_RE)) slot.marked.add(m[1]);
    if ((p.lang === "hi" || p.lang === "bho") && !DEVA_KEYS.has(p.key)) slot.text[p.lang] += "\n" + stripLinks(p.text);
  }
  for (const [file, slot] of byFile) {
    if (file.startsWith("glossary/")) continue;
    const unmarked = [];
    for (const t of glossaryTerms) {
      if (slot.marked.has(t.id)) continue;
      const forms = [t.hi, t.bho].filter((x) => typeof x === "string" && x.length >= 3);
      if (forms.some((w) => wordRe(w).test(slot.text.hi) || wordRe(w).test(slot.text.bho))) unmarked.push(t.id);
    }
    if (unmarked.length) FLAG(file, "G13", `glossary term(s) used without [[…]] marking: ${unmarked.slice(0, 10).join(", ")}${unmarked.length > 10 ? ` (+${unmarked.length - 10})` : ""}`);
  }

  // ---- G14 honesty lint
  for (const p of prose) {
    if (p.kind === "ui" || p.phalashruti || NON_PROSE_TRI.has(p.key)) continue;
    const H = HONESTY[p.lang];
    const text = p.kind === "md" ? proseOnly(p.text) : stripLinks(p.text);
    for (const s of sentences(text)) {
      const cure = H.cure.test(s), disease = H.disease.test(s), abs = H.absolute.test(s);
      if (!cure && !disease && !abs) continue;
      if (cure && disease && H.subject.test(s) && !p.isGlossary) F(p.file, "G14", `${p.path}: outcome claim about a ${p.lang === "en" ? "mantra/puja/vrat" : "मंत्र/पूजा/व्रत"} with a curative verb and a Schedule disease term: “${s.trim().slice(0, 90)}” (R4 §5.3 rule 2 — use the "tradition holds" frame)`);
      else FLAG(p.file, "G14", `${p.path}: honesty lint (${[cure && "curative verb", disease && "health term", abs && "absolute claim"].filter(Boolean).join(", ")}): “${s.trim().slice(0, 90)}” — frame as परम्परा में माना जाता है / tradition holds`);
    }
  }

  // ---- G15 sensitive notes available
  for (const o of data.occasions) for (const s of o.sensitive || []) {
    const key = s === "pregnancy" ? "health_note" : `${s}_note`;
    for (const l of LANGS) if (ui[l] && !flatten(ui[l])[`honesty.${key}`]) F(o._file, "G15", `sensitive "${s}" needs ui/${l}.json honesty.${key}`);
    if (!SENSITIVE.includes(s)) F(o._file, "G15", `unknown sensitive kind "${s}"`);
  }

  // ---- G16 named sources are links
  const titles = [];
  for (const e of sources.values()) for (const t of e.titles || []) if (t.length >= 4) titles.push({ t, from: `sources.json#${e.id}` });
  for (const i of institutions?.institutions || []) for (const t of [i.name, ...(i.names || [])]) if (t && t.length >= 4) titles.push({ t, from: `institutions.json#${i.id}` });
  for (const p of prose) {
    if (p.kind === "ui" || DEVA_KEYS.has(p.key) || !G16_KEYS.has(p.key)) continue;
    const bare = stripLinks(p.text);
    for (const { t, from } of titles) if (bare.includes(t)) F(p.file, "G16", `${p.path}: “${t}” (${from}) appears without a link — every named source/institution is a link (brief §5.1)`);
  }

  // ---- G17 literal counts
  for (const p of prose) {
    if (p.kind === "ui" || DEVA_KEYS.has(p.key)) continue;
    const text = stripLinks(p.text);
    const m = text.match(COUNT_WORDS);
    if (m) FLAG(p.file, "G17", `${p.path}: literal count "${m[0]}" — numbers about the corpus come only from {{count:…}} (brief §1)`);
  }

  // ---- G18 duplicate ids (within this dir, and against the pools in lane mode)
  const dupCheck = (list, key, label) => {
    const seen = new Map();
    for (const r of list) { if (!r[key]) continue; if (seen.has(r[key])) F(r._file, "G18", `duplicate ${label} id "${r[key]}" (also in ${seen.get(r[key])})`); else seen.set(r[key], r._file); }
  };
  dupCheck(data.mantras, "id", "mantra"); dupCheck(data.occasions, "id", "occasion"); dupCheck(data.texts, "id", "text"); dupCheck(data.kathas, "id", "katha"); dupCheck(data.lessons, "id", "lesson"); dupCheck(data.terms, "id", "glossary");
  if (lane) {
    for (const p of pools) {
      for (const key of ["mantras", "occasions", "texts", "kathas", "lessons", "terms", "reference", "statics"]) for (const id of ids[key]) if (p[key].has(id)) F(fileOf(data, key, id), "G18", `${key.replace(/s$/, "")} id "${id}" also exists in ${p.label} (lanes are split by domain — brief §13.2)`);
    }
  }

  // ---- G19 reproduce:false
  for (const [file, rec] of allRecords) if (rec.reproduce === false) F(file, "G19", 'reproduce: false — owner decision §14: reproduce in full (keep copyright/copyrightBasis for the record)');

  // ---- G20 Shubhvela ids
  if (shubhvelaIds) for (const o of data.occasions) {
    const sv = o.when?.shubhvela || {};
    if (sv.muhurat && !shubhvelaIds.muhurat.includes(sv.muhurat)) F(o._file, "G20", `when.shubhvela.muhurat "${sv.muhurat}" is not a Shubhvela muhurat activity id (content/shubhvela-ids.json)`);
    if (sv.festival && !shubhvelaIds.festivals.includes(sv.festival)) F(o._file, "G20", `when.shubhvela.festival "${sv.festival}" is not a Shubhvela festival slug`);
    if (sv.vrat && !shubhvelaIds.vrats.includes(sv.vrat)) F(o._file, "G20", `when.shubhvela.vrat "${sv.vrat}" is not a Shubhvela vrat slug`);
  }

  // ---- G21 bho identical to hi
  for (const [file, rec] of allRecords) for (const f of triFields(stripMeta(rec))) {
    if (NON_PROSE_TRI.has(f.key) && (f.obj.hi || "").length <= 40) continue;
    if (typeof f.obj.hi === "string" && f.obj.hi === f.obj.bho) {
      const n = f.obj.hi.length;
      if (n > 40) F(file, "G21", `${f.path}: bho is identical to hi (${n} chars) — untranslated`);
      else if (n > 12) FLAG(file, "G21", `${f.path}: bho identical to hi (${n} chars) — check it is a shared tatsama`);
    }
  }
  for (const [file, set] of mdSets) if (set.hi && set.bho && set.hi.body.trim() === set.bho.body.trim() && set.hi.body.trim().length > 40) F(file, "G21", "bho Markdown body is identical to hi — untranslated");

  const counts = { FAIL: 0, FLAG: 0, WARN: 0 };
  for (const f of findings) counts[f.level]++;
  const order = { FAIL: 0, WARN: 1, FLAG: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level] || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0) || (a.rule < b.rule ? -1 : a.rule > b.rule ? 1 : 0));
  return { ok: counts.FAIL === 0, dir: data.label, lane, phase, counts, findings };
}

function stripMeta(rec) {
  if (Array.isArray(rec)) return rec;
  const out = {};
  for (const [k, v] of Object.entries(rec)) if (!k.startsWith("_") && !["slug", "chapterFiles", "md"].includes(k)) out[k] = v;
  return out;
}
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj || {})) { const key = prefix ? `${prefix}.${k}` : k; if (v && typeof v === "object") flatten(v, key, out); else out[key] = v; }
  return out;
}
const flatKeys = (o) => Object.keys(flatten(o));
function versePhalashruti(rec) {
  const out = [];
  for (const v of rec.verses || []) if (v.phalashruti === true) for (const f of triFields(v)) for (const l of LANGS) if (typeof f.obj[l] === "string") out.push({ path: `verses[${v.v}]${f.path.slice(1)}.${l}`, lang: l, text: f.obj[l], key: f.key });
  return out;
}
function fileOf(data, key, id) {
  const coll = { mantras: data.mantras, occasions: data.occasions, texts: data.texts, kathas: data.kathas, lessons: data.lessons, terms: data.terms, reference: data.reference, statics: data.statics }[key] || [];
  return coll.find((r) => r.id === id || r.slug === id)?._file || key;
}

/** Lang-relative page paths the route table yields for this content (published chapters only). */
export function routeSet(data, R = null) {
  const routes = R || createRoutes({ BASE_PATH: "/", SITE_ORIGIN: "https://example.invalid" });
  const texts = data.texts.filter((t) => !t._orphanChapters).map((t) => ({ slug: t.id, chapters: (t.chapterFiles || []).filter(isPublished).map((c) => ({ n: c._n, parts: paginate(c.verses || []) })) }));
  const d = {
    occasions: data.occasions.map((o) => ({ slug: o.id, parts: (o.parts || []).map((p) => ({ slug: p.id })) })),
    mantras: data.mantras.map((m) => ({ id: m.id })),
    texts,
    kathas: data.kathas.map((k) => ({ slug: k.id, adhyayas: k.adhyayas || [] })),
    lessons: data.lessons.map((l) => ({ id: l.id })),
    levels: Array.isArray(data.levels) ? data.levels : [],
    terms: data.terms.map((t) => ({ id: t.id })),
    reference: data.reference.map((r) => ({ slug: r.slug })),
    statics: data.statics.map((s) => ({ slug: s.slug })),
    features: { searchPage: false },
  };
  const set = new Set();
  for (const r of routes.routesFor("hi", d)) if (r.lang !== null && !r.file) set.add(r.path);
  set.add("");
  return set;
}

/** Load pools for lane mode: content/ + every staging dir except <dir> itself. */
export function lanePools(dir, { contentDir = join(ROOT, "content"), stagingRoot = DEFAULT_STAGING } = {}) {
  const pools = [];
  let registries = null;
  if (existsSync(contentDir) && !sameDir(contentDir, dir)) {
    const c = loadContent(contentDir, { label: "content" });
    registries = c;
    pools.push(poolOf(c));
  }
  for (const s of stagingDirs(stagingRoot)) if (!sameDir(s, dir)) pools.push(poolOf(loadContent(s, { label: s.split(/[\\/]/).slice(-3).join("/") })));
  return { pools, registries };
}

export function formatFindings(findings) {
  return findings.map((f) => `${f.level.padEnd(4)}  ${f.file}  ${f.rule}  ${f.message}`).join("\n");
}

/** Write dist/_reports/gate.json (always — NIT 14) and return the path. */
export function writeReport(result, distDir) {
  const dir = join(distDir, "_reports");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "gate.json");
  writeFileSync(file, JSON.stringify({ generated: new Date().toISOString(), ...result }, null, 2) + "\n");
  return file;
}

// ---------------------------------------------------------------- CLI
function parseArgs(argv) {
  const o = { dir: null, lane: false, phase: null, staging: DEFAULT_STAGING, quiet: false, dist: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir") o.dir = argv[++i];
    else if (a === "--lane") o.lane = true;
    else if (a === "--phase") o.phase = argv[++i];
    else if (a === "--staging") o.staging = argv[++i];
    else if (a === "--dist") o.dist = argv[++i];
    else if (a === "--quiet") o.quiet = true;
    else if (a === "--help" || a === "-h") { console.log("usage: node build/gate.mjs [--dir <path>] [--lane] [--phase 1|2|3] [--staging <root>] [--dist <path>] [--quiet]"); process.exit(0); }
    else throw new Error(`unknown argument ${a}`);
  }
  return o;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const { default: config } = await import("./config.mjs");
  const dir = resolve(args.dir || config.CONTENT_DIR);
  const dist = resolve(args.dist || config.DIST);
  let result;
  try {
    const data = loadContent(dir, { label: args.dir ? dir.split(/[\\/]/).slice(-2).join("/") : "content" });
    let pools = [], registries = null;
    if (args.lane) ({ pools, registries } = lanePools(dir, { contentDir: join(ROOT, "content"), stagingRoot: args.staging }));
    result = runGate(data, { phase: args.phase, lane: args.lane, pools, registries });
  } catch (err) {
    result = { ok: false, dir, lane: args.lane, counts: { FAIL: 1, FLAG: 0, WARN: 0 }, findings: [{ level: "FAIL", file: err.file || "-", rule: "G1", message: `parse error: ${err.message}` }], fatal: true };
    writeReport(result, dist);
    console.error(formatFindings(result.findings));
    process.exit(2);
  }
  const report = writeReport(result, dist);
  if (!args.quiet && result.findings.length) console.log(formatFindings(result.findings));
  console.log(`gate ${result.ok ? "OK" : "FAIL"}: ${result.counts.FAIL} FAIL, ${result.counts.FLAG} FLAG, ${result.counts.WARN} WARN — ${result.dir}${result.lane ? " (lane mode)" : ""} → ${report}`);
  process.exit(result.ok ? 0 : 3);
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  main().catch((err) => { console.error(`gate: ${err.message}`); process.exit(2); });
}
