// Level page (design.md §3.2 learn-level, §4.7; decisions.md §10; FEAT-108): level intro + lesson cards (title, one line,
// minutes, question count, progress badge); prev/next level; left rail = the levels card. Level 0 renders the
// formal-routes table from content/institutions.json — every institution name is a link to its page (G16 / UI-19), the
// course and duration columns are the registry's language-neutral strings (lang="en"), status as a chip.
import { html, t, num, extLink } from "../lib.mjs";
import { layout } from "../layout.mjs";
import { clip, levelHref, levelsOf, learnCrumbs, lessonCard, levelsCard } from "./learn-index.mjs";

const STATUS_CHIP = { fact: "chip-good", "to-confirm": "chip-paddhati", uncertain: "chip-lok" };
const STATUS_KEY = { fact: "inst_fact", "to-confirm": "inst_to_confirm", uncertain: "inst_uncertain" };
const shortHost = (u) => String(u).replace(/^https?:\/\//, "").replace(/\/.*$/, "");

/** Display name of an institution in the page language: the first Devanagari name for hi/bho, the English name for en. */
export const institutionName = (inst, lang) => (lang === "en" ? inst.name : (Array.isArray(inst.names) && inst.names[0]) || inst.name);

/** The institutions table (Level 0). Returns "" when the registry is absent. */
export function institutionsTable(lang, institutions, { id = "institutions" } = {}) {
  const list = institutions && Array.isArray(institutions.institutions) ? institutions.institutions : [];
  if (!list.length) return "";
  const written = institutions._meta && institutions._meta.written;
  return html`<section id="${id}" aria-labelledby="h-${id}">
<div class="section-head"><h2 id="h-${id}">${t(lang, "learn.institutions")}</h2></div>
<p class="lede m0">${t(lang, "learn.institutions_lede")}</p>
<div class="table-wrap"><table class="institutions">
<thead><tr><th scope="col">${t(lang, "learn.inst_name")}</th><th scope="col">${t(lang, "learn.inst_course")}</th><th scope="col">${t(lang, "learn.inst_duration")}</th><th scope="col">${t(lang, "learn.inst_status")}</th></tr></thead>
<tbody>${list.map((i) => html`<tr data-institution="${i.id}">
<th scope="row">${extLink(lang, i.url, institutionName(i, lang))}${Array.isArray(i.urls) && i.urls.length ? html`<span class="small alt-urls">${i.urls.map((u) => html` · ${extLink(lang, u, shortHost(u))}`)}</span>` : ""}</th>
<td lang="en">${i.course}</td>
<td lang="en">${i.duration || ""}</td>
<td><span class="chip ${STATUS_CHIP[i.status] || "chip-lok"}">${t(lang, `learn.${STATUS_KEY[i.status] || "inst_uncertain"}`)}</span></td>
</tr>`)}</tbody>
</table></div>
${written ? html`<p class="small">${t(lang, "learn.inst_note", { date: written })}</p>` : ""}
</section>`;
}

export function learnLevelBody(ctx, { lang, level, data }) {
  const levels = levelsOf(data);
  const i = levels.findIndex((l) => l.level === level.level);
  const cur = levels[i];
  const prev = i > 0 ? levels[i - 1] : null;
  const next = i >= 0 && i < levels.length - 1 ? levels[i + 1] : null;
  return html`<div class="page-head">
<div><h1>${cur.title[lang]}</h1><p class="lede m0">${cur.summary[lang]}</p>
<p class="meta"><span>${t(lang, "learn.level_n", { n: num(cur.level) })}</span>${cur.lessons.length ? html`<span>${t(lang, "counts.lessons", { n: num(cur.lessons.length) })}</span>` : ""}</p></div>
${prev || next ? html`<div class="actions">${prev ? html`<a class="btn" rel="prev" href="${levelHref(ctx, lang, prev.level)}">${t(lang, "learn.prev_level")}<span class="sr"> — ${prev.title[lang]}</span></a>` : ""}${next ? html`<a class="btn btn-primary" rel="next" href="${levelHref(ctx, lang, next.level)}">${t(lang, "learn.next_level")}<span class="sr"> — ${next.title[lang]}</span></a>` : ""}</div>` : ""}
</div>
<div class="layout has-left">
<aside class="rail rail-left">
${levelsCard(ctx, lang, levels, { current: cur.level })}
</aside>
<div class="stack">
<section id="lessons" aria-labelledby="h-lessons">
<div class="section-head"><h2 id="h-lessons">${t(lang, "learn.lessons_heading")}</h2></div>
${cur.lessons.length ? html`<ol class="grid grid-md-2 grid-lg-3 grid-xl-4 lesson-grid" aria-label="${t(lang, "learn.lessons_heading")}">${cur.lessons.map((l) => lessonCard(ctx, lang, l))}</ol>` : html`<p class="meta m0">${t(lang, "learn.no_lessons")}</p>`}
</section>
${cur.level === 0 ? institutionsTable(lang, data.institutions) : ""}
</div>
</div>`;
}

export function learnLevelPage(ctx, { route, level, data }) {
  const lang = route.lang;
  const levels = levelsOf(data);
  const i = levels.findIndex((l) => l.level === level.level);
  const prev = i > 0 ? levels[i - 1] : null;
  const next = i >= 0 && i < levels.length - 1 ? levels[i + 1] : null;
  return layout(ctx, {
    route,
    title: level.title[lang],
    description: clip(level.summary[lang]),
    section: "learn",
    crumbs: learnCrumbs(ctx, lang),
    headExtra: html`${prev ? html`<link rel="prev" href="${levelHref(ctx, lang, prev.level)}">\n` : ""}${next ? html`<link rel="next" href="${levelHref(ctx, lang, next.level)}">` : ""}`,
    body: learnLevelBody(ctx, { lang, level, data }),
  });
}
