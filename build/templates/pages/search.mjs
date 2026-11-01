// Search page (design.md §3.2 search, §14.4; design-review MEDIUM 6; FEAT-108). While features.search is false the page is a
// BROWSE page: the ten occasion groups (the home's group cards with example chips), the glossary letter bar (anchors into
// /glossary/) and the texts list — no <input>, no [data-search], no SearchAction JSON-LD. When the flag is true (Phase 3,
// FEAT-301) the §14.4 UI renders: a 44-px type="search" input, the aria-live result count and the results region; the
// browse blocks stay below as the empty-query view. Offline and 404 link Occasions, not Search, while the flag is false.
import { html, t, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { groupCards } from "./home.mjs";
import { groupTerms, letterBar } from "./glossary-index.mjs";
import { textCard } from "./texts-index.mjs";
import { mdContext } from "../components/verse.mjs";

export function browseBlocks(ctx, { lang, data, derived }) {
  const R = ctx.R;
  const groups = groupTerms(derived.glossaryPages || [], lang);
  const texts = (data.texts || []).filter((x) => x.publishedCount > 0);
  const mdCtx = mdContext(ctx, lang, derived);
  return html`<section id="browse-groups" aria-labelledby="h-browse-groups">
<div class="section-head"><h2 id="h-browse-groups">${t(lang, "search.browse_groups")}</h2><a href="${R.href(`${lang}/occasions/`)}">${derived.counts.occasions ? t(lang, "counts.occasions", { n: num(derived.counts.occasions) }) + " →" : t(lang, "home.all_occasions")}</a></div>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4" data-grid="fixed">${groupCards(ctx, lang, { counts: derived.counts, groups: derived.groups.map((g) => ({ id: g.id, examples: g.examples.map((e) => ({ title: e.title[lang], href: e.href(lang) })) })) })}</div>
</section>
${groups.length ? html`<section id="browse-glossary" aria-labelledby="h-browse-glossary">
<div class="section-head"><h2 id="h-browse-glossary">${t(lang, "search.browse_glossary")}</h2><a href="${R.href(`${lang}/glossary/`)}">${t(lang, "counts.terms", { n: num((derived.glossaryPages || []).length) })} →</a></div>
${letterBar(lang, groups, { base: R.href(`${lang}/glossary/`) })}
</section>` : ""}
${texts.length || derived.counts.mantras ? html`<section id="browse-texts" aria-labelledby="h-browse-texts">
<div class="section-head"><h2 id="h-browse-texts">${t(lang, "search.browse_texts")}</h2><a href="${R.href(`${lang}/texts/`)}">${t(lang, "texts.all")} →</a></div>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${derived.counts.mantras ? html`<a class="card card-link text-card" href="${R.href(`${lang}/mantras/`)}"><h3 class="m0">${t(lang, "mantras.title")}</h3><p class="m0">${t(lang, "texts.mantras_body")}</p><span class="meta">${t(lang, "counts.mantras", { n: num(derived.counts.mantras) })}</span></a>` : ""}${texts.map((x) => textCard(ctx, x, lang, mdCtx))}</div>
</section>` : ""}`;
}

/** The Phase 3 search UI (§14.4) — markup only; search.mjs (FEAT-301) wires it. */
function searchUI(lang) {
  return html`<form class="search-form" role="search" action="" data-search-form>
<label class="sr" for="q">${t(lang, "search.label")}</label>
<input id="q" class="search-input" type="search" name="q" maxlength="100" placeholder="${t(lang, "search.placeholder")}" autocomplete="off" data-search>
<button class="btn btn-primary" type="submit">${t(lang, "search.label")}</button>
</form>
<p class="meta" role="status" aria-live="polite" data-search-count></p>
<div id="results" data-search-results></div>`;
}

export function searchBody(ctx, { lang, data, derived }) {
  const on = !!ctx.features.search;
  return html`<div class="page-head">
<div><h1>${t(lang, "nav.search")}</h1>${on ? "" : html`<p class="lede m0">${t(lang, "search.browse_lede")}</p>`}</div>
</div>
${on ? searchUI(lang) : ""}
${browseBlocks(ctx, { lang, data, derived })}`;
}

export function searchPage(ctx, { route, data, derived }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: t(lang, "nav.search"),
    description: t(lang, ctx.features.search ? "search.placeholder" : "search.browse_lede"),
    section: null,
    crumbs: [{ href: ctx.R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: searchBody(ctx, { lang, data, derived }),
  });
}
