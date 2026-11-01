// Content loader (design.md §10.1, §11.1 stage 1). Reads every file under a content dir (CONTENT_DIR or --dir),
// parses JSON with file:line:col in any error, reads Markdown with its JSON front-matter line, and returns the
// collections the gate, derive and render stages work on. Every record carries `_file` (posix path relative to the
// content dir) for messages. A fixture dir may hold `_fixture.json` {"base": "../content-sample"}: the base is loaded
// first and the fixture's files override it file by file (test/fixtures/content-bad/*).
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep, resolve, dirname, basename } from "node:path";
import { parseFrontMatter } from "./md.mjs";

export const LANGS = ["hi", "en", "bho"];
const posix = (p) => p.split(sep).join("/");

export function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** JSON.parse with file:line:col in the error (design §11.1 stage 1). */
export function parseJsonFile(file, label = file) {
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  try {
    return JSON.parse(text);
  } catch (err) {
    const m = /position (\d+)/.exec(err.message);
    let line = 1, col = 1;
    if (m) {
      const pos = Number(m[1]);
      const before = text.slice(0, pos);
      line = before.split("\n").length;
      col = pos - before.lastIndexOf("\n");
    }
    throw new Error(`${posix(label)}:${line}:${col}: ${err.message}`);
  }
}

export const REGISTRY_FILES = ["ui/hi.json", "ui/en.json", "ui/bho.json", "termbank.json", "forbidden-hi-in-bho.json", "sources.json", "institutions.json", "latin-allow.json", "shubhvela-ids.json", "festival-calendar.json"];

/** Map of relative posix path → absolute file for a dir (with `_fixture.json` base overlay applied). */
export function fileMap(dir, seen = new Set()) {
  const abs = resolve(dir);
  if (seen.has(abs)) throw new Error(`content: _fixture.json base cycle at ${abs}`);
  seen.add(abs);
  let files = new Map();
  const fixture = join(abs, "_fixture.json");
  if (existsSync(fixture)) {
    const fx = parseJsonFile(fixture);
    if (fx.base) files = fileMap(resolve(abs, fx.base), seen);
    // {"registries": "<dir>"}: only the registry files (ui/, term bank, lists) of that dir — the sample corpus uses the repo's.
    if (fx.registries) {
      const reg = resolve(abs, fx.registries);
      for (const rel of REGISTRY_FILES) if (existsSync(join(reg, rel))) files.set(rel, join(reg, rel));
    }
  }
  for (const f of walk(abs)) {
    const rel = posix(relative(abs, f));
    if (rel === "_fixture.json") continue;
    files.set(rel, f);
  }
  return files;
}

const LANG_MD = /^(.*)\.(hi|en|bho)\.md$/;

/**
 * Load a content dir. Returns the data object described in design §10.1 plus `files` (every file with its kind) and
 * `unknownFiles` (paths the layout does not know — the gate fails them). Parse errors throw (fatal, exit 2).
 */
export function loadContent(dir, { label = null } = {}) {
  const files = fileMap(dir);
  const data = {
    dir: resolve(dir), label: label || posix(dir),
    ui: {}, termbank: null, forbidden: null, sourcesFile: null, sources: new Map(), institutions: null, latinAllow: null, shubhvelaIds: null, festivalCalendar: null, levelsFile: null,
    mantras: [], occasions: [], texts: [], kathas: [], lessons: [], levels: null, terms: [], reference: [], statics: [],
    files: [], unknownFiles: [], mdFiles: [],
  };
  const byText = new Map();
  const kathaMd = new Map();
  const lessonMd = new Map();
  const refMd = new Map();
  const staticMd = new Map();
  const json = (rel, abs) => parseJsonFile(abs, `${data.label}/${rel}`);
  const md = (rel, abs) => {
    const { meta, body } = parseFrontMatter(readFileSync(abs, "utf8"), `${data.label}/${rel}`);
    const rec = { meta, body, _file: rel };
    data.mdFiles.push(rec);
    return rec;
  };
  for (const [rel, abs] of [...files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const parts = rel.split("/");
    const top = parts[0];
    let kind = null;
    try {
      if (top === "ui" && parts.length === 2 && /^(hi|en|bho)\.json$/.test(parts[1])) { kind = "ui"; data.ui[parts[1].slice(0, -5)] = json(rel, abs); }
      else if (rel === "termbank.json") { kind = "termbank"; data.termbank = json(rel, abs); }
      else if (rel === "forbidden-hi-in-bho.json") { kind = "forbidden"; data.forbidden = json(rel, abs); }
      else if (rel === "sources.json") { kind = "sources"; data.sourcesFile = json(rel, abs); for (const s of data.sourcesFile.sources || []) if (s && s.id) data.sources.set(s.id, s); }
      else if (rel === "institutions.json") { kind = "institutions"; data.institutions = json(rel, abs); }
      else if (rel === "latin-allow.json") { kind = "latinAllow"; data.latinAllow = json(rel, abs); }
      else if (rel === "shubhvela-ids.json") { kind = "shubhvelaIds"; data.shubhvelaIds = json(rel, abs); }
      else if (rel === "festival-calendar.json") { kind = "festivalCalendar"; data.festivalCalendar = json(rel, abs); }
      else if (top === "mantras" && parts.length === 3 && parts[2].endsWith(".json")) { kind = "mantra"; data.mantras.push({ ...json(rel, abs), _file: rel, _group: parts[1] }); }
      else if (top === "occasions" && parts.length === 3 && parts[2].endsWith(".json")) { kind = "occasion"; data.occasions.push({ ...json(rel, abs), _file: rel, _dirGroup: parts[1] }); }
      else if (top === "texts" && parts.length === 3 && parts[2] === "text.json") { kind = "text"; const t = { ...json(rel, abs), _file: rel, _dir: parts[1] }; data.texts.push(t); }
      else if (top === "texts" && parts.length === 3 && /^\d+\.json$/.test(parts[2])) { kind = "chapter"; const c = { ...json(rel, abs), _file: rel, _dir: parts[1], _n: Number(parts[2].slice(0, -5)) }; if (!byText.has(parts[1])) byText.set(parts[1], []); byText.get(parts[1]).push(c); }
      else if (top === "kathas" && parts.length === 3 && parts[2] === "katha.json") { kind = "katha"; data.kathas.push({ ...json(rel, abs), _file: rel, _dir: parts[1] }); }
      else if (top === "kathas" && parts.length === 3 && /^\d+\.(hi|en|bho)\.md$/.test(parts[2])) { kind = "katha-md"; const [, n, lang] = /^(\d+)\.(hi|en|bho)\.md$/.exec(parts[2]); const key = parts[1]; if (!kathaMd.has(key)) kathaMd.set(key, {}); const slot = kathaMd.get(key); slot[n] ??= {}; slot[n][lang] = md(rel, abs); }
      else if (top === "learn" && parts.length === 2 && parts[1] === "levels.json") { kind = "levels"; data.levels = json(rel, abs); data.levelsFile = rel; }
      else if (top === "learn" && parts.length === 2 && parts[1].endsWith(".json")) { kind = "lesson"; data.lessons.push({ ...json(rel, abs), _file: rel, _base: parts[1].slice(0, -5) }); }
      else if (top === "learn" && parts.length === 2 && LANG_MD.test(parts[1])) { kind = "lesson-md"; const [, base, lang] = LANG_MD.exec(parts[1]); if (!lessonMd.has(base)) lessonMd.set(base, {}); lessonMd.get(base)[lang] = md(rel, abs); }
      else if (top === "glossary" && parts.length === 2 && parts[1].endsWith(".json")) { kind = "term"; data.terms.push({ ...json(rel, abs), _file: rel, _base: parts[1].slice(0, -5) }); }
      else if (top === "reference" && parts.length === 2 && LANG_MD.test(parts[1])) { kind = "reference-md"; const [, base, lang] = LANG_MD.exec(parts[1]); if (!refMd.has(base)) refMd.set(base, {}); refMd.get(base)[lang] = md(rel, abs); }
      else if (top === "static" && parts.length === 2 && LANG_MD.test(parts[1])) { kind = "static-md"; const [, base, lang] = LANG_MD.exec(parts[1]); if (!staticMd.has(base)) staticMd.set(base, {}); staticMd.get(base)[lang] = md(rel, abs); }
      else if (basename(rel) === "README.md" || basename(rel) === ".gitkeep") { kind = "ignore"; }
      else { data.unknownFiles.push(rel); }
    } catch (err) {
      err.file = rel;
      throw err;
    }
    data.files.push({ file: rel, kind, abs });
  }
  for (const t of data.texts) {
    t.slug = t.id;
    t.chapterFiles = (byText.get(t._dir) || []).sort((a, b) => a._n - b._n);
    byText.delete(t._dir);
  }
  for (const [dirName, chapters] of byText) data.texts.push({ _orphanChapters: chapters, _dir: dirName, _file: `texts/${dirName}/text.json`, slug: dirName, id: dirName, chapterFiles: chapters });
  for (const k of data.kathas) { k.slug = k.id; k.md = kathaMd.get(k._dir) || {}; kathaMd.delete(k._dir); }
  for (const [dirName, mdSet] of kathaMd) data.unknownFiles.push(...Object.values(mdSet).flatMap((x) => Object.values(x).map((r) => r._file)));
  for (const l of data.lessons) { l.md = lessonMd.get(l._base) || {}; lessonMd.delete(l._base); }
  for (const [, mdSet] of lessonMd) data.unknownFiles.push(...Object.values(mdSet).map((r) => r._file));
  for (const [slug, mdSet] of refMd) data.reference.push({ slug, id: slug, md: mdSet, _file: `reference/${slug}.*.md` });
  for (const [slug, mdSet] of staticMd) data.statics.push({ slug, id: slug, md: mdSet, _file: `static/${slug}.*.md` });
  for (const o of data.occasions) o.slug = o.id;
  for (const t of data.terms) t.slug = t.id;
  return data;
}

/** Ids per collection of a dir, loaded cheaply (lane mode pools). Returns { mantras:Set, occasions:Set, texts:Set, verses:Set, kathas:Set, lessons:Set, terms:Set, reference:Set, statics:Set, parts: Map(occasion → Set) }. */
export function idPool(dir) {
  const d = loadContent(dir);
  return poolOf(d);
}

export function poolOf(d) {
  const pool = { dir: d.dir, label: d.label, mantras: new Set(), occasions: new Set(), texts: new Set(), chapters: new Set(), verses: new Set(), kathas: new Set(), lessons: new Set(), terms: new Set(), reference: new Set(), statics: new Set() };
  for (const m of d.mantras) if (m.id) pool.mantras.add(m.id);
  for (const o of d.occasions) if (o.id) pool.occasions.add(o.id);
  for (const t of d.texts) {
    if (t.id) pool.texts.add(t.id);
    for (const c of t.chapterFiles || []) {
      pool.chapters.add(`${t.id}-${c._n}`);
      for (const v of c.verses || []) if (v && v.v !== undefined) pool.verses.add(`${t.id}-${c._n}-${v.v}`);
    }
  }
  for (const k of d.kathas) if (k.id) pool.kathas.add(k.id);
  for (const l of d.lessons) if (l.id) pool.lessons.add(l.id);
  for (const t of d.terms) if (t.id) pool.terms.add(t.id);
  for (const r of d.reference) pool.reference.add(r.slug);
  for (const s of d.statics) pool.statics.add(s.slug);
  return pool;
}

/** Staging dirs of brief §13.2: <root>/<A|B|C>/<item-id>/ — every existing item dir is a pool. */
export function stagingDirs(root) {
  const out = [];
  if (!root || !existsSync(root)) return out;
  for (const lane of readdirSync(root).sort()) {
    const lp = join(root, lane);
    if (!statSync(lp).isDirectory()) continue;
    for (const item of readdirSync(lp).sort()) {
      const ip = join(lp, item);
      if (statSync(ip).isDirectory()) out.push(ip);
    }
  }
  return out;
}

export const sameDir = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();
export { dirname };
