// Glossary index (design.md §3.2 glossary-index, §4.8; FEAT-108): only terms with a definition in all three languages
// (derived.glossaryPages) — grouped by the first Devanagari letter of the display form (hi/bho) or A–Z (en), a 44-px
// letter bar, each group a multi-column word list (display form → term page, with the English gloss / Hindi form as meta).
// Shared helpers for the term page live here (termHref, letterOf, groupTerms, letterBar, glossaryCrumbs).
import { html, raw, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { termForms } from "../../lib/derive.mjs";

export const clip = (s, n = 160) => { const x = String(s ?? "").replace(/\s+/g, " ").trim(); return x.length <= n ? x : x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };
export const termHref = (ctx, lang, term) => ctx.R.href(`${lang}/glossary/${term.id}/`);

/** Display form of a term in a language (the term bank's hi/en/bho; falls back to hi). */
export const displayOf = (term, lang) => (term.forms && term.forms[lang] && term.forms[lang].display) || (term.forms && term.forms.hi && term.forms.hi.display) || term.id;

const DEVA_LETTER = /[\u0904-\u0939\u0950\u0958-\u0961\u0972-\u097F]/u;
/** Grouping letter of a display form: the first Devanagari letter (vowel or consonant; ॐ stays ॐ) for hi/bho, the first Latin letter upper-cased for en. */
export function letterOf(display, lang) {
  const s = String(display ?? "").trim();
  if (lang === "en") { const m = /[A-Za-z]/.exec(s); return m ? m[0].toUpperCase() : "#"; }
  const m = DEVA_LETTER.exec(s);
  return m ? m[0] : s.charAt(0) || "#";
}
export const letterId = (letter) => `l-${[...letter].map((c) => c.codePointAt(0).toString(16).padStart(4, "0")).join("-")}`;

/** [{ letter, id, terms[] }] sorted by letter (code point order ≈ varnamala order), terms sorted by display form. */
export function groupTerms(terms, lang) {
  const map = new Map();
  for (const term of terms) {
    const d = displayOf(term, lang);
    const l = letterOf(d, lang);
    if (!map.has(l)) map.set(l, []);
    map.get(l).push({ term, display: d });
  }
  const coll = new Intl.Collator(lang === "en" ? "en" : "hi");
  return [...map.entries()].sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.codePointAt(0) - b.codePointAt(0))).map(([letter, list]) => ({ letter, id: letterId(letter), terms: list.sort((x, y) => coll.compare(x.display, y.display)) }));
}

/** 44-px letter bar; `base` prefixes the anchors when the bar sits on another page (search browse). */
export function letterBar(lang, groups, { base = "", current = null } = {}) {
  if (!groups.length) return "";
  return html`<nav class="letter-bar" aria-label="${t(lang, "glossary.letters")}">${groups.map((g) => html`<a href="${base}#${g.id}"${g.letter === current ? raw(' aria-current="true"') : ""} lang="${lang === "en" ? "en" : "hi"}">${g.letter}</a>`)}</nav>`;
}

export function glossaryCrumbs(ctx, lang) {
  const R = ctx.R;
  return [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }, { href: R.href(`${lang}/glossary/`), label: t(lang, "nav.glossary") }];
}

/** The secondary form shown beside a term in lists: English gloss for hi/bho, the Hindi form for en. */
export function glossOf(term, lang) {
  const other = lang === "en" ? "hi" : "en";
  const f = term.forms && term.forms[other];
  return f ? { text: f.display, lang: other } : null;
}

export function termRow(ctx, lang, { term, display }) {
  const g = glossOf(term, lang);
  return html`<li><a href="${termHref(ctx, lang, term)}">${display}</a>${g ? html` <span class="meta" lang="${g.lang}">${g.text}</span>` : ""}</li>`;
}

export function glossaryIndexBody(ctx, { lang, terms }) {
  const groups = groupTerms(terms, lang);
  return html`<div class="page-head">
<div><h1>${t(lang, "glossary.title")}</h1><p class="lede m0">${t(lang, "glossary.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.terms", { n: num(terms.length) })}</span></div>
</div>
${letterBar(lang, groups)}
${groups.map((g) => html`<section class="letter-group" id="${g.id}" aria-labelledby="h-${g.id}">
<div class="section-head"><h2 id="h-${g.id}" lang="${lang === "en" ? "en" : "hi"}">${g.letter}</h2><span class="meta">${t(lang, "counts.terms", { n: num(g.terms.length) })}</span></div>
<ul class="term-list">${g.terms.map((x) => termRow(ctx, lang, x))}</ul>
</section>`)}`;
}

export function glossaryIndexPage(ctx, { route, terms }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: t(lang, "glossary.title"),
    description: clip(t(lang, "glossary.lede")),
    section: "glossary",
    crumbs: [{ href: ctx.R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: glossaryIndexBody(ctx, { lang, terms }),
  });
}

export { termForms };
