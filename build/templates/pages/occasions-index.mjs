// Occasions index (design.md §3.2, §4.8; FEAT-106): the ten groups in the §3.3 order, each with its icon, a computed
// count and tiles (title, lede, step count); a group with no pages yet shows one honest line instead of a grid.
import { html, t, icon, num } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { OCCASION_GROUPS } from "../../lib/routes.mjs";
import { GROUP_ICONS } from "./home.mjs";
import { stepsOf } from "../components/step.mjs";

const byTitle = (lang) => (a, b) => String(a.title[lang]).localeCompare(String(b.title[lang]), lang === "en" ? "en" : "hi");

export function occasionTile(ctx, occ, lang) {
  const steps = stepsOf(occ);
  return html`<a class="card card-link occ-card" href="${ctx.R.href(`${lang}/occasions/${occ.slug}/`)}">
<h3 class="m0">${occ.title[lang]}</h3>
<p class="m0">${occ.lede[lang]}</p>
<span class="meta">${t(lang, "occasion.steps", { n: num(steps.length) })}${occ.parts && occ.parts.length ? html` · ${t(lang, "occasion.parts_count", { n: num(occ.parts.length) })}` : ""}</span>
</a>`;
}

export function occasionsIndexBody(ctx, { lang, occasions, counts = {} }) {
  const groups = OCCASION_GROUPS.map((id) => ({ id, items: occasions.filter((o) => o.group === id).sort(byTitle(lang)) }));
  const filled = groups.filter((g) => g.items.length).length;
  return html`<div class="page-head">
<div><h1>${t(lang, "occasions.title")}</h1><p class="lede m0">${t(lang, "occasions.lede")}</p></div>
<div class="meta"><span>${t(lang, "counts.occasions", { n: num(occasions.length) })}</span><span>${t(lang, "counts.groups", { n: num(filled) })}</span></div>
</div>
<nav class="sections" aria-label="${t(lang, "occasions.groups_label")}">${groups.map((g) => html`<a class="btn btn-ghost" href="#${g.id}">${t(lang, `groups.${g.id}`)}</a>`)}</nav>
${groups.map((g) => html`<section id="${g.id}" class="occ-group" aria-labelledby="h-${g.id}">
<div class="section-head"><h2 id="h-${g.id}">${icon(GROUP_ICONS[g.id], { cls: "ico", size: 28 })}${t(lang, `groups.${g.id}`)}</h2><span class="meta">${t(lang, "counts.pages", { n: num(g.items.length) })}</span></div>
${g.items.length ? html`<div class="grid grid-md-2 grid-lg-3 grid-xl-4">${g.items.map((o) => occasionTile(ctx, o, lang))}</div>` : html`<p class="meta m0">${t(lang, "occasions.empty_group")}</p>`}
</section>`)}`;
}

export function occasionsIndexPage(ctx, { route, occasions, counts }) {
  const lang = route.lang;
  const R = ctx.R;
  return layout(ctx, {
    route,
    title: t(lang, "occasions.title"),
    description: t(lang, "occasions.lede"),
    section: "occasions",
    crumbs: [{ href: R.href(`${lang}/`), label: t(lang, "nav.home") }],
    body: occasionsIndexBody(ctx, { lang, occasions, counts }),
  });
}
