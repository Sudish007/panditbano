// Glossary term page (design.md §3.2 term, §4.8; R5 §4.2 B7; FEAT-108): h1 = the display form in the page language; the
// forms card shows the other two languages (+ Sanskrit when the term bank has it), alternates (hiAlt / bhoAlt) and folk
// forms (bhoFolk) — the first-use bracket rule applies in prose, here they are listed; the definition (inline Markdown
// with [[term]] links); related terms; the occasions and lessons whose prose marks [[this-term]] (computed) plus the
// record's own `occasions[]`; right rail = the other terms under the same letter.
import { html, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { mdContext, inlineProse } from "../components/verse.mjs";
import { clip, termHref, displayOf, letterOf, groupTerms, glossaryCrumbs, letterId } from "./glossary-index.mjs";
import { excerpt } from "./texts-index.mjs";

const LANG_LABEL = { hi: "lang.hi.long", en: "lang.en.long", bho: "lang.bho.long" };

/** Occasions / lessons whose text marks [[id]] (any language field) — "computed from [[term]] usage" (FEAT-108). */
export function usersOf(id, data) {
  const mark = `[[${id}]]`;
  const inText = (rec) => JSON.stringify(rec, (k, v) => (k.startsWith("_") || k === "md" ? undefined : v)).includes(mark);
  const inMd = (set) => Object.values(set || {}).some((m) => m && typeof m.body === "string" && m.body.includes(mark));
  const occasions = (data.occasions || []).filter((o) => inText(o));
  const lessons = (data.lessons || []).filter((l) => inText(l) || inMd(l.md));
  return { occasions, lessons };
}

export function termBody(ctx, { lang, term, data, derived }) {
  const R = ctx.R;
  const tb = derived.termbankById.get(term.id);
  const display = displayOf(term, lang);
  const mdCtx = mdContext(ctx, lang, derived);
  const others = ["hi", "en", "bho"].filter((l) => l !== lang);
  const alts = [...(tb.hiAlt || []).map((x) => ({ x, l: "hi" })), ...(tb.bhoAlt || []).map((x) => ({ x, l: "bho" }))].filter(({ x }) => x !== display);
  const folk = (tb.bhoFolk || []).filter((x) => x !== display);
  const related = (term.related || []).map((id) => ({ id, tb: derived.termbankById.get(id), page: derived.glossaryPages.find((g) => g.id === id) })).filter((r) => r.tb);
  const occById = new Map((data.occasions || []).map((o) => [o.id, o]));
  const used = usersOf(term.id, data);
  const occasions = [...new Map([...(term.occasions || []).map((id) => occById.get(id)).filter(Boolean), ...used.occasions].map((o) => [o.id, o])).values()];
  const letter = letterOf(display, lang);
  const group = groupTerms(derived.glossaryPages, lang).find((g) => g.letter === letter);
  const neighbours = group ? group.terms.filter((x) => x.term.id !== term.id).slice(0, 12) : [];
  return html`<div class="page-head">
<div><h1>${display}</h1></div>
<div class="actions"><a class="btn" href="${R.href(`${lang}/glossary/`)}#${letterId(letter)}">${t(lang, "glossary.all")}</a></div>
</div>
<div class="layout has-right">
<div class="stack">
<section class="card term-forms" id="forms" aria-labelledby="h-forms">
<h2 id="h-forms">${t(lang, "glossary.forms")}</h2>
<dl>${others.map((l) => html`<div><dt>${t(lang, LANG_LABEL[l])}</dt><dd lang="${l}">${tb[l]}</dd></div>`)}${tb.sa ? html`<div><dt>${t(lang, "glossary.sanskrit")}</dt><dd lang="sa">${tb.sa}</dd></div>` : ""}</dl>
${alts.length ? html`<p class="meta m0"><span class="label">${t(lang, "glossary.alternates")}:</span> ${alts.map((a, i) => html`${i ? " · " : ""}<span lang="${a.l}">${a.x}</span>`)}</p>` : ""}
${folk.length ? html`<p class="meta m0"><span class="label">${t(lang, "glossary.folk")}:</span> ${folk.map((x, i) => html`${i ? " · " : ""}<span lang="bho">${x}</span>`)}</p>` : ""}
${tb.evidence === "UNCERTAIN" ? html`<p class="caveat m0">${t(lang, "glossary.evidence_uncertain")}</p>` : ""}
</section>
<section class="prose" id="definition" aria-labelledby="h-definition">
<h2 id="h-definition">${t(lang, "glossary.definition")}</h2>
<p>${inlineProse(term.definition[lang], mdCtx)}</p>
</section>
${related.length ? html`<section id="related" aria-labelledby="h-related"><h2 id="h-related">${t(lang, "glossary.related")}</h2><p class="chips m0">${related.map((r) => (r.page ? html`<a class="chip" href="${termHref(ctx, lang, r.page)}">${r.tb[lang] || r.tb.hi}</a>` : html`<span class="chip" data-term="${r.id}">${r.tb[lang] || r.tb.hi}</span>`))}</p></section>` : ""}
${occasions.length ? html`<section id="used-in" aria-labelledby="h-used-in"><h2 id="h-used-in">${t(lang, "glossary.used_in")}</h2><ul class="link-list">${occasions.map((o) => html`<li><a href="${R.href(`${lang}/occasions/${o.slug}/`)}">${o.title[lang]}</a>${o.lede && o.lede[lang] ? html` <span class="meta">— ${clip(o.lede[lang], 90)}</span>` : ""}</li>`)}</ul></section>` : ""}
${used.lessons.length ? html`<section id="in-lessons" aria-labelledby="h-in-lessons"><h2 id="h-in-lessons">${t(lang, "glossary.in_lessons")}</h2><ul class="link-list">${used.lessons.map((l) => html`<li><a href="${R.href(`${lang}/learn/${l.id}/`)}">${l.title[lang]}</a></li>`)}</ul></section>` : ""}
</div>
<aside class="rail rail-right">
${neighbours.length ? html`<div class="card"><h2 class="rail-h">${t(lang, "glossary.same_letter")} · <span lang="${lang === "en" ? "en" : "hi"}">${letter}</span></h2><nav aria-label="${t(lang, "glossary.same_letter")}"><ul>${neighbours.map((x) => html`<li><a href="${termHref(ctx, lang, x.term)}"><span class="t">${x.display}</span></a></li>`)}</ul></nav><p class="small m0"><a href="${R.href(`${lang}/glossary/`)}#${letterId(letter)}">${t(lang, "glossary.all")} →</a></p></div>` : html`<div class="card"><h2 class="rail-h">${t(lang, "glossary.title")}</h2><p class="small m0"><a href="${R.href(`${lang}/glossary/`)}">${t(lang, "glossary.all")} →</a> · ${t(lang, "counts.terms", { n: num(derived.glossaryPages.length) })}</p></div>`}
</aside>
</div>`;
}

export function termPage(ctx, { route, term, data, derived }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: displayOf(term, lang),
    description: excerpt(term.definition[lang], mdContext(ctx, lang, derived)), // marks resolved (FIX-1a: 64 term pages leaked [[id]] into the description)
    section: "glossary",
    crumbs: glossaryCrumbs(ctx, lang),
    body: termBody(ctx, { lang, term, data, derived }),
  });
}
