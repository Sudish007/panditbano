// Verse / mantra renderer (design.md §7, §18, §27 items 1 and 5; design-review MEDIUM 4, NIT 13; FEAT-105).
// verseBlock() emits, in this order and only this order: <p class="mantra"> (Devanagari, one pada per line, svara marks
// kept; the svara-less text as a visually hidden span — never aria-label) → <p class="iast"> → <p class="roman-easy"> →
// <div class="verse-tools">. The composition helpers below follow with the word split, meaning/explanation, vinyog,
// variants and the source line in the fixed order of design §7.1. Every string from a record passes through html``/esc().
import { html, raw, esc, t, icon } from "../lib.mjs";
import { joinDanda, splitPadas, digitsFor } from "../../lib/deva.mjs";
import { toIAST, toEasy, ariaPlain } from "../../lib/translit.mjs";
import { attributionLine, termForms } from "../../lib/derive.mjs";
import { renderInline } from "../../lib/md.mjs";

export const VERSE_LANGS = ["sa", "awa", "hi"];
const KIND_CHIP = { vedic: "chip-vedic", puranic: "chip-paddhati", paddhati: "chip-paddhati", folk: "chip-lok", author: "chip-lok" };

/** Verse number for the ॥ n ॥ marker: an explicit n, else the last segment of a vs-a-b / pgs-k-k-s / rv-m-h-v id (never a range). */
export function verseNumber(rec, n) {
  if (n !== undefined && n !== null) return Number(n);
  const m = /^(?:vs-\d+|pgs-\d+-\d+|rv-\d+-\d+)-(\d+)$/.exec(rec.id || "");
  return m ? Number(m[1]) : null;
}

const HAS_MARKER = /॥\s*[०-९0-9]+(?:[.-][०-९0-9]+)*\s*॥\s*$/;

/** Add "॥ n ॥" to a verse that ends with ॥ and carries no number yet (digits per design §27 item 1). */
export function withMarker(devanagari, n, lang) {
  const s = String(devanagari ?? "").trim();
  if (n === null || n === undefined || HAS_MARKER.test(s) || !/॥\s*$/.test(s)) return s;
  return s.replace(/\s*॥\s*$/, ` ॥ ${digitsFor(n, lang)} ॥`);
}
function withBarMarker(roman, n, numbered) {
  const s = String(roman ?? "").trim();
  if (!numbered || /\|\|\s*\d+(?:[.-]\d+)*\s*\|\|\s*$/.test(s) || !/\|\|\s*$/.test(s)) return s;
  return s.replace(/\s*\|\|\s*$/, ` || ${n} ||`);
}

/** Split a Roman line at | and || like splitPadas does at । ॥ (the "|| n ||" marker stays with its pada). */
export function splitBars(text) {
  const out = [];
  const s = String(text ?? "").replace(/\|\|\s*(\d+(?:[.-]\d+)*)\s*\|\|/g, "\uE010$1\uE010");
  const re = /[^|]*\|+(?:\s*\uE010[^\uE010]*\uE010)?|[^|]+$/g;
  for (const m of s.matchAll(re)) {
    const seg = m[0].replace(/\uE010([^\uE010]*)\uE010/g, "|| $1 ||").trim();
    if (seg) out.push(seg);
  }
  return out;
}

/** Lines → padas → <span class="pada">, each joined with joinDanda so a danda / bar never starts a line (§27 item 1, §7.2). */
export function padaSpans(text, splitter) {
  const segs = String(text ?? "").split(/\n+/).flatMap((line) => splitter(line.trim()));
  return raw(segs.map((seg) => `<span class="pada">${joinDanda(esc(seg))}</span>`).join(""));
}

export function kindLabel(rec, lang) {
  if (rec.verseKind) return t(lang, `verse_kind.${rec.verseKind}`);
  return null;
}

function toolsRow(rec, lang, { id, n, title, settingsHref, showKind }) {
  const aria = n !== null && n !== undefined ? t(lang, "voice.aria", { n: String(n) }) : t(lang, "voice.aria_title", { title });
  const kind = showKind ? kindLabel(rec, lang) : null;
  return html`<div class="verse-tools">
<button class="btn btn-ghost" type="button" data-listen="${id}" aria-pressed="false" aria-label="${aria}" data-l-play="${t(lang, "voice.listen")}" data-l-stop="${t(lang, "voice.stop")}" hidden>${icon("i-play")}<span class="lbl">${t(lang, "voice.listen")}</span></button>
<a class="btn btn-ghost btn-icon" href="${settingsHref}" aria-label="${t(lang, "verse.open_settings")}" title="${t(lang, "verse.open_settings")}">${icon("i-settings")}</a>
<span class="svara-flag${rec.svara === true ? "" : " off"}">${t(lang, rec.svara === true ? "svara.on" : "svara.off")}</span>
<span class="note">${t(lang, "voice.note")}</span>
${kind ? html`<span class="chip chip-kind">${kind}</span>` : ""}
<span class="vstatus small" role="status" data-vstatus></span>
</div>`;
}

/**
 * The verse block. rec = mantra record or text verse (derived fields iast/easy/ariaPlain used when present);
 * opts: { n (verse number), textLang ("sa"|"awa"|"hi", default rec.lang or "sa"), id (default "m-<rec.id>"),
 * tools (default true), showKind (default true), settingsHref (default "#reading-settings"), cls }.
 */
export function verseBlock(rec, lang, opts = {}) {
  const textLang = VERSE_LANGS.includes(opts.textLang) ? opts.textLang : VERSE_LANGS.includes(rec.lang) ? rec.lang : "sa";
  const id = opts.id || `m-${rec.id}`;
  const n = verseNumber(rec, opts.n);
  const plain = rec.ariaPlain || ariaPlain(rec.devanagari);
  const iast = rec.iast || toIAST(rec.devanagari, rec.id);
  const easy = rec.easy || toEasy(iast);
  const svara = rec.svara === true;
  const deva = withMarker(rec.devanagari, n, lang);
  const numbered = n !== null && deva !== String(rec.devanagari ?? "").trim();
  const title = (rec.title && rec.title[lang]) || rec.id || "";
  return html`<div class="verse${opts.cls ? " " + opts.cls : ""}">
<p class="mantra" lang="${textLang}" id="${id}" data-plain="${plain}"><span class="deva"${svara ? raw(' aria-hidden="true"') : ""}>${padaSpans(deva, splitPadas)}</span>${svara ? html`<span class="sr" lang="${textLang}">${plain}</span>` : ""}</p>
<p class="iast" lang="sa-Latn">${padaSpans(withBarMarker(iast, n, numbered), splitBars)}</p>
<p class="roman-easy" lang="sa-Latn">${padaSpans(withBarMarker(easy, n, numbered), splitBars)}</p>
${opts.tools === false ? "" : toolsRow(rec, lang, { id, n, title, settingsHref: opts.settingsHref || "#reading-settings", showKind: opts.showKind !== false })}
</div>`;
}

// ---------------------------------------------------------------- prose (Markdown inline subset for meaning/explanation)
/** renderInline context for a page: lang-less content links → /{lang}/…, [[term]] → glossary, {{count}} from derived. */
export function mdContext(ctx, lang, derived = {}) {
  const R = ctx.R;
  const glossary = new Set((derived.glossaryPages || []).map((g) => g.id));
  return {
    lang,
    extLabel: t(lang, "ext.label"),
    href: (p) => R.href(`${lang}/${String(p).replace(/^\/+/, "")}`),
    term: (id) => {
      const tb = derived.termbankById && derived.termbankById.get(id);
      if (!tb) return null;
      const f = termForms(tb, lang);
      return { display: f.display, alt: f.alt, href: R.href(glossary.has(id) ? `${lang}/glossary/${id}/` : `${lang}/glossary/`) };
    },
    note: (kind) => t(lang, `honesty.${kind}_note`),
    count: (key) => (derived.counts && derived.counts[key] !== undefined ? derived.counts[key] : null),
    mantra: () => null,
    verse: () => null,
    sutra: () => null,
  };
}
/** One prose field (string with the inline Markdown subset) as Raw; `<` from data is always escaped. */
export const inlineProse = (text, mdCtx) => raw(renderInline(String(text ?? ""), mdCtx));

// ---------------------------------------------------------------- composition pieces (design §7.5–7.9, §4.4)
export function padaCard(rec, lang, { id = "pada", heading = "h2" } = {}) {
  if (!Array.isArray(rec.pada) || !rec.pada.length) return "";
  const H = heading;
  return html`<section class="card" id="${id}" aria-labelledby="h-${id}">
${raw(`<${H} id="h-${id}">`)}${t(lang, "verse.pada")}${raw(`</${H}>`)}
<dl class="pada">${rec.pada.map((p) => html`<div><dt lang="sa">${p.sa}</dt><dd>${p.gloss && p.gloss[lang]}</dd></div>`)}</dl>
</section>`;
}

/** Meaning (with the phalashruti frame — §7.9), explanation and note as .prose sections. */
export function meaningSection(rec, lang, mdCtx, { id = "arth", heading = "h2" } = {}) {
  const H = heading;
  const h = (hid, label) => raw(`<${H} id="${hid}">${esc(label)}</${H}>`);
  const meaning = rec.meaning && rec.meaning[lang];
  const explanation = rec.explanation && rec.explanation[lang];
  const note = rec.note && rec.note[lang];
  if (!meaning && !explanation && !note) return "";
  return html`<section class="prose" id="${id}">
${meaning ? html`${h(`h-${id}`, t(lang, "verse.meaning"))}${rec.phalashruti === true ? html`<p class="label">${t(lang, "verse.phalashruti")}</p>` : ""}<p>${inlineProse(meaning, mdCtx)}</p>` : ""}
${explanation ? html`${h(`h-${id}-x`, t(lang, "verse.explain"))}<p>${inlineProse(explanation, mdCtx)}</p>` : ""}
${note ? html`${h(`h-${id}-n`, t(lang, "verse.note"))}<p>${inlineProse(note, mdCtx)}</p>` : ""}
</section>`;
}

/** Vinyog card: every occasion step that uses the mantra (derived from steps[].mantraIds — §7.6). Anchor: #step-<n>. */
export function vinyogCard(rec, lang, { ctx, occasionsById, mdCtx, id = "vinyog", heading = "h2" } = {}) {
  const items = (rec.vinyog || []).filter((v) => occasionsById && occasionsById.get(v.occasionId));
  if (!items.length) return "";
  const H = heading;
  const R = ctx.R;
  return html`<section class="card" id="${id}" aria-labelledby="h-${id}">
${raw(`<${H} id="h-${id}">`)}${t(lang, "verse.vinyog")}${raw(`</${H}>`)}
<ul class="m0">${items.map((v) => {
    const o = occasionsById.get(v.occasionId);
    const href = R.href(`${lang}/occasions/${o.slug}/${v.part ? v.part + "/" : ""}#step-${v.step}`);
    const action = v.action && v.action[lang];
    return html`<li><a href="${href}">${o.title[lang]} → ${t(lang, "verse.step", { n: v.step })}</a>${action ? html` — ${inlineProse(action, mdCtx)}` : ""}</li>`;
  })}</ul>
</section>`;
}

/** Variant readings (record.variants[]) with their note and source title. */
export function variantsSection(rec, lang, { sources, id = "variants", heading = "h2" } = {}) {
  if (!Array.isArray(rec.variants) || !rec.variants.length) return "";
  const H = heading;
  return html`<section id="${id}" aria-labelledby="h-${id}">
${raw(`<${H} id="h-${id}">`)}${t(lang, "verse.variants")}${raw(`</${H}>`)}
<ul>${rec.variants.map((v) => {
    const entry = sources && sources.get(v.source);
    return html`<li><span lang="sa" class="reading">${v.reading}</span>${v.note && v.note[lang] ? html` — ${v.note[lang]}` : ""}${entry ? html` (${sourceLink(entry, lang)})` : ""}</li>`;
  })}</ul>
</section>`;
}

// ---------------------------------------------------------------- sources and attribution (design §7.7; decisions §7.2)
function extAnchor(lang, url, label, rel = "external noopener") {
  // url and label are already HTML-escaped by the caller
  return `<a href="${url}" rel="${rel}">${label}<svg class="ext-ic" aria-hidden="true" focusable="false"><use href="#i-ext"/></svg><span class="sr"> (${esc(t(lang, "ext.label"))})</span></a>`;
}
/** Display title of a registry entry: the first human title in the page's script, else the registry title. */
export function sourceTitle(entry, lang) {
  const titles = Array.isArray(entry.titles) ? entry.titles : [];
  const deva = titles.find((x) => /[\u0900-\u097F]/.test(x));
  const latin = titles.find((x) => !/[\u0900-\u097F]/.test(x));
  return (lang === "en" ? latin || deva : deva || latin) || entry.title || entry.id || "";
}
export function sourceLink(entry, lang) {
  return raw(extAnchor(lang, esc(entry.url || "#"), esc(sourceTitle(entry, lang))));
}
const shortUrl = (u) => { const s = u.replace(/^https?:\/\//, "").replace(/\/$/, ""); return s.length > 48 ? s.slice(0, 47) + "…" : s; };

/**
 * One attribution line as HTML: “title” (url) → the quoted title linked; "CC BY-SA 4.0 (url)" → a rel="license" link;
 * the registry title linked once where it stands unquoted (B/T/O patterns); any bare (url) left → a shortened link.
 */
export function attributionHtml(line, lang, entry = null) {
  let s = esc(line.text);
  const linked = new Set();
  // The registry URL first, literally: a Wikisource URL may contain ")" (…/खण्डः_५_(अवन्तीखण्डः)/…), which the generic
  // regexes below would cut — and a cut URL would let the title be linked twice (nested <a>, UI-20 / UI-25 — FEAT-107 fix).
  if (entry && entry.url) {
    const url = esc(entry.url);
    const q = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`“([^”]+)” \\(${q}\\)`, "g"), (_, title) => { linked.add(url); return `“${extAnchor(lang, url, title)}”`; });
  }
  s = s.replace(/“([^”]+)” \((https?:\/\/[^\s)]+)\)/g, (m, title, url) => { if (linked.has(url) || m.includes("<a ")) return m; linked.add(url); return `“${extAnchor(lang, url, title)}”`; });
  s = s.replace(/(CC BY(?:-NC)?-SA 4\.0) \((https?:\/\/[^\s)]+)\)/g, (_, lic, url) => { linked.add(url); return extAnchor(lang, url, lic, "external license noopener"); });
  if (entry && entry.title && entry.url && !linked.has(esc(entry.url))) {
    const title = esc(entry.title);
    const url = esc(entry.url);
    const i = s.indexOf(title);
    if (i >= 0) {
      // "title, publisher, year (url; public domain)" → the title linked, the parenthesised URL dropped (the href carries it)
      const rest = s.slice(i + title.length);
      const m = new RegExp(`^([^()]{0,80}?) \\(${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([;)])`).exec(rest);
      let tail = rest;
      if (m) { const after = rest.slice(m[0].length); tail = m[1] + (m[2] === ";" ? " (" + after.replace(/^\s+/, "") : after); }
      s = s.slice(0, i) + extAnchor(lang, url, title) + tail;
      linked.add(url);
    }
  }
  // "phrase (url)" where the phrase is the run since the last label colon → the phrase linked (V pattern and the like)
  s = s.replace(/(^|: )([^():]{2,120}?) \((https?:\/\/[^\s;)]+)\)/g, (m, lead, phrase, url) => {
    if (linked.has(url)) return m;
    linked.add(url);
    return `${lead}${extAnchor(lang, url, phrase)}`;
  });
  s = s.replace(/\((https?:\/\/[^\s;)]+)/g, (m, url) => (linked.has(url) ? m : `(${extAnchor(lang, url, shortUrl(url))}`));
  return raw(s);
}

/** All attribution lines of a record: its source, then checkedAgainst, then variant sources (deduplicated by ref). */
export function attributionLines(rec, lang, sources) {
  const out = [];
  const seen = new Set();
  const push = (ref, opts) => {
    if (!ref || seen.has(ref)) return;
    seen.add(ref);
    const entry = (sources && sources.get(ref)) || null;
    out.push({ ref, entry, line: attributionLine(entry, opts, lang) });
  };
  if (rec.source) push(rec.source.ref, { retrieved: rec.source.retrieved, modified: rec.source.modified || false });
  for (const c of rec.checkedAgainst || []) push(c.ref, { retrieved: c.retrieved, checked: true });
  for (const v of rec.variants || []) push(v.source, { checked: true });
  return out;
}

/** The short source line under a verse (§7.7): label, the linked source title, the locator. */
export function sourceLine(rec, lang, { sources } = {}) {
  const entry = rec.source && sources ? sources.get(rec.source.ref) : null;
  if (!entry && !rec.locator) return "";
  return html`<p class="src">${t(lang, "verse.source")}: ${entry ? sourceLink(entry, lang) : ""}${rec.locator ? html`${entry ? " · " : ""}${rec.locator}` : ""}</p>`;
}

/** #sources section of a content page: one attribution line per source of every record (design §4.1). */
export function sourcesSection(records, lang, { sources, id = "sources", heading = "h2" } = {}) {
  const lines = [];
  const seen = new Set();
  for (const rec of records) for (const a of attributionLines(rec, lang, sources)) if (!seen.has(a.ref)) { seen.add(a.ref); lines.push(a); }
  if (!lines.length) return "";
  const H = heading;
  return html`<section id="${id}" aria-labelledby="h-${id}">
${raw(`<${H} id="h-${id}">`)}${t(lang, "verse.source")}${raw(`</${H}>`)}
<ol class="sources">${lines.map((a) => html`<li data-source="${a.ref}">${attributionHtml(a.line, lang, a.entry)}</li>`)}</ol>
</section>`;
}

/** The "स्वर चिह्न" legend card (design §27 item 5) — on every page that renders svara-marked text. */
export function svaraLegend(lang) {
  const mark = (s) => `<span class="mark" lang="sa">${esc(s)}</span>`;
  const body = esc(t(lang, "svara_legend.body")).replace("{svarita}", mark("क॑")).replace("{anudatta}", mark("क॒")).replace("{nasal}", mark("तिँ"));
  return html`<div class="card svara-legend"><h2 class="rail-h">${t(lang, "svara_legend.title")}</h2><p class="meta m0">${raw(body)}</p></div>`;
}

/** Kind chip for a mantra record (वैदिक / पौराणिक / पद्धति / लोक / रचनाकार). */
export function kindChip(rec, lang) {
  if (!rec.kind) return "";
  return html`<span class="chip ${KIND_CHIP[rec.kind] || "chip-lok"}">${t(lang, `kind.${rec.kind}`)}</span>`;
}

/**
 * The full fixed-order rendering for a step / chapter embed (design §7.1): verse block → pada → meaning/explanation →
 * vinyog → variants → source line. Pages that lay the pieces out differently (the mantra page) call the pieces.
 */
export function verseFull(rec, lang, { ctx, derived, occasionsById, sources, n, textLang, heading = "h3", idPrefix, id } = {}) {
  const mdCtx = mdContext(ctx, lang, derived);
  const p = idPrefix || `${rec.id}`;
  return html`${verseBlock(rec, lang, { n, textLang, id })}
${padaCard(rec, lang, { id: `pada-${p}`, heading })}
${meaningSection(rec, lang, mdCtx, { id: `arth-${p}`, heading })}
${vinyogCard(rec, lang, { ctx, occasionsById, mdCtx, id: `vinyog-${p}`, heading })}
${variantsSection(rec, lang, { sources, id: `variants-${p}`, heading })}
${sourceLine(rec, lang, { sources })}`;
}
