// Home (design.md §4.2 with §27 items 2 and 3). Every number comes from `counts` (brief §1); a count line is omitted
// while the count is 0 (no content yet) rather than showing a literal.
import { html, raw, t, icon, extLink, num } from "../lib.mjs";
import { layout, SHUBHVELA } from "../layout.mjs";
import { OCCASION_GROUPS } from "../../lib/routes.mjs";
import { tp } from "../components/names.mjs";

export const GROUP_ICONS = {
  foundations: "i-fire", daily: "i-sun2", birth: "i-child", marriage: "i-rings", home: "i-home",
  death: "i-pind", kathas: "i-book", vrats: "i-moonstar", festivals: "i-flag", shanti: "m-shankh",
};

const countLine = (lang, parts) => {
  const shown = parts.filter(([, n]) => n > 0).map(([key, n]) => t(lang, `counts.${key}`, { n: num(n) }));
  return shown.length ? html`<span class="count">${shown.join(" · ")}</span>` : "";
};

/** One group card (design §27 item 3): icon + name + computed count + up to 4 example chips. Shared with the search browse page (FEAT-108). */
export function groupCard(ctx, lang, id, { n = 0, examples = [] } = {}) {
  const chips = examples.slice(0, 4);
  return html`<div class="card group-card">
<a class="gc-head card-link" href="${ctx.R.href(`${lang}/occasions/#${id}`)}">${icon(GROUP_ICONS[id], { cls: "ico", size: 36 })}<span class="t"><strong>${t(lang, `groups.${id}`)}</strong>${n ? html`<span>${t(lang, "counts.pages", { n: num(n) })}</span>` : ""}</span></a>
${chips.length ? html`<div class="chips">${chips.map((c) => html`<a class="chip" href="${c.href}">${c.title}</a>`)}</div>` : ""}
</div>`;
}

/** The ten group cards in the §3.3 order from `counts.groups` and the derived examples. */
export function groupCards(ctx, lang, { counts = {}, groups = [] }) {
  const g = counts.groups || {};
  return OCCASION_GROUPS.map((id) => groupCard(ctx, lang, id, { n: g[id] || 0, examples: (groups.find((x) => x.id === id) || {}).examples || [] }));
}

export function homeBody(ctx, { lang, counts = {}, groups = [], featured = [] }) {
  const R = ctx.R;
  const L = (p) => R.href(`${lang}/${p}`);
  const groupTiles = groupCards(ctx, lang, { counts, groups });
  return html`<section class="hero">
<div class="hero-text">
<h1>${t(lang, "site.name")}</h1>
<p class="tagline">${t(lang, "site.tagline")}</p>
<p class="lede">${t(lang, "site.lede")}</p>
<div class="actions"><a class="btn btn-primary" href="${L("learn/")}">${t(lang, "home.start_learning")}</a><a class="btn" href="${L("occasions/")}">${t(lang, "home.see_occasions")}</a></div>
</div>
<div class="motif-wrap"><svg class="motif" viewBox="0 0 120 100" aria-hidden="true" focusable="false"><use href="#m-diya"/></svg></div>
</section>
<section aria-labelledby="h-paths"><h2 id="h-paths" class="sr">${t(lang, "home.paths_heading")}</h2>
<div class="grid grid-md-3">
${/* the path cards are <a>s: their bodies use t(), never tp() — a linked name inside a link is a nested <a> and the parser
      splits the card (FIX-1a: the texts card broke once "रुद्राष्टाध्यायी" entered the registry). The names are linked on /texts/. */ ""}
<a class="card card-link path-card" href="${L("learn/")}">${icon("i-cap", { cls: "ico", size: 44 })}<h3 class="m0">${t(lang, "home.path_learn_title")}</h3><p class="m0">${t(lang, "home.path_learn_body")}</p>${countLine(lang, [["levels", counts.levels || 0], ["lessons", counts.lessons || 0]])}<span class="more">${t(lang, "home.more")}</span></a>
<a class="card card-link path-card" href="${L("occasions/")}">${icon("i-list", { cls: "ico", size: 44 })}<h3 class="m0">${t(lang, "home.path_occasions_title")}</h3><p class="m0">${t(lang, "home.path_occasions_body")}</p>${countLine(lang, [["occasions", counts.occasions || 0], ["groups", counts.groupCount || 0]])}<span class="more">${t(lang, "home.more")}</span></a>
<a class="card card-link path-card" href="${L("texts/")}">${icon("i-om", { cls: "ico", size: 44 })}<h3 class="m0">${t(lang, "home.path_texts_title")}</h3><p class="m0">${t(lang, "home.path_texts_body")}</p>${countLine(lang, [["mantras", counts.mantras || 0], ["verses", counts.verses || 0]])}<span class="more">${t(lang, "home.more")}</span></a>
</div></section>
<section aria-labelledby="h-groups">
<div class="section-head"><h2 id="h-groups">${t(lang, "home.groups_heading")}</h2><a href="${L("occasions/")}">${counts.occasions ? t(lang, "counts.occasions", { n: num(counts.occasions) }) + " →" : t(lang, "home.all_occasions")}</a></div>
<div class="grid grid-md-2 grid-lg-3 grid-xl-4" data-grid="fixed">${groupTiles}</div>
</section>
<section class="today" aria-labelledby="h-today">
<div class="card">
<h2 id="h-today">${t(lang, "home.today_heading")}</h2>
<p>${t(lang, "honesty.no_dates")} ${tp(ctx, lang, "home.today_body")}</p>
<div class="btns">${extLink(lang, `${SHUBHVELA}${lang}/panchang/new-delhi/`, t(lang, "shubhvela.panchang"), { cls: "btn" })}${extLink(lang, `${SHUBHVELA}${lang}/festivals/`, t(lang, "shubhvela.festivals"), { cls: "btn" })}${extLink(lang, `${SHUBHVELA}${lang}/muhurat/`, t(lang, "shubhvela.muhurat"), { cls: "btn" })}</div>
</div>
<div class="card">
<h2>${t(lang, "home.how_heading")}</h2>
<p>${tp(ctx, lang, "home.how_body")}</p>
${(() => {
    // FEAT-110: link only the pages the corpus has (the verification reference page and the Sources page land with C1A-17)
    const links = [];
    if (!ctx.has || ctx.has.reference("verification")) links.push(html`<a href="${L("reference/verification/")}">${t(lang, "home.how_link")}</a>`);
    if (!ctx.has || ctx.has.static("sources")) links.push(html`<a href="${L("sources/")}">${t(lang, "home.sources_link")}</a>`);
    return links.length ? html`<p class="m0">${links.map((l, i) => html`${i ? raw(" · ") : ""}${l}`)}</p>` : "";
  })()}
</div>
</section>
${featured.length ? html`<section aria-labelledby="h-feat">
<div class="section-head"><h2 id="h-feat">${t(lang, "home.featured_heading")}</h2></div>
<div class="grid grid-md-2 grid-lg-4">${featured.map((f) => html`<a class="card card-link" href="${f.href}"><span class="chip chip-paddhati">${f.kind}</span><h3 class="m0">${f.title}</h3>${f.meta ? html`<p class="meta m0">${f.meta}</p>` : ""}</a>`)}</div>
</section>` : ""}
<section class="saved-list" data-saved-list hidden aria-labelledby="h-saved">
<div class="section-head"><h2 id="h-saved">${t(lang, "offline.saved_list")}</h2></div>
<ul class="compact-steps" data-saved-items></ul>
</section>`;
}

export function homePage(ctx, { route, counts, groups, featured }) {
  const lang = route.lang;
  return layout(ctx, {
    route,
    title: t(lang, "site.tagline"),
    description: t(lang, "site.description"),
    section: null,
    crumbs: [],
    body: homeBody(ctx, { lang, counts, groups, featured }),
  });
}
